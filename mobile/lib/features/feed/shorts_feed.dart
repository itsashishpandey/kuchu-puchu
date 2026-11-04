import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';
import '../../core/api.dart';
import '../../core/config.dart';
import '../../core/format.dart';
import '../../core/history.dart';
import '../../core/models.dart';
import '../../core/preferences.dart';
import '../../core/router.dart';
import '../../core/theme.dart';
import '../../shared/parental_gate.dart';
import '../../shared/widgets.dart';
import '../onboarding/guest_languages.dart';

/// Server feeds (anonymous). Both use the languages saved on this phone, or the 🌐 filter.
enum FeedKind { foryou, trending }

/// Videos already reported as watched-to-the-end in this app session (one event per video).
final Set<String> _completedThisSession = {};

/// Full-screen vertical swipe feed (the Reelxia "For You" pattern).
///
/// Either a server feed ([kind], paged with `nextOffset`) or a fixed list
/// ([videos] + [initialIndex]). At most three players are alive at once —
/// previous, current and next — so the next swipe starts instantly. Players are keyed by
/// video id, so cards can be removed ("Not interested") without disturbing the others.
/// Everything pauses when [active] is false, when another route covers this
/// one, or when the app goes to the background.
class ShortsFeed extends ConsumerStatefulWidget {
  final FeedKind? kind;
  final List<Video>? videos;
  final int initialIndex;
  final bool active;

  const ShortsFeed({super.key, this.kind, this.videos, this.initialIndex = 0, this.active = true})
      : assert(kind != null || videos != null);

  @override
  ConsumerState<ShortsFeed> createState() => _ShortsFeedState();
}

class _ShortsFeedState extends ConsumerState<ShortsFeed> with WidgetsBindingObserver, RouteAware {
  late PageController _pc;
  List<Video> _videos = [];
  int? _nextOffset;
  bool _loading = false;
  bool _loadingMore = false;
  Object? _error;
  String? _emptyReason;
  int _page = 0;

  final Map<String, VideoPlayerController> _ctrls = {};
  final Set<String> _failed = {};
  bool _muted = false;
  bool _userPaused = false;
  bool _appVisible = true;
  bool _covered = false;
  bool _subscribed = false;

  // qualified-view + completion tracking for the card on screen
  Timer? _ticker;
  double _watched = 0;
  bool _reported = false;
  Duration _lastPos = Duration.zero;

