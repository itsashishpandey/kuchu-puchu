import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/config.dart';
import '../core/format.dart';
import '../core/models.dart';
import '../core/theme.dart';

// ───────────────────────────── Touch & buttons ─────────────────────────────

/// Squishes a little when pressed — makes every tap feel like a toy button.
class Bouncy extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;
  const Bouncy({super.key, required this.child, this.onTap, this.scale = 0.94});
  @override
  State<Bouncy> createState() => _BouncyState();
}

class _BouncyState extends State<Bouncy> {
  bool _down = false;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: widget.onTap == null ? null : (_) => setState(() => _down = true),
      onTapCancel: () => setState(() => _down = false),
      onTapUp: widget.onTap == null ? null : (_) => setState(() => _down = false),
      onTap: widget.onTap == null
          ? null
          : () {
              HapticFeedback.lightImpact();
              widget.onTap!();
            },
      child: AnimatedScale(
        scale: _down ? widget.scale : 1,
        duration: const Duration(milliseconds: 110),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

/// Chunky pill button with a gradient and a "3D" lip underneath.
class KpButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final Gradient gradient;
  final IconData? icon;
  final String? emoji;
  final bool loading;
  final bool expand;
  final double height;
  final Color? textColor;

  const KpButton({
    super.key,
    required this.label,
    this.onTap,
    this.gradient = KP.brand,
    this.icon,
    this.emoji,
    this.loading = false,
    this.expand = true,
    this.height = 56,
    this.textColor,
  });

  const KpButton.light({
    super.key,
    required this.label,
    this.onTap,
    this.icon,
    this.emoji,
    this.loading = false,
    this.expand = true,
    this.height = 56,
  })  : gradient = const LinearGradient(colors: [Colors.white, Colors.white]),
        textColor = KP.ink;

  @override
  Widget build(BuildContext context) {
    final disabled = onTap == null || loading;
    final fg = textColor ?? Colors.white;
    final child = Container(
      height: height,
      width: expand ? double.infinity : null,
      padding: const EdgeInsets.symmetric(horizontal: 26),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(height),
        border: textColor == KP.ink ? Border.all(color: KP.line, width: 2) : null,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.10), offset: const Offset(0, 5)),
          BoxShadow(color: (gradient.colors.first).withValues(alpha: 0.30), blurRadius: 16, offset: const Offset(0, 8)),
        ],
      ),
      child: Row(
        mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (loading)
            SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 3, color: fg))
          else ...[
            if (emoji != null) ...[Text(emoji!, style: const TextStyle(fontSize: 20)), const SizedBox(width: 8)],
            if (icon != null) ...[Icon(icon, color: fg, size: 22), const SizedBox(width: 8)],
            Flexible(
              child: Text(label, overflow: TextOverflow.ellipsis, style: KP.display(height > 50 ? 19 : 16, color: fg, weight: FontWeight.w700)),
            ),
          ],
        ],
      ),
    );
    return Opacity(opacity: disabled && !loading ? 0.55 : 1, child: Bouncy(onTap: disabled ? null : onTap, child: child));
  }
}

/// Round icon button with a soft colored disc.
class CircleIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final Color color;
  final Color background;
  final double size;
  final int? badge;
  const CircleIconButton({
    super.key,
    required this.icon,
    this.onTap,
    this.color = KP.ink,
    this.background = Colors.white,
    this.size = 44,
    this.badge,
  });
  @override
  Widget build(BuildContext context) {
    return Bouncy(
      onTap: onTap,
      child: Stack(clipBehavior: Clip.none, children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(color: background, shape: BoxShape.circle, boxShadow: KP.softShadow()),
          child: Icon(icon, color: color, size: size * 0.5),
        ),
        if ((badge ?? 0) > 0)
          Positioned(
            right: -2,
            top: -2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: KP.pink, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white, width: 2)),
              child: Text(badge! > 9 ? '9+' : '$badge', style: KP.body(10, color: Colors.white, weight: FontWeight.w900)),
            ),
          ),
      ]),
    );
  }
}

// ───────────────────────────── Images ─────────────────────────────

class NetImage extends StatelessWidget {
  final String? path;
  final BoxFit fit;
  final Widget? fallback;
  const NetImage(this.path, {super.key, this.fit = BoxFit.cover, this.fallback});

