# AGENTS.md

本仓库是 CoC 7 角色卡中心，独立于 TeaParty-Bell。

优先级：用户当前指令 → 本文件 → `docs/reference/` 里的两份审计 → 现有代码。冲突或不确定时停下，问用户。与本文件冲突时，以本文件为准。

## 铁律

- 以瞎猜接口为耻，以认真查询为荣。
- 以模糊执行为耻，以寻求确认为荣。
- 以臆想业务为耻，以人类确认为荣。
- 以创造接口为耻，以复用现有为荣。
- 以跳过验证为耻，以主动测试为荣。
- 以破坏架构为耻，以遵循规范为荣。
- 以假装理解为耻，以诚实无知为荣。
- 以盲目修改为耻，以谨慎重构为荣。

## 边界

只改本仓库。TeaParty-Bell 的跑团代码、配置和部署不动。

```text
web/        页面
api/        HTTP
auth/       Discord OAuth 与会话
storage/    SQLite。只有本服务能打开
rules/      纯函数。测试不连 Discord，不引用 TeaParty-Bell 源码
tests/
```

一次只做当前 Phase：`B0 → B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8`。B0、B1、B2、B3、B4、B5、B6 已完成。用户没点名下一个阶段，就停在当前阶段。每个阶段带测试，通过后再进下一个。

B6 只做本站 `*.coc7.json` 的导出和导入。`TL COC CARD.xlsx` 导入和 Excel 导出已取消。

B7 内部 API 是唯一集成边界，只监听本机或校验 `INTERNAL_API_SECRET`。B8 第一批只做 PL 选择自己的长期卡；本局消耗留在 A 线。

## 依据

Discord 接口查当前官方文档。登录用 Authorization Code Flow，scope 为 `identify` + `guilds.members.read`。用当前用户自己的 Access Token 读 `/users/@me`，以及 `/users/@me/guilds/{guild.id}/member` 的 `roles`。这是 OAuth scope，不是 Guild Members Gateway Intent，也不使用小G宝的 Bot Token。

角色卡公式只认本仓库里的：

```text
docs/reference/tl-coc-card-xlsx-audit.md
docs/reference/coc-phase0-audit.md
```

审计没写的公式，停下来问。禁止 `eval`，禁止解析 Excel 公式字符串。

## 产品决定

身份写 PL。所有权只认 Discord User ID。卡面不设玩家名。姓名是调查员的名字。

长期卡保存基础值、初始值和可推导字段，包括幸运。本局 HP / SAN / MP / Luck 消耗、伤势、疯狂、死亡不写回长期卡。

职业点是审计里的 13 个枚举函数，例如 `EDU_X4`；未知类型直接失败。兴趣点是智力的两倍。年龄除移动力外，缩写未展开前只提示，不改属性。派生值现算，不存 Excel 坐标。

建卡初始理智的字段名是 `initialSan`，范围是 0 到 99。购点时九项属性各自是 0 到 90 的整数。技能基础值、职业目录和武器目录在 `rules/data/`，页面从那里读取。

固定网址，URL 里没有 User ID。必须校验 `state`。Session ID 随机不可猜。Cookie 为 `HttpOnly`、`Secure`、`SameSite=Lax`。会话存在服务端。浏览器不保存 Discord token。角色卡主人只从 Session 推导，不接受前端传入的 owner。

不保存 access token 和 refresh token。会话约 90 天，资格约 30 天，写成命名常量。资格到期后重新授权。

`DISCORD_GUILD_ID`、`COC_ACCESS_ROLE_ID`、Client、回调地址、Session Secret、数据库路径、内部密钥只来自环境变量。`.env.example` 的值为空。生产茶话会 Guild ID `1447978053665030280` 只是备注。

SQLite 的 Migration 从 v1 开始。启动做完整性检查；损坏就拒绝服务，不新建空库。在线备份每天一份，保留 14 份。数据库驱动用 `better-sqlite3`，不用 `node:sqlite`。

## 修改与验证

先读相关代码，复用已有实现，只改任务范围内的部分。删除函数、配置或 Migration 前先搜引用。

错误写出真实原因。不用空 `catch`、默认值或新空库掩盖失败。日志不记录 Client Secret、Token、Session ID、Session Secret、Internal API Secret。失败只告诉当前用户。

改完运行 `npm test`。Node `>=22.20.0`。不靠删除测试或放宽断言换通过。真实 OAuth、贵宾身份和线上 Cookie 未实测时，标明「待真实环境验证」。

完成时说明改动、文件、测试结果，以及尚未验证的部分。