  bool get _live => widget.active && _appVisible && !_covered;
  ApiClient get _api => ref.read(apiProvider);
  Video? get _current => _page >= 0 && _page < _videos.length ? _videos[_page] : null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (widget.videos != null) {
      _videos = List.of(widget.videos!);
      _page = widget.initialIndex.clamp(0, _videos.isEmpty ? 0 : _videos.length - 1);
      _pc = PageController(initialPage: _page);
      WidgetsBinding.instance.addPostFrameCallback((_) => _sync());
    } else {
      _pc = PageController();
      // the saved languages load asynchronously — wait for them before the first request
      if (!ref.read(guestPrefsProvider).loaded) {
        _loading = true;
      } else {
        _load(reset: true);
      }
    }
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_subscribed) {
      final route = ModalRoute.of(context);
      if (route != null) {
        routeObserver.subscribe(this, route);
        _subscribed = true;
      }
    }
  }

  @override
  void didUpdateWidget(covariant ShortsFeed old) {
    super.didUpdateWidget(old);
    if (old.active != widget.active) _applyPlayback();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    if (_subscribed) routeObserver.unsubscribe(this);
    _ticker?.cancel();
    _disposeAll();
    _pc.dispose();
    super.dispose();
  }

  // ── lifecycle / route visibility ──
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _appVisible = state == AppLifecycleState.resumed;
    _applyPlayback();
  }

  @override
  void didPushNext() {
    _covered = true;
    _applyPlayback();
  }

  @override
  void didPopNext() {
    _covered = false;
    _applyPlayback();
  }

  // ── data ──
  Map<String, dynamic> _query(int offset, {bool fresh = false}) {
    final kind = widget.kind!;
    final filter = ref.read(feedLanguageFilterProvider);
    // the 🌐 filter, else the languages saved on this phone (none saved = every language)
    final languages = filter.isNotEmpty ? filter : ref.read(guestPrefsProvider).effectiveLanguages;
    return {
      'feed': kind.name,
      'limit': '10',
      'offset': '$offset',
      if (languages.isNotEmpty) 'languages': languages.join(','),
      if (fresh) 'fresh': '1',
    };
  }

  Future<void> _load({bool reset = false, bool fresh = false}) async {
    final kind = widget.kind;
    if (kind == null) return;
    if (reset) {
      setState(() {
        _loading = true;
        _error = null;
      });
    } else {
      if (_loadingMore || _nextOffset == null) return;
      _loadingMore = true;
    }
    try {
      final res = await _api.get('/public/videos', query: _query(reset ? 0 : _nextOffset!, fresh: fresh));
      // "Not interested" videos and hidden channels are filtered here, on the phone
      final hiddenVideos = ref.read(hiddenVideosProvider), hiddenCreators = ref.read(hiddenCreatorsProvider);
      final list = ((res['videos'] as List?) ?? const [])
          .map((e) => Video.fromJson((e as Map).cast<String, dynamic>()))
          .where((v) => !hiddenVideos.contains(v.id) && !hiddenCreators.contains(v.creator.id))
          .toList();
      if (!mounted) return;
      final wasEmpty = _videos.isEmpty;
      setState(() {
        if (reset) {
          _disposeAll();
          _videos = list;
          _page = 0;
          _userPaused = false;
          _emptyReason = (res['meta'] as Map?)?['emptyReason'] as String?;
        } else {
          final have = _videos.map((v) => v.id).toSet();
          _videos.addAll(list.where((v) => !have.contains(v.id)));
        }
        _nextOffset = (res['nextOffset'] as num?)?.toInt();
        _loading = false;
      });
      if (!reset && wasEmpty && _videos.isNotEmpty) WidgetsBinding.instance.addPostFrameCallback((_) => _sync());
      if (reset) {
        // everything on this page was hidden on the phone → fetch the next page
        if (_videos.isEmpty && _nextOffset != null) WidgetsBinding.instance.addPostFrameCallback((_) => _load());
        if (_pc.hasClients) _pc.jumpToPage(0);
        _resetWatch();
        WidgetsBinding.instance.addPostFrameCallback((_) => _sync());
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          if (reset) _error = e;
          _loading = false;
        });
      }
    } finally {
      _loadingMore = false;
    }
  }

  // ── players (keyed by video id) ──
  void _disposeAll() {
    for (final c in _ctrls.values) {
      c.dispose();
    }
    _ctrls.clear();
    _failed.clear();
  }

  void _sync() {
    if (!mounted || _videos.isEmpty) return;
    final keepIdx = [_page, _page + 1, _page - 1].where((i) => i >= 0 && i < _videos.length).toList();
    final keep = keepIdx.map((i) => _videos[i].id).toSet();
    for (final id in _ctrls.keys.toList()) {
      if (!keep.contains(id)) _ctrls.remove(id)?.dispose();
    }
    // current first so it wins the network race, then neighbours
    for (final i in keepIdx) {
      final v = _videos[i];
      if (!_ctrls.containsKey(v.id) && !_failed.contains(v.id)) _create(v);
    }
    _applyPlayback();
  }

  void _create(Video v) {
    final c = VideoPlayerController.networkUrl(Uri.parse(AppConfig.media(v.videoUrl)));
    _ctrls[v.id] = c;
    c.initialize().then((_) {
      if (!mounted || _ctrls[v.id] != c) return;
      c.setLooping(true);
      c.setVolume(_muted ? 0 : 1);
      setState(() {});
      _applyPlayback();
    }).catchError((Object _) {
      if (mounted && _ctrls[v.id] == c) setState(() => _failed.add(v.id));
    });
  }

  void _applyPlayback() {
    final currentId = _current?.id;
    for (final e in _ctrls.entries) {
      final c = e.value;
      if (!c.value.isInitialized) continue;
      if (e.key == currentId && _live && !_userPaused) {
        if (!c.value.isPlaying) c.play();
      } else {
        if (c.value.isPlaying) c.pause();
        if (e.key != currentId && c.value.position > Duration.zero) c.seekTo(Duration.zero);
      }
    }
  }

  void _onPage(int i) {
    setState(() {
      _page = i;
      _userPaused = false;
    });
    _resetWatch();
    _sync();
    if (widget.kind != null && i >= _videos.length - 3) _load();
  }

  // ── removing / restoring cards ("Not interested", "Don't recommend this creator") ──
  List<(int, Video)> _remove(bool Function(Video) test) {
    final removed = <(int, Video)>[];
    for (var i = 0; i < _videos.length; i++) {
      if (test(_videos[i])) removed.add((i, _videos[i]));
    }
    if (removed.isEmpty) return removed;
    final currentId = _current?.id;
    final ids = removed.map((r) => r.$2.id).toSet();
    final before = removed.where((r) => r.$1 < _page).length;
    for (final id in ids) {
      _ctrls.remove(id)?.dispose();
      _failed.remove(id);
    }
    final next = _videos.where((v) => !ids.contains(v.id)).toList();
    var page = currentId != null && !ids.contains(currentId) ? next.indexWhere((v) => v.id == currentId) : _page - before;
    page = page.clamp(0, next.isEmpty ? 0 : next.length - 1);
    setState(() {
      _videos = next;
      _page = page;
      _userPaused = false;
    });
    _afterListChange();
    if (_videos.isEmpty && widget.kind != null) {
      _load(reset: true);
    } else if (widget.kind != null && _page >= _videos.length - 3) {
      _load();
    }
    return removed;
  }

  void _restore(List<(int, Video)> removed) {
    if (!mounted || removed.isEmpty) return;
    final currentId = _current?.id;
    final list = List<Video>.of(_videos);
    for (final (i, v) in removed) {
      if (list.any((x) => x.id == v.id)) continue;
      list.insert(i.clamp(0, list.length), v);
    }
    final page = currentId == null ? removed.first.$1.clamp(0, list.length - 1) : list.indexWhere((v) => v.id == currentId);
    setState(() {
      _videos = list;
      _page = page < 0 ? 0 : page;
    });
    _afterListChange();
  }

  void _afterListChange() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (_pc.hasClients && _videos.isNotEmpty && (_pc.page?.round() ?? _page) != _page) _pc.jumpToPage(_page);
      _resetWatch();
      _sync();
    });
  }

  // ── view + completion tracking ──
  void _resetWatch() {
    _watched = 0;
    _reported = false;
    _lastPos = Duration.zero;
  }

  void _tick() {
    final v = _current;
    if (!_live || _userPaused || v == null) return;
    final c = _ctrls[v.id];
    if (c == null || !c.value.isInitialized || !c.value.isPlaying) return;
    _watched += 1;
    final dur = c.value.duration.inMilliseconds > 0 ? c.value.duration.inMilliseconds / 1000 : v.duration;
    if (!_reported && _watched >= 3) {
      _reported = true;
      ref.read(historyProvider.notifier).add(v);
      _api.post('/social/view/${v.contentId}', {'watchSeconds': _watched, 'durationSeconds': dur}).catchError((Object _) => <String, dynamic>{});
    }
    // reached the end (or looped back to the start) after watching most of it → one completion event
    final pos = c.value.position;
    final looped = pos < _lastPos - const Duration(milliseconds: 900);
    final atEnd = dur > 0 && pos.inMilliseconds >= (dur * 1000 - 600);
    _lastPos = pos;
    if ((looped || atEnd) && dur > 0 && _watched >= dur * 0.85 && !_completedThisSession.contains(v.id)) {
      _completedThisSession.add(v.id);
      _api.post('/social/complete/${v.contentId}', {'watchSeconds': _watched, 'durationSeconds': dur}).catchError((Object _) => <String, dynamic>{});
    }
  }

  // ── actions ──
  void _togglePause() {
    setState(() => _userPaused = !_userPaused);
    _applyPlayback();
  }

  void _toggleMute() {
    setState(() => _muted = !_muted);
    for (final c in _ctrls.values) {
      if (c.value.isInitialized) c.setVolume(_muted ? 0 : 1);
    }
  }

  /// Likes are remembered on this phone (the heart stays filled); the server keeps an anonymous count.
  Future<void> _like(Video v, {bool onlyLike = false}) async {
    final liked = ref.read(likedIdsProvider).contains(v.id);
    if (onlyLike && liked) return;
    final want = !liked;
    final before = v.likes;
    setState(() => v.likes = (v.likes + (want ? 1 : -1)).clamp(0, 1 << 31));
    ref.read(likedVideosProvider.notifier).set(v, want);
    HapticFeedback.lightImpact();
    try {
      var r = await _api.post('/social/like/${v.contentId}');
      // the server toggles its own anonymous like; line it up with what the phone shows
      if (r['liked'] is bool && r['liked'] != want) r = await _api.post('/social/like/${v.contentId}');
      if (mounted) setState(() => v.likes = (r['likes'] as num?)?.toInt() ?? v.likes);
    } catch (_) {
      if (mounted) setState(() => v.likes = before);
    }
  }

  /// "Not interested": hidden on this phone only (no account needed), with Undo.
  void _notInterested(Video v) {
    ref.read(hiddenVideosProvider.notifier).add(v.id);
    final removed = _remove((x) => x.id == v.id);
    undoToast(context, "Okay — we'll hide that one", emoji: '🙈', onUndo: () {
      ref.read(hiddenVideosProvider.notifier).remove(v.id);
      _restore(removed);
    });
  }

  /// "Don't show this channel": hidden on this phone only, with Undo.
  void _hideCreator(Video v) {
    final creatorId = v.creator.id;
    if (creatorId.isEmpty) return;
    ref.read(hiddenCreatorsProvider.notifier).add(creatorId);
    final removed = _remove((x) => x.creator.id == creatorId);
    undoToast(context, "We won't show @${v.creator.username} here", emoji: '🙅', onUndo: () {
      ref.read(hiddenCreatorsProvider.notifier).remove(creatorId);
      _restore(removed);
    });
  }

  Future<void> _share(Video v) async {
    // sharing leaves the app — a grown-up has to approve it every time
    if (!await ParentalGate.check(context, remember: false)) return;
    if (!mounted) return;
    _api.post('/social/share/${v.contentId}').then((r) {
      if (mounted) setState(() => v.shares = (r['shares'] as num?)?.toInt() ?? v.shares);
    }).catchError((Object _) {});
    await SharePlus.instance.share(ShareParams(
      subject: v.title,
      text: '${v.title} 🎈\nWatch it on Kuchu Puchu — ${AppConfig.serverUrl}/#/feed',
    ));
  }

  void _more(Video v) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        Widget item(String emoji, String title, String sub, VoidCallback onTap, {Color color = KP.ink}) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SoftCard(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                onTap: () {
                  Navigator.pop(ctx);
                  onTap();
                },
                child: Row(children: [
                  Text(emoji, style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(title, style: KP.body(15.5, color: color, weight: FontWeight.w900)),
                      Text(sub, style: KP.body(12.5, color: KP.inkSoft)),
                    ]),
                  ),
                ]),
              ),
            );
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(v.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: KP.display(21)),
              const SizedBox(height: 4),
              if (v.tags.isNotEmpty || v.languages.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    [if (v.languages.isNotEmpty) v.languages.map((l) => l.label).join(' · '), ...v.tags.map((t) => t.label)].join('  |  '),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: KP.body(12.5, color: KP.inkSoft),
                  ),
                ),
              item('🙈', 'Not interested', 'Hide this video on this phone', () => _notInterested(v)),
              item('🙅', "Don't show this channel", 'No more videos from @${v.creator.username} on this phone', () => _hideCreator(v)),
              item('🚩', 'Report', 'For grown-ups: something not okay for kids?', () => showReportSheet(context, _api, v), color: KP.pink),
            ]),
          ),
        );
      },
    );
  }

  // ── UI ──
  Widget _lightBox(Widget child) => DecoratedBox(
        decoration: KP.pageGlow,
        child: Stack(children: [
          const Positioned.fill(child: StickerLayer(opacity: 0.4)),
          SafeArea(child: child),
        ]),
      );

  Widget _emptyState() {
    final filtered = ref.read(feedLanguageFilterProvider).isNotEmpty;
    if (_emptyReason == 'NO_VIDEOS_IN_YOUR_LANGUAGES' || filtered) {
      return _lightBox(Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Text('🗣️', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 12),
            Text('No videos in these languages yet', textAlign: TextAlign.center, style: KP.display(22)),
            const SizedBox(height: 6),
            Text(
              'New videos arrive every day. Meanwhile, try another language.',
              textAlign: TextAlign.center,
              style: KP.body(14.5, color: KP.inkSoft, height: 1.35),
            ),
            const SizedBox(height: 20),
            if (filtered)
              KpButton(
                label: 'Show all my languages',
                emoji: '🌈',
                expand: false,
                height: 50,
                onTap: () => ref.read(feedLanguageFilterProvider.notifier).state = const [],
              ),
            const SizedBox(height: 10),
            KpButton.light(
              label: 'Change languages',
              emoji: '🌐',
              expand: false,
              height: 48,
              onTap: () async {
                if (await ParentalGate.check(context) && mounted) showGuestLanguageSheet(context);
              },
            ),
          ]),
        ),
      ));
    }
    return _lightBox(EmptyState(
      emoji: '🎬',
      title: 'No videos right now',
      message: 'New cartoons are on their way — check back soon!',
      actionLabel: 'Refresh',
      onAction: () => _load(reset: true, fresh: true),
    ));
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<int>(feedRefreshProvider, (_, __) {
      if (widget.kind != null) _load(reset: true, fresh: true);
    });
    ref.listen<List<String>>(feedLanguageFilterProvider, (_, __) {
      if (widget.kind != null) _load(reset: true);
    });
    ref.listen<GuestPrefs>(guestPrefsProvider, (prev, next) {
      final firstLoad = prev != null && !prev.loaded && next.loaded;
      if (widget.kind != null && (firstLoad || prev?.languages != next.languages)) _load(reset: true);
    });
    final likedIds = ref.watch(likedIdsProvider);

    if (_loading && _videos.isEmpty) {
      return const ColoredBox(color: KP.night, child: LoadingDots(onDark: true));
    }
    if (_error != null && _videos.isEmpty) {
      return _lightBox(ErrorView(error: _error!, onRetry: () => _load(reset: true)));
    }
    if (_videos.isEmpty) return _emptyState();

    return ColoredBox(
      color: Colors.black,
      child: PageView.builder(
        controller: _pc,
        scrollDirection: Axis.vertical,
        itemCount: _videos.length,
        onPageChanged: _onPage,
        itemBuilder: (context, i) {
          final v = _videos[i];
          return _FeedPage(
            key: ValueKey('page-${v.id}'),
            video: v,
            liked: likedIds.contains(v.id),
            controller: _ctrls[v.id],
            failed: _failed.contains(v.id),
            paused: i == _page && _userPaused,
            muted: _muted,
            onTap: _togglePause,
            onDoubleTapLike: () => _like(v, onlyLike: true),
            onLike: () => _like(v),
            onShare: () => _share(v),
            onMore: () => _more(v),
            onMute: _toggleMute,
            onCreator: v.creator.username.isEmpty ? null : () => context.push('/channel/${v.creator.username}'),
          );
        },
      ),
    );
  }
}

