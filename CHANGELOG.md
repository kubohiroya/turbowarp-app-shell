# Changelog

## Unreleased

## 0.2.1

- Keep every application menu action on the stage. The default layout placed actions in two
  columns 30% apart, so a fifth action already ran past the bottom and a ninth was out of reach
  (the root clips its overflow). Up to four actions keep the layout they had; more actions get
  three columns (four beyond twelve) in the band above the status row, with labels and icons
  scaled to the cells. An action's own `position` still overrides its cell.

## 0.2.0

- Add app-neutral title controls, application menu, loading presenter, and source chooser primitives.
- Add DOM fixture coverage for injected labels, icons, actions, lifecycle, state, and test hooks.
- Document migration notes for consuming apps while keeping app-specific policy outside this package.
- Let a consuming app inject its own DOM attributes on every shell part, so existing app-owned
  selectors survive the migration.
- Let an icon carry a CSS `filter`, box `size`, and `fontSize`, so an app keeps its own icon rendering.
- Let an application menu action own an absolute `position`, and let the status row own its colour.
- Let title controls scale the built-in close glyph through `closeIconMetrics`.
- Let a source choice pick `align: 'center'` for a label-only button.
- Treat an undefined `mount.style.position` as unset, so DOM stubs restore the mount correctly.
- Build `dist/` from a `prepare` script, so the package is usable when installed from a git ref.

## 0.1.0

- Initial public package shape for app-neutral TurboWarp DOM shell primitives.
- Add locale resolution and a disposable runtime message indicator.
- Keep application copy, diagnostics, preview behavior, and menu policy outside the package boundary.
