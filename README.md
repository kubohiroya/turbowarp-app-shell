# turbowarp-app-shell

[日本語](README.ja.md)

`@kubohiroya/turbowarp-app-shell` provides app-neutral DOM shell primitives for TurboWarp applications.

It owns mechanics such as stage overlays, locale-aware labels, and disposable controls. App packages inject copy, icons, diagnostics, and actions.

## Scope

- Resolve browser locale.
- Mount disposable overlays into a TurboWarp stage container.
- Create app-neutral runtime message indicators.
- Keep app-specific copy and behavior outside the package.

## Example

```ts
import {
  createRuntimeMessageIndicator,
  resolveAppShellLocale
} from '@kubohiroya/turbowarp-app-shell';

const indicator = createRuntimeMessageIndicator({
  document,
  mount: stageContainer,
  initialLocale: resolveAppShellLocale(navigator),
  locales: {
    en: {title: 'Runtime error', actionLabel: 'Reload'},
    ja: {title: '実行エラー', actionLabel: '再読み込み'}
  },
  action: {
    onClick() {
      location.reload();
    }
  }
});

indicator.show({
  message: error.message,
  details: {code: error.code}
});
```

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
pnpm run release:check
```
