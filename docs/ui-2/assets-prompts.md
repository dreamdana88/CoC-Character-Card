# UI-2 · 图像素材与提示词

2026-09-30，使用内置 image_gen；按 imagegen 与 clean-focused-image-generation 技能执行。三件独立透明素材已保存项目内，未上传。

| 运行文件 | 运行规格 | 使用 |
| --- | --- | --- |
| archive-paper-frame.webp | 768×768，52,698 字节 | 档案卡九宫格边框，切片 105，边框显示宽度 27px，真实 HTML 叠加 |
| archive-botanical-edge.webp | 600×900，94,416 字节 | 页侧植物/旧照片，小范围装饰，手机缩小减弱 |
| archive-wax-seal.webp | 128×123，4,728 字节 | 更新时间旁 26px 空白酒红蜡封 |

对应源图在 `web/assets/sources/<名称>-original.png`。运行版仅等比缩放及 WebP quality 90 编码，保留透明通道；未用代码重画或修补图像。素材试装页 `/ui/asset-review`。

## 1. 档案纸框

ONE isolated antique investigator archive paper FRAME asset for a Chinese CoC website. Square front view, full outer edges visible, transparent exterior background. A warm ivory parchment rectangle with thin double muted brass/brown rules, tiny purposeful corner flourishes and gentle irregular aged EDGE shading, readable clean nearly uniform ivory center occupying 80 percent. Elegant private 1920s archive, #F7F4EC paper, #8C7048 edging. Designed as nine-slice stretchable UI frame: corners compact in outer 10 percent, sides straight and continuous, center visually quiet. No text, no symbols, no buttons, no drop shadow beyond edge. NO fish scales, NO scallop texture, NO grain, NO speckles, NO noise, NO gratuitous scratches, NO excessive ornament. Purposeful paper edge detail only, not minimalist flat vector.

## 2. 植物与旧照片

One isolated vertical left-side decorative collage asset, transparent background, for a private 1920s investigator archive web UI. Slim composition down the LEFT edge, right 60 percent empty transparent to protect readable content. Sepia old photo of distant gothic archive building (no text), corner of vintage street map (no lettering), small pressed pale cream flowers and dark muted green ivy sprig, a little brass paperclip. Rich tasteful quiet antique archival material and painterly photographic realism matching warm ivory paper and burgundy private archive aesthetic. Entire collage fits within frame with transparent exterior, NO background page, no rectangle filling canvas, no shadow halo. Purposeful 3-4 objects only, no weapons, no books, no extra symbols, NO fish scale/scallop texture, NO grain, NO noise, NO speckles, no excessive microdetails. No writing or typography anywhere. Tall narrow usable side ornament.

## 3. 空白酒红蜡封

ONE isolated small blank dark burgundy wax seal UI asset, top-down front view, transparent background, centered complete circular seal. Elegant antique 1920s private archive aesthetic. Wine red #6B2D35 matte wax, gently irregular outer wax rim, simple concentric recessed circular center, NO lettering NO emblem NO symbol inside; blank center. Restrained warm light, very subtle relief, no large cast shadow, no halo, no paper or ribbons. Clearly legible at 24-36px. No fish scales or scalloped repeating patterns, no grain, no noise, no speckles, no excessive tiny cracks, no gratuitous details. Single wax seal only.

## 装饰还原修订：五张独立透明素材

全部参照既有视觉基准，以写实复古纸质拼贴、旧铜金、低饱和植物为方向；透明背景，无文字、无鱼鳞纹、无可见噪点、不增加无关物品。保留物体有意义的细节，正文区域不生成纹理。

- archive-binding：连续纵向旧铜植物雕花，深皮边和克制常春藤；用于左右页面边饰，右侧镜像。
- card-side-black-rose：两朵绒面黑玫瑰、暗绿叶、旧地图纸、黄铜挂坠及黑色丝带。
- card-side-books：两本深色旧皮笔记本、细铜金书脊、地图及旧钥匙，不生成书名。
- card-side-documents：旧信封、棕褐建筑照片、暗红花纹蜡封、黄铜夹和一枝干植物。
- card-side-flowers：灰紫及乳白干花、地图纸、黄铜植物徽章、亚麻绳。

生成原图在 web/assets/sources/*-original.png；交付 WebP 通过透明边裁切、缩放和压缩制成。

### 信件照片完整轮廓编辑

内置 imagegen；编辑目标为原 card-side-documents-original.png。最终替换 web/assets/sources/card-side-documents-original.png 和 web/assets/card-side-documents.webp。

Prompt: Use case: precise-object-edit. Edit target: supplied antique archive decoration. Repair ONLY the composition's clipped left edge by completing all left contours of the letters, envelopes, photographs and dried sprig. Keep the same sepia architectural photographs, cream envelopes, burgundy botanical wax seal, brass paperclip, warm antique palette and realistic collage style. The entire vertical slim cluster must be visible as a freestanding cutout, with generous genuinely transparent margins on ALL four sides. NO object touches the image canvas edges; no flat vertical cutoff. Keep a compact slender vertical silhouette, natural staggered paper corners. No added objects, no lettering, no fish-scale texture, no visible noise or grain, no background halo. Preserve purposeful material details. This is a website card-margin decoration, not a wallpaper or page edge.