  @override
  Widget build(BuildContext context) {
    final url = AppConfig.media(path);
    final fb = fallback ??
        Container(
          decoration: const BoxDecoration(gradient: KP.skyGrad),
          alignment: Alignment.center,
          child: const Text('🎈', style: TextStyle(fontSize: 34)),
        );
    if (url.isEmpty) return fb;
    return CachedNetworkImage(
      imageUrl: url,
      fit: fit,
      fadeInDuration: const Duration(milliseconds: 180),
      placeholder: (_, __) => Container(color: KP.blueSoft),
      errorWidget: (_, __, ___) => fb,
    );
  }
}

/// Avatar with a colorful ring; falls back to a bright initial bubble.
class KpAvatar extends StatelessWidget {
  final String? url;
  final String name;
  final double size;
  final bool ring;
  final Gradient ringGradient;
  const KpAvatar({super.key, this.url, required this.name, this.size = 44, this.ring = true, this.ringGradient = KP.brand});

  @override
  Widget build(BuildContext context) {
    final colors = [KP.blue, KP.pink, KP.purple, KP.orange, KP.green];
    final c = colors[name.isEmpty ? 0 : name.codeUnitAt(0) % colors.length];
    final initial = Container(
      color: c.withValues(alpha: 0.15),
      alignment: Alignment.center,
      child: Text(name.isEmpty ? '🙂' : name.characters.first.toUpperCase(), style: KP.display(size * 0.42, color: c)),
    );
    final inner = ClipOval(
      child: SizedBox(
        width: size,
        height: size,
        child: (url == null || url!.isEmpty) ? initial : NetImage(url, fallback: initial),
      ),
    );
    if (!ring) return inner;
    return Container(
      padding: EdgeInsets.all(size > 60 ? 3.5 : 2.2),
      decoration: BoxDecoration(gradient: ringGradient, shape: BoxShape.circle),
      child: Container(padding: const EdgeInsets.all(2), decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: inner),
    );
  }
}

// ───────────────────────────── Cards ─────────────────────────────

class SoftCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  final VoidCallback? onTap;
  final Gradient? gradient;
  const SoftCard({super.key, required this.child, this.padding = const EdgeInsets.all(18), this.color = Colors.white, this.onTap, this.gradient});

  @override
  Widget build(BuildContext context) {
    final box = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null ? color : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(KP.rLg),
        boxShadow: KP.softShadow(),
      ),
      child: child,
    );
    return onTap == null ? box : Bouncy(onTap: onTap, scale: 0.97, child: box);
  }
}

/// Portrait thumbnail card for grids and rails.
class VideoCard extends StatelessWidget {
  final Video video;
  final VoidCallback onTap;
  final double width;
  final String? badge;
  final bool showCreator;
  const VideoCard({super.key, required this.video, required this.onTap, this.width = 150, this.badge, this.showCreator = true});

  @override
  Widget build(BuildContext context) {
    final cat = videoStyle(video);
    final lang = video.primaryLanguage;
    return Bouncy(
      onTap: onTap,
      scale: 0.96,
      child: SizedBox(
        width: width,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          AspectRatio(
            aspectRatio: 9 / 14,
            child: Container(
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(22), boxShadow: KP.softShadow(cat.color)),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: Stack(fit: StackFit.expand, children: [
                  NetImage(video.thumbnailUrl),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.transparent, Color(0xAA000000)],
                      ),
                    ),
                  ),
                  Positioned(
                    left: 8,
                    top: 8,
                    child: _Pill(text: '${cat.emoji} ${seconds(video.duration)}', color: Colors.white, textColor: KP.ink),
                  ),
                  if (badge != null)
                    Positioned(right: 8, top: 8, child: _Pill(text: badge!, color: KP.pink, textColor: Colors.white))
                  else if (lang != null && lang.code != 'en')
                    Positioned(right: 8, top: 8, child: _Pill(text: lang.label, color: KP.ink, textColor: Colors.white)),
                  Positioned(
                    left: 10,
                    bottom: 8,
                    right: 10,
                    child: Row(children: [
                      const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 18),
                      Text(compact(video.views), style: KP.body(13, color: Colors.white, weight: FontWeight.w800)),
                      const Spacer(),
                      const Icon(Icons.favorite_rounded, color: KP.pinkLight, size: 15),
                      const SizedBox(width: 2),
                      Text(compact(video.likes), style: KP.body(12, color: Colors.white, weight: FontWeight.w800)),
                    ]),
                  ),
                ]),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(video.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: KP.body(13.5, weight: FontWeight.w800, height: 1.2)),
          if (showCreator) ...[
            const SizedBox(height: 2),
            Text('@${video.creator.username}', maxLines: 1, overflow: TextOverflow.ellipsis, style: KP.body(12, color: KP.inkSoft)),
          ],
        ]),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String text;
  final Color color, textColor;
  const _Pill({required this.text, required this.color, required this.textColor});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.92), borderRadius: BorderRadius.circular(20)),
        child: Text(text, style: KP.body(11, color: textColor, weight: FontWeight.w900)),
      );
}

