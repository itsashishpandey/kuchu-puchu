import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api.dart';

/// Who the app is for (GET /api/public/settings → audience). Built-in copies are used when the
/// server doesn't send them (older server, offline).
class Audience {
  final int minAge, maxAge;
  final String label, parentConfirmText, kidsSafeDeclaration;
  final bool commentsEnabled, ads;

  const Audience({
    this.minAge = 3,
    this.maxAge = 8,
    this.label = 'Made for kids aged 3–8',
    this.parentConfirmText = 'I am a parent or guardian aged 18 or over. Kids watch without an account.',
    this.kidsSafeDeclaration =
        'This video is made for kids aged 3–8: no violence, scary scenes, bad language, adult themes, ads or links, and nothing that asks kids for personal information.',
    this.commentsEnabled = false,
    this.ads = false,
  });

  factory Audience.fromJson(Map<String, dynamic>? j) {
    const d = Audience();
    if (j == null) return d;
    String s(String k, String fallback) {
      final v = j[k];
      return v is String && v.trim().isNotEmpty ? v : fallback;
    }

    return Audience(
      minAge: (j['minAge'] as num?)?.toInt() ?? d.minAge,
      maxAge: (j['maxAge'] as num?)?.toInt() ?? d.maxAge,
      label: s('label', d.label),
      parentConfirmText: s('parentConfirmText', d.parentConfirmText),
      kidsSafeDeclaration: s('kidsSafeDeclaration', d.kidsSafeDeclaration),
      commentsEnabled: j['commentsEnabled'] == true,
      ads: j['ads'] == true,
    );
  }

  /// "Ages 3–8"
  String get ages => 'Ages $minAge–$maxAge';
}

final audienceProvider = FutureProvider<Audience>((ref) async {
  try {
    final res = await ref.read(apiProvider).get('/public/settings');
    return Audience.fromJson((res['audience'] as Map?)?.cast<String, dynamic>());
  } catch (_) {
    return const Audience();
  }
});
