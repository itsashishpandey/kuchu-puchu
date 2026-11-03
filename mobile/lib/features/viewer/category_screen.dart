import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api.dart';
import '../../core/format.dart';
import '../../core/models.dart';
import '../../core/preferences.dart';
import '../../core/taxonomy.dart';
import '../../core/theme.dart';
import '../../shared/widgets.dart';
import '../onboarding/pickers.dart';
import 'video_grid.dart';
import 'viewer_data.dart';

/// One main category: horizontal subcategory chips + language chips; only the grid reloads.
class CategoryScreen extends ConsumerStatefulWidget {
  final String slug;
  final String? initialSubcategory;
  const CategoryScreen({super.key, required this.slug, this.initialSubcategory});
  @override
  ConsumerState<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends ConsumerState<CategoryScreen> {
  String? _sub; // subcategory slug
  List<String> _langs = const [];
  bool _popular = false;
  List<Video> _videos = [];
  int? _next;
  bool _loading = true;
  bool _loadingMore = false;
  Object? _error;
  int _seq = 0;

  @override
  void initState() {
    super.initState();
    _sub = widget.initialSubcategory;
    _load();
  }

  Future<void> _load({bool more = false}) async {
    final seq = more ? _seq : ++_seq;
    setState(() {
      if (more) {
        _loadingMore = true;
      } else {
        _loading = true;
        _error = null;
      }
    });
    try {
      final page = await fetchVideoPage(
        ref.read(apiProvider),
        feed: _popular ? 'trending' : 'explore',
        category: widget.slug,
        subcategory: _sub,
        languages: _langs,
        limit: 24,
        offset: more ? (_next ?? 0) : 0,
      );
      if (!mounted || seq != _seq) return;
      setState(() {
        if (more) {
          final have = _videos.map((v) => v.id).toSet();
          _videos.addAll(page.videos.where((v) => !have.contains(v.id)));
        } else {
          _videos = page.videos;
        }
        _next = page.nextOffset;
        _loading = false;
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted || seq != _seq) return;
      setState(() {
        if (!more) _error = e;
        _loading = false;
        _loadingMore = false;
      });
    }
  }

  void _setSub(String? slug) {
    if (_sub == slug) return;
    setState(() => _sub = slug);
    _load();
  }

  void _toggleLang(String code) {
    final next = List<String>.of(_langs);
    if (!next.remove(code)) next.add(code);
    setState(() => _langs = next);
    _load();
  }

  Future<void> _pickOtherLanguages(List<TaxLanguage> all) async {
    var picked = List<String>.of(_langs);
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => SizedBox(
          height: MediaQuery.sizeOf(ctx).height * 0.85,
          child: Column(children: [
            Expanded(
              child: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 12), children: [
                Text('Languages', style: KP.display(24)),
                const SizedBox(height: 12),
                LanguageChooser(
                  languages: all,
                  selected: picked,
                  withPrimary: false,
                  max: 10,
                  onChanged: (list, _) => setSheet(() => picked = list),
                ),
              ]),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 6, 20, 12),
                child: KpButton(label: 'Show videos', emoji: '🌐', onTap: () => Navigator.pop(ctx, true)),
              ),
            ),
          ]),
        ),
      ),
    );
    if (ok == true && mounted) {
      setState(() => _langs = picked);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(taxonomyCategoriesProvider);
    final allLangs = ref.watch(languagesProvider).value ?? const <TaxLanguage>[];
    // the languages saved on this phone are offered as quick chips (not applied until tapped)
    final mine = ref.watch(guestPrefsProvider).effectiveLanguages;
    final c = cats.value?.byId(widget.slug);
    final s = c?.style ?? CategoryStyle.of(widget.slug);
    final langChips = {...mine, ..._langs}.toList();

    return Scaffold(
      body: GlowPage(
        stickers: true,
        child: RefreshIndicator(
          color: KP.pink,
          onRefresh: () => _load(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Container(
                  padding: EdgeInsets.fromLTRB(12, MediaQuery.paddingOf(context).top + 8, 16, 18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [s.color, Color.lerp(s.color, KP.purple, 0.35)!], begin: Alignment.topLeft, end: Alignment.bottomRight),
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    CircleIconButton(icon: Icons.arrow_back_rounded, onTap: () => Navigator.of(context).maybePop()),
                    const SizedBox(height: 10),
                    Row(children: [
                      Text(s.emoji, style: const TextStyle(fontSize: 46))
                          .animate()
                          .scale(begin: const Offset(0.5, 0.5), curve: Curves.elasticOut, duration: 800.ms),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(c?.name ?? 'Category', style: KP.display(27, color: Colors.white)),
                          if (c != null)
                            Text('${plural(c.videoCount, 'video')} · ${plural(c.subcategories.length, 'topic')}',
                                style: KP.body(13, color: Colors.white.withValues(alpha: 0.92), weight: FontWeight.w800)),
                        ]),
                      ),
                    ]),
                    if ((c?.description ?? '').isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(c!.description!, style: KP.body(13.5, color: Colors.white, height: 1.3)),
                    ],
                  ]),
                ),
              ),
              // subcategory chips
              if (c != null)
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 58,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: SelectChip(label: 'All', emoji: '✨', dense: true, color: s.color, selected: _sub == null, onTap: () => _setSub(null)),
                        ),
                        for (final sub in c.subcategories)
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: SelectChip(
                              label: sub.videoCount > 0 ? '${sub.name} · ${sub.videoCount}' : sub.name,
                              emoji: sub.emoji,
                              dense: true,
                              color: s.color,
                              selected: _sub == sub.slug || _sub == sub.id,
                              onTap: () => _setSub(sub.slug),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              // language + sort chips
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 52,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(16, 6, 16, 4),
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: SelectChip(
                          label: _popular ? 'Popular' : 'Newest',
                          emoji: _popular ? '🔥' : '🆕',
                          dense: true,
                          color: KP.orange,
                          selected: true,
                          onTap: () {
                            setState(() => _popular = !_popular);
                            _load();
                          },
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: SelectChip(
                          label: 'Any language',
                          emoji: '🌈',
                          dense: true,
                          color: KP.blue,
                          selected: _langs.isEmpty,
                          onTap: () {
                            if (_langs.isEmpty) return;
                            setState(() => _langs = const []);
                            _load();
                          },
                        ),
                      ),
                      for (final code in langChips)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: SelectChip(
                            label: allLangs.byCode(code)?.nameNative ?? code,
                            dense: true,
                            color: KP.blue,
                            selected: _langs.contains(code),
                            onTap: () => _toggleLang(code),
                          ),
                        ),
                      if (allLangs.isNotEmpty)
                        SelectChip(label: 'More languages', emoji: '➕', dense: true, color: KP.blue, onTap: () => _pickOtherLanguages(allLangs)),
                    ],
                  ),
                ),
              ),
              if (_loading)
                const SliverToBoxAdapter(child: SizedBox(height: 260, child: LoadingDots()))
              else if (_error != null)
                SliverToBoxAdapter(child: ErrorView(error: _error!, onRetry: () => _load()))
              else if (_videos.isEmpty)
                SliverToBoxAdapter(
                  child: EmptyState(
                    emoji: s.emoji,
                    title: 'Nothing here yet',
                    message: _langs.isNotEmpty ? 'No videos in these languages yet — try "Any language".' : 'New videos for this topic are on their way!',
                  ),
                )
              else ...[
                const SliverToBoxAdapter(child: SizedBox(height: 10)),
                VideoGridSliver(videos: _videos, title: c?.name ?? ''),
                if (_next != null)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(60, 16, 60, 0),
                      child: KpButton.light(label: 'Show more', emoji: '👇', height: 48, loading: _loadingMore, onTap: () => _load(more: true)),
                    ),
                  ),
              ],
              SliverToBoxAdapter(child: SizedBox(height: MediaQuery.paddingOf(context).bottom + 30)),
            ],
          ),
        ),
      ),
    );
  }
}
