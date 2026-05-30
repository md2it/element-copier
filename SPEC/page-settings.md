# PAGE SETTINGS

---

## ОСНОВНЫЕ 

### Skip START page
- Toggler, default off

### Копирование по дефолту
- Заголовок "Copy default"
- Выпадающий список
- Поле позволяет выбрать из имеющихся форматов, что именно сохранять в буфер обмена при копировании
- Есть вариант "nothing", если выбран этот вариант. Этот вариант первый в списке, серый
- Дефолтный "Text"

### Inline изображения
- Заголовок "Inline images in text"
- Выпадающий список
- Варианты:
   - Use all // default
   - Remove large // remove imgs over 2kb
   - Remove all
- Между заголовком и полем есть иконка lucide info. По нажатию выходит информационное окно:
   - Some images are stored inline within the page code itself. For example, Base64 (which is often used by Google and many other sites). Sometimes these images make the page very heavy. Even large inline images likely won't cause any problems. However, if the size of the resulting TEXT or MARKDOWN is important to you, use this setting.

---

## ЧИПСЫ ДЛЯ START
- Inline списки:
   - "Files:"
   - "Copy text:"
   - "Developer tools:"
- Чипсы с названиями форматов:
   - Включённые имеют зелёный цвет и жирный чёрный текст
   - Выключенные имеют серый цвет и обычный серый текст
   - Иконки на чипсах аналогичны тем, что пользователь увидит на странице SAVED
- По умолчанию:
   - Выключены: styles, XPath
   - Остальные включены

---

## ВËРСТКА

- Между блоками настроек разделительная черта
- Выпадающий список
   - В одну строку с лейблом
   - Если строка в поле не помещается, то частично обрезается