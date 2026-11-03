import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api.dart';
import '../../core/format.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import '../../shared/widgets.dart';
import 'video_grid.dart';

/// key = "username|sort" (sort: latest | popular | oldest)
final _channelProvider = FutureProvider.autoDispose.family<ChannelPage, String>((ref, key) async {
  final [username, sort] = key.split('|');
  final res = await ref.read(apiProvider).get('/public/creator/$username', query: {'sort': sort});
  return ChannelPage.fromJson((res['channel'] as Map).cast<String, dynamic>());
});

/// A channel page (view only): banner, logo, name, tagline, and two tabs —
/// Videos (Latest / Popular / Oldest) and About.
class ChannelScreen extends ConsumerStatefulWidget {
  final String username;
  const ChannelScreen({super.key, required this.username});
  @override
  ConsumerState<ChannelScreen> createState() => _ChannelScreenState();
}

class _ChannelScreenState extends ConsumerState<ChannelScreen> {
  int _tab = 0; // 0 Videos, 1 About
  String _sort = 'latest';
  ChannelPage? _last; // shown while another sort order loads

  String get _key => '${widget.username}|$_sort';

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(_channelProvider(_key));
    return Scaffold(
      body: GlowPage(
        child: data.when(
          loading: () => _last != null ? _page(_last!, loadingVideos: true) : const LoadingDots(),
          error: (e, _) => SafeArea(child: ErrorView(error: e, onRetry: () => ref.invalidate(_channelProvider(_key)))),
          data: (ch) => _page(_last = ch),
        ),
      ),
    );
  }

  Widget _page(ChannelPage ch, {bool loadingVideos = false}) {
    final cat = CategoryStyle.of(ch.category);
    final pink = ch.theme == 'PINK';
    final videos = ch.videos();
    final w = MediaQuery.sizeOf(context).width;
    final top = MediaQuery.paddingOf(context).top;
    final bannerH = (w / 3.2).clamp(110.0, 220.0) + top;

    return CustomScrollView(slivers: [
      // ── banner ──
      SliverToBoxAdapter(
        child: Stack(children: [
          SizedBox(
            height: bannerH,
            width: double.infinity,
            child: ch.bannerUrl != null
                ? NetImage(ch.bannerUrl, fallback: const DecoratedBox(decoration: BoxDecoration(gradient: KP.brand)))
                : DecoratedBox(
                    decoration: BoxDecoration(gradient: LinearGradient(colors: [cat.color, KP.purple, KP.pink], begin: Alignment.topLeft, end: Alignment.bottomRight)),
                    child: StickerLayer(stickers: [cat.emoji, '⭐', '🎈', '🌈', cat.emoji, '✨'], opacity: 0.5),
                  ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: CircleIconButton(icon: Icons.arrow_back_rounded, onTap: () => Navigator.of(context).maybePop()),
            ),
          ),
        ]),
      ),
      // ── identity ──
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 14, 18, 4),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
              KpAvatar(url: ch.avatarUrl, name: ch.name, size: 78, ringGradient: pink ? KP.pinkGrad : KP.sunGrad)
                  .animate()
                  .scale(begin: const Offset(0.6, 0.6), curve: Curves.elasticOut, duration: 800.ms),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Flexible(child: Text(ch.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: KP.display(24))),
                    if (ch.verified) ...[const SizedBox(width: 5), const Icon(Icons.verified_rounded, color: KP.blue, size: 20)],
                  ]),
                  Text('@${ch.username}', style: KP.body(13.5, color: KP.inkSoft, weight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Text(plural(ch.videoCount, 'video', short: true),
                      style: KP.body(13, color: KP.inkSoft, weight: FontWeight.w700)),
                ]),
              ),
            ]),
            if (ch.tagline != null) ...[
              const SizedBox(height: 10),
              Text(ch.tagline!, style: KP.body(14.5, height: 1.3, weight: FontWeight.w700)),
            ],
            const SizedBox(height: 14),
            _Tabs(index: _tab, onTap: (i) => setState(() => _tab = i)),
          ]),
        ),
      ),
      if (_tab == 0) ...[
        SliverToBoxAdapter(
          child: SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 4),
              children: [
                for (final (key, label, emoji) in const [('latest', 'Latest', '🆕'), ('popular', 'Popular', '🔥'), ('oldest', 'Oldest', '📜')])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: SelectChip(
                      label: label,
                      emoji: emoji,
                      dense: true,
                      color: KP.blue,
                      selected: _sort == key,
                      onTap: () => setState(() => _sort = key),
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (loadingVideos)
          const SliverToBoxAdapter(child: SizedBox(height: 200, child: LoadingDots()))
        else if (videos.isEmpty)
          const SliverToBoxAdapter(
            child: EmptyState(emoji: '🎨', title: 'No videos yet', message: 'New videos for this channel are on their way — check back soon!'),
          )
        else ...[
          const SliverToBoxAdapter(child: SizedBox(height: 8)),
          VideoGridSliver(videos: videos, title: ch.name, showCreator: false),
        ],
      ] else
        SliverToBoxAdapter(child: _About(ch: ch)),
      SliverToBoxAdapter(child: SizedBox(height: MediaQuery.paddingOf(context).bottom + 30)),
    ]);
  }
}

