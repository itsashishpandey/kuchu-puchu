import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/models.dart';
import '../../shared/widgets.dart';
import '../feed/play_screen.dart';

/// Opens the full-screen player on [videos] starting at [index].
void openPlayer(BuildContext context, List<Video> videos, int index, {String title = ''}) {
  context.push('/play', extra: PlayArgs(videos: videos, index: index, title: title));
}

/// Two-column grid of video cards, sized so titles never clip.
SliverGridDelegate videoGridDelegate(BuildContext context, {double hPad = 16, double spacing = 14}) {
  final w = MediaQuery.sizeOf(context).width;
  final cell = (w - hPad * 2 - spacing) / 2;
  return SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    crossAxisSpacing: spacing,
    mainAxisSpacing: 18,
    mainAxisExtent: cell * 14 / 9 + 74,
  );
}

class VideoGridSliver extends StatelessWidget {
  final List<Video> videos;
  final String title;
  final bool showCreator;
  const VideoGridSliver({super.key, required this.videos, this.title = '', this.showCreator = true});

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: videoGridDelegate(context),
        delegate: SliverChildBuilderDelegate(
          (context, i) => VideoCard(
            video: videos[i],
            width: double.infinity,
            showCreator: showCreator,
            onTap: () => openPlayer(context, videos, i, title: title),
          ).animate().fadeIn(delay: (40 * (i % 8)).ms, duration: 300.ms).slideY(begin: 0.08, end: 0),
          childCount: videos.length,
        ),
      ),
    );
  }
}

/// Horizontal rail of video cards.
class VideoRail extends StatelessWidget {
  final List<Video> videos;
  final String title;
  final bool numbered;
  const VideoRail({super.key, required this.videos, this.title = '', this.numbered = false});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 150 * 14 / 9 + 76,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: videos.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (context, i) => VideoCard(
          video: videos[i],
          badge: numbered ? '#${i + 1}' : null,
          onTap: () => openPlayer(context, videos, i, title: title),
        ),
      ),
    );
  }
}
