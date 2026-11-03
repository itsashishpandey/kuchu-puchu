import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:kuchu_puchu/core/history.dart';
import 'package:kuchu_puchu/core/models.dart';
import 'package:shared_preferences/shared_preferences.dart';

Video _video(String id) => Video.fromJson({'id': id, 'contentId': 'VID-$id', 'title': 'Video $id', 'videoUrl': '/v/$id.mp4'});

List<String> _savedIds(SharedPreferences prefs, String key) =>
    (jsonDecode(prefs.getString(key) ?? '[]') as List).map((e) => (e as Map)['id'] as String).toList();

void main() {
  // The app opens on Shorts, so the first watched video can reach the history
  // before the saved list has finished loading from the phone.
  test('watching a video right after launch keeps the saved history', () async {
    SharedPreferences.setMockInitialValues({
      'kp_watch_history': jsonEncode([_video('old').toJson()]),
    });
    final history = HistoryController();
    await history.add(_video('new'));
    await Future<void>.delayed(const Duration(milliseconds: 20));

    expect(history.state.map((v) => v.id), ['new', 'old']);
    expect(_savedIds(await SharedPreferences.getInstance(), 'kp_watch_history'), ['new', 'old']);
  });

  test('liking a video right after launch keeps the saved likes', () async {
    SharedPreferences.setMockInitialValues({
      'kp_liked_videos': jsonEncode([_video('old').toJson()]),
    });
    final liked = LikedController();
    await liked.set(_video('new'), true);
    await Future<void>.delayed(const Duration(milliseconds: 20));

    expect(liked.state.map((v) => v.id), ['new', 'old']);
    expect(_savedIds(await SharedPreferences.getInstance(), 'kp_liked_videos'), ['new', 'old']);
  });
}
