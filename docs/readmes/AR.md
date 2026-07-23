# ELEMENT COPIER

<p align="center" id="installation">
  <a href="https://chromewebstore.google.com/detail/element-copier/gdcdnijkedjdjighmalgialikcgkibel">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Chrome%20Web%20Store.svg?logo=googlechrome&logoColor=4285F4&mode=dark">
      <source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/badge/Chrome%20Web%20Store.svg?logo=googlechrome&logoColor=4285F4&mode=light">
      <img src="https://shieldcn.dev/badge/Chrome%20Web%20Store.svg?logo=googlechrome&logoColor=4285F4&mode=dark" alt="Chrome Web Store">
    </picture>
  </a>
  <a href="https://addons.mozilla.org/firefox/addon/element-copier/">
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
=-=-=-=-=-=-=-=-= | <a href="./DE.md">DE</a> | <a href="../../README.md">EN</a> | <a href="./ES.md">ES</a> | <a href="./FR.md">FR</a> | <a href="./RU.md">RU</a> | <a href="./ZH.md">中文</a> | عربي | =-=-=-=-=-=-=-=-=
</p>

## الوصف

انسخ ونزّل صفحات كاملة أو عناصر منفردة كنص منسّق وصور وMarkdown.

للمطورين والمختبرين: عناوين URL، وشفرة HTML، وtag#id.class، ومحددات CSS، ومسارات JS، وXPath وXPath الكامل، والأنماط المعلنة والمحسوبة، وبيانات مفصلة لتقارير الأخطاء.

<p align="center" id="screenshots">
  <a href="../publication/screenshots/AR-0.png"><img src="../publication/screenshots/AR-0.png" width="180" alt="Element Copier screenshot 1"></a>
</p>

## الميزات الرئيسية

- نسخ صفحة كاملة أو عنصر محدد
- تحويل المحتوى إلى عدة تنسيقات في الوقت نفسه
- الاحتفاظ بآخر محتوى منسوخ لجميع التنسيقات المفعّلة
- نسخ المحتوى إلى الحافظة أو تنزيله كملف
- استخدام إجراء افتراضي قابل للتخصيص لتسريع عمليات النسخ المتكررة
- اختصارات لوحة المفاتيح
- سمة فاتحة وأخرى داكنة
- إعدادات مرنة
- الواجهة متاحة بالإنجليزية والفرنسية والألمانية والإسبانية والروسية والعربية والصينية المبسطة

### التنسيقات المدعومة

- نص منسق للصق في Google Docs وWord
- الصور:
   - PNG
   - JPEG
- Markdown
- HTML
- تنسيقات التطوير والاختبار:
   - Tag#id.class
   - Selector
   - مسار JS
   - XPath
   - XPath كامل
   - الأنماط المعلنة
   - الأنماط المحسوبة
   - تفاصيل QA لتقارير الأخطاء

### ملاحظات المنتج

- صُمم تنسيق النص المنسق لتقديم نتيجة أفضل من النسخ واللصق الأساسيين
- تقلل اختصارات لوحة المفاتيح والإجراء الافتراضي عدد الخطوات في عمليات النسخ المتكررة
- تتيح تنسيقات المطورين بيانات الفحص الشائعة دون فتح DevTools
- تحافظ معالجة Markdown قدر الإمكان على التخطيط والروابط وصور المحتوى، بما فيها صور SVG المحوّلة

## الخصوصية

- لا يتم جمع البيانات
- لا يوجد تتبع
- لا توجد طلبات شبكة
- تتم معالجة محتوى الصفحة محليًا في المتصفح

## القيود

- **يختلف تحديد iframe** عن تحديد العناصر الأخرى:
   - يتم تحديد iframe بالكامل
      - يرجع ذلك إلى قيد في المنصة
      - لا يُنصح بالحقن داخل iframe نفسه
   - يبدو التحديد مختلفًا بصريًا
      - يرجع ذلك إلى اختلاف معالجات الأحداث
      - لا يؤثر ذلك في الوظائف
      - لن يوفر توحيد التحديد أي فائدة وظيفية
- **قد تستغرق معالجة الصفحات الكبيرة بعض الوقت:**
   - تحد مكتبات الجهات الخارجية من سرعة المعالجة
   - تُستخدم هذه المكتبات دون تعديل من خلال غلاف (wrapper)
   - هذا قرار تصميمي مقصود
   - يمكن تعطيل إنشاء الصور وحفظها من الإعدادات
   - من دون معالجة الصور، تتم معالجة الصفحات الكبيرة جدًا في جزء من الثانية
- **قد تتم مقاطعة فتح نافذة النتائج المنبثقة:**
   - قد يفتح المتصفح نافذة منبثقة أخرى ذات أولوية أعلى
   - لا يؤثر ذلك في وظائف الإضافة
   - ستكتمل العمليات التي بدأت بالفعل
- **معالجة الصور الصغيرة في Markdown اختيارية:**
   - تتطلب بعض حالات الاستخدام تضمين جميع الصور الصغيرة
   - تتطلب حالات استخدام أخرى استبعادها
   - لا يمكن للإضافة توقع هدف المستخدم
   - يتم التحكم في هذا السلوك من خلال إعداد مستقل

## الترخيص

[ترخيص MIT](../../LICENSE)
