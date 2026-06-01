# PAGE SETTINGS

---

## Настройка языка
- Простые кнопки: EN | ES | FR | DE | RU | 中文 | عربي
- Блок контента: именно этот список не меняет ориентацию при смене LTR / RTL

---

## Выпадающие списки

### Дефолтное действие
- Заголовок "Default action"
- Поле позволяет выбрать из имеющихся форматов:
   - NOTHING // Этот вариант первый в списке, серый
   - Copy Text // дефолтный
   - Copy Markdown
   - Copy Image
   - Download Markdown
   - Download HTML
   - Download PNG
   - Download JPEG
   - Copy code
   - Copy selector
   - Copy JS path
   - Copy XPath
   - Copy full XPath
   - Copy styles
   - Copy computed styles

### Inline изображения
- Заголовок "Inline images in text"
- Варианты:
   - Use all // default
   - Remove large // remove imgs over 2kb
   - Remove small // remove imgs less 2kb
   - Remove all
- Между заголовком и полем есть иконка lucide info. По нажатию выходит информационное окно:
   - Some pages embed images in the HTML as Base64 (common on Google and similar sites). This can slow copying and bloat Text or Markdown output. Small images are often icons or buttons that add clutter. Use this setting to control what is included.

### Стиль подписи выделения
- Заголовок "On the frame"
- Варианты:
   - "No title"
   - "click to copy" // просто строка, локализованная, значение поля по дефолту
   - "tag id class"
   - "selector"
   - "full XPath"

---

## Turn formats on off

- Togglers
- По умолчанию все On
- Есть строка "Turn off to reduce processing time:"
- Список:
   - Generate images
      - Выключает три формата: IMG to clipboard, скачивание JPEG, PMG
   - Generate markdown
      - Выключает оба markdown: и текст, и файл
   - Compute text

---

## Togglers for developers

### Developer tools
- Default on
- Если off, то скрывает из страницы COPIED соответствующий блок кнопок

### Dark theme
- Default off