class _Tabs extends StatelessWidget {
  final int index;
  final ValueChanged<int> onTap;
  const _Tabs({required this.index, required this.onTap});
  @override
  Widget build(BuildContext context) {
    Widget tab(int i, String label) => Expanded(
          child: Semantics(
            button: true,
            selected: index == i,
            label: label,
            child: InkWell(
              onTap: () => onTap(i),
              child: Column(children: [
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Text(label, style: KP.body(15, color: index == i ? KP.ink : KP.inkSoft, weight: FontWeight.w900)),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 3,
                  margin: const EdgeInsets.symmetric(horizontal: 30),
                  decoration: BoxDecoration(gradient: index == i ? KP.brand : null, borderRadius: BorderRadius.circular(3)),
                ),
              ]),
            ),
          ),
        );
    return DecoratedBox(
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: KP.line, width: 1.5))),
      child: Row(children: [tab(0, 'Videos'), tab(1, 'About')]),
    );
  }
}

/// About a channel — facts only, no outside links (kids' app).
class _About extends StatelessWidget {
  final ChannelPage ch;
  const _About({required this.ch});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SoftCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('About', style: KP.display(19)),
            const SizedBox(height: 6),
            Text(ch.description.isEmpty ? 'No description yet.' : ch.description,
                style: KP.body(14.5, color: ch.description.isEmpty ? KP.inkSoft : KP.ink, height: 1.4)),
          ]),
        ),
        const SizedBox(height: 12),
        SoftCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(children: [
            if ((ch.country ?? '').isNotEmpty) _line('📍', ch.country!),
            if (ch.joinedAt != null) _line('🗓️', 'Joined ${shortDate(ch.joinedAt)}'),
            _line('🎬', plural(ch.videoCount, 'video')),
            _line('👀', '${compact(ch.totalViews)} views'),
          ]),
        ),
        if (ch.languages.isNotEmpty || ch.preferredCategories.isNotEmpty) ...[
          const SizedBox(height: 12),
          SoftCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (ch.languages.isNotEmpty) ...[
                Text('Languages', style: KP.body(13, color: KP.inkSoft, weight: FontWeight.w900)),
                const SizedBox(height: 6),
                Wrap(spacing: 6, runSpacing: 6, children: [
                  for (final l in ch.languages)
                    StatusChip(l.nameNative.toLowerCase() == l.nameEn.toLowerCase() ? l.nameEn : '${l.nameNative} · ${l.nameEn}', KP.blue, emoji: '🗣'),
                ]),
              ],
              if (ch.preferredCategories.isNotEmpty) ...[
                if (ch.languages.isNotEmpty) const SizedBox(height: 12),
                Text('Videos about', style: KP.body(13, color: KP.inkSoft, weight: FontWeight.w900)),
                const SizedBox(height: 6),
                Wrap(spacing: 6, runSpacing: 6, children: [
                  for (final c in ch.preferredCategories) StatusChip(c.name, KP.purple, emoji: c.emoji),
                ]),
              ],
            ]),
          ),
        ],
      ]),
    );
  }

  Widget _line(String emoji, String text) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(children: [
          Text(emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: KP.body(14.5, weight: FontWeight.w800))),
        ]),
      );
}
