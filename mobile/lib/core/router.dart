import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/splash_screen.dart';
import '../features/feed/play_screen.dart';
import '../features/viewer/category_screen.dart';
import '../features/viewer/channel_screen.dart';
import '../features/viewer/video_list_screen.dart';
import '../features/viewer/viewer_shell.dart';

/// Global so screens (e.g. the feed) can tell when another route covers them.
final routeObserver = RouteObserver<ModalRoute<void>>();

/// Watch-only kids app: no accounts, no creator screens. Splash → Shorts feed.
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    observers: [routeObserver],
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(
        path: '/home',
        builder: (_, s) => ViewerShell(initialTab: int.tryParse(s.uri.queryParameters['tab'] ?? '') ?? ViewerShell.shortsTab),
      ),
      GoRoute(path: '/play', builder: (_, s) => PlayScreen(args: s.extra as PlayArgs)),
      GoRoute(path: '/channel/:username', builder: (_, s) => ChannelScreen(username: s.pathParameters['username']!)),
      GoRoute(path: '/videos', builder: (_, s) => VideoListScreen(args: s.extra as VideoListArgs)),
      GoRoute(
        path: '/category/:slug',
        builder: (_, s) => CategoryScreen(slug: s.pathParameters['slug']!, initialSubcategory: s.uri.queryParameters['sub']),
      ),
    ],
    errorBuilder: (_, __) => const ViewerShell(initialTab: ViewerShell.shortsTab),
  );
});
