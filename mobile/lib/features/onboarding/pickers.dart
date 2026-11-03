import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/format.dart';
import '../../core/taxonomy.dart';
import '../../core/theme.dart';
import '../../shared/widgets.dart';

/// Pickers shared by onboarding, the guest language sheet and "My Interests & Languages".
/// They render plain columns so a screen can place them inside its own scroll view.

String languageLabel(TaxLanguage l) => l.sameNames ? l.nameEn : '${l.nameNative} · ${l.nameEn}';

/// Multi-select languages with search, removable chips and (optionally) a primary star.
class LanguageChooser extends StatefulWidget {
  final List<TaxLanguage> languages;
  final List<String> selected;
  final String? primary;
  final bool withPrimary;
  final int? max;
  final List<String> suggested; // e.g. the phone's own languages
  final void Function(List<String> selected, String? primary) onChanged;

  const LanguageChooser({
    super.key,
    required this.languages,
    required this.selected,
    required this.onChanged,
    this.primary,
    this.withPrimary = true,
    this.max,
    this.suggested = const [],
  });

  @override
  State<LanguageChooser> createState() => _LanguageChooserState();
}

class _LanguageChooserState extends State<LanguageChooser> {
  final _search = TextEditingController();
  String _q = '';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _toggle(String code) {
    final list = List<String>.of(widget.selected);
    String? primary = widget.primary;
    if (list.contains(code)) {
      list.remove(code);
      if (primary == code) primary = list.firstOrNull;
    } else {
      if (widget.max != null && list.length >= widget.max!) {
        toast(context, 'You can pick up to ${widget.max} languages', emoji: '🙂');
        return;
      }
      list.add(code);
      primary ??= code;
    }
    widget.onChanged(list, primary);
  }

  Widget _chip(TaxLanguage l, {bool dense = false}) {
    final on = widget.selected.contains(l.code);
    return SelectChip(
      label: languageLabel(l),
      selected: on,
      dense: dense,
      color: KP.blue,
      onTap: () => _toggle(l.code),
      trailing: on ? const Icon(Icons.check_rounded, color: Colors.white, size: 16) : null,
    );
  }

  Widget _section(String title, List<TaxLanguage> list) {
    if (list.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 8, left: 2),
        child: Text(title, style: KP.body(13, color: KP.inkSoft, weight: FontWeight.w900)),
      ),
      Wrap(spacing: 8, runSpacing: 8, children: [for (final l in list) _chip(l)]),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final all = widget.languages;
    final selected = [for (final c in widget.selected) ?all.byCode(c)];
    final searching = _q.trim().isNotEmpty;
    final matches = searching ? all.where((l) => l.matches(_q)).toList() : const <TaxLanguage>[];
    final suggested = [for (final c in widget.suggested) ?all.byCode(c)].where((l) => !widget.selected.contains(l.code)).toList();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      TextField(
        controller: _search,
        onChanged: (v) => setState(() => _q = v),
        textInputAction: TextInputAction.search,
        style: KP.body(16, weight: FontWeight.w700),
        decoration: InputDecoration(
          hintText: 'Search 100+ languages…',
          prefixIcon: const Icon(Icons.search_rounded, color: KP.blue),
          suffixIcon: _q.isEmpty
              ? null
              : IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => setState(() {
                    _search.clear();
                    _q = '';
                  }),
                ),
        ),
      ),
      if (selected.isNotEmpty) ...[
        const SizedBox(height: 14),
        Row(children: [
          Text('Your languages', style: KP.body(13, color: KP.inkSoft, weight: FontWeight.w900)),
          const Spacer(),
          if (widget.withPrimary && selected.length > 1)
            Text('⭐ = main language', style: KP.body(12, color: KP.inkSoft, weight: FontWeight.w700)),
        ]),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final l in selected)
            Container(
              padding: const EdgeInsets.fromLTRB(4, 4, 6, 4),
              decoration: BoxDecoration(
                gradient: KP.blueGrad,
                borderRadius: BorderRadius.circular(22),
                boxShadow: KP.softShadow(KP.blue),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                if (widget.withPrimary)
                  Semantics(
                    button: true,
                    label: widget.primary == l.code ? '${l.nameEn} is your main language' : 'Make ${l.nameEn} your main language',
                    child: GestureDetector(
                      onTap: () => widget.onChanged(widget.selected, l.code),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Text(widget.primary == l.code ? '⭐' : '☆',
                            style: TextStyle(fontSize: 16, color: widget.primary == l.code ? null : Colors.white)),
                      ),
                    ),
                  )
                else
                  const SizedBox(width: 8),
                Flexible(
                  child: Text(languageLabel(l), overflow: TextOverflow.ellipsis, style: KP.body(13.5, color: Colors.white, weight: FontWeight.w800)),
                ),
                Semantics(
                  button: true,
                  label: 'Remove ${l.nameEn}',
                  child: GestureDetector(
                    onTap: () => _toggle(l.code),
                    child: const Padding(
                      padding: EdgeInsets.only(left: 6),
                      child: Icon(Icons.cancel_rounded, color: Colors.white, size: 19),
                    ),
                  ),
                ),
              ]),
            ).animate().scale(begin: const Offset(0.8, 0.8), duration: 220.ms, curve: Curves.easeOutBack),
        ]),
      ],
      if (searching) ...[
        const SizedBox(height: 14),
        if (matches.isEmpty)
          Text('No language found for “$_q”.', style: KP.body(14, color: KP.inkSoft))
        else
          Wrap(spacing: 8, runSpacing: 8, children: [for (final l in matches) _chip(l)]),
      ] else ...[
        if (suggested.isNotEmpty) _section('On your phone', suggested),
        _section('Popular', all.where((l) => l.popular).toList()),
        _section('Indian languages', all.where((l) => !l.popular && l.group == 'INDIAN').toList()),
        _section('International', all.where((l) => !l.popular && l.group != 'INDIAN').toList()),
      ],
    ]);
  }
}