class _FeedPage extends StatefulWidget {
  final Video video;
  final bool liked;
  final VideoPlayerController? controller;
  final bool failed, paused, muted;
  final VoidCallback onTap, onDoubleTapLike, onLike, onShare, onMore, onMute;
  final VoidCallback? onCreator;

  const _FeedPage({
    super.key,
    required this.video,
    required this.liked,
    required this.controller,
    required this.failed,
    required this.paused,
    required this.muted,
    required this.onTap,
    required this.onDoubleTapLike,
    required this.onLike,
    required this.onShare,
    required this.onMore,
    required this.onMute,
    required this.onCreator,
  });

  @override
  State<_FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends State<_FeedPage> {
  final List<(int, Offset)> _bursts = [];
  int _burstId = 0;
  Offset _lastDouble = Offset.zero;

  void _burst() {
    final id = _burstId++;
    setState(() => _bursts.add((id, _lastDouble)));
    Future.delayed(const Duration(milliseconds: 1000), () {
      if (mounted) setState(() => _bursts.removeWhere((b) => b.$1 == id));
    });
  }

  @override
  Widget build(BuildContext context) {
    final v = widget.video;
    final c = widget.controller;
    final bottom = MediaQuery.paddingOf(context).bottom;
    final cat = videoStyle(v);
    final lang = v.primaryLanguage;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: widget.onTap,
      onDoubleTapDown: (d) => _lastDouble = d.localPosition,
      onDoubleTap: () {
        _burst();
        widget.onDoubleTapLike();
      },
      child: Stack(fit: StackFit.expand, children: [
        // poster while the player warms up
        NetImage(v.thumbnailUrl, fallback: const ColoredBox(color: KP.night)),
        if (c != null)
          ValueListenableBuilder<VideoPlayerValue>(
            valueListenable: c,
            builder: (_, val, __) => val.isInitialized
                ? FittedBox(
                    fit: BoxFit.cover,
                    clipBehavior: Clip.hardEdge,
                    child: SizedBox(width: val.size.width, height: val.size.height, child: VideoPlayer(c)),
                  )
                : const Center(
                    child: SizedBox(width: 34, height: 34, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3)),
                  ),
          ),
        if (widget.failed)
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
              decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(22)),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Text('🙈', style: TextStyle(fontSize: 40)),
                const SizedBox(height: 6),
                Text("Can't play this one right now", style: KP.body(15, color: Colors.white, weight: FontWeight.w800)),
              ]),
            ),
          ),

        // legibility shades
        const IgnorePointer(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: [0, 0.18, 0.6, 1],
                colors: [Color(0x66000000), Colors.transparent, Colors.transparent, Color(0xCC000000)],
              ),
            ),
          ),
        ),

        if (widget.paused)
          IgnorePointer(
            child: Center(
              child: Container(
                width: 92,
                height: 92,
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.25), shape: BoxShape.circle),
                child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 70),
              ).animate().scale(begin: const Offset(0.6, 0.6), curve: Curves.easeOutBack, duration: 250.ms),
            ),
          ),

        // heart bursts from double-tap
        for (final b in _bursts)
          Positioned(
            key: ValueKey('burst-${b.$1}'),
            left: b.$2.dx - 55,
            top: b.$2.dy - 55,
            child: IgnorePointer(
              child: const Icon(Icons.favorite_rounded, color: KP.pink, size: 110, shadows: [Shadow(color: Colors.black26, blurRadius: 12)])
                  .animate()
                  .scale(begin: const Offset(0.2, 0.2), end: const Offset(1.15, 1.15), curve: Curves.elasticOut, duration: 550.ms)
                  .rotate(begin: -0.08, end: 0.04, duration: 400.ms)
                  .then(delay: 120.ms)
                  .moveY(end: -70, duration: 350.ms)
                  .fadeOut(duration: 350.ms),
            ),
          ),

        // creator + caption
        Positioned(
          left: 16,
          right: 92,
          bottom: bottom + 22,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Row(children: [
              GestureDetector(
                onTap: widget.onCreator,
                child: KpAvatar(url: v.creator.avatarUrl, name: v.creator.channelName, size: 42, ringGradient: v.creator.theme == 'PINK' ? KP.pinkGrad : KP.blueGrad),
              ),
              const SizedBox(width: 10),
              Flexible(
                child: GestureDetector(
                  onTap: widget.onCreator,
                  child: Text(
                    '@${v.creator.username}',
                    overflow: TextOverflow.ellipsis,
                    style: KP.body(15.5, color: Colors.white, weight: FontWeight.w900).copyWith(shadows: const [Shadow(color: Colors.black45, blurRadius: 6)]),
                  ),
                ),
              ),
              if (v.creator.verified) ...[
                const SizedBox(width: 4),
                const Icon(Icons.verified_rounded, color: KP.cyan, size: 17),
              ],
            ]),
            const SizedBox(height: 10),
            Text(
              v.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: KP.display(19, color: Colors.white, weight: FontWeight.w700, height: 1.2).copyWith(shadows: const [Shadow(color: Colors.black54, blurRadius: 8)]),
            ),
            if (v.hashtags.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                v.hashtags.take(4).map((h) => '#$h').join('  '),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: KP.body(13, color: Colors.white.withValues(alpha: 0.85), weight: FontWeight.w800),
              ),
            ],
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 6, children: [
              _Chip('${cat.emoji} ${v.categoryLabel}', cat.color),
              if (lang != null) _Chip('🗣 ${lang.label}', KP.yellow),
              _Chip('▶ ${plural(v.views, 'view', short: true)}', Colors.white),
            ]),
          ]),
        ),

        // action rail
        Positioned(
          right: 10,
          bottom: bottom + 26,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            _RailButton(
              icon: widget.liked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              label: compact(v.likes),
              color: widget.liked ? KP.pink : Colors.white,
              filled: widget.liked,
              onTap: widget.onLike,
            ),
            _RailButton(icon: Icons.share_rounded, label: v.shares > 0 ? compact(v.shares) : 'Share', onTap: widget.onShare),
            _RailButton(icon: Icons.more_horiz_rounded, label: 'More', onTap: widget.onMore),
            _RailButton(icon: widget.muted ? Icons.volume_off_rounded : Icons.volume_up_rounded, label: widget.muted ? 'Muted' : 'Sound', onTap: widget.onMute),
          ]),
        ),

        // progress
        if (c != null)
          Positioned(
            left: 0,
            right: 0,
            bottom: bottom,
            child: ValueListenableBuilder<VideoPlayerValue>(
              valueListenable: c,
              builder: (_, val, __) {
                final total = val.duration.inMilliseconds;
                final p = total <= 0 ? 0.0 : (val.position.inMilliseconds / total).clamp(0.0, 1.0);
                return Container(
                  height: 3.5,
                  color: Colors.white.withValues(alpha: 0.18),
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(
                    widthFactor: p,
                    child: Container(decoration: const BoxDecoration(gradient: KP.brand)),
                  ),
                );
              },
            ),
          ),
      ]),
    );
  }
}

