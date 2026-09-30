# UI-1 · 独立素材

视觉依据：项目上级目录的 `ChatGPT 图像 2026年9月30日 15_05_40.png`，以及用户提供的无字登录背景。所有文件位于本项目内。

通用总则：禁止鱼鳞纹、噪点，不无端增加过多细节造成视觉疲劳。文字与输入区域保持清晰，装饰不承载业务信息。

| 文件 | 来源与规格 | 用途 |
| --- | --- | --- |
| 登录页背景-v1.png | 用户提供，1672×941，2,512,792 字节，原件保持不变 | 美术源图，不作为公开路由 |
| login-study.webp | 从原图直接编码 WebP，quality 88，不加纹理或修改画面，321,296 字节 | 运行书桌背景 |
| archive-emblem.png | 内置 image_gen 生成，透明 PNG，运行版 512×423；章鱼与钥匙孔 | 馆徽，约 138 KB |
| brass-corner.svg | 本批手绘 SVG，150×150 viewBox，透明 | 铜色植物卷纹角饰，旋转复用 |
| archive-divider.svg | 本批手绘 SVG，420×32 viewBox，透明 | 铜色细线与菱形卷纹分隔 |
| paper-texture.svg | 本批 SVG，640×640，仅柔和径向色阶，无噪声滤镜 | 低纹理纸面 |
| archive-login.woff2 | Noto Serif SC，400–700 可变字重；登录固定中文文案子集，16,808 字节 | 登录中文标题与文案 |
| noto-serif-sc-ofl.txt | 随字体提供的 SIL Open Font License | 字体许可 |
| font-source.css | Google Fonts 返回的原始子集声明 | 来源与字形范围记录，不供浏览器请求 |

字体来源：<https://github.com/google/fonts/tree/main/ofl/notoserifsc>。下载由 Google Fonts CSS API 的 `text` 子集完成；运行不依赖 Google 服务器。此子集仅覆盖固定登录文案，不作为后续任意调查员姓名的完整字体。

章鱼馆徽已改用内置 image_gen 生成的透明 PNG，源图与提示词见 docs/ui-1/asset-inventory.md。背景沿用用户资产，角饰与分隔纹保留 SVG。SVG 不包含脚本、外链或图片中的文字；角饰并非原参考图的逐像素分离。

素材试装入口：`/ui/asset-review`。实际登录入口：`/`。本站只公开 `web/static-assets.js` 中列出的文件，源图、许可、说明和截图不通过资产路由公开。

桌面背景采用等比 cover，保留台灯和怀表；手机优先保留左侧暖灯与书桌，横向场景会裁切，未单独生成手机插画。

UI-2 新增三件运行图像：archive-paper-frame.webp、archive-botanical-edge.webp、archive-wax-seal.webp；规格、来源与完整提示词见 docs/ui-2/assets-prompts.md，原始 PNG 均保存在 sources/。列表采用独立纸框切片和真实 HTML 字段，未将整张概念图当作页面。
