import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../core/theme.dart';
import 'widgets.dart';

/// Parental gate (Google Play Families / Apple Kids): a grown-up must type a random two-digit
/// number that is shown spelled out in words ("forty-seven"). No colour or picture puzzles a
/// pre-reader could solve. A new number on every try; the gate closes after 3 wrong answers.
///
/// Grown-up areas (account, studio, settings) stay open for 5 minutes after a pass.
/// External links and sharing pass `remember: false` and ask every time.
class ParentalGate {
  ParentalGate._();

  static const unlockFor = Duration(minutes: 5);
  static const maxTries = 3;
  static DateTime? _unlockedUntil;
  static Timer? _relock;

  /// Notifies when the grown-up area opens or closes (so open screens can hide again).
  static final ValueNotifier<bool> state = ValueNotifier(false);

  static bool get unlocked => _unlockedUntil != null && DateTime.now().isBefore(_unlockedUntil!);

  static void lock() {
    _unlockedUntil = null;
    _relock?.cancel();
    state.value = false;
  }

  static void _unlock() {
    _unlockedUntil = DateTime.now().add(unlockFor);
    _relock?.cancel();
    _relock = Timer(unlockFor, lock);
    state.value = true;
  }

  /// True when a grown-up passed. [remember] = keep grown-up areas open for 5 minutes.
  static Future<bool> check(BuildContext context, {bool remember = true}) async {
    if (remember && unlocked) return true;
    final ok = await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (_) => const _GateDialog(),
        ) ??
        false;
    if (ok && remember) _unlock();
    return ok;
  }
}

/// 10 → "ten", 47 → "forty-seven".
String numberInWords(int n) {
  const ones = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if (n < 20) return ones[n];
  final o = n % 10;
  return o == 0 ? tens[n ~/ 10] : '${tens[n ~/ 10]}-${ones[o]}';
}

class _GateDialog extends StatefulWidget {
  const _GateDialog();
  @override
  State<_GateDialog> createState() => _GateDialogState();
}

class _GateDialogState extends State<_GateDialog> {
  final _rng = Random.secure();
  final _c = TextEditingController();
  late int _n = _pick();
  int _wrong = 0;
  String? _msg;

  int _pick() => 10 + _rng.nextInt(90);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  void _submit() {
    if (int.tryParse(_c.text.trim()) == _n) {
      Navigator.of(context).pop(true);
      return;
    }
    _wrong++;
    if (_wrong >= ParentalGate.maxTries) {
      Navigator.of(context).pop(false);
      return;
    }
    setState(() {
      _n = _pick();
      _c.clear();
      _msg = 'That’s not it. Try this new number (${ParentalGate.maxTries - _wrong} ${ParentalGate.maxTries - _wrong == 1 ? 'try' : 'tries'} left).';
    });
  }

  @override
  Widget build(BuildContext context) {
    final words = numberInWords(_n);
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      title: Column(children: [
        const Text('🔒', style: TextStyle(fontSize: 40)),
        const SizedBox(height: 6),
        Text('Ask a grown-up', style: KP.display(24)),
      ]),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        Text('Grown-ups: type this number using digits.', textAlign: TextAlign.center, style: KP.body(14.5, color: KP.inkSoft)),
        const SizedBox(height: 12),
        Semantics(
          label: 'Number in words: $words',
          child: Text(words, textAlign: TextAlign.center, style: KP.display(28, color: KP.blue)),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _c,
          autofocus: true,
          keyboardType: TextInputType.number,
          maxLength: 2,
          textAlign: TextAlign.center,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: KP.display(26),
          decoration: const InputDecoration(hintText: '00', counterText: ''),
          onSubmitted: (_) => _submit(),
        ),
        if (_msg != null) ...[
          const SizedBox(height: 8),
          Text(_msg!, textAlign: TextAlign.center, style: KP.body(13, color: KP.red, weight: FontWeight.w800)),
        ],
      ]),
      actionsAlignment: MainAxisAlignment.spaceBetween,
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text('Cancel', style: KP.body(15, color: KP.inkSoft, weight: FontWeight.w800))),
        KpButton(label: 'Continue', expand: false, height: 46, gradient: KP.blueGrad, onTap: _submit),
      ],
    );
  }
}

/// Wraps a grown-up screen (route). Asks on entry unless the area is already open; a child who
/// can't pass is sent back to the videos. Doesn't re-lock while a grown-up is using the screen.
class GrownUpRoute extends StatefulWidget {
  final Widget child;
  const GrownUpRoute({super.key, required this.child});
  @override
  State<GrownUpRoute> createState() => _GrownUpRouteState();
}

class _GrownUpRouteState extends State<GrownUpRoute> {
  bool _ok = ParentalGate.unlocked;

  @override
  void initState() {
    super.initState();
    if (!_ok) WidgetsBinding.instance.addPostFrameCallback((_) => _ask());
  }

  Future<void> _ask() async {
    if (!mounted) return;
    final ok = await ParentalGate.check(context);
    if (!mounted) return;
    if (ok) {
      setState(() => _ok = true);
    } else if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home?tab=1');
    }
  }

  @override
  Widget build(BuildContext context) => _ok ? widget.child : const Scaffold(body: GlowPage(child: _LockedBody()));
}

/// Wraps a grown-up area that lives inside a tab (e.g. the signed-in "Me" tab): shows a lock
/// screen with an "Ask a grown-up" button, and closes again when the 5 minutes are up.
class GrownUpArea extends StatelessWidget {
  final Widget child;
  const GrownUpArea({super.key, required this.child});
  @override
  Widget build(BuildContext context) => ValueListenableBuilder<bool>(
        valueListenable: ParentalGate.state,
        builder: (context, _, __) => ParentalGate.unlocked
            ? child
            : GlowPage(
                stickers: true,
                child: SafeArea(
                  child: _LockedBody(onAsk: () => ParentalGate.check(context)),
                ),
              ),
      );
}

class _LockedBody extends StatelessWidget {
  final VoidCallback? onAsk;
  const _LockedBody({this.onAsk});
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Text('🔒', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 12),
            Text('Grown-ups only', style: KP.display(26)),
            const SizedBox(height: 6),
            Text('This part is for parents and teachers.', textAlign: TextAlign.center, style: KP.body(15, color: KP.inkSoft)),
            if (onAsk != null) ...[
              const SizedBox(height: 20),
              KpButton(label: 'Ask a grown-up', emoji: '🙋', expand: false, height: 50, onTap: onAsk),
            ],
          ]),
        ),
      );
}
