import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../shared/widgets.dart';

/// Animated splash: the icon pops in on the same sky gradient as the native
/// launch screen, then straight into the Shorts feed (no accounts in this app).
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});
  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _minTimeDone = false;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      setState(() => _minTimeDone = true);
      _maybeGo();
    });
  }

  void _maybeGo() {
    if (_navigated || !_minTimeDone) return;
    _navigated = true;
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: KP.skyGrad),
        child: Stack(children: [
          const Positioned.fill(child: StickerLayer(opacity: 0.85)),
          Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(44),
                child: Image.asset('assets/images/app_icon.png', width: 168, height: 168),
              )
                  .animate()
                  .scale(begin: const Offset(0.3, 0.3), duration: 900.ms, curve: Curves.elasticOut)
                  .then(delay: 200.ms)
                  .shake(hz: 3, rotation: 0.04, duration: 500.ms),
              const SizedBox(height: 24),
              Text('Kuchu Puchu', style: KP.display(44, color: Colors.white))
                  .animate()
                  .fadeIn(delay: 350.ms, duration: 400.ms)
                  .slideY(begin: 0.4, curve: Curves.easeOutBack),
              const SizedBox(height: 4),
              Text('Watch. Giggle. Learn.', style: KP.body(18, color: Colors.white, weight: FontWeight.w800))
                  .animate()
                  .fadeIn(delay: 650.ms, duration: 400.ms),
              const SizedBox(height: 40),
              const LoadingDots().animate().fadeIn(delay: 900.ms),
            ]),
          ),
        ]),
      ),
    );
  }
}
