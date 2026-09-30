# 图像资产盘点（2026-09-30）

采用 PNG 与 SVG/CSS 混合方式。已认可的 SVG 角饰、分隔纹保留；只为需要绘画与材质的部分生图，不给每个控件生成图片。

核心预算：5 件图像资产＝已有登录背景 1 件＋新增生图 4 件。章鱼馆徽在 UI-1 修订生成，其余 3 件已在 UI-2 生成并接入。核心 5 件现已齐备。

| 图像 | 数量 | 状态/用途 |
| --- | --- | --- |
| 登录书桌背景 | 1 | 已有，不重画；PNG 原件＋WebP 运行版属于同一资产 |
| 章鱼钥匙孔馆徽 | 1 | 本次内置 image_gen 生成，透明 PNG，登录/页头复用 |
| 无字档案纸框 | 1 | UI-2 已生成；清洁米白纸面与旧纸边缘，切片伸缩，列表与面板复用 |
| 侧边植物与旧照片装饰 | 1 | UI-2 已生成；透明独立边饰，保留基准图的叙事细节，不压正文 |
| 空白酒红蜡封 | 1 | UI-2 已生成；透明，少量放在档案卡边缘，不生成文字 |

可选最多 2 件，试装确有必要再做：天命档案袋边饰、日记页边饰。总量约 5–7 件，首版优先控制在 5 件。旋转、切片、压缩和尺寸派生不算新增生图。

SVG/CSS：铜角饰、分隔线、姓名首字印章、纸签、按钮、属性牌、输入框、进度条、普通功能图标。武器不生图，不制作角色头像。

所有生成统一要求：无鱼鳞纹、无噪点，无无关装饰堆砌；参考图的有意义细节保持，阅读区保持清晰。每次按所在 UI 批次交付，当前不提前制作 UI-2 的素材。

## 本次馆徽

内置 image_gen，参考已确认视觉基准。源图：`web/assets/sources/archive-emblem-original.png`；运行版：`web/assets/archive-emblem.png`。保留 alpha；运行版仅裁掉透明外边距、等比缩小及无损 PNG 编码。纸面检查图：`emblem-inspection.png`。

提示词：Generate ONE isolated transparent PNG logo asset, not a screenshot or concept board. Use the reference's small brown octopus archive emblem as STYLE REFERENCE. Refined symmetrical antique octopus-and-keyhole emblem for a private 1920s investigator archive. Tall head, negative-space keyhole, eight elegant curling arms, purposeful engraved linework, narrow finial. Warm sepia #623d2c, subtle broad stroke variation, legible at 100px. Transparent background, no paper rectangle or shadow halo, no text or extra objects. No fish-scale patterns, scalloped scales, grain, noise, speckles, gratuitous microtexture, excessive suction-cup details or unrelated ornament clutter. Complete unclipped arms.

右下角修正：拆为真实独立装饰元素，用 CSS `rotate(180deg)` 贴合右下角，不修改其他角饰方向。