class _Chip extends StatelessWidget {
  final String text;
  final Color color;
  const _Chip(this.text, this.color);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.30),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.7), width: 1.4),
        ),
        child: Text(text, style: KP.body(12, color: Colors.white, weight: FontWeight.w800)),
      );
}

class _RailButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool filled;
  final VoidCallback? onTap;
  const _RailButton({required this.icon, required this.label, this.color = Colors.white, this.filled = false, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Semantics(
        button: true,
        label: label,
        child: Bouncy(
          onTap: onTap,
          scale: 0.85,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: filled ? Colors.white : Colors.black.withValues(alpha: 0.28),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withValues(alpha: 0.35), width: 1.5),
              ),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                transitionBuilder: (child, a) => ScaleTransition(scale: CurvedAnimation(parent: a, curve: Curves.elasticOut), child: child),
                child: Icon(icon, key: ValueKey(icon), color: color, size: 26),
              ),
            ),
            const SizedBox(height: 3),
            Text(label, style: KP.body(12, color: Colors.white, weight: FontWeight.w900).copyWith(shadows: const [Shadow(color: Colors.black54, blurRadius: 4)])),
          ]),
        ),
      ),
    );
  }
}

/// "Something's not right" sheet — for grown-ups (behind the parental gate).
Future<void> showReportSheet(BuildContext context, ApiClient api, Video v) async {
  // asks every time, like Share and outside links
  if (!await ParentalGate.check(context, remember: false)) return;
  if (!context.mounted) return;
  const reasons = [
    ('INAPPROPRIATE', '🚫', 'Not okay for kids'),
    ('SPAM', '📢', 'Spam or misleading'),
    ('COPYRIGHT', '©️', 'Copied from someone else'),
    ('OTHER', '💬', 'Something else'),
  ];
  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (ctx) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Report this video', style: KP.display(24)),
          const SizedBox(height: 4),
          Text('Tell us what is wrong — a grown-up on our team will check it.', style: KP.body(14, color: KP.inkSoft)),
          const SizedBox(height: 16),
          for (final r in reasons)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SoftCard(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                onTap: () async {
                  Navigator.pop(ctx);
                  try {
                    await api.post('/social/report/${v.contentId}', {'reason': r.$1});
                    if (context.mounted) toast(context, 'Thanks! Our team will take a look', emoji: '💙');
                  } catch (e) {
                    if (context.mounted) toast(context, '$e', emoji: '🙈');
                  }
                },
                child: Row(children: [
                  Text(r.$2, style: const TextStyle(fontSize: 24)),
                  const SizedBox(width: 14),
                  Expanded(child: Text(r.$3, style: KP.body(16, weight: FontWeight.w800))),
                  const Icon(Icons.chevron_right_rounded, color: KP.inkSoft),
                ]),
              ),
            ),
        ]),
      ),
    ),
  );
}
