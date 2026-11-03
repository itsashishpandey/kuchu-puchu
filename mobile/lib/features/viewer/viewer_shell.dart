import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/preferences.dart';
import '../../core/taxonomy.dart';
import '../../core/theme.dart';
import '../../shared/widgets.dart';
import '../feed/shorts_feed.dart';
import '../grownups/grown_ups_screen.dart';
import '../onboarding/guest_languages.dart';
import 'explore_screen.dart';
import 'home_screen.dart';

/// Which tab is showing: 0 Home, 1 Shorts (the app opens here), 2 Explore, 3 Grown-ups (gated).
/// Screens switch tabs with `ref.read(viewerTabProvider.notifier).state = n`.
final viewerTabProvider = StateProvider<int>((_) => 0);

class _TabItem {
  final IconData icon;
  final String label;
  final Color color;
  const _TabItem(this.icon, this.label, this.color);
}

const _tabs = [
  _TabItem(Icons.home_rounded, 'Home', KP.blue),
  _TabItem(Icons.play_circle_fill_rounded, 'Shorts', KP.pink),
  _TabItem(Icons.explore_rounded, 'Explore', KP.purple),
  _TabItem(Icons.lock_rounded, 'Grown-ups', KP.green),
];

/// The whole app: a watch-only shell with no accounts. Tabs are built the first time
/// they are opened and then kept alive (IndexedStack) so scroll positions and
/// players survive tab switches — the Reelxia main_shell pattern.
class ViewerShell extends ConsumerStatefulWidget {
  static const shortsTab = 1;
  final int initialTab;
  const ViewerShell({super.key, this.initialTab = shortsTab});
  @override
  ConsumerState<ViewerShell> createState() => _ViewerShellState();
}

class _ViewerShellState extends ConsumerState<ViewerShell> {
  late int _tab;
  late final Set<int> _visited;

  @override
  void initState() {
    super.initState();
    _tab = widget.initialTab.clamp(0, _tabs.length - 1);
    _visited = {_tab};
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(viewerTabProvider.notifier).state = _tab;
    });
  }

  void _select(int i) {
    if (i == _tab) return;
    setState(() {
      _tab = i;
      _visited.add(i);
    });
    if (ref.read(viewerTabProvider) != i) ref.read(viewerTabProvider.notifier).state = i;
  }

  Future<void> _onBack() async {
    // back goes to the videos first, then asks before leaving
    if (_tab != ViewerShell.shortsTab) {
      _select(ViewerShell.shortsTab);
      return;
    }
    final leave = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: Column(children: [
          const Text('🥺', style: TextStyle(fontSize: 48)),
          const SizedBox(height: 6),
          Text('Leaving already?', style: KP.display(24)),
        ]),
        content: Text('There are more cartoons waiting for you!', textAlign: TextAlign.center, style: KP.body(15, color: KP.inkSoft)),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Exit', style: KP.body(15, color: KP.inkSoft, weight: FontWeight.w800))),
          KpButton(label: 'Stay & watch', emoji: '🍿', expand: false, height: 46, onTap: () => Navigator.pop(ctx, false)),
        ],
      ),
    );
    if (leave == true) SystemNavigator.pop();
  }

  Widget _buildTab(int i) {
    switch (i) {
      case 0:
        return const HomeScreen();
      case 1:
        return _ShortsTab(active: _tab == ViewerShell.shortsTab);
      case 2:
        return const ExploreScreen();
      default:
        return const GrownUpsScreen();
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<int>(viewerTabProvider, (_, next) => _select(next));
    final dark = _tab == 1;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _onBack();
      },
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
        child: Scaffold(
          extendBody: true,
          backgroundColor: dark ? Colors.black : KP.surface,
          body: IndexedStack(
            index: _tab,
            children: [
              for (var i = 0; i < _tabs.length; i++) _visited.contains(i) ? _buildTab(i) : const SizedBox.shrink(),
            ],
          ),
          bottomNavigationBar: _CandyBar(index: _tab, dark: dark, onTap: _select),
        ),
      ),
    );
  }
}

