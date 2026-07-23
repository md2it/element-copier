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
=-=-=-=-=-=-=-=-= | <a href="./DE.md">DE</a> | <a href="../../README.md">EN</a> | <a href="./ES.md">ES</a> | <a href="./FR.md">FR</a> | RU | <a href="./ZH.md">中文</a> | <a href="./AR.md">عربي</a> | =-=-=-=-=-=-=-=-=
</p>

## ОПИСАНИЕ

Копируйте и скачивайте всю страницу или её элементы как форматированный текст, изображения и Markdown.

Для разработчиков и тестировщиков: URL, HTML-код, tag#id.class, CSS-селекторы, JS path, XPath и полный XPath, объявленные и вычисленные стили, а также данные для баг-репортов.

<p align="center" id="screenshots">
  <a href="../publication/screenshots/RU-0.png"><img src="../publication/screenshots/RU-0.png" width="180" alt="Element Copier screenshot 1"></a>
  <a href="../publication/screenshots/RU-1.png"><img src="../publication/screenshots/RU-1.png" width="180" alt="Element Copier screenshot 2"></a>
  <a href="../publication/screenshots/RU-2.png"><img src="../publication/screenshots/RU-2.png" width="180" alt="Element Copier screenshot 3"></a>
</p>

## КЛЮЧЕВЫЕ ВОЗМОЖНОСТИ

- Копирование всей страницы или отдельного элемента
- Преобразование содержимого сразу в несколько форматов
- Хранение последнего скопированного содержимого для всех включённых форматов
- Копирование в буфер обмена или скачивание в виде файла
- Настраиваемое действие по умолчанию для ускорения повторных операций
- Горячие клавиши
- Светлая и тёмная темы
- Гибкие настройки
- Интерфейс доступен на английском, французском, немецком, испанском, русском, арабском и упрощённом китайском языках

### Поддерживаемые форматы

- Форматированный текст для вставки в Google Docs и Word
- Изображения:
   - PNG
   - JPEG
- Markdown
- HTML
- Форматы для разработки и тестирования:
   - Tag#id.class
   - Селектор
   - JS path
   - XPath
   - Full XPath
   - Объявленные стили
   - Вычисленные стили
   - QA details для баг-репортов

### Примечания о продукте

- Форматирование текста рассчитано на лучший результат, чем обычное копирование и вставка
- Горячие клавиши и действие по умолчанию сокращают число шагов при повторном копировании
- Форматы для разработчиков предоставляют часто используемые данные без открытия DevTools
- Обработка Markdown по возможности сохраняет структуру, ссылки и изображения, включая преобразованные SVG

## КОНФИДЕНЦИАЛЬНОСТЬ

- Данные не собираются
- Отслеживание отсутствует
- Сетевые запросы отсутствуют
- Содержимое страницы обрабатывается локально в браузере

## ОГРАНИЧЕНИЯ

- **Выбор iframe отличается** от выбора других элементов:
   - Iframe выбирается целиком
   - Причина — ограничение платформы; внедрение внутрь iframe считается нежелательным
   - Выделение выглядит иначе из-за других обработчиков событий, но это не влияет на функции
- **Обработка больших страниц может занять некоторое время:**
   - Скорость ограничена сторонними библиотеками, которые используются без изменений
   - Создание и сохранение изображений можно отключить в настройках
   - Без обработки изображений даже очень большие страницы обрабатываются за доли секунды
- **Открытие окна результата может быть прервано:**
   - Браузер может открыть другое окно с более высоким приоритетом
   - Уже запущенные процессы всё равно будут завершены
- **Обработка небольших изображений в Markdown настраивается отдельно:**
   - В одних сценариях их нужно включать, в других — исключать
   - Поведение управляется отдельной настройкой

## ЛИЦЕНЗИЯ

[Лицензия MIT](../../LICENSE)
