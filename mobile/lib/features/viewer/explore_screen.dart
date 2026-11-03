import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api.dart';
import '../../core/format.dart';
import '../../core/taxonomy.dart';
import '../../core/theme.dart';
import '../../shared/widgets.dart';
import 'search.dart';
import 'video_grid.dart';

/// Search (understands languages and categories) + the big colourful category grid.
class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});
  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final _search = TextEditingController();
  Timer? _debounce;

  SearchRequest? _req;
  SearchResult? _result;
  bool _searching = false;
  bool _loadingMore = false;
  Object? _error;
  int _seq = 0;

  static const _suggestions = ['🦁 animals', '🎤 kids songs', '🎵 hindi nursery rhymes', '🐼 animals for kids', '🚀 space', '🎨 painting'];

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 450), () {
      if (mounted) _run(SearchRequest(v.trim()));
    });
    setState(() {}); // clear button
  }

  void _setQuery(String q) {
    _search.text = q;
    _search.selection = TextSelection.collapsed(offset: q.length);
    _run(SearchRequest(q));
  }

  Future<void> _run(SearchRequest r) async {
    final seq = ++_seq;
    if (r.isEmpty) {
      setState(() {
        _req = null;
        _result = null;
        _error = null;
        _searching = false;
      });
      return;
    }
    setState(() {
      _req = r;
      _searching = true;
      _error = null;
    });
    try {
      final res = await runSearch(ref.read(apiProvider), r);
      if (!mounted || seq != _seq) return;
      setState(() {
        _result = res;
        _searching = false;
      });
    } catch (e) {
      if (!mounted || seq != _seq) return;
      setState(() {
        _error = e;
        _searching = false;
      });
    }
  }

  Future<void> _more() async {
    final r = _req, cur = _result;
    if (r == null || cur?.nextOffset == null || _loadingMore) return;
    setState(() => _loadingMore = true);
    try {
      final res = await runSearch(ref.read(apiProvider), r, offset: cur!.nextOffset!);
      if (!mounted) return;
      setState(() {
        final have = cur.videos.map((v) => v.id).toSet();
        cur.videos.addAll(res.videos.where((v) => !have.contains(v.id)));
        cur.nextOffset = res.nextOffset;
      });
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  // ── chip edits ──
  void _removeLanguage(String code) {
    final i = _result!.interpretation;
    final base = _req!.explicit ? _req! : SearchRequest.fromInterpretation(i);
    _run(base.copyWith(languages: base.languages.where((c) => c != code).toList()));
  }

  void _removeCategory() {
    final i = _result!.interpretation;
    final base = _req!.explicit ? _req! : SearchRequest.fromInterpretation(i);
    _run(base.copyWith(clearCategory: true));
  }

  void _removeSubcategory() {
    final i = _result!.interpretation;
    final base = _req!.explicit ? _req! : SearchRequest.fromInterpretation(i);
    _run(base.copyWith(clearSubcategory: true));
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final hasQuery = _req != null;
    return GlowPage(
      child: CustomScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        slivers: [
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Text('Explore', style: KP.display(32)),
                    const SizedBox(width: 8),
                    const Text('🔭', style: TextStyle(fontSize: 28))
                        .animate(onPlay: (c) => c.repeat(reverse: true))
                        .rotate(begin: -0.05, end: 0.05, duration: 1200.ms),
                  ]),
                  Text('Videos in 100+ languages — try “Hindi nursery rhymes”', style: KP.body(14.5, color: KP.inkSoft, weight: FontWeight.w700)),
                  const SizedBox(height: 14),
                  Container(
                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(KP.rMd), boxShadow: KP.softShadow(KP.purple)),
                    child: TextField(
                      controller: _search,
                      onChanged: _onChanged,
                      textInputAction: TextInputAction.search,
                      onSubmitted: (v) {
                        _debounce?.cancel();
                        _run(SearchRequest(v.trim()));
                      },
                      style: KP.body(16, weight: FontWeight.w700),
                      decoration: InputDecoration(
                        hintText: 'Search videos, languages, channels…',
                        prefixIcon: const Icon(Icons.search_rounded, color: KP.purple, size: 26),
                        suffixIcon: _search.text.isEmpty
                            ? null
                            : IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => _setQuery('')),
                      ),
                    ),
                  ),
                  if (!hasQuery) ...[
                    const SizedBox(height: 12),
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      for (final s in _suggestions)
                        Bouncy(
                          onTap: () => _setQuery(s.substring(s.indexOf(' ') + 1)),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: KP.line, width: 1.5),
                            ),
                            child: Text(s, style: KP.body(13, weight: FontWeight.w800)),
                          ),
                        ),
                    ]),
                  ],
                ]),
              ),
            ),
          ),
          if (!hasQuery) ..._categorySlivers() else ..._resultSlivers(),
          SliverToBoxAdapter(child: SizedBox(height: bottom + 96)),
        ],
      ),
    );
  }

  List<Widget> _categorySlivers() {
    final cats = ref.watch(taxonomyCategoriesProvider);
    return [
      const SliverToBoxAdapter(child: SectionTitle('All worlds', emoji: '🗺️')),
      cats.when(
        loading: () => const SliverToBoxAdapter(child: SizedBox(height: 200, child: LoadingDots())),
        error: (e, _) => SliverToBoxAdapter(child: ErrorView(error: e, onRetry: () => ref.invalidate(taxonomyCategoriesProvider))),
        data: (list) => SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.45,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, i) => CategoryTile(c: list[i], index: i),
              childCount: list.length,
            ),
          ),
        ),
      ),
    ];
  }

  List<Widget> _resultSlivers() {
    if (_searching && _result == null) {
      return const [SliverToBoxAdapter(child: SizedBox(height: 200, child: LoadingDots()))];
    }
    if (_error != null && _result == null) {
      return [SliverToBoxAdapter(child: ErrorView(error: _error!, onRetry: () => _run(_req!)))];
    }
    final r = _result;
    if (r == null) return const [];
    final i = r.interpretation;
    return [
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (i.hasFilters) ...[
              Text('Showing', style: KP.body(12.5, color: KP.inkSoft, weight: FontWeight.w900)),
              const SizedBox(height: 6),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final l in i.languages)
                  _FilterChip(
                    label: l.nameNative.toLowerCase() == l.nameEn.toLowerCase() ? l.nameEn : '${l.nameNative} · ${l.nameEn}',
                    emoji: '🗣️',
                    color: KP.blue,
                    onRemove: () => _removeLanguage(l.code),
                  ),
                if (i.category != null)
                  _FilterChip(label: i.category!.name, emoji: i.category!.emoji ?? '⭐', color: KP.purple, onRemove: _removeCategory),
                if (i.subcategory != null)
                  _FilterChip(label: i.subcategory!.name, emoji: '✨', color: KP.pink, onRemove: _removeSubcategory),
                if (i.text.isNotEmpty) _FilterChip(label: '“${i.text}”', emoji: '🔎', color: KP.inkSoft),
              ]),
            ],
            if (i.suggestions.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final s in i.suggestions)
                  Bouncy(
                    onTap: () => _run(_req!.apply(s, i)),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: KP.yellowSoft,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: KP.yellow, width: 1.5),
                      ),
                      child: Text('💡 ${s.reason}', style: KP.body(13, weight: FontWeight.w800)),
                    ),
                  ),
              ]),
            ],
          ]),
        ),
      ),
      if (r.creators.isNotEmpty) ...[
        const SliverToBoxAdapter(child: SectionTitle('Channels', emoji: '🌟')),
        SliverToBoxAdapter(
          child: SizedBox(
            height: 96,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: r.creators.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, k) {
                final c = r.creators[k];
                return SoftCard(
                  padding: const EdgeInsets.fromLTRB(10, 10, 16, 10),
                  onTap: () => context.push('/channel/${c.username}'),
                  child: Row(children: [
                    KpAvatar(url: c.avatarUrl, name: c.channelName, size: 48),
                    const SizedBox(width: 10),
                    Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Text(c.channelName, style: KP.body(14.5, weight: FontWeight.w900)),
                        if (c.verified) const Icon(Icons.verified_rounded, color: KP.blue, size: 15),
                      ]),
                      Text('@${c.username} · ${compact(c.followerCount)} fans', style: KP.body(12, color: KP.inkSoft)),
                    ]),
                  ]),
                );
              },
            ),
          ),
        ),
      ],
      SliverToBoxAdapter(
        child: SectionTitle(
          r.total == 0 ? 'No videos found' : '${r.total} video${r.total == 1 ? '' : 's'}',
          emoji: '🔎',
        ),
      ),
      if (r.videos.isEmpty)
        SliverToBoxAdapter(
          child: EmptyState(
            emoji: '🔍',
            title: 'Nothing matches yet',
            message: i.suggestions.isNotEmpty ? 'Try one of the suggestions above.' : 'Try another word — like "bunny" or "song"!',
          ),
        )
      else
        VideoGridSliver(videos: r.videos, title: 'Search'),
      if (r.nextOffset != null)
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(60, 16, 60, 0),
            child: KpButton.light(label: 'Show more', emoji: '👇', height: 48, loading: _loadingMore, onTap: _more),
          ),
        ),
    ];
  }
}

