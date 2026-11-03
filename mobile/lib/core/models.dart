int _int(dynamic v) => (v as num?)?.toInt() ?? 0;
double _dbl(dynamic v) => (v as num?)?.toDouble() ?? 0;
DateTime? _date(dynamic v) => v is String ? DateTime.tryParse(v)?.toLocal() : null;

/// A language spoken in a video (primary first).
class VideoLang {
  final String code, nameEn, nameNative, direction;
  final bool isPrimary;
  VideoLang.fromJson(Map<String, dynamic> j)
      : code = j['code'] ?? '',
        nameEn = j['nameEn'] ?? '',
        nameNative = j['nameNative'] ?? j['nameEn'] ?? '',
        direction = j['direction'] ?? 'LTR',
        isPrimary = j['isPrimary'] == true;
  Map<String, dynamic> toJson() => {'code': code, 'nameEn': nameEn, 'nameNative': nameNative, 'direction': direction, 'isPrimary': isPrimary};
  bool get rtl => direction == 'RTL';
  String get label => nameNative.toLowerCase() == nameEn.toLowerCase() ? nameEn : nameNative;
}

/// One of a video's 1–3 category → subcategory tags (priority 1 = primary).
class VideoTag {
  final int priority;
  final String categoryId, categorySlug, categoryName, subcategoryId, subcategorySlug, subcategoryName;
  final String? emoji, color;
  VideoTag.fromJson(Map<String, dynamic> j)
      : priority = _int(j['priority']),
        categoryId = j['category']?['id'] ?? '',
        categorySlug = j['category']?['slug'] ?? '',
        categoryName = j['category']?['name'] ?? '',
        emoji = j['category']?['emoji'],
        color = j['category']?['color'],
        subcategoryId = j['subcategory']?['id'] ?? '',
        subcategorySlug = j['subcategory']?['slug'] ?? '',
        subcategoryName = j['subcategory']?['name'] ?? '';
  Map<String, dynamic> toJson() => {
        'priority': priority,
        'category': {'id': categoryId, 'slug': categorySlug, 'name': categoryName, 'emoji': emoji, 'color': color},
        'subcategory': {'id': subcategoryId, 'slug': subcategorySlug, 'name': subcategoryName},
      };
  String get label => subcategoryName.isEmpty ? categoryName : '$categoryName › $subcategoryName';
}

List<VideoLang> _langs(dynamic v) =>
    (v is List ? v : const []).whereType<Map>().map((e) => VideoLang.fromJson(e.cast<String, dynamic>())).toList();
List<VideoTag> _tags(dynamic v) {
  final list = (v is List ? v : const []).whereType<Map>().map((e) => VideoTag.fromJson(e.cast<String, dynamic>())).toList();
  list.sort((a, b) => a.priority.compareTo(b.priority));
  return list;
}

class VideoCreator {
  final String id, name, username, channelName;
  final String? avatarUrl, channelId, theme;
  final bool verified;
  final int followerCount;

  VideoCreator.fromJson(Map<String, dynamic> j)
      : id = j['id'] ?? '',
        name = j['name'] ?? '',
        username = j['username'] ?? '',
        channelName = j['channelName'] ?? j['name'] ?? '',
        avatarUrl = j['avatarUrl'],
        channelId = j['channelId'],
        theme = j['theme'],
        verified = j['verified'] == true,
        followerCount = _int(j['followerCount']);

  Map<String, dynamic> toJson() => {
        'id': id, 'name': name, 'username': username, 'channelName': channelName,
        'avatarUrl': avatarUrl, 'channelId': channelId, 'theme': theme, 'verified': verified,
        'followerCount': followerCount,
      };
}

/// A public video (feed / grids). Mutable social state so the feed can update in place.
class Video {
  final String id, contentId, title, description, category, videoUrl;
  final String? thumbnailUrl;
  final List<String> hashtags;
  final double duration;
  final int views;
  int likes, commentsCount, shares;
  bool liked, following, saved;
  final DateTime? publishedAt;
  final VideoCreator creator;
  final List<VideoLang> languages;
  final List<VideoTag> tags;

  VideoTag? get primaryTag => tags.isEmpty ? null : tags.first;
  VideoLang? get primaryLanguage => languages.where((l) => l.isPrimary).firstOrNull ?? languages.firstOrNull;

  /// Label for chips: the primary subcategory (localized), else the legacy category label.
  String get categoryLabel => primaryTag?.subcategoryName.isNotEmpty == true ? primaryTag!.subcategoryName : category;

