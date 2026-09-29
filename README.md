# CoC-Character-Card

CoC 7 角色卡中心。当前做到 Phase B3：Discord 登录和贵宾门禁。没有车卡页面。

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

玩家身份用 PL。SQLite 使用 `better-sqlite3`，不用 `node:sqlite`。库文件只由本服务打开，路径来自 `DATABASE_PATH`。启动时做完整性检查，损坏则拒绝打开。在线备份每天一份，保留最近 14 份。登录使用 Discord Authorization Code，scope 为 `identify` 和 `guilds.members.read`，不保存 access token 和 refresh token。