class _FilterChip extends StatelessWidget {
  final String label, emoji;
  final Color color;
  final VoidCallback? onRemove;
  const _FilterChip({required this.label, required this.emoji, required this.color, this.onRemove});
  @override
  Widget build(BuildContext context) => Container(
        padding: EdgeInsets.fromLTRB(12, 7, onRemove == null ? 12 : 6, 7),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.5), width: 1.5),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text('$emoji $label', style: KP.body(13, color: KP.ink, weight: FontWeight.w800)),
          if (onRemove != null)
            Semantics(
              button: true,
              label: 'Remove $label',
              child: GestureDetector(
                onTap: onRemove,
                child: Padding(padding: const EdgeInsets.only(left: 4), child: Icon(Icons.cancel_rounded, size: 18, color: color)),
              ),
            ),
        ]),
      );
}

/// Colourful category tile (Explore grid, Home).
class CategoryTile extends ConsumerWidget {
  final TaxCategory c;
  final int index;
  const CategoryTile({super.key, required this.c, this.index = 0});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = c.style;
    return Bouncy(
      onTap: () => context.push('/category/${c.slug}'),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [s.color, Color.lerp(s.color, Colors.white, 0.35)!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: KP.softShadow(s.color),
        ),
        child: Stack(children: [
          Positioned(
            right: -6,
            bottom: -10,
            child: Text(s.emoji, style: const TextStyle(fontSize: 58))
                .animate(onPlay: (ctl) => ctl.repeat(reverse: true))
                .rotate(begin: -0.04, end: 0.04, duration: (1500 + (index % 6) * 120).ms),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.name, maxLines: 2, style: KP.display(16.5, color: Colors.white, height: 1.05)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(12)),
                child: Text(plural(c.videoCount, 'video'), style: KP.body(11.5, color: Colors.white, weight: FontWeight.w900)),
              ),
            ]),
          ),
        ]),
      ),
    ).animate().scale(begin: const Offset(0.85, 0.85), delay: (30 * (index % 10)).ms, curve: Curves.easeOutBack, duration: 450.ms);
  }
}
