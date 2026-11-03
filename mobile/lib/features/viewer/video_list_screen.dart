import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import '../../shared/widgets.dart';
import 'video_grid.dart';

class VideoListArgs {
  final String title;
  final String emoji;
  final Future<List<Video>> Function(ApiClient api) load;
  const VideoListArgs({required this.title, this.emoji = '🎬', required this.load});
}

/// A titled grid of videos (category, liked, history, search …).
class VideoListScreen extends ConsumerStatefulWidget {
  final VideoListArgs args;
  const VideoListScreen({super.key, required this.args});
  @override
  ConsumerState<VideoListScreen> createState() => _VideoListScreenState();
}

class _VideoListScreenState extends ConsumerState<VideoListScreen> {
  late Future<List<Video>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.args.load(ref.read(apiProvider));
  }

  Future<void> _reload() async {
    setState(() => _future = widget.args.load(ref.read(apiProvider)));
    await _future.catchError((_) => <Video>[]);
  }

  @override
  Widget build(BuildContext context) {
    final cat = CategoryStyle.of(widget.args.title);
    return Scaffold(
      body: GlowPage(
        stickers: true,
        child: FutureBuilder<List<Video>>(
          future: _future,
          builder: (context, snap) {
            return RefreshIndicator(
              onRefresh: _reload,
              color: KP.pink,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverAppBar(
                    pinned: true,
                    backgroundColor: Colors.white.withValues(alpha: 0.85),
                    leading: Padding(
                      padding: const EdgeInsets.all(6),
                      child: CircleIconButton(icon: Icons.arrow_back_rounded, onTap: () => Navigator.of(context).maybePop()),
                    ),
                    title: Row(children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(color: cat.soft, shape: BoxShape.circle),
                        alignment: Alignment.center,
                        child: Text(widget.args.emoji, style: const TextStyle(fontSize: 20)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: Text(widget.args.title, overflow: TextOverflow.ellipsis, style: KP.display(22))),
                    ]),
                  ),
                  if (snap.connectionState != ConnectionState.done)
                    const SliverFillRemaining(hasScrollBody: false, child: LoadingDots())
                  else if (snap.hasError)
                    SliverFillRemaining(hasScrollBody: false, child: ErrorView(error: snap.error!, onRetry: _reload))
                  else if ((snap.data ?? const []).isEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: EmptyState(emoji: '🧸', title: 'Nothing here yet', message: 'New cartoons are on their way — check back soon!'),
                    )
                  else ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 14, 20, 12),
                        child: Text('${snap.data!.length} videos to watch', style: KP.body(14, color: KP.inkSoft, weight: FontWeight.w700)),
                      ),
                    ),
                    VideoGridSliver(videos: snap.data!, title: widget.args.title),
                    const SliverToBoxAdapter(child: SizedBox(height: 40)),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
