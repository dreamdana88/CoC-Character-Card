export function loginPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#35261c">
<title>茶话会调查员档案馆 · 登录</title>
<link rel="icon" href="/assets/archive-emblem.png" type="image/png">
<link rel="preload" href="/assets/archive-login.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/login.css">
</head>
<body class="archive-login">
<div class="scene" aria-hidden="true"></div>
<div class="screen-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
<main class="login-stage">
<section class="login-sheet" aria-labelledby="archive-title">
<img class="sheet-corner" src="/assets/brass-corner.svg" width="70" height="70" alt="">
<img class="sheet-corner sheet-corner-bottom" src="/assets/brass-corner.svg" width="70" height="70" alt="">
<span class="archive-eyebrow">私人珍藏 · 调查员档案</span>
<img class="archive-emblem" src="/assets/archive-emblem.png" width="112" height="118" alt="">
<h1 id="archive-title">茶话会调查员档案馆</h1>
<p class="archive-english" lang="en">ARKHAM INVESTIGATOR ARCHIVE</p>
<img class="archive-divider" src="/assets/archive-divider.svg" width="360" height="28" alt="">
<a class="discord-login" href="/auth/login">
<svg aria-hidden="true" viewBox="0 0 24 24" width="25" height="25" fill="currentColor"><path d="M19.7 5.2a18 18 0 0 0-4.4-1.4l-.6 1.2a16.5 16.5 0 0 0-5.4 0l-.6-1.2a18 18 0 0 0-4.4 1.4C1.5 9.4.7 13.5 1.1 17.5a18 18 0 0 0 5.4 2.7l1.1-1.8-1.7-.8.4-.3c3.7 1.7 7.7 1.7 11.4 0l.4.3-1.7.8 1.1 1.8a18 18 0 0 0 5.4-2.7c.5-4.6-.8-8.6-3.2-12.3ZM8.5 14.9c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/></svg>
<span>使用 Discord 登录</span>
<span class="button-arrow" aria-hidden="true">↗</span>
</a>
<p class="archive-motto">在迷雾中，仍有人记录下我们的名字。</p>
<div class="sheet-bottom" aria-hidden="true"><span></span><b>✧</b><span></span></div>
</section>
<p class="login-footnote">一纸档案，留存每一次启程。</p>
</main>
</body>
</html>`;
}
