import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/audience.dart';
import '../../core/history.dart';
import '../../core/preferences.dart';
import '../../core/taxonomy.dart';
import '../../core/theme.dart';
import '../../shared/widgets.dart';
import 'video_grid.dart';
import 'video_list_screen.dart';
import 'viewer_data.dart';
import 'viewer_shell.dart';

/// Opens a main category (by slug) with its subcategory chips.
void openCategory(BuildContext context, String slug) => context.push('/category/$slug');

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(taxonomyCategoriesProvider);
    ref.invalidate(railProvider);
    try {
      await ref.read(railProvider('trending').future);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(historyProvider);
    final liked = ref.watch(likedVideosProvider);
    final bottom = MediaQuery.paddingOf(context).bottom;

    final sections = <Widget>[
      _HeroBanner(onPlay: () => ref.read(viewerTabProvider.notifier).state = ViewerShell.shortsTab),
      const SectionTitle('Pick a world', emoji: '🌈'),
      _Categories(),
      if (history.isNotEmpty) ...[
        SectionTitle('Continue watching', emoji: '🕒', action: 'See all', onAction: () {
          context.push('/videos', extra: VideoListArgs(title: 'Watch history', emoji: '🕒', load: (_) async => history));
        }),
        VideoRail(videos: history.take(10).toList(), title: 'Continue watching'),
      ],
      if (liked.isNotEmpty) ...[
        SectionTitle('Videos I liked', emoji: '❤️', action: 'See all', onAction: () {
          context.push('/videos', extra: VideoListArgs(title: 'Videos I liked', emoji: '❤️', load: (_) async => ref.read(likedVideosProvider)));
        }),
        VideoRail(videos: liked.take(10).toList(), title: 'Videos I liked'),
      ],
      SectionTitle('Trending now', emoji: '🔥', action: 'Play all', onAction: () => ref.read(viewerTabProvider.notifier).state = ViewerShell.shortsTab),
      _AsyncRail(feed: 'trending', title: 'Trending now', numbered: true),
      SectionTitle('Fresh cartoons', emoji: '✨', action: 'See all', onAction: () {
        final languages = ref.read(guestPrefsProvider).effectiveLanguages;
        context.push('/videos', extra: VideoListArgs(title: 'Fresh cartoons', emoji: '✨', load: (api) async => (await fetchVideoPage(api, languages: languages, limit: 48)).videos));
      }),
      _AsyncRail(feed: 'explore', title: 'Fresh cartoons'),
    ];

    return GlowPage(
      child: RefreshIndicator(
        color: KP.pink,
        onRefresh: () => _refresh(ref),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 16, 4),
                  child: Row(children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.asset('assets/images/app_icon.png', width: 50, height: 50),
                    ).animate().scale(begin: const Offset(0.5, 0.5), curve: Curves.elasticOut, duration: 900.ms),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(
                          'Hi there! 👋',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: KP.display(22),
                        ),
                        Row(children: [
                          Flexible(child: Text('What shall we watch today?', overflow: TextOverflow.ellipsis, style: KP.body(13.5, color: KP.inkSoft, weight: FontWeight.w700))),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: KP.yellowSoft, borderRadius: BorderRadius.circular(10), border: Border.all(color: KP.yellow)),
                            child: Text(ref.watch(audienceProvider).value?.ages ?? const Audience().ages, style: KP.body(11, weight: FontWeight.w900)),
                          ),
                        ]),
                      ]),
                    ),
                    CircleIconButton(
                      icon: Icons.search_rounded,
                      color: KP.purple,
                      onTap: () => ref.read(viewerTabProvider.notifier).state = 2,
                    ),
                  ]),
                ),
              ),
            ),
            SliverList.list(
              children: [
                for (var i = 0; i < sections.length; i++)
                  sections[i].animate().fadeIn(delay: (60 * i).ms, duration: 380.ms).slideY(begin: 0.06, end: 0, curve: Curves.easeOut),
              ],
            ),
            SliverToBoxAdapter(child: SizedBox(height: bottom + 24)),
          ],
        ),
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  final VoidCallback onPlay;
  const _HeroBanner({required this.onPlay});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Container(
        height: 188,
        decoration: BoxDecoration(
          gradient: KP.brand,
          borderRadius: BorderRadius.circular(30),
          boxShadow: KP.softShadow(KP.purple),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: Stack(children: [
            Positioned(
              right: -18,
              bottom: -6,
              top: 10,
              child: Image.asset('assets/images/hero-kids.webp', fit: BoxFit.contain)
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .moveY(begin: 0, end: -6, duration: 1800.ms, curve: Curves.easeInOut),
            ),
            const Positioned(left: 150, top: 14, child: Text('⭐', style: TextStyle(fontSize: 20))),
            const Positioned(left: 14, bottom: 10, child: Text('🎈', style: TextStyle(fontSize: 18))),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 0, 18),
              child: SizedBox(
                width: MediaQuery.sizeOf(context).width * 0.5,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.25), borderRadius: BorderRadius.circular(20)),
                    child: Text('NEW EVERY DAY', style: KP.body(10.5, color: Colors.white, weight: FontWeight.w900)),
                  ),
                  const SizedBox(height: 8),
                  Text('Watch, giggle & learn!', style: KP.display(25, color: Colors.white, height: 1.05)),
                  const Spacer(),
                  Bouncy(
                    onTap: onPlay,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.12), offset: const Offset(0, 4))],
                      ),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        const Icon(Icons.play_arrow_rounded, color: KP.pink, size: 24),
                        const SizedBox(width: 4),
                        Text('Play Shorts', style: KP.display(16, color: KP.ink, weight: FontWeight.w700)),
                      ]),
                    ),
                  ),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

class _Categories extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cats = ref.watch(taxonomyCategoriesProvider);
    return SizedBox(
      height: 112,
      child: cats.when(
        loading: () => const LoadingDots(),
        error: (e, _) => Center(child: TextButton(onPressed: () => ref.invalidate(taxonomyCategoriesProvider), child: const Text('Tap to retry'))),
        data: (list) => ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: list.length,
          separatorBuilder: (_, __) => const SizedBox(width: 6),
          itemBuilder: (context, i) => CategoryBubble(name: list[i].name, style: list[i].style, onTap: () => openCategory(context, list[i].slug))
              .animate()
              .scale(begin: const Offset(0.7, 0.7), delay: (50 * i).ms, curve: Curves.elasticOut, duration: 700.ms),
        ),
      ),
    );
  }
}

class _AsyncRail extends ConsumerWidget {
  final String feed;
  final String title;
  final bool numbered;
  const _AsyncRail({required this.feed, required this.title, this.numbered = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(railProvider(feed));
    return data.when(
      loading: () => const SizedBox(height: 200, child: LoadingDots()),
      error: (e, _) => SizedBox(
        height: 120,
        child: Center(
          child: TextButton.icon(
            onPressed: () => ref.invalidate(railProvider(feed)),
            icon: const Icon(Icons.refresh_rounded),
            label: Text('Couldn\'t load — tap to retry', style: KP.body(14, color: KP.blue, weight: FontWeight.w800)),
          ),
        ),
      ),
      data: (videos) => videos.isEmpty
          ? Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text('Nothing here yet — check back soon! 🧸', style: KP.body(14, color: KP.inkSoft)),
            )
          : VideoRail(videos: videos, title: title, numbered: numbered),
    );
  }
}
