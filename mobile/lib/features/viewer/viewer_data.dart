import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api.dart';
import '../../core/models.dart';
import '../../core/preferences.dart';

/// Parse a `{ videos: [...] }` payload.
List<Video> parseVideos(Map<String, dynamic> res) =>
    ((res['videos'] as List?) ?? const []).map((e) => Video.fromJson((e as Map).cast<String, dynamic>())).toList();

/// One page of a public feed. [category]/[subcategory] are slugs.
Future<({List<Video> videos, int? nextOffset})> fetchVideoPage(
  ApiClient api, {
  String feed = 'explore',
  String? category,
  String? subcategory,
  List<String> languages = const [],
  String? q,
  int limit = 24,
  int offset = 0,
}) async {
  final res = await api.get('/public/videos', query: {
    'feed': feed,
    'category': ?category,
    'subcategory': ?subcategory,
    if (languages.isNotEmpty) 'languages': languages.join(','),
    'q': ?q,
    'limit': '$limit',
    'offset': '$offset',
  });
  return (videos: parseVideos(res), nextOffset: (res['nextOffset'] as num?)?.toInt());
}

/// Rails on Home: 'trending' | 'explore' — in the languages saved on this phone, without hidden items.
final railProvider = FutureProvider.autoDispose.family<List<Video>, String>((ref, feed) async {
  final languages = ref.watch(guestPrefsProvider.select((g) => g.loaded ? g.effectiveLanguages : const <String>[]));
  ref.watch(feedRefreshProvider);
  final hiddenVideos = ref.watch(hiddenVideosProvider), hiddenCreators = ref.watch(hiddenCreatorsProvider);
  final page = await fetchVideoPage(ref.read(apiProvider), feed: feed, languages: languages, limit: 12);
  return page.videos.where((v) => !hiddenVideos.contains(v.id) && !hiddenCreators.contains(v.creator.id)).toList();
});