/// Floating rounded bottom bar; the active tab grows into a candy pill.
class _CandyBar extends StatelessWidget {
  final int index;
  final bool dark;
  final ValueChanged<int> onTap;
  const _CandyBar({required this.index, required this.dark, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final safe = MediaQuery.paddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(14, 0, 14, safe + 10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        height: 68,
        padding: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          color: dark ? Colors.black.withValues(alpha: 0.55) : Colors.white,
          borderRadius: BorderRadius.circular(34),
          border: Border.all(color: dark ? Colors.white.withValues(alpha: 0.12) : KP.line, width: 1.5),
          boxShadow: dark ? null : KP.softShadow(),
        ),
        child: Row(children: [
          for (var i = 0; i < _tabs.length; i++)
            Expanded(
              flex: i == index ? 15 : 10,
              child: Bouncy(
                onTap: () => onTap(i),
                child: _BarItem(item: _tabs[i], active: i == index, dark: dark),
              ),
            ),
        ]),
      ),
    );
  }
}

class _BarItem extends StatelessWidget {
  final _TabItem item;
  final bool active, dark;
  const _BarItem({required this.item, required this.active, required this.dark});

  @override
  Widget build(BuildContext context) {
    final inactive = dark ? Colors.white.withValues(alpha: 0.8) : item.color.withValues(alpha: 0.75);
    return Center(
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutBack,
        height: 50,
        padding: EdgeInsets.symmetric(horizontal: active ? 10 : 0),
        decoration: BoxDecoration(
          color: active ? item.color : Colors.transparent,
          borderRadius: BorderRadius.circular(25),
          boxShadow: active ? [BoxShadow(color: item.color.withValues(alpha: 0.4), blurRadius: 12, offset: const Offset(0, 5))] : null,
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, mainAxisSize: MainAxisSize.min, children: [
          Icon(item.icon, color: active ? Colors.white : inactive, size: 26)
              .animate(target: active ? 1 : 0)
              .scaleXY(begin: 1, end: 1.12, duration: 220.ms, curve: Curves.easeOutBack),
          if (active) ...[
            const SizedBox(width: 5),
            Flexible(
              child: Text(item.label, maxLines: 1, overflow: TextOverflow.clip, style: KP.body(12.5, color: Colors.white, weight: FontWeight.w900)),
            ),
          ],
        ]),
      ),
    );
  }
}

/// Shorts tab: For You / Following / Trending switch over a full-screen feed, plus the language chip.
class _ShortsTab extends ConsumerStatefulWidget {
  final bool active;
  const _ShortsTab({required this.active});
  @override
  ConsumerState<_ShortsTab> createState() => _ShortsTabState();
}

class _ShortsTabState extends ConsumerState<_ShortsTab> {
  FeedKind _kind = FeedKind.foryou;

  static const _labels = {FeedKind.foryou: 'For You', FeedKind.trending: 'Trending'};

  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(feedLanguageFilterProvider);
    final langs = ref.watch(languagesProvider).value ?? const <TaxLanguage>[];
    final chip = filter.isEmpty
        ? '🌐'
        : filter.length == 1
            ? '🌐 ${langs.byCode(filter.first)?.nameNative ?? filter.first}'
            : '🌐 ${filter.length}';
    return Stack(children: [
      Positioned.fill(
        child: ShortsFeed(key: ValueKey(_kind), kind: _kind, active: widget.active),
      ),
      SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Align(
            alignment: Alignment.topCenter,
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Flexible(child: FittedBox(fit: BoxFit.scaleDown, child: _switcher())),
              const SizedBox(width: 8),
              Semantics(
                button: true,
                label: 'Feed languages',
                child: Bouncy(
                  onTap: () => showFeedLanguageFilter(context),
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 120),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                    decoration: BoxDecoration(
                      color: filter.isEmpty ? Colors.black.withValues(alpha: 0.35) : KP.yellow,
                      borderRadius: BorderRadius.circular(26),
                    ),
                    child: Text(chip,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: KP.body(13, color: filter.isEmpty ? Colors.white : KP.ink, weight: FontWeight.w900)),
                  ),
                ),
              ),
            ]),
          ),
        ),
      ),
    ]);
  }

  Widget _switcher() => Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.35), borderRadius: BorderRadius.circular(26)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                for (final k in _labels.keys)
                  Bouncy(
                    onTap: () => setState(() => _kind = k),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: _kind == k ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Text(
                        _labels[k]!,
                        style: KP.body(13.5, color: _kind == k ? KP.ink : Colors.white, weight: FontWeight.w900),
                      ),
                    ),
                  ),
              ]),
            );
}
