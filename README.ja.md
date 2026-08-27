# turbowarp-app-shell

[English](README.md)

`@kubohiroya/turbowarp-app-shell` は、TurboWarp app 向けの app 非依存 DOM shell primitive を提供します。

stage overlay、locale-aware label、dispose 可能な control などの mechanics を持ちます。copy、icon、diagnostics、action は app package から注入します。

## スコープ

- ブラウザ locale を解決する。
- TurboWarp stage container に dispose 可能な overlay を mount する。
- app 非依存の runtime message indicator を作成する。
- app 固有の copy と behavior は package の外側に残す。

## 例

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

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
pnpm run release:check
```
