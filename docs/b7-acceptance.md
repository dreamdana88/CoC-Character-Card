# B7 内部只读 API 交付

2026-10-01。基于 UI 提交 `7aba33d5b66d0d0c0a2d568970eacacab358a6e6`，只修改 CoC-Character-Card；TeaParty-Bell 未修改，B8 未开始。

新增 `api/internal.js`，由 `server.js` 分流 `/internal` 与 `/internal/*`。两个 GET 复用 `listCharactersByOwner()`、`getCharacter()` 与 `derivePreview()`，没有 SQL、写入或规则副本。Bearer 密钥采用等长恒定时间比较，空配置拒绝访问。不读取 OAuth 配置、不使用 Cookie，不以来源地址替代认证。

接口完整契约见 README 的 B7 部分。单卡返回真实库存长期数据和派生结果，缺失 `initialSan` 不补 POW；列表只返回六个摘要字段。存储原有校验禁止本局字段写入。

`npm test`：82/82 通过，0 失败、0 跳过。新增 7 项 B7 测试使用本机真实 HTTP、随机临时端口、临时 SQLite 和测试密钥；覆盖正确/缺少/错误认证、服务器未配置密钥、无 OAuth/Cookie 调用、所有者隔离、空列表、参数错误、未知卡/路由、非 GET 的 405/Allow、完整卡/初始 SAN/Luck/派生值、缺失 SAN、禁止字段、读取前后全部角色行内容与时间不变、500 错误及日志脱敏。原网页 API、OAuth、UI 及规则自动化测试继续通过。

骨架测试的精确 API 文件清单及阶段文案断言更新到 B7，未删除测试或放宽原断言。未新增依赖，未改网页行为、现有数据库、Discord 或运行服务。

尚未验证：真实 VPS 部署、真实 INTERNAL_API_SECRET 配置、小 G 宝 HTTP 调用、OpenResty 禁止公网 `/internal/*`、真实 Discord OAuth。自动化回归不等同于上述真实部署验收。

完成后停止在 B7，下一阶段 B8 需要用户另行授权。