/// Colored chip for statuses ("In review", "Live" …).
class StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  final String? emoji;
  const StatusChip(this.label, this.color, {super.key, this.emoji});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(20)),
        child: Text('${emoji != null ? '$emoji ' : ''}$label', style: KP.body(12, color: color, weight: FontWeight.w900)),
      );
}

/// Category bubble with emoji — the main "by picture" navigation for kids.
class CategoryBubble extends StatelessWidget {
  final String name;
  final VoidCallback onTap;
  final bool selected;
  final CategoryStyle? style;
  const CategoryBubble({super.key, required this.name, required this.onTap, this.selected = false, this.style});

  String get _short => CategoryStyle.shortName(name);

  @override
  Widget build(BuildContext context) {
    final s = style ?? CategoryStyle.of(name);
    return Bouncy(
      onTap: onTap,
      child: SizedBox(
        width: 78,
        child: Column(children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 66,
            height: 66,
            decoration: BoxDecoration(
              color: selected ? s.color : s.soft,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: KP.softShadow(s.color),
            ),
            alignment: Alignment.center,
            child: Text(s.emoji, style: const TextStyle(fontSize: 30)),
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(_short, maxLines: 1, textAlign: TextAlign.center, style: KP.body(11.5, weight: FontWeight.w800, height: 1.1)),
          ),
        ]),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String title;
  final String? emoji;
  final String? action;
  final VoidCallback? onAction;
  const SectionTitle(this.title, {super.key, this.emoji, this.action, this.onAction});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 22, 12, 10),
        child: Row(children: [
          if (emoji != null) ...[Text(emoji!, style: const TextStyle(fontSize: 22)), const SizedBox(width: 8)],
          Expanded(child: Text(title, style: KP.display(21))),
          if (action != null)
            TextButton(
              onPressed: onAction,
              child: Text(action!, style: KP.body(13.5, color: KP.blue, weight: FontWeight.w800)),
            ),
        ]),
      );
}

// ───────────────────────────── Fun & states ─────────────────────────────

/// Floating emoji stickers that drift gently behind a screen.
class StickerLayer extends StatelessWidget {
  final List<String> stickers;
  final double opacity;
  const StickerLayer({super.key, this.stickers = const ['🎈', '⭐', '🧸', '🦄', '🌈', '🍭'], this.opacity = 0.9});

  @override
  Widget build(BuildContext context) {
    const spots = [
      Alignment(-0.85, -0.82), Alignment(0.88, -0.6), Alignment(-0.9, 0.15),
      Alignment(0.82, 0.32), Alignment(-0.55, 0.86), Alignment(0.6, 0.9),
    ];
    return IgnorePointer(
      child: Stack(children: [
        for (var i = 0; i < stickers.length && i < spots.length; i++)
          Align(
            alignment: spots[i],
            child: Opacity(
              opacity: opacity,
              child: Text(stickers[i], style: TextStyle(fontSize: 26 + (i % 3) * 6.0))
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .moveY(begin: -6, end: 6, duration: (1800 + i * 300).ms, curve: Curves.easeInOut)
                  .rotate(begin: -0.03, end: 0.03, duration: (2200 + i * 200).ms),
            ),
          ),
      ]),
    );
  }
}

class EmptyState extends StatelessWidget {
  final String emoji;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final String? image;
  const EmptyState({super.key, this.emoji = '🎈', required this.title, required this.message, this.actionLabel, this.onAction, this.image});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          if (image != null)
            Image.asset(image!, height: 150).animate().scale(begin: const Offset(0.8, 0.8), curve: Curves.elasticOut, duration: 900.ms)
          else
            Text(emoji, style: const TextStyle(fontSize: 64))
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .moveY(begin: -5, end: 5, duration: 1400.ms, curve: Curves.easeInOut),
          const SizedBox(height: 14),
          Text(title, textAlign: TextAlign.center, style: KP.display(22)),
          const SizedBox(height: 6),
          Text(message, textAlign: TextAlign.center, style: KP.body(14.5, color: KP.inkSoft, height: 1.35)),
          if (actionLabel != null) ...[
            const SizedBox(height: 20),
            KpButton(label: actionLabel!, onTap: onAction, expand: false, height: 50),
          ],
        ]),
      ),
    );
  }
}

