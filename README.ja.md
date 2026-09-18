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
- domain library `turbowarp-3d-scene-dsl` を利用するアプリは、Kamishibai story module を import せずに、3D/AR 用の label と source action を渡して同じ primitive を構成できます。
- fixture test では標準の `data-turbowarp-app-shell-*` 属性を使えます。consuming app 固有の安定 selector が必要な場合のみ、`rootTestId`、action `testId`、choice `testId` を渡してください。
- 既に独自 selector を持つ app は、fixture を書き換える代わりに `attributes` を渡してそのまま維持できます。各 factory は part ごとの attribute map を受け取り、標準 attribute の後に適用するため、app が所有する ARIA attribute の上書きもできます。

## App 側が所有する表示

本 package が所有するのは layout mechanics であり、app の視覚的な identity ではありません。以下の option により、mechanics を本 package へ移しても app 側の既存の見た目を維持できます。

- `AppShellIcon` は `filter`、`size`、`fontSize` を持ちます。単色 source asset の recolour や、text glyph を app 独自のサイズで表示できます。
- application menu の action は絶対 `position` を受け取り、`setActionState` で移動できます。標準の 2 列 layout ではなく app 側が menu layout を所有できます。
- 標準の layout は、action が 4 つまでなら 2 列 2 行です。それより多いと列と行を増やして label を縮め、すべての action が status 行より上の stage 内に収まります。
- `AppShellApplicationMenuStatus.color` は、app が所有する status 行の色を tone palette より優先します。
- `closeIconMetrics` は、標準の 20px ではなく stage に追従する close glyph の寸法を指定します。
- source choice は label だけの button 用に `align: 'center'` を指定できます。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

## リリース

リリースはタグの push で行います。`.github/workflows/release.yml` が `v*` のタグで動き、次の順に処理します。

1. `pnpm run check` を実行します。
2. タグが `package.json` の版（`0.2.1` なら `v0.2.1`）を指していなければ止まります。
3. GitHub Release を作ります。
4. Trusted Publishing を使い、provenance 付きで npm へ publish します。

したがってリリースは、版を上げた変更を `main` にマージし、そのタグを push する手順になります。

```bash
git fetch origin
git tag v0.2.2 origin/main
git push origin v0.2.2
```

リポジトリは npm のトークンを持ちません。npm が publish を受け付けるのは、npmjs.com 上のこの package の
Trusted Publisher にこの workflow が登録されているからです。登録内容は GitHub Actions、`kubohiroya` /
`turbowarp-app-shell`、workflow filename `release.yml`、environment なしです。登録がないか内容が違うと、
GitHub Release を作った後の publish で `403 … OIDC permission denied` になって失敗します。登録を直したら、
失敗したジョブだけを再実行します。タグを付け直す必要はありません。

```bash
gh run rerun <run-id> --failed
```

`prepare` が publish 時に `dist/` をビルドするため、別途ビルド手順は不要です。

workflow から publish できないときは、タグの commit から手作業で publish することもできます。認証は
パスキーで対話的に行います。

```bash
npm login
npm publish --access public
```

`pnpm run release:check` は dry run です。実際の publish と同じ `+ <name>@<version>` の要約を出力しますが、
何もアップロードしません。また、registry が新しい版を返すまで数分かかることがあります。公開の確認は
この要約ではなく registry に対して行ってください。

```bash
npm view @kubohiroya/turbowarp-app-shell versions
```
