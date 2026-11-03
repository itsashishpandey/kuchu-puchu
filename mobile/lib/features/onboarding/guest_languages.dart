import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api.dart';
import '../../core/preferences.dart';
import '../../core/taxonomy.dart';
import '../../core/theme.dart';
import '../../shared/widgets.dart';
import 'pickers.dart';

/// Language picker. The choice stays on this phone (shared preferences) and is only sent as
/// `languages=` on the feed requests. Nothing personal is collected.
Future<void> showGuestLanguageSheet(BuildContext context, {bool firstLaunch = false}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    isDismissible: !firstLaunch,
    enableDrag: !firstLaunch,
    builder: (_) => _GuestLanguageSheet(firstLaunch: firstLaunch),
  );
}

class _GuestLanguageSheet extends ConsumerStatefulWidget {
  final bool firstLaunch;
  const _GuestLanguageSheet({required this.firstLaunch});
  @override
  ConsumerState<_GuestLanguageSheet> createState() => _GuestLanguageSheetState();
}

class _GuestLanguageSheetState extends ConsumerState<_GuestLanguageSheet> {
  List<String>? _picked;
  String? _locale;
  List<({String code, String nativeName})> _locales = const [];

  @override
  void initState() {
    super.initState();
    ref.read(apiProvider).get('/taxonomy/locales').then((res) {
      final list = ((res['locales'] as List?) ?? const [])
          .whereType<Map>()
          .map((e) => (code: '${e['code']}', nativeName: '${e['nameNative'] ?? e['name'] ?? e['code']}'))
          .toList();
      if (mounted) setState(() => _locales = list);
    }).catchError((Object _) {});
  }

