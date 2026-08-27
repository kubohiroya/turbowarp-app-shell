# turbowarp-app-shell

[English](README.md)

`@kubohiroya/turbowarp-app-shell` は、TurboWarp app 向けの app 非依存 DOM shell primitive を提供します。

stage overlay、locale-aware label、dispose 可能な control などの mechanics を持ちます。copy、icon、diagnostics、action は app package から注入します。

## スコープ

- ブラウザ locale を解決する。
- TurboWarp stage container に dispose 可能な overlay を mount する。
- app 非依存の runtime message indicator を作成する。
- title controls、application menu、loading presenter、source chooser を再利用可能な primitive として作成する。
- app 固有の copy と behavior は package の外側に残す。

## Primitive

- `createAppShellTitleControls`: website/close の copy、icon、callback、visible/enabled state、任意の `data-testid` hook を注入する stage 上の title action。
- `createAppShellApplicationMenu`: app が所有する ID、label、icon、callback、enabled/visible state、status text を持つ汎用 menu。
- `createAppShellLoadingPresenter`: startup/runtime initialization 用の loading overlay。backdrop、animation frame、label、determinate/indeterminate progress を任意で渡す。
- `createAppShellSourceChooser`: source selection の shell。choice、validation、picker policy は consuming app が所有する。
- `createRuntimeMessageIndicator`: app 非依存の runtime message overlay。

## 例

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

## 移行メモ

- `tm-kamishibai` は、既存の label、icon、callback、availability state をこれらの factory に渡すことで、local な title/menu/loading/source chooser DOM mechanics を置き換えられます。DSL diagnostics、story source validation、source excerpt、return-to-menu behavior は `tm-kamishibai` 側に残します。
- `tm-3d-app` は、Kamishibai story module を import せずに、3D/AR 用の label と source action を渡して同じ primitive を構成できます。
- fixture test では標準の `data-turbowarp-app-shell-*` 属性を使えます。consuming app 固有の安定 selector が必要な場合のみ、`rootTestId`、action `testId`、choice `testId` を渡してください。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
pnpm run release:check
```
