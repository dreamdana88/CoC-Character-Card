# CoC-Character-Card

CoC 7 角色卡中心。当前做到 Phase B7：登录后可以填写、保存、复制和删除完整的 CoC7 调查员卡，并导出、导入本站的 `*.coc7.json`。导入后的卡属于当前登录用户。已提供内部只读 API；TeaParty-Bell 尚未接入，B8 才接。

## 规则

UI 初版已完成，包括登录页、调查员列表及完整编辑页。设计计划见 `docs/ui-construction-plan.md`，列表验收见 `docs/ui-2/acceptance.md`。登录后访问 `/investigators`；独立素材试装页为 `/ui/asset-review`。

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

`node server.js` 监听 `127.0.0.1`，端口读 `PORT`，默认 `8787`。角色卡接口是 `/api/characters`。主人只认当前会话，不接受页面传入的 owner。

## B7 内部只读 API

两个接口均要求 `Authorization: Bearer <INTERNAL_API_SECRET>`。密钥来自环境变量；未配置、缺少或错误认证均返回 401。不依赖来源地址、Discord OAuth、Cookie 或网页 Session。Node 继续监听本机；VPS 部署时还须配置 OpenResty 禁止公网访问 `/internal/*`（尚未部署）。

- `GET /internal/users/:discordUserId/characters`：ID 必须是非空数字字符串。仅按所有者查询，返回 `{ok:true,characters:[{id,ownerDiscordUserId,name,occupation,era,updatedAt}]}`；无卡返回空数组，不返回完整卡。
- `GET /internal/characters/:characterId`：按库存 ID 返回 `{ok:true,character,derived,createdAt,updatedAt}`。`character` 是原长期卡，`derived` 复用 `derivePreview()`。所有权供 B8 根据 PL 的 Discord User ID 再核对。

B8 初始化来源：姓名为 `character.identity.name`，HP 为 `derived.hp`，SAN 为 `character.initialSan`，MP 为 `derived.mp`，Luck 为 `character.characteristics.luck`。缺失的 `initialSan` 保持缺失，绝不从 POW 补值。

状态码：200 成功、400 参数无效、401 认证失败、404 卡或路由不存在、405 非 GET（`Allow: GET`）、500 内部错误。先认证再检查方法。错误统一 `{ok:false,error,message}`；代码分别为 `INVALID_PARAMETER`、`UNAUTHORIZED`、`NOT_FOUND`、`METHOD_NOT_ALLOWED`、`INTERNAL_ERROR`。所有响应使用 JSON UTF-8 和 `Cache-Control: no-store`，错误与日志不包含密钥。

内部接口没有写入操作或本局状态；SQLite 只有档案馆服务打开。TeaParty-Bell 尚未接入；B8、VPS HTTP 调用与 OpenResty 公网隔离均未验收。