class ErrorView extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;
  const ErrorView({super.key, required this.error, required this.onRetry});
  @override
  Widget build(BuildContext context) => EmptyState(
        emoji: '🙈',
        title: 'Oops!',
        message: '$error',
        actionLabel: 'Try again',
        onAction: onRetry,
      );
}

/// Three bouncing candy dots.
class LoadingDots extends StatelessWidget {
  final bool onDark;
  const LoadingDots({super.key, this.onDark = false});
  @override
  Widget build(BuildContext context) {
    const colors = [KP.blue, KP.yellow, KP.pink];
    return Center(
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        for (var i = 0; i < 3; i++)
          Container(
            width: 14,
            height: 14,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(color: colors[i], shape: BoxShape.circle),
          )
              .animate(onPlay: (c) => c.repeat(reverse: true), delay: (i * 140).ms)
              .moveY(begin: 0, end: -12, duration: 380.ms, curve: Curves.easeOut),
      ]),
    );
  }
}

void toast(BuildContext context, String message, {String emoji = '✨'}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text('$emoji  $message'), duration: const Duration(seconds: 3)));
}

/// Page scaffold with the soft pastel glow behind content.
class GlowPage extends StatelessWidget {
  final Widget child;
  final bool stickers;
  const GlowPage({super.key, required this.child, this.stickers = false});
  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: KP.pageGlow,
        child: Stack(children: [if (stickers) const Positioned.fill(child: StickerLayer(opacity: 0.35)), child]),
      );
}

/// Emoji + colour for a video: its primary category from the taxonomy, else the built-in map.
CategoryStyle videoStyle(Video v) {
  final t = v.primaryTag;
  return t == null ? CategoryStyle.of(v.category) : CategoryStyle.from(t.emoji, t.color, fallback: v.category);
}

/// Progress pills for multi-step flows (sign-up, onboarding).
class StepDots extends StatelessWidget {
  final int step;
  final int count;
  final Gradient gradient;
  const StepDots({super.key, required this.step, this.count = 2, this.gradient = KP.pinkGrad});
  @override
  Widget build(BuildContext context) => Semantics(
        label: 'Step ${step + 1} of $count',
        child: Row(children: [
          for (var i = 0; i < count; i++)
            Expanded(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                height: 8,
                margin: EdgeInsets.only(right: i < count - 1 ? 8 : 0),
                decoration: BoxDecoration(
                  gradient: i <= step ? gradient : null,
                  color: i <= step ? null : KP.line,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
        ]),
      );
}

/// Rounded selectable chip used by the language / interest pickers and filters.
class SelectChip extends StatelessWidget {
  final String label;
  final String? emoji;
  final bool selected;
  final Color color;
  final VoidCallback? onTap;
  final Widget? trailing;
  final TextDirection? textDirection;
  final bool dense;
  const SelectChip({
    super.key,
    required this.label,
    this.emoji,
    this.selected = false,
    this.color = KP.blue,
    this.onTap,
    this.trailing,
    this.textDirection,
    this.dense = false,
  });

  @override
  Widget build(BuildContext context) {
    return Bouncy(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: EdgeInsets.symmetric(horizontal: dense ? 11 : 14, vertical: dense ? 7 : 9),
        decoration: BoxDecoration(
          color: selected ? color : Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: selected ? color : KP.line, width: 1.8),
          boxShadow: selected ? [BoxShadow(color: color.withValues(alpha: 0.28), blurRadius: 10, offset: const Offset(0, 4))] : null,
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (emoji != null && emoji!.isNotEmpty) ...[Text(emoji!, style: TextStyle(fontSize: dense ? 14 : 16)), const SizedBox(width: 6)],
          Flexible(
            child: Text(
              label,
              textDirection: textDirection,
              overflow: TextOverflow.ellipsis,
              style: KP.body(dense ? 12.5 : 13.5, color: selected ? Colors.white : KP.ink, weight: FontWeight.w800),
            ),
          ),
          if (trailing != null) ...[const SizedBox(width: 6), trailing!],
        ]),
      ),
    );
  }
}

/// Snackbar with an Undo action (not interested / don't recommend …).
void undoToast(BuildContext context, String message, {String emoji = '👍', required VoidCallback onUndo}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text('$emoji  $message'),
      duration: const Duration(seconds: 5),
      action: SnackBarAction(label: 'Undo', textColor: KP.yellow, onPressed: onUndo),
    ));
}
