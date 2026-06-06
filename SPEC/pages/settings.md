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
   - Use all
   - Remove large // remove imgs over 2kb
   - Remove small // remove imgs less 2kb // default
   - Remove all
- Рядом с лейблом есть иконка lucide info. По нажатию выходит информационное окно:
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

## Togglers

### Generate images
- Default on
- Рядом с лейблом есть иконка lucide info. По нажатию выходит информационное окно:
   - On large pages, images take a lot of time to generate. If you don't need them, turn them off to run way faster.
- Если в "Default action" было выбрано одно из этих действий, то при выключении генерации изображений происходит сброс "Default action" к дефолту
- Если пользователь в "Default action" выбирает пункты из подсписка, то текущий toggler включается принудительно:
   - Copy Image
   - Download PNG
   - Download JPEG

### Display developer tools
- Default on
- Если off, то скрывает из страницы COPIED соответствующий блок кнопок

### Dark theme
- Default off
