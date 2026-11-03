import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'models.dart';

/// Watch history lives on the phone (the server only keeps anonymous view events).
class HistoryController extends StateNotifier<List<Video>> {
  static const _key = 'kp_watch_history';
  static const _max = 60;

  HistoryController() : super(const []) {
    _ready = _load();
  }

  /// The saved list loads asynchronously. Every change waits for it, or the first
  /// video watched after launch would overwrite the saved history.
  late final Future<void> _ready;

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null) return;
      final list = (jsonDecode(raw) as List).map((e) => Video.fromJson((e as Map).cast<String, dynamic>())).toList();
      state = list;
    } catch (_) {}
  }

  Future<void> add(Video v) async {
    await _ready;
    final next = [v, ...state.where((e) => e.id != v.id)].take(_max).toList();
    state = next;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, jsonEncode(next.map((e) => e.toJson()).toList()));
    } catch (_) {}
  }

  Future<void> clear() async {
    await _ready;
    state = const [];
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_key);
    } catch (_) {}
  }
}

final historyProvider = StateNotifierProvider<HistoryController, List<Video>>((_) => HistoryController());

/// Videos liked on this phone (newest first) — keeps the heart filled and powers the Liked rail.
/// The server only keeps an anonymous like count.
class LikedController extends StateNotifier<List<Video>> {
  static const _key = 'kp_liked_videos';
  static const _max = 200;

  LikedController() : super(const []) {
    _ready = _load();
  }

  late final Future<void> _ready; // see HistoryController._ready

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null) return;
      state = (jsonDecode(raw) as List).map((e) => Video.fromJson((e as Map).cast<String, dynamic>())).toList();
    } catch (_) {}
  }

  bool isLiked(String id) => state.any((v) => v.id == id);

  Future<void> set(Video v, bool liked) async {
    await _ready;
    final rest = state.where((e) => e.id != v.id);
    final next = liked ? [v, ...rest].take(_max).toList() : rest.toList();
    state = next;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, jsonEncode(next.map((e) => e.toJson()).toList()));
    } catch (_) {}
  }
}

final likedVideosProvider = StateNotifierProvider<LikedController, List<Video>>((_) => LikedController());

/// Ids of liked videos, for quick lookups.
final likedIdsProvider = Provider<Set<String>>((ref) => ref.watch(likedVideosProvider).map((v) => v.id).toSet());
