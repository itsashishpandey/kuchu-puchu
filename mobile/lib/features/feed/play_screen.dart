import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/models.dart';
import '../../core/theme.dart';
import '../../shared/widgets.dart';
import 'shorts_feed.dart';

class PlayArgs {
  final List<Video> videos;
  final int index;
  final String title;
  const PlayArgs({required this.videos, required this.index, this.title = ''});
}

/// Full-screen player for a fixed list (a rail, a grid, a channel …).
class PlayScreen extends StatelessWidget {
  final PlayArgs args;
  const PlayScreen({super.key, required this.args});

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: Colors.black,
        // fill the whole screen: a plain Stack would shrink to the height of the top bar (the bug where the
        // video showed as a thin strip at the top)
        body: Stack(
          fit: StackFit.expand,
          children: [
            Positioned.fill(
              child: ShortsFeed(videos: args.videos, initialIndex: args.index),
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                  child: Row(
                    children: [
                      CircleIconButton(
                        icon: Icons.arrow_back_rounded,
                        background: Colors.black.withValues(alpha: 0.35),
                        color: Colors.white,
                        onTap: () => Navigator.of(context).maybePop(),
                      ),
                      const SizedBox(width: 12),
                      if (args.title.isNotEmpty)
                        Flexible(
                          child: Text(
                            args.title,
                            overflow: TextOverflow.ellipsis,
                            style: KP
                                .display(20, color: Colors.white)
                                .copyWith(
                                  shadows: const [
                                    Shadow(
                                      color: Colors.black54,
                                      blurRadius: 8,
                                    ),
                                  ],
                                ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
