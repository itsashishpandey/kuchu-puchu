// Walks the app through its main screens on a phone or Simulator, against the live server.
// Each "SHOT:<name>" line it prints is the moment to photograph the screen:
// tool/ios-screenshots.sh does that, so store screenshots come from the real app at the
// device's own size. It also checks that the parental gate opens the Grown-ups area.
//   bash tool/ios-screenshots.sh            (iPhone Simulator, saves to ../store/ios/)
// Note: every video it plays counts as a real view on the live site, so it plays only a few.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kuchu_puchu/features/viewer/explore_screen.dart';
import 'package:kuchu_puchu/main.dart' as app;
import 'package:kuchu_puchu/shared/parental_gate.dart';
import 'package:kuchu_puchu/shared/widgets.dart';

/// Lets real time pass (network, video) while the app keeps drawing.
Future<void> wait(WidgetTester t, double seconds) async {
  final end = DateTime.now().add(Duration(milliseconds: (seconds * 1000).round()));
  while (DateTime.now().isBefore(end)) {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    await t.pump();
  }
}

/// Marks a screenshot moment and holds the screen still while the host takes it.
Future<void> shot(WidgetTester t, String name) async {
  await wait(t, 1);
  debugPrint('SHOT:$name');
  await wait(t, 3);
}

Future<void> openTab(WidgetTester t, IconData icon) async {
  await t.tap(find.byIcon(icon).last);
  await wait(t, 5);
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('main screens', (t) async {
    app.main();
    await wait(t, 15); // splash, then the Shorts feed starts playing
    expect(find.text('For You'), findsOneWidget);
    await shot(t, '1-shorts');

    await openTab(t, Icons.home_rounded);
    await shot(t, '2-home');

    // The video just watched in Shorts is in Continue watching: open it full screen.
    final cards = find.byType(VideoCard);
    if (cards.evaluate().isNotEmpty) {
      await t.tap(cards.first);
      await wait(t, 8);
      await shot(t, '3-player');
      await t.binding.handlePopRoute();
      await wait(t, 3);
    }

    await openTab(t, Icons.explore_rounded);
    await shot(t, '4-explore');
    final tiles = find.byType(CategoryTile);
    if (tiles.evaluate().isNotEmpty) {
      await t.tap(tiles.first);
      await wait(t, 6);
      await shot(t, '5-category');
      await t.binding.handlePopRoute();
      await wait(t, 3);
    }

    await t.tap(find.byIcon(Icons.lock_rounded).last);
    await wait(t, 2);
    await shot(t, '6-grownups-locked');
    await t.tap(find.text('Ask a grown-up'));
    await wait(t, 2);
    await shot(t, '7-gate');
    // Answer the gate the way a grown-up does: read the sum in words, type the answer as digits.
    var n = -1;
    for (var a = gateFirst.min; a <= gateFirst.max && n < 0; a++) {
      for (var b = gateSecond.min; b <= gateSecond.max && n < 0; b++) {
        if (find.text(gateQuestion(a, b)).evaluate().isNotEmpty) n = a * b;
      }
    }
    expect(n, isNot(-1), reason: 'the gate shows a multiplication in words');
    await t.enterText(find.byType(TextField), '$n');
    await t.testTextInput.receiveAction(TextInputAction.done);
    await wait(t, 3);
    expect(ParentalGate.unlocked, isTrue, reason: 'the right answer opens the Grown-ups area');
    await shot(t, '8-grownups');
  });
}
