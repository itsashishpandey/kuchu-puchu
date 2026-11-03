import 'package:intl/intl.dart';

/// 1234 → 1.2K, 1250000 → 1.3M
String compact(num n) {
  if (n < 1000) return '$n';
  return NumberFormat.compact().format(n);
}

/// 2500 → 2,500
String thousands(num n) => NumberFormat('#,##0').format(n);

/// "1 video", "2 videos" (shown with [compact] numbers when [short] is true).
String plural(num n, String word, {bool short = false}) => '${short ? compact(n) : n} $word${n == 1 ? '' : 's'}';

String money(num n) => NumberFormat.currency(symbol: '\$', decimalDigits: 2).format(n);

String seconds(double s) {
  final t = s.round();
  return t >= 60 ? '${t ~/ 60}:${(t % 60).toString().padLeft(2, '0')}' : '${t}s';
}

String ago(DateTime? d) {
  if (d == null) return '';
  final diff = DateTime.now().difference(d);
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  if (diff.inDays < 365) return DateFormat('d MMM').format(d);
  return DateFormat('d MMM y').format(d);
}

String shortDate(DateTime? d) => d == null ? '—' : DateFormat('d MMM y').format(d);

String greeting() {
  final h = DateTime.now().hour;
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
