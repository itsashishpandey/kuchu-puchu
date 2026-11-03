/// Where the app finds the Kuchu Puchu server.
///
/// Set at build time:
///   flutter build apk --dart-define=API_BASE_URL=https://mykuchupuchu.com
///
/// The default is this development PC on the local Wi-Fi (Next.js on port
/// 5000). A phone can't use "localhost" — that would mean the phone itself.
class AppConfig {
  static const String serverUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.1.12:5000',
  );

  static String get apiBase => '$serverUrl/api';

  /// Shown in Grown-ups → About. Keep in sync with pubspec.yaml (a test checks it).
  static const String version = '1.5.2';
  static const int build = 9;

  /// Public pages for grown-ups (always the live site, even in debug builds).
  static const String site = 'https://mykuchupuchu.com';
  static const String privacyUrl = '$site/privacy';
  static const String termsUrl = '$site/terms';
  static const String supportEmail = 'support@mykuchupuchu.com';

  /// Media paths come back relative ("/videos/v01.mp4", "/images/avatars/…").
  static String media(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return '$serverUrl${path.startsWith('/') ? '' : '/'}$path';
  }
}
