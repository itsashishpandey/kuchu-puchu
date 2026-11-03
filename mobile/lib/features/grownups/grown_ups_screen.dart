import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/audience.dart';
import '../../core/config.dart';
import '../../core/format.dart';
import '../../core/history.dart';
import '../../core/preferences.dart';
import '../../core/taxonomy.dart';
import '../../core/theme.dart';
import '../../shared/parental_gate.dart';
import '../../shared/widgets.dart';
import '../onboarding/guest_languages.dart';

/// "Grown-ups 🔒" tab: behind the parental gate (open for 5 minutes after a pass).
/// Languages, on-phone data, legal pages and contact. No accounts exist in this app.
class GrownUpsScreen extends StatelessWidget {
  const GrownUpsScreen({super.key});
  @override
  Widget build(BuildContext context) => const GrownUpArea(child: _GrownUpsBody());
}

class _GrownUpsBody extends ConsumerWidget {
  const _GrownUpsBody();

  /// Pages outside the app: the gate asks every time.
  Future<void> _open(BuildContext context, Uri uri) async {
    if (!await ParentalGate.check(context, remember: false)) return;
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && context.mounted) toast(context, 'Couldn’t open ${uri.scheme == 'mailto' ? 'an email app' : 'the browser'}', emoji: '🙈');
    } catch (_) {
      if (context.mounted) toast(context, 'Couldn’t open that', emoji: '🙈');
    }
  }

  Future<bool> _confirm(BuildContext context, String title, String body, String action) async =>
      await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          title: Text(title, style: KP.display(22)),
          content: Text(body, style: KP.body(14.5, color: KP.inkSoft)),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Cancel', style: KP.body(15, color: KP.inkSoft, weight: FontWeight.w800))),
            TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text(action, style: KP.body(15, color: KP.pink, weight: FontWeight.w900))),
          ],
        ),
      ) ==
      true;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final langs = ref.watch(languagesProvider).value ?? const <TaxLanguage>[];
    final mine = ref.watch(guestPrefsProvider).effectiveLanguages;
    final history = ref.watch(historyProvider);
    final liked = ref.watch(likedVideosProvider);
    final hidden = ref.watch(hiddenVideosProvider).length + ref.watch(hiddenCreatorsProvider).length;
    final audience = ref.watch(audienceProvider).value ?? const Audience();
    final bottom = MediaQuery.paddingOf(context).bottom;

    return GlowPage(
      child: SafeArea(
        bottom: false,
        child: ListView(padding: EdgeInsets.fromLTRB(16, 14, 16, bottom + 110), children: [
          Row(children: [
            Expanded(child: Text('Grown-ups 🔒', style: KP.display(30))),
            TextButton.icon(
              onPressed: ParentalGate.lock,
              icon: const Icon(Icons.lock_rounded, size: 18),
              label: Text('Lock', style: KP.body(14, color: KP.blue, weight: FontWeight.w900)),
            ),
          ]),
          Text('For parents and teachers. ${audience.label}. No ads, no accounts, no tracking.',
              style: KP.body(13.5, color: KP.inkSoft, height: 1.35)),
          const SizedBox(height: 14),
          _group([
            _Row(
              emoji: '🗣️',
              title: 'Languages',
              subtitle: mine.map(langs.label).join(', '),
              onTap: () => showGuestLanguageSheet(context),
            ),
          ]),
          const SizedBox(height: 12),
          _group([
            _Row(
              emoji: '🕒',
              title: 'Clear watch history',
              subtitle: history.isEmpty ? 'Nothing watched yet' : '${plural(history.length, 'video')} on this phone',
              onTap: history.isEmpty
                  ? null
                  : () async {
                      if (await _confirm(context, 'Clear watch history?', 'This removes the list of watched videos from this phone.', 'Clear')) {
                        await ref.read(historyProvider.notifier).clear();
                        if (context.mounted) toast(context, 'Watch history cleared', emoji: '🧹');
                      }
                    },
            ),
            _Row(
              emoji: '❤️',
              title: 'Clear liked videos',
              subtitle: liked.isEmpty ? 'No liked videos' : '${plural(liked.length, 'video')} on this phone',
              onTap: liked.isEmpty
                  ? null
                  : () async {
                      if (await _confirm(context, 'Clear liked videos?', 'This removes the “Videos I liked” list from this phone.', 'Clear')) {
                        for (final v in List.of(ref.read(likedVideosProvider))) {
                          await ref.read(likedVideosProvider.notifier).set(v, false);
                        }
                        if (context.mounted) toast(context, 'Liked videos cleared', emoji: '🧹');
                      }
                    },
            ),
            _Row(
              emoji: '🙈',
              title: 'Show hidden videos & channels again',
              subtitle: hidden == 0 ? 'Nothing hidden' : '${plural(hidden, 'item')} hidden on this phone',
              onTap: hidden == 0
                  ? null
                  : () async {
                      await ref.read(hiddenVideosProvider.notifier).clear();
                      await ref.read(hiddenCreatorsProvider.notifier).clear();
                      ref.read(feedRefreshProvider.notifier).state++;
                      if (context.mounted) toast(context, 'Hidden videos and channels are back', emoji: '👀');
                    },
            ),
          ]),
          const SizedBox(height: 12),
          _group([
            _Row(emoji: '🔐', title: 'Privacy Policy', subtitle: 'Opens mykuchupuchu.com', external: true, onTap: () => _open(context, Uri.parse(AppConfig.privacyUrl))),
            _Row(emoji: '📜', title: 'Terms', subtitle: 'Opens mykuchupuchu.com', external: true, onTap: () => _open(context, Uri.parse(AppConfig.termsUrl))),
            _Row(
              emoji: '✉️',
              title: 'Contact us',
              subtitle: AppConfig.supportEmail,
              external: true,
              onTap: () => _open(context, Uri(scheme: 'mailto', path: AppConfig.supportEmail, query: 'subject=My%20Kuchu%20Puchu%20app')),
            ),
          ]),
          const SizedBox(height: 18),
          Center(
            child: Text('Kuchu Puchu ${AppConfig.version} (${AppConfig.build}) · ${audience.ages}',
                style: KP.body(12.5, color: KP.inkSoft, weight: FontWeight.w800)),
          ),
        ]),
      ),
    );
  }

  static Widget _group(List<Widget> rows) => SoftCard(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(children: [
          for (var i = 0; i < rows.length; i++) ...[
            rows[i],
            if (i < rows.length - 1) const Divider(height: 1, indent: 62, endIndent: 16),
          ],
        ]),
      );
}

class _Row extends StatelessWidget {
  final String emoji, title, subtitle;
  final VoidCallback? onTap;
  final bool external;
  const _Row({required this.emoji, required this.title, required this.subtitle, this.onTap, this.external = false});
  @override
  Widget build(BuildContext context) => Opacity(
        opacity: onTap == null ? 0.5 : 1,
        child: Bouncy(
          onTap: onTap,
          scale: 0.98,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(children: [
              Text(emoji, style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: KP.body(15, weight: FontWeight.w900)),
                  Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: KP.body(12.5, color: KP.inkSoft)),
                ]),
              ),
              Icon(external ? Icons.open_in_new_rounded : Icons.chevron_right_rounded, color: KP.inkSoft, size: external ? 18 : 24),
            ]),
          ),
        ),
      );
}