  Future<void> _save(List<String> codes) async {
    final guest = ref.read(guestPrefsProvider.notifier);
    await guest.setLanguages(codes);
    if (_locale != null) await guest.setLocale(_locale!);
    ref.read(feedRefreshProvider.notifier).state++;
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final langs = ref.watch(languagesProvider);
    final guest = ref.watch(guestPrefsProvider);
    final picked = _picked ?? List<String>.of(guest.effectiveLanguages);
    final locale = _locale ?? guest.locale;
    final h = MediaQuery.sizeOf(context).height;

    return SizedBox(
      height: h * 0.88,
      child: Column(children: [
        Expanded(
          child: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 12), children: [
            Text('Which languages do you love watching?', style: KP.display(25, height: 1.1)),
            const SizedBox(height: 6),
            Text("Choose your favorite languages. We'll help you discover videos you'll enjoy.",
                style: KP.body(14.5, color: KP.inkSoft, height: 1.35)),
            const SizedBox(height: 16),
            langs.when(
              loading: () => const SizedBox(height: 160, child: LoadingDots()),
              error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(languagesProvider)),
              data: (all) => LanguageChooser(
                languages: all,
                selected: picked,
                withPrimary: false,
                max: 10,
                suggested: deviceLanguageGuess(all.map((l) => l.code)),
                onChanged: (list, _) => setState(() => _picked = list),
              ),
            ),
            if (_locales.length > 1) ...[
              const SizedBox(height: 18),
              Text('Show category names in', style: KP.body(13, color: KP.inkSoft, weight: FontWeight.w900)),
              const SizedBox(height: 8),
              Wrap(spacing: 8, children: [
                for (final l in _locales)
                  SelectChip(label: l.nativeName, selected: locale == l.code, color: KP.purple, onTap: () => setState(() => _locale = l.code)),
              ]),
            ],
            const SizedBox(height: 14),
            Text('🔒 Saved only on this phone.', style: KP.body(12.5, color: KP.inkSoft)),
          ]),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 6, 20, 12),
            child: Row(children: [
              if (widget.firstLaunch) ...[
                Expanded(
                  flex: 2,
                  child: KpButton.light(
                    label: 'Skip',
                    height: 52,
                    onTap: () => _save(deviceLanguageGuess((langs.value ?? const []).map((l) => l.code))),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                flex: 3,
                child: KpButton(
                  label: picked.isEmpty ? 'Pick one' : "Let's go",
                  emoji: '🍿',
                  height: 52,
                  onTap: picked.isEmpty ? null : () => _save(picked),
                ),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}

/// The 🌐 chip on the feeds: narrow the feed to some of the viewer's languages, or browse others.
Future<void> showFeedLanguageFilter(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => const _FeedLanguageFilterSheet(),
  );
}

class _FeedLanguageFilterSheet extends ConsumerStatefulWidget {
  const _FeedLanguageFilterSheet();
  @override
  ConsumerState<_FeedLanguageFilterSheet> createState() => _FeedLanguageFilterSheetState();
}

class _FeedLanguageFilterSheetState extends ConsumerState<_FeedLanguageFilterSheet> {
  bool _browseOthers = false;
  late List<String> _picked = List.of(ref.read(feedLanguageFilterProvider));

  void _apply(List<String> codes) {
    ref.read(feedLanguageFilterProvider.notifier).state = codes;
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final langs = ref.watch(languagesProvider).value ?? const <TaxLanguage>[];
    final mine = ref.watch(guestPrefsProvider).effectiveLanguages;
    final current = ref.watch(feedLanguageFilterProvider);
    final h = MediaQuery.sizeOf(context).height;

    return SizedBox(
      height: _browseOthers ? h * 0.85 : null,
      child: SafeArea(
        top: false,
        child: _browseOthers
            ? Column(children: [
                Expanded(
                  child: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 12), children: [
                    Text('Browse other languages', style: KP.display(24)),
                    const SizedBox(height: 4),
                    Text('Just for now — your saved languages don\'t change.', style: KP.body(14, color: KP.inkSoft)),
                    const SizedBox(height: 14),
                    LanguageChooser(
                      languages: langs,
                      selected: _picked,
                      withPrimary: false,
                      max: 10,
                      onChanged: (list, _) => setState(() => _picked = list),
                    ),
                  ]),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 6, 20, 12),
                  child: KpButton(label: 'Show these languages', emoji: '🌐', onTap: _picked.isEmpty ? null : () => _apply(_picked)),
                ),
              ])
            : Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Languages in this feed', style: KP.display(24)),
                  const SizedBox(height: 12),
                  _Option(
                    emoji: '🌈',
                    title: 'My languages',
                    subtitle: mine.isEmpty ? 'Everything' : mine.map(langs.label).join(', '),
                    selected: current.isEmpty,
                    onTap: () => _apply(const []),
                  ),
                  for (final code in mine)
                    _Option(
                      emoji: '🗣️',
                      title: langs.label(code),
                      selected: current.length == 1 && current.first == code,
                      onTap: () => _apply([code]),
                    ),
                  if (current.isNotEmpty && !(current.length == 1 && mine.contains(current.first)))
                    _Option(emoji: '🌐', title: current.map(langs.label).join(', '), subtitle: 'Browsing now', selected: true, onTap: () {}),
                  const SizedBox(height: 4),
                  _Option(emoji: '🔭', title: 'Browse other languages…', onTap: () => setState(() => _browseOthers = true)),
                  _Option(
                    emoji: '✏️',
                    title: 'Edit my languages',
                    onTap: () {
                      Navigator.of(context).pop();
                      showGuestLanguageSheet(context);
                    },
                  ),
                ]),
              ),
      ),
    );
  }
}

class _Option extends StatelessWidget {
  final String emoji, title;
  final String? subtitle;
  final bool selected;
  final VoidCallback onTap;
  const _Option({required this.emoji, required this.title, this.subtitle, this.selected = false, required this.onTap});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: SoftCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          color: selected ? KP.blueSoft : Colors.white,
          onTap: onTap,
          child: Row(children: [
            Text(emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: KP.body(15, weight: FontWeight.w900)),
                if (subtitle != null) Text(subtitle!, maxLines: 2, overflow: TextOverflow.ellipsis, style: KP.body(12.5, color: KP.inkSoft)),
              ]),
            ),
            if (selected) const Icon(Icons.check_circle_rounded, color: KP.blue),
          ]),
        ),
      );
}
