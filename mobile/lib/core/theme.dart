import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Kuchu Puchu palette — same tokens as the website (src/app/globals.css):
/// blue for boys' channels, pink for girls', sunny yellow accents.
class KP {
  static const blue = Color(0xFF1677FF);
  static const blueDeep = Color(0xFF0B4FC4);
  static const blueSoft = Color(0xFFE6F0FF);
  static const pink = Color(0xFFFF4E9B);
  static const pinkLight = Color(0xFFFF8AC2);
  static const pinkSoft = Color(0xFFFFE6F2);
  static const yellow = Color(0xFFFFC531);
  static const yellowSoft = Color(0xFFFFF4D6);
  static const orange = Color(0xFFFF8A00);
  static const purple = Color(0xFF8B5CF6);
  static const purpleSoft = Color(0xFFEFE8FF);
  static const green = Color(0xFF22C55E);
  static const greenSoft = Color(0xFFDCFCE7);
  static const red = Color(0xFFFF6369);
  static const cyan = Color(0xFF1AE6FC);
  static const ink = Color(0xFF1E1B3A);
  static const inkSoft = Color(0xFF6B6890);
  static const line = Color(0xFFE9E6F5);
  static const surface = Color(0xFFF7F6FC);
  static const night = Color(0xFF221F3D); // website dark background, used behind video

  static const brand = LinearGradient(
    colors: [blue, purple, pink],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
  static const blueGrad = LinearGradient(colors: [blue, Color(0xFF4D9AFF)], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const pinkGrad = LinearGradient(colors: [pink, pinkLight], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const sunGrad = LinearGradient(colors: [Color(0xFFFFD600), orange], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const skyGrad = LinearGradient(colors: [Color(0xFF28EEFC), Color(0xFF0CB6FD)], begin: Alignment.topCenter, end: Alignment.bottomCenter);
  static const purpleGrad = LinearGradient(colors: [purple, Color(0xFFB794FF)], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const greenGrad = LinearGradient(colors: [Color(0xFF22C55E), Color(0xFF6EE7A0)], begin: Alignment.topLeft, end: Alignment.bottomRight);

  /// Soft pastel page background, like the website's hero glow.
  static const pageGlow = BoxDecoration(
    gradient: LinearGradient(
      colors: [Color(0xFFFFF0F7), Color(0xFFF2F7FF), Color(0xFFFFFAEB)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
  );

  static const rLg = 24.0;
  static const rMd = 18.0;

  static TextStyle display(double size, {Color color = ink, FontWeight weight = FontWeight.w800, double? height}) =>
      GoogleFonts.baloo2(fontSize: size, fontWeight: weight, color: color, height: height ?? 1.1);

  static TextStyle body(double size, {Color color = ink, FontWeight weight = FontWeight.w600, double? height}) =>
      GoogleFonts.nunito(fontSize: size, fontWeight: weight, color: color, height: height);

  static List<BoxShadow> softShadow([Color c = const Color(0xFF6B5BD6)]) => [
        BoxShadow(color: c.withValues(alpha: 0.12), blurRadius: 18, offset: const Offset(0, 8)),
      ];

  static ThemeData theme() {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: blue, primary: blue, secondary: pink, surface: Colors.white),
      scaffoldBackgroundColor: surface,
    );
    return base.copyWith(
      textTheme: GoogleFonts.nunitoTextTheme(base.textTheme).apply(bodyColor: ink, displayColor: ink),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        foregroundColor: ink,
        titleTextStyle: display(24),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        hintStyle: body(15, color: inkSoft.withValues(alpha: 0.7), weight: FontWeight.w600),
        labelStyle: body(15, color: inkSoft),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(rMd), borderSide: const BorderSide(color: line, width: 2)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(rMd), borderSide: const BorderSide(color: line, width: 2)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(rMd), borderSide: const BorderSide(color: blue, width: 2.4)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(rMd), borderSide: const BorderSide(color: red, width: 2)),
        focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(rMd), borderSide: const BorderSide(color: red, width: 2.4)),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: ink,
        contentTextStyle: body(14, color: Colors.white, weight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      ),
      dividerTheme: const DividerThemeData(color: line, thickness: 1.2),
      checkboxTheme: CheckboxThemeData(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6))),
    );
  }
}

/// Every category gets its own emoji + candy color so kids can find things by picture.
class CategoryStyle {
  final String emoji;
  final Color color;
  final Color soft;
  const CategoryStyle(this.emoji, this.color, this.soft);

