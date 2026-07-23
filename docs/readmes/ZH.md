# ELEMENT COPIER

<p align="center" id="installation">
  <a href="https://chromewebstore.google.com/detail/element-copier/gdcdnijkedjdjighmalgialikcgkibel" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Chrome%20Web%20Store.svg?logo=googlechrome&logoColor=4285F4&mode=dark">
      <source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/badge/Chrome%20Web%20Store.svg?logo=googlechrome&logoColor=4285F4&mode=light">
      <img src="https://shieldcn.dev/badge/Chrome%20Web%20Store.svg?logo=googlechrome&logoColor=4285F4&mode=dark" alt="Chrome Web Store">
    </picture>
  </a>
  <a href="https://addons.mozilla.org/firefox/addon/element-copier/" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Firefox%20Add%E2%80%91ons.svg?logo=firefoxbrowser&logoColor=FF7139&mode=dark">
      <source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/badge/Firefox%20Add%E2%80%91ons.svg?logo=firefoxbrowser&logoColor=FF7139&mode=light">
      <img src="https://shieldcn.dev/badge/Firefox%20Add%E2%80%91ons.svg?logo=firefoxbrowser&logoColor=FF7139&mode=dark" alt="Firefox Add-ons">
    </picture>
  </a>
  <a href="https://github.com/md2it/element-copier/releases/latest/download/element-copier.zip">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Latest%20Release%20ZIP.svg?logo=lu:FileArchive&logoColor=CA8A04&mode=dark">
      <source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/badge/Latest%20Release%20ZIP.svg?logo=lu:FileArchive&logoColor=CA8A04&mode=light">
      <img src="https://shieldcn.dev/badge/Latest%20Release%20ZIP.svg?logo=lu:FileArchive&logoColor=CA8A04&mode=dark" alt="Latest Release ZIP">
    </picture>
  </a>
</p>

<p align="center" id="language">
=-=-=-=-=-=-=-=-= | <a href="./DE.md">DE</a> | <a href="../../README.md">EN</a> | <a href="./ES.md">ES</a> | <a href="./FR.md">FR</a> | <a href="./RU.md">RU</a> | 中文 | <a href="./AR.md">عربي</a> | =-=-=-=-=-=-=-=-=
</p>

## 说明

复制和下载整个网页或单个元素，可保存为富文本、图像和 Markdown。

面向开发人员和测试人员：URL、HTML 代码、tag#id.class、CSS 选择器、JS 路径、XPath 和完整 XPath、声明样式和计算样式，以及缺陷报告所需的详细信息。

<p align="center" id="screenshots">
  <a href="../publication/screenshots/ZH-0.png"><img src="../publication/screenshots/ZH-0.png" width="180" alt="Element Copier screenshot 1"></a>
  <a href="../publication/screenshots/ZH-1.png"><img src="../publication/screenshots/ZH-1.png" width="180" alt="Element Copier screenshot 2"></a>
  <a href="../publication/screenshots/ZH-2.png"><img src="../publication/screenshots/ZH-2.png" width="180" alt="Element Copier screenshot 3"></a>
</p>

## 主要功能

- 复制整个页面或指定元素
- 同时将内容转换为多种格式
- 为所有已启用格式保留最近复制的内容
- 将内容复制到剪贴板或下载为文件
- 使用可配置的默认操作加快重复复制
- 键盘快捷键
- 浅色和深色主题
- 灵活的设置
- 界面支持英语、法语、德语、西班牙语、俄语、阿拉伯语和简体中文

### 支持的格式

- 可粘贴到 Google Docs 和 Word 的富文本
- 图像：
   - PNG
   - JPEG
- Markdown
- HTML
- 开发和测试格式：
   - Tag#id.class
   - 选择器
   - JS 路径
   - XPath
   - 完整 XPath
   - 声明样式
   - 计算样式
   - QA 详情用于缺陷报告

### 产品说明

- 富文本格式旨在提供优于基本复制粘贴的结果
- 键盘快捷键和默认操作可减少重复复制所需的步骤
- 开发者格式无需打开 DevTools 即可提供常用检查数据
- Markdown 处理会尽可能保留布局、链接和内容图像，包括转换后的 SVG 图像

## 隐私

- 不收集数据
- 不跟踪用户
- 不发送网络请求
- 页面内容仅在浏览器本地处理

## 限制

- **iframe 的选择方式与其他元素不同：**
   - iframe 会作为一个整体被选择
      - 这是平台限制所致
      - 向 iframe 内部注入代码被认为是不可取的
   - 选择效果在视觉上有所不同
      - 这是由于事件处理程序不同
      - 不影响功能
      - 统一选择效果不会带来任何功能上的好处
- **处理大型页面可能需要一些时间：**
   - 处理速度受第三方库限制
   - 这些库通过封装未经修改地使用
   - 这是一项有意为之的设计决定
   - 可以在设置中禁用图像生成和保存
   - 不处理图像时，即使是非常大的页面也能在不到一秒内完成处理
- **结果弹出窗口可能会被中断：**
   - 浏览器可能打开优先级更高的其他弹出窗口
   - 这不影响扩展程序的功能
   - 已启动的处理仍会完成
- **Markdown 中小图像的处理方式可以配置：**
   - 某些使用场景需要收集所有小图像
   - 另一些场景则需要排除它们
   - 扩展程序无法预知用户的目的
   - 此行为由单独的设置控制

## 许可证

[MIT 许可证](../../LICENSE)
