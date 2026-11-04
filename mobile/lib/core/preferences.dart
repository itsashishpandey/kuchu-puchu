import 'dart:convert';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Everything the app remembers lives on this phone (shared preferences). There are no
/// accounts: only language codes ever go to the server, on the feed requests.

// ───────────────────────────── languages ─────────────────────────────

class GuestPrefs {
  final bool loaded;

  /// null = never chosen → every language ([effectiveLanguages] is empty).
  final List<String>? languages;
  final String locale;
  const GuestPrefs({this.loaded = false, this.languages, this.locale = 'en'});

  /// What the feeds use: the languages a grown-up saved, else none, which means every language.
  /// (Filtering by the phone's language hid most of the catalogue on English phones.)
  List<String> get effectiveLanguages => languages ?? const [];
}

class GuestPrefsController extends StateNotifier<GuestPrefs> {
  static const _langKey = 'kp_guest_languages';
  static const _localeKey = 'kp_guest_locale';

  GuestPrefsController() : super(const GuestPrefs()) {
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await SharedPreferences.getInstance();
      final raw = p.getString(_langKey);
      List<String>? langs;
      if (raw != null) {
        final v = jsonDecode(raw);
        if (v is List && v.isNotEmpty) langs = v.map((e) => '$e').take(10).toList();
      }
      state = GuestPrefs(loaded: true, languages: langs, locale: p.getString(_localeKey) ?? 'en');
    } catch (_) {
      state = const GuestPrefs(loaded: true);
    }
  }

  Future<void> setLanguages(List<String> codes) async {
    final list = codes.take(10).toList();
    state = GuestPrefs(loaded: true, languages: list.isEmpty ? null : list, locale: state.locale);
    try {
      final p = await SharedPreferences.getInstance();
      if (list.isEmpty) {
        await p.remove(_langKey);
      } else {
        await p.setString(_langKey, jsonEncode(list));
      }
    } catch (_) {}
  }

  Future<void> setLocale(String code) async {
    state = GuestPrefs(loaded: true, languages: state.languages, locale: code);
    try {
      final p = await SharedPreferences.getInstance();
      await p.setString(_localeKey, code);
    } catch (_) {}
  }
}

final guestPrefsProvider = StateNotifierProvider<GuestPrefsController, GuestPrefs>((_) => GuestPrefsController());

/// The phone's own languages, as suggestions in the language picker (always includes English).
List<String> deviceLanguageGuess(Iterable<String> known) {
  final codes = known.toSet();
  final out = <String>[];
  for (final l in WidgetsBinding.instance.platformDispatcher.locales) {
    final c = l.languageCode.toLowerCase();
    if (codes.contains(c) && !out.contains(c)) out.add(c);
  }
  if (!out.contains('en') && codes.contains('en')) out.add('en');
  return out.take(3).toList();
}

/// Interface language for category names ("en", "hi").
final Provider<String> uiLocaleProvider = Provider<String>((ref) => ref.watch(guestPrefsProvider.select((g) => g.locale)));

// ───────────────────────────── feed signals ─────────────────────────────

/// Bumped when languages or hidden items change so the feeds reload.
final feedRefreshProvider = StateProvider<int>((_) => 0);

/// Language filter chip on the feeds (empty = the saved languages).
final feedLanguageFilterProvider = StateProvider<List<String>>((_) => const []);

// ───────────────────────────── likes, hidden videos & channels ─────────────────────────────

/// A set of ids kept on the phone.
class IdSetController extends StateNotifier<Set<String>> {
  final String key;
  final int max;
  IdSetController(this.key, {this.max = 500}) : super(const {}) {
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await SharedPreferences.getInstance();
      final list = p.getStringList(key);
      if (list != null) state = {...list, ...state};
    } catch (_) {}
  }

  Future<void> _save() async {
    try {
      final p = await SharedPreferences.getInstance();
      await p.setStringList(key, state.toList());
    } catch (_) {}
  }

  bool has(String id) => state.contains(id);

  Future<void> add(String id) async {
    final next = {...state, id};
    state = next.length > max ? next.skip(next.length - max).toSet() : next;
    await _save();
  }

  Future<void> remove(String id) async {
    state = {...state}..remove(id);
    await _save();
  }

  Future<void> clear() async {
    state = const {};
    await _save();
  }
}

/// "Not interested" videos and "Don't show this channel" creators — filtered out on the phone.
final hiddenVideosProvider = StateNotifierProvider<IdSetController, Set<String>>((_) => IdSetController('kp_hidden_videos'));
final hiddenCreatorsProvider = StateNotifierProvider<IdSetController, Set<String>>((_) => IdSetController('kp_hidden_creators'));
