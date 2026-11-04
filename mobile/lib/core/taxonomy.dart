import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api.dart';
import 'preferences.dart';
import 'theme.dart';

/// Languages + main categories + subcategories from the server (/api/taxonomy/*).
/// Admins manage them; the app only ever shows what is active.

class TaxLanguage {
  final String id, code, nameEn, nameNative, script, direction, group;
  final bool popular;
  final int priority, videoCount;

  TaxLanguage.fromJson(Map<String, dynamic> j)
      : id = j['id'] ?? '',
        code = j['code'] ?? '',
        nameEn = j['nameEn'] ?? '',
        nameNative = j['nameNative'] ?? j['nameEn'] ?? '',
        script = j['script'] ?? 'Latn',
        direction = j['direction'] ?? 'LTR',
        group = j['group'] ?? 'INTERNATIONAL',
        popular = j['popular'] == true,
        priority = (j['priority'] as num?)?.toInt() ?? 100,
        videoCount = (j['videoCount'] as num?)?.toInt() ?? 0;

  bool get rtl => direction == 'RTL';
  bool get sameNames => nameNative.toLowerCase() == nameEn.toLowerCase();
  TextDirection get textDirection => rtl ? TextDirection.rtl : TextDirection.ltr;

  bool matches(String q) {
    final s = q.trim().toLowerCase();
    if (s.isEmpty) return true;
    return nameEn.toLowerCase().contains(s) || nameNative.toLowerCase().contains(s) || code.toLowerCase() == s;
  }
}

class TaxSubcategory {
  final String id, slug, name, nameEn, categoryId;
  final String? emoji;
  final int videoCount;
  TaxSubcategory.fromJson(Map<String, dynamic> j, this.categoryId)
      : id = j['id'] ?? '',
        slug = j['slug'] ?? '',
        name = j['name'] ?? '',
        nameEn = j['nameEn'] ?? j['name'] ?? '',
        emoji = j['emoji'],
        videoCount = (j['videoCount'] as num?)?.toInt() ?? 0;
}

class TaxCategory {
  final String id, slug, name, nameEn;
  final String? description, emoji, colorHex, coverImageUrl;
  final int videoCount;
  final List<TaxSubcategory> subcategories;

  TaxCategory.fromJson(Map<String, dynamic> j)
      : id = j['id'] ?? '',
        slug = j['slug'] ?? '',
        name = j['name'] ?? '',
        nameEn = j['nameEn'] ?? j['name'] ?? '',
        description = j['description'],
        emoji = j['emoji'],
        colorHex = j['color'],
        coverImageUrl = j['coverImageUrl'],
        videoCount = (j['videoCount'] as num?)?.toInt() ?? 0,
        subcategories = ((j['subcategories'] as List?) ?? const [])
            .whereType<Map>()
            .map((e) => TaxSubcategory.fromJson(e.cast<String, dynamic>(), '${j['id']}'))
            .toList();

  CategoryStyle get style => CategoryStyle.from(emoji, colorHex, fallback: nameEn);

  TaxSubcategory? sub(String? id) => id == null ? null : subcategories.where((s) => s.id == id || s.slug == id).firstOrNull;
}

final languagesProvider = FutureProvider<List<TaxLanguage>>((ref) async {
  final res = await ref.read(apiProvider).get('/taxonomy/languages');
  return ((res['languages'] as List?) ?? const []).whereType<Map>().map((e) => TaxLanguage.fromJson(e.cast<String, dynamic>())).toList();
});

/// Main categories (with subcategories) in the viewer's category-name language.
/// Only the ones that have videos: an empty "0 videos" tile is a dead end for a child.
final taxonomyCategoriesProvider = FutureProvider<List<TaxCategory>>((ref) async {
  final locale = ref.watch(uiLocaleProvider);
  final res = await ref.read(apiProvider).get('/taxonomy/categories', query: {'locale': locale});
  return ((res['categories'] as List?) ?? const [])
      .whereType<Map>()
      .map((e) => TaxCategory.fromJson(e.cast<String, dynamic>()))
      .where((c) => c.videoCount > 0)
      .map((c) => c..subcategories.removeWhere((s) => s.videoCount == 0))
      .toList();
});

extension LanguageLookup on List<TaxLanguage> {
  TaxLanguage? byCode(String? code) => code == null ? null : where((l) => l.code == code).firstOrNull;

  /// "हिन्दी · Hindi" (or just "English").
  String label(String code) {
    final l = byCode(code);
    if (l == null) return code;
    return l.sameNames ? l.nameEn : '${l.nameNative} · ${l.nameEn}';
  }
}

extension CategoryLookup on List<TaxCategory> {
  TaxCategory? byId(String? id) => id == null ? null : where((c) => c.id == id || c.slug == id).firstOrNull;

  Map<String, String> get subToCategory => {for (final c in this) for (final s in c.subcategories) s.id: c.id};
}
