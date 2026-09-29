# CoC-Character-Card

CoC 7 角色卡中心。当前是 Phase B0：仓库骨架和测试入口。没有登录、数据库和车卡页面。

## 规则

字段和公式以本仓库里的两份审计为准：

```text
docs/reference/tl-coc-card-xlsx-audit.md
docs/reference/coc-phase0-audit.md
```

## 配置

复制 `.env.example` 为 `.env`，在本机填写。程序只读环境变量，这些值不进仓库：

```text
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
OAUTH_CALLBACK_URL
DISCORD_GUILD_ID
COC_ACCESS_ROLE_ID
SESSION_SECRET
DATABASE_PATH
INTERNAL_API_SECRET
```

当前生产茶话会的 Guild ID 备注是 `1447978053665030280`。这只是备注。运行时读取 `DISCORD_GUILD_ID`，仓库里不写这个默认值。

## 运行测试

需要 Node.js `>=22.20.0`。

```text
npm test
```

玩家身份用 PL。以后的 SQLite 使用 `better-sqlite3`，不用 `node:sqlite`。本阶段不安装数据库驱动。
