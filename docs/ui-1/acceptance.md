# UI-1 · 交付与验收

2026-09-30。完成独立素材试装与实际登录页；等待用户视觉验收，停在 UI-1。

## 交付

- `web/login.js`、`web/login.css`：实际根路径登录页面；背景、铜色角饰、馆徽、纸质登录面板、中文标题、酒红按钮。
- `web/assets/`：保留原背景，增加 WebP 运行图、独立 SVG、登录字体子集及许可，详见该目录 README。
- `web/asset-review.html`、`web/asset-review.css`：独立试装，包含背景、馆徽、角饰、分隔纹、纸面与真实控件。示例控件不保存角色。
- `web/static-assets.js`：公开文件清单路由，允许 GET/HEAD，拒绝未列出的素材和其他方法；不暴露源图、文档或任意磁盘路径。
- `web/pages.js`：引用新登录页与素材路由，删除旧登录模板；现有调查员列表与编辑页未美化。
- `tests/ui-login-http.test.js`：公开素材、方法、私有文件边界、OAuth 入口与已有会话跳转检查。原骨架测试保持精确目录断言，更新为当前新增文件清单。

## 验证

`npm test`：72 项全部通过。

实际 Edge 无头浏览器检查登录页和试装页，分别在 1440、1280、390、320px 宽度：无页面横向溢出、无脚本/控制台错误、无失败素材请求；图片加载成功；标题通过浏览器平台字体检查确认使用本地 Noto Serif SC；键盘 Tab 可以聚焦登录按钮；试装文本框可编辑。结果保存为 `browser-results.json`，截图为 `login-*.png`、`asset-review-*.png`。

检查过桌面和手机截图。桌面保留书桌场景，手机调整为左侧暖灯优先裁切。纸面无颗粒噪声、无鱼鳞纹，装饰仅在外围与分隔处。

登录链接继续走 `/auth/login`，测试用虚拟配置与临时数据库确认跳转到 Discord 授权地址并生成 state；不向真实 Discord 发起请求。真实 OAuth、贵宾身份、生产 Cookie 待真实环境验证。

未读取 `.env`，未接触现有角色数据库，未启动生产服务，未部署，未进入 UI-2/B7/B8。

## 本地查看

在项目目录运行 `node docs/ui-1/preview-server.mjs`，按输出的本机地址打开 `/` 和 `/ui/asset-review`。该服务使用临时数据库与虚拟 OAuth 配置，登录按钮展示实际入口，但不能完成真实登录。Ctrl+C 关闭服务并清理临时库。

已配置环境的正式服务仍用 `node server.js`；首页会显示同一套 UI，已经登录的用户仍跳转到自己的调查员列表。

复查浏览器可运行：`node docs/ui-1/check-browser.cjs <预览服务地址> <提供 playwright 的 node_modules 绝对目录>`。本次使用 Codex 随附 Playwright 和本机 Edge，未增加项目依赖。

下一步由用户验收本批外观，确认后执行 UI-2。