  Video.fromJson(Map<String, dynamic> j)
      : id = j['id'] ?? '',
        contentId = j['contentId'] ?? '',
        title = j['title'] ?? '',
        description = j['description'] ?? '',
        category = j['category'] ?? '',
        videoUrl = j['videoUrl'] ?? '',
        thumbnailUrl = j['thumbnailUrl'],
        hashtags = (j['hashtags'] is List) ? List<String>.from((j['hashtags'] as List).map((e) => '$e')) : const [],
        duration = _dbl(j['duration']),
        views = _int(j['views']),
        likes = _int(j['likes']),
        commentsCount = _int(j['commentsCount']),
        shares = _int(j['shares']),
        liked = j['liked'] == true,
        following = j['following'] == true,
        saved = j['saved'] == true,
        publishedAt = _date(j['publishedAt']),
        creator = VideoCreator.fromJson((j['creator'] as Map?)?.cast<String, dynamic>() ?? const {}),
        languages = _langs(j['languages']),
        tags = _tags(j['tags']);

  Map<String, dynamic> toJson() => {
        'id': id, 'contentId': contentId, 'title': title, 'description': description,
        'category': category, 'videoUrl': videoUrl, 'thumbnailUrl': thumbnailUrl,
        'hashtags': hashtags, 'duration': duration, 'views': views, 'likes': likes,
        'commentsCount': commentsCount, 'shares': shares, 'liked': liked, 'following': following, 'saved': saved,
        'publishedAt': publishedAt?.toUtc().toIso8601String(), 'creator': creator.toJson(),
        'languages': languages.map((l) => l.toJson()).toList(), 'tags': tags.map((t) => t.toJson()).toList(),
      };
}

class ChannelPage {
  final String id, name, username, description;
  final String? avatarUrl, bannerUrl, category, country, tagline, supportEmail, theme;
  int followerCount;
  final int videoCount, totalViews;
  final bool verified;
  bool following;
  final DateTime? joinedAt;
  final Map<String, String> socialLinks;
  final List<Map<String, dynamic>> rawVideos;
  final List<({String name, String? emoji})> preferredCategories;
  final List<({String code, String nameEn, String nameNative})> languages;

  ChannelPage.fromJson(Map<String, dynamic> j)
      : id = j['id'] ?? '',
        name = j['name'] ?? '',
        username = j['username'] ?? '',
        description = j['description'] ?? '',
        avatarUrl = j['avatarUrl'],
        bannerUrl = j['bannerUrl'],
        category = j['category'],
        country = j['country'],
        tagline = (j['tagline'] as String?)?.trim().isEmpty == true ? null : j['tagline'] as String?,
        supportEmail = (j['supportEmail'] as String?)?.trim().isEmpty == true ? null : j['supportEmail'] as String?,
        theme = j['theme'],
        followerCount = _int(j['followerCount']),
        videoCount = j['videoCount'] == null ? ((j['videos'] as List?)?.length ?? 0) : _int(j['videoCount']),
        totalViews = j['totalViews'] == null
            ? ((j['videos'] as List?) ?? const []).fold<int>(0, (a, v) => a + _int((v as Map)['views']))
            : _int(j['totalViews']),
        verified = j['verified'] == true,
        following = j['following'] == true,
        joinedAt = _date(j['joinedAt']),
        socialLinks = {
          for (final e in ((j['socialLinks'] as Map?) ?? const {}).entries)
            if (e.value != null && '${e.value}'.trim().isNotEmpty) '${e.key}': '${e.value}'.trim(),
        },
        rawVideos = ((j['videos'] as List?) ?? const []).map((e) => (e as Map).cast<String, dynamic>()).toList(),
        preferredCategories = ((j['preferredCategories'] as List?) ?? const [])
            .whereType<Map>()
            .map((e) => (name: '${e['name'] ?? ''}', emoji: e['emoji'] as String?))
            .toList(),
        languages = ((j['languages'] as List?) ?? const [])
            .whereType<Map>()
            .map((e) => (code: '${e['code'] ?? ''}', nameEn: '${e['nameEn'] ?? ''}', nameNative: '${e['nameNative'] ?? ''}'))
            .toList();

  /// Older servers sent channel video rows without the creator block — rebuild it from the channel.
  List<Video> videos() => rawVideos
      .map((v) => Video.fromJson({
            ...v,
            'creator': v['creator'] ??
                {
                  'id': '', 'name': name, 'username': username, 'channelName': name,
                  'avatarUrl': avatarUrl, 'channelId': id, 'verified': verified, 'followerCount': followerCount,
                },
            'following': following,
          }))
      .toList();
}