/// Big picture cards for main categories (onboarding step 2, settings).
class CategoryCardGrid extends StatelessWidget {
  final List<TaxCategory> categories;
  final List<String> selected;
  final ValueChanged<String> onToggle;
  const CategoryCardGrid({super.key, required this.categories, required this.selected, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, box) {
      final cols = box.maxWidth > 560 ? 3 : 2;
      final w = (box.maxWidth - (cols - 1) * 12) / cols;
      return Wrap(spacing: 12, runSpacing: 12, children: [
        for (var i = 0; i < categories.length; i++)
          SizedBox(
            width: w,
            child: _CategoryCard(c: categories[i], on: selected.contains(categories[i].id), onTap: () => onToggle(categories[i].id))
                .animate()
                .fadeIn(delay: (20 * (i % 12)).ms, duration: 250.ms),
          ),
      ]);
    });
  }
}

class _CategoryCard extends StatelessWidget {
  final TaxCategory c;
  final bool on;
  final VoidCallback onTap;
  const _CategoryCard({required this.c, required this.on, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final s = c.style;
    return Semantics(
      button: true,
      selected: on,
      label: c.name,
      child: Bouncy(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 104,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: on ? LinearGradient(colors: [s.color, Color.lerp(s.color, Colors.white, 0.3)!], begin: Alignment.topLeft, end: Alignment.bottomRight) : null,
            color: on ? null : s.soft,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: on ? Colors.white : s.color.withValues(alpha: 0.25), width: 2.4),
            boxShadow: on ? KP.softShadow(s.color) : null,
          ),
          child: Stack(children: [
            Positioned(right: -2, bottom: -6, child: Text(s.emoji, style: const TextStyle(fontSize: 40))),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: KP.display(15.5, color: on ? Colors.white : KP.ink, height: 1.1)),
              const Spacer(),
              if (c.videoCount > 0)
                Text(plural(c.videoCount, 'video'), style: KP.body(11, color: on ? Colors.white : KP.inkSoft, weight: FontWeight.w800)),
            ]),
            if (on)
              const Positioned(
                right: 0,
                top: 0,
                child: CircleAvatar(radius: 12, backgroundColor: Colors.white, child: Icon(Icons.check_rounded, size: 16, color: KP.green)),
              ),
          ]),
        ),
      ),
    );
  }
}

/// Subcategory chips per chosen category, each with an "All Subcategories" option (step 3).
class SubcategoryChooser extends StatelessWidget {
  final List<TaxCategory> categories; // the chosen ones, in order
  final Set<String> allSubcategories;
  final Set<String> subcategoryIds;
  final ValueChanged<String> onToggleAll; // category id
  final void Function(String categoryId, String subcategoryId) onToggleSub;

  const SubcategoryChooser({
    super.key,
    required this.categories,
    required this.allSubcategories,
    required this.subcategoryIds,
    required this.onToggleAll,
    required this.onToggleSub,
  });

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      for (final c in categories)
        Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: SoftCard(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: c.style.soft, shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: Text(c.style.emoji, style: const TextStyle(fontSize: 18)),
                ),
                const SizedBox(width: 10),
                Expanded(child: Text(c.name, style: KP.display(17))),
              ]),
              const SizedBox(height: 10),
              Wrap(spacing: 8, runSpacing: 8, children: [
                SelectChip(
                  label: 'All Subcategories',
                  emoji: '✨',
                  dense: true,
                  color: c.style.color,
                  selected: allSubcategories.contains(c.id),
                  onTap: () => onToggleAll(c.id),
                ),
                for (final s in c.subcategories)
                  SelectChip(
                    label: s.name,
                    emoji: s.emoji,
                    dense: true,
                    color: c.style.color,
                    selected: !allSubcategories.contains(c.id) && subcategoryIds.contains(s.id),
                    onTap: () => onToggleSub(c.id, s.id),
                  ),
              ]),
            ]),
          ),
        ),
    ]);
  }
}

/// Toggle helpers so every screen applies the same "All vs individual" rule.
void toggleAllSubcategories(Set<String> all, Set<String> subs, TaxCategory c) {
  if (all.contains(c.id)) {
    all.remove(c.id);
  } else {
    all.add(c.id);
    subs.removeAll(c.subcategories.map((s) => s.id));
  }
}

void toggleSubcategory(Set<String> all, Set<String> subs, String categoryId, String subId) {
  all.remove(categoryId);
  if (!subs.remove(subId)) subs.add(subId);
}
