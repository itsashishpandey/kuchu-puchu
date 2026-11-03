import '../../core/api.dart';
import '../../core/models.dart';
import 'viewer_data.dart';

/// Unified search (/api/search): the server reads languages / categories / subcategories out of
/// the words ("Hindi nursery rhymes" → Hindi + Rhymes & Songs › Nursery Rhymes).
/// Exact matches become filters (shown as removable chips); near-misses come back as
/// "Did you mean …?" suggestions and are never applied without a tap.

class SearchSuggestion {
  final String type, id, label, reason, token;
  final String? categoryId;
  SearchSuggestion.fromJson(Map<String, dynamic> j)
      : type = j['type'] ?? '',
        id = j['id'] ?? '',
        label = j['label'] ?? '',
        reason = j['reason'] ?? '',
        token = j['token'] ?? '',
        categoryId = j['categoryId'];
}

class SearchInterpretation {
  final List<({String code, String nameEn, String nameNative})> languages;
  final ({String id, String slug, String name, String? emoji})? category;
  final ({String id, String slug, String name})? subcategory;
  final String text;
  final List<SearchSuggestion> suggestions;

  SearchInterpretation.fromJson(Map<String, dynamic> j)
      : languages = ((j['languages'] as List?) ?? const [])
            .whereType<Map>()
            .map((e) => (code: '${e['code']}', nameEn: '${e['nameEn'] ?? e['code']}', nameNative: '${e['nameNative'] ?? e['code']}'))
            .toList(),
        category = j['category'] is Map
            ? (
                id: '${j['category']['id']}',
                slug: '${j['category']['slug']}',
                name: '${j['category']['name']}',
                emoji: j['category']['emoji'] as String?,
              )
            : null,
        subcategory = j['subcategory'] is Map
            ? (id: '${j['subcategory']['id']}', slug: '${j['subcategory']['slug']}', name: '${j['subcategory']['name']}')
            : null,
        text = (j['text'] ?? '').toString(),
        suggestions = ((j['suggestions'] as List?) ?? const []).whereType<Map>().map((e) => SearchSuggestion.fromJson(e.cast<String, dynamic>())).toList();

  bool get hasFilters => languages.isNotEmpty || category != null || subcategory != null;
}

class SearchCreator {
  final String username, channelName;
  final String? avatarUrl;
  final bool verified;
  final int followerCount;
  SearchCreator.fromJson(Map<String, dynamic> j)
      : username = j['username'] ?? '',
        channelName = j['channelName'] ?? '',
        avatarUrl = j['avatarUrl'],
        verified = j['verified'] == true,
        followerCount = (j['followerCount'] as num?)?.toInt() ?? 0;
}

class SearchResult {
  final SearchInterpretation interpretation;
  final List<Video> videos;
  final List<SearchCreator> creators;
  final int total;
  int? nextOffset; // moves on with "Show more"
  SearchResult.fromJson(Map<String, dynamic> j)
      : interpretation = SearchInterpretation.fromJson((j['interpretation'] as Map?)?.cast<String, dynamic>() ?? const {}),
        videos = parseVideos(j),
        creators = ((j['creators'] as List?) ?? const []).whereType<Map>().map((e) => SearchCreator.fromJson(e.cast<String, dynamic>())).toList(),
        total = (j['total'] as num?)?.toInt() ?? 0,
        nextOffset = (j['nextOffset'] as num?)?.toInt();
}

/// What is sent: the free text plus (once the viewer edits chips) explicit filters.
class SearchRequest {
  final String text;
  final List<String> languages;
  final String? categoryId, subcategoryId;
  final bool explicit; // false = let the server interpret the text
  const SearchRequest(this.text, {this.languages = const [], this.categoryId, this.subcategoryId, this.explicit = false});

  bool get isEmpty => text.trim().isEmpty && languages.isEmpty && categoryId == null && subcategoryId == null;

  Map<String, dynamic> query(int offset) => {
        'q': text,
        if (explicit && languages.isNotEmpty) 'languages': languages.join(','),
        if (explicit && categoryId != null) 'category': categoryId,
        if (explicit && subcategoryId != null) 'subcategory': subcategoryId,
        'limit': '24',
        'offset': '$offset',
      };

  /// Turn the server's reading of the text into explicit filters (so a chip can be removed).
  static SearchRequest fromInterpretation(SearchInterpretation i) => SearchRequest(
        i.text,
        languages: i.languages.map((l) => l.code).toList(),
        categoryId: i.category?.id,
        subcategoryId: i.subcategory?.id,
        explicit: true,
      );

  SearchRequest copyWith({String? text, List<String>? languages, String? categoryId, String? subcategoryId, bool clearCategory = false, bool clearSubcategory = false}) =>
      SearchRequest(
        text ?? this.text,
        languages: languages ?? this.languages,
        categoryId: clearCategory ? null : (categoryId ?? this.categoryId),
        subcategoryId: clearSubcategory || clearCategory ? null : (subcategoryId ?? this.subcategoryId),
        explicit: true,
      );

  /// Apply a "Did you mean …?" suggestion: swap the misspelled words for the filter.
  SearchRequest apply(SearchSuggestion s, SearchInterpretation current) {
    final base = explicit ? this : fromInterpretation(current);
    final words = base.text.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    final drop = s.token.toLowerCase().split(RegExp(r'\s+')).toSet();
    final text = words.where((w) => !drop.contains(w.toLowerCase())).join(' ');
    switch (s.type) {
      case 'language':
        return base.copyWith(text: text, languages: {...base.languages, s.id}.toList());
      case 'subcategory':
        return base.copyWith(text: text, categoryId: s.categoryId, subcategoryId: s.id);
      default:
        return base.copyWith(text: text, categoryId: s.id, clearSubcategory: true);
    }
  }
}

Future<SearchResult> runSearch(ApiClient api, SearchRequest r, {int offset = 0}) async =>
    SearchResult.fromJson(await api.get('/search', query: r.query(offset)));
