import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kuchu_puchu/core/config.dart';
import 'package:kuchu_puchu/core/format.dart';
import 'package:kuchu_puchu/core/models.dart';
import 'package:kuchu_puchu/core/preferences.dart';
import 'package:kuchu_puchu/core/theme.dart';
import 'package:kuchu_puchu/features/viewer/search.dart';
import 'package:kuchu_puchu/shared/parental_gate.dart';

void main() {
  test('media paths resolve against the server', () {
    expect(AppConfig.media('/videos/v01.mp4'), '${AppConfig.serverUrl}/videos/v01.mp4');
    expect(AppConfig.media('https://cdn.example.com/a.mp4'), 'https://cdn.example.com/a.mp4');
    expect(AppConfig.media(null), '');
  });

  test('formatting helpers', () {
    expect(compact(950), '950');
    expect(compact(1200), '1.2K');
    expect(seconds(42), '42s');
    expect(seconds(75), '1:15');
  });

  test('every seeded category has its own emoji; admin colours win', () {
    expect(CategoryStyle.of('Nursery Rhymes').emoji, '🎵');
    expect(CategoryStyle.of('science').emoji, '🔬');
    expect(CategoryStyle.of('unknown').emoji, '⭐');
    final s = CategoryStyle.from('😂', '#FF8A00');
    expect(s.emoji, '😂');
    expect(s.color, const Color(0xFFFF8A00));
    expect(hexColor('nope'), isNull);
    expect(CategoryStyle.from(null, null, fallback: 'Nursery Rhymes').emoji, '🎵');
  });

  test('videos carry languages and up to three tags, primary first', () {
    final v = Video.fromJson({
      'id': 'v1', 'contentId': 'VID-1', 'title': 'Twinkle Twinkle', 'category': 'Nursery Rhymes',
      'languages': [
        {'code': 'en', 'nameEn': 'English', 'nameNative': 'English', 'isPrimary': false},
        {'code': 'hi', 'nameEn': 'Hindi', 'nameNative': 'हिन्दी', 'isPrimary': true},
      ],
      'tags': [
        {'priority': 2, 'category': {'id': 'ent', 'name': 'Kids Comedy'}, 'subcategory': {'id': 'skit', 'name': 'Silly Sketches'}},
        {'priority': 1, 'category': {'id': 'rhymes', 'name': 'Rhymes & Songs', 'emoji': '🎵'}, 'subcategory': {'id': 'nr', 'name': 'Nursery Rhymes'}},
      ],
      'saved': true,
      'creator': {'id': 'c1', 'username': 'meera'},
    });
    expect(v.primaryLanguage?.code, 'hi');
    expect(v.primaryTag?.categoryId, 'rhymes');
    expect(v.categoryLabel, 'Nursery Rhymes');
    expect(v.saved, isTrue);
    // survives the on-device watch history round trip
    final back = Video.fromJson(v.toJson());
    expect(back.tags.length, 2);
    expect(back.languages.first.nameNative, 'English');
  });

  test('languages default to the phone language plus English, unless chosen', () {
    TestWidgetsFlutterBinding.ensureInitialized();
    expect(const GuestPrefs(languages: ['ta']).effectiveLanguages, ['ta']);
    final d = const GuestPrefs().effectiveLanguages;
    expect(d, contains('en'));
    expect(d.length, lessThanOrEqualTo(2));
  });

  test('the version shown to grown-ups matches pubspec.yaml', () {
    final pub = File('pubspec.yaml').readAsStringSync();
    expect(pub, contains('version: ${AppConfig.version}+${AppConfig.build}'));
  });

  test('a "Did you mean" suggestion swaps the misspelled word for a filter', () {
    final interp = SearchInterpretation.fromJson({
      'languages': [],
      'category': {'id': 'rhymes', 'slug': 'rhymes-songs', 'name': 'Rhymes & Songs'},
      'subcategory': null,
      'text': 'hindhi',
      'suggestions': [
        {'type': 'language', 'id': 'hi', 'label': 'Hindi', 'reason': 'Did you mean Hindi?', 'token': 'hindhi'},
      ],
    });
    final next = const SearchRequest('hindhi rhymes').apply(interp.suggestions.first, interp);
    expect(next.text, '');
    expect(next.languages, ['hi']);
    expect(next.categoryId, 'rhymes');
    expect(next.query(0)['languages'], 'hi');
    // removing the category chip keeps the language
    expect(next.copyWith(clearCategory: true).query(0).containsKey('category'), isFalse);
  });

  test('parental gate numbers are spelled in words', () {
    expect(numberInWords(10), 'ten');
    expect(numberInWords(13), 'thirteen');
    expect(numberInWords(40), 'forty');
    expect(numberInWords(47), 'forty-seven');
    expect(numberInWords(99), 'ninety-nine');
    for (var n = 10; n < 100; n++) {
      expect(numberInWords(n), isNot(matches(RegExp(r'\d'))), reason: 'no digits for $n');
    }
  });
}
