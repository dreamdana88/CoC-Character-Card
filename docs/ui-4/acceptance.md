# UI-4 职业与技能交付记录

状态：施工及功能验证完成，UI-3/UI-4 等待用户统一视觉验收。

## 实现

- 职业目录采用搜索弹窗，显示信用范围、中文公式、技能摘要与目录编号。同名职业按 ID 选择；搜索“科学家”有三个结果，其中两个同名科学家可按信用范围区分。
- 保留自定义职业、职业公式与职业技能编辑能力。
- 技能采用紧凑档案行，支持职业技能/全部视图、名称与专攻搜索、混点及成长显示。普通/困难/极难以三值展示，编辑资料按需展开。
- 职业点、兴趣点显示真实进度与余额；超点转暗红并显示负余额。错误可定位到字段，同时解除阻碍定位的过滤条件。
- 延续已交付的纸框、黑玫瑰与档案装饰；本批没有增加生图资产或依赖。
- 保留认证、存储及规则边界，没有执行 UI-5/6 或 B7/B8。

## 验证

`npm test`：74 项通过。

真实 Edge 无头浏览器：1440、1280、390、320 四种屏宽均无横向溢出、图片加载失败或未捕获脚本错误。搜索、同名职业按 ID 选择、键盘与 Escape、筛选、混点、成长、神话技能限制、超点和错误定位通过。

临时 SQLite 中实际保存并读回：混点/成长、技能专攻、信用范围修正、自定义职业与自定义技能通过。浏览器使用隔离数据库与模拟会话，未操作用户角色数据，未进行真实 Discord OAuth 验收。完整结果见 `browser-results.json`。

弹窗交互参考 [W3C 模态弹窗规范](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)，使用原生 dialog，保留焦点、键盘关闭与返回入口焦点。

## 查看

实际服务： http://127.0.0.1:8787/investigators ，打开角色编辑页的“职业&技能”。

截图：`skills-1440.png`、`skills-390-viewport.png`；职业目录真实视口见 `occupation-search-1440-viewport.png`、`occupation-search-390-viewport.png`。手机全页截图的固定保存栏位置来自截图拼接，实际栏固定于视口底部。

复现：

```powershell
npm test
node docs/ui-4/check-browser.mjs C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
```