  static const _map = <String, CategoryStyle>{
    'cartoons': CategoryStyle('🎬', Color(0xFF1677FF), Color(0xFFE6F0FF)),
    'rhymes': CategoryStyle('🎵', Color(0xFFFF4E9B), Color(0xFFFFE6F2)),
    'comedy': CategoryStyle('😂', Color(0xFFFF8A00), Color(0xFFFFEDD5)),
    'learning': CategoryStyle('🎓', Color(0xFF8B5CF6), Color(0xFFEFE8FF)),
    'stories': CategoryStyle('📖', Color(0xFF0EA5E9), Color(0xFFE0F5FE)),
    'songs': CategoryStyle('🎤', Color(0xFFEC4899), Color(0xFFFCE7F3)),
    'toys': CategoryStyle('🧸', Color(0xFFF59E0B), Color(0xFFFEF3C7)),
    'animals': CategoryStyle('🐾', Color(0xFF22C55E), Color(0xFFDCFCE7)),
    'crafts': CategoryStyle('🎨', Color(0xFFEF4444), Color(0xFFFEE2E2)),
    'dance': CategoryStyle('💃', Color(0xFFD946EF), Color(0xFFFAE8FF)),
    'family': CategoryStyle('🏕️', Color(0xFF14B8A6), Color(0xFFCCFBF1)),
    'science': CategoryStyle('🔬', Color(0xFF6366F1), Color(0xFFE0E7FF)),
  };

  static const _byName = <String, String>{
    'cartoons & animation': 'cartoons',
    'nursery rhymes': 'rhymes',
    'kids comedy': 'comedy',
    'learning & fun': 'learning',
    'story time': 'stories',
    'kids songs': 'songs',
    'toys & play': 'toys',
    'animals & friends': 'animals',
    'arts & crafts': 'crafts',
    'dance & fun': 'dance',
    'family adventures': 'family',
    'science for kids': 'science',
  };

  static const _short = <String, String>{
    'cartoons': 'Cartoons', 'rhymes': 'Rhymes', 'comedy': 'Comedy', 'learning': 'Learning',
    'stories': 'Stories', 'songs': 'Songs', 'toys': 'Toys', 'animals': 'Animals',
    'crafts': 'Crafts', 'dance': 'Dance', 'family': 'Family', 'science': 'Science',
  };

  /// One-word label for small bubbles ("Animals & Friends" → "Animals").
  static String shortName(String name) {
    final k = name.toLowerCase();
    return _short[k] ?? _short[_byName[k]] ?? name.split(RegExp(r'\s+&\s+|\s+')).first;
  }

  static CategoryStyle of(String? nameOrSlug) {
    final k = (nameOrSlug ?? '').toLowerCase();
    return _map[k] ?? _map[_byName[k]] ?? const CategoryStyle('⭐', KP.blue, KP.blueSoft);
  }

  /// Emoji + colour set by admins on the category (taxonomy), falling back to the built-in map.
  static CategoryStyle from(String? emoji, String? colorHex, {String? fallback}) {
    final base = of(fallback);
    final c = hexColor(colorHex);
    final e = (emoji ?? '').trim();
    if (c == null && e.isEmpty) return base;
    final color = c ?? base.color;
    return CategoryStyle(e.isEmpty ? base.emoji : e, color, Color.lerp(color, Colors.white, 0.86)!);
  }
}

/// "#FF4E9B" → Color (null when missing or malformed).
Color? hexColor(String? hex) {
  final h = (hex ?? '').trim().replaceFirst('#', '');
  if (!RegExp(r'^[0-9a-fA-F]{6}$').hasMatch(h)) return null;
  return Color(int.parse('FF$h', radix: 16));
}
