# turbowarp-app-shell

[日本語](README.ja.md)

`@kubohiroya/turbowarp-app-shell` provides app-neutral DOM shell primitives for TurboWarp applications.

It owns mechanics such as stage overlays, locale-aware labels, and disposable controls. App packages inject copy, icons, diagnostics, and actions.

## Scope

- Resolve browser locale.
- Mount disposable overlays into a TurboWarp stage container.
- Create app-neutral runtime message indicators.
- Create reusable title controls, application menus, loading presenters, and source choosers.
- Keep app-specific copy and behavior outside the package.

## Primitives

- `createAppShellTitleControls`: stage-bound title actions with injected website/close copy, icons, callbacks, visibility, enabled state, and optional `data-testid` hooks.
- `createAppShellApplicationMenu`: generic menu actions with app-owned IDs, labels, icons, callbacks, enabled/visible state, and status text.
- `createAppShellLoadingPresenter`: startup/runtime loading overlay with optional backdrop, animation frames, label, and determinate or indeterminate progress.
- `createAppShellSourceChooser`: generic source-choice dialog where the consuming app owns choices, validation, and picker policy.
- `createRuntimeMessageIndicator`: app-neutral runtime message overlay.

## Examples

```ts
import {
  createAppShellApplicationMenu,
  createAppShellLoadingPresenter,
  createAppShellSourceChooser,
  createAppShellTitleControls,
  createRuntimeMessageIndicator,
  resolveAppShellLocale
} from '@kubohiroya/turbowarp-app-shell';

const locale = resolveAppShellLocale(navigator);

const titleControls = createAppShellTitleControls({
  document,
  mount: stageContainer,
  initialLocale: locale,
  locales: {
    en: {website: 'Website', close: 'Close'},
    ja: {website: 'Web', close: '閉じる'}
  },
  websiteIcon: {url: '/icons/site.svg'},
  onWebsite: () => window.open('/docs/', '_blank', 'noopener,noreferrer'),
  onClose: dismissTitle
});

const menu = createAppShellApplicationMenu({
  document,
  mount: stageContainer,
  initialLocale: locale,
  actions: [
    {
      id: 'open',
      labels: {en: 'Open', ja: '開く'},
      icon: {url: '/icons/open.svg'},
      onSelect: openSource
    },
    {id: 'reload', labels: {en: 'Reload', ja: 'Reload'}, onSelect: reloadRuntime}
  ]
});

const loading = createAppShellLoadingPresenter({document, mount: stageContainer});
loading.show({label: 'Loading runtime', progress: null});

const chooser = createAppShellSourceChooser({
  document,
  mount: stageContainer,
  initialLocale: locale,
  choices: [
    {id: 'file', labels: {en: 'Open file', ja: 'ファイルを開く'}, primary: true, onSelect: openFile},
    {id: 'project', labels: {en: 'Open project', ja: 'プロジェクトを開く'}, onSelect: openProject}
  ]
});

const indicator = createRuntimeMessageIndicator({
  document,
  mount: stageContainer,
  initialLocale: locale,
  locales: {
    en: {title: 'Runtime error', actionLabel: 'Reload'},
    ja: {title: '実行エラー', actionLabel: '再読み込み'}
  },
  action: {onClick: () => location.reload()}
});
indicator.show({
  message: error.message,
  details: {code: error.code}
});
```

## Migration Notes

- `tm-kamishibai` can replace local title/menu/loading/source chooser DOM mechanics by mapping its existing labels, icons, callbacks, and availability state into these factories. Keep DSL diagnostics, story source validation, source excerpts, and return-to-menu behavior in `tm-kamishibai`.
- `tm-3d-app` can compose the same primitives with 3D/AR-specific labels and source actions without importing Kamishibai story modules.
- Use the built-in `data-turbowarp-app-shell-*` attributes for broad fixture assertions. Use `rootTestId`, action `testId`, and choice `testId` only when a consuming app needs stable app-owned selectors.
- An app that already ships its own selectors can keep them by passing `attributes` instead of renaming its fixtures. Every factory accepts per-part attribute maps, applied after the built-in attributes, so an app can also override an ARIA attribute it owns.

## App-owned presentation

The package owns layout mechanics, not an app's visual identity. These options let an app keep its
existing rendering while the mechanics move here:

- `AppShellIcon` carries `filter`, `size`, and `fontSize`, so an app can recolour a monochrome source asset or keep a text glyph at its own size.
- An application menu action accepts an absolute `position`, and `setActionState` can move it, so an app owns its menu layout instead of the default two-column flow.
- `AppShellApplicationMenuStatus.color` overrides the tone palette for an app-owned status row.
- `closeIconMetrics` scales the built-in close glyph with the stage instead of the 20px default.
- A source choice can set `align: 'center'` for a label-only button.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

## Releasing

Releases are published by hand, so a passkey can authenticate interactively:

```bash
npm login
npm publish --access public
```

`prepare` builds `dist/` during publish, so no separate build step is needed.

`pnpm run release:check` is a dry run. It prints the same `+ <name>@<version>` summary as a real
publish while uploading nothing, so confirm a release against the registry rather than against that
summary:

```bash
npm view @kubohiroya/turbowarp-app-shell versions
```
