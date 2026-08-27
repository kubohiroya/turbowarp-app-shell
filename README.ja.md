# turbowarp-app-shell

[English](README.md)

`@kubohiroya/turbowarp-app-shell` は、TurboWarp app 向けの app 非依存 DOM shell primitive を提供します。

stage overlay、locale-aware label、dispose 可能な control などの mechanics を持ちます。copy、icon、diagnostics、action は app package から注入します。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
pnpm run release:check
```
