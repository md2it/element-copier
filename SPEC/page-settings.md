# PAGE SETTINGS

---

## Skip START page
- Toggler, default off

## Developer tools
- Toggler, default on
- Если off, то скрывает из страницы COPIED соответствующий блок кнопок

## Копирование по дефолту
- Заголовок "Copy default"
- Выпадающий список
- Поле позволяет выбрать из имеющихся форматов, что именно сохранять в буфер обмена при копировании
- Есть вариант "nothing", если выбран этот вариант. Этот вариант первый в списке, серый
- Дефолтный "Text"

## Inline изображения
- Заголовок "Inline images in text"
- Выпадающий список
- Варианты:
   - Use all // default
   - Remove large // remove imgs over 2kb
   - Remove all
- Между заголовком и полем есть иконка lucide info. По нажатию выходит информационное окно:
   - Some images are stored inline within the page code itself. For example, Base64 (which is often used by Google and many other sites). Sometimes these images make the page very heavy. Even large inline images likely won't cause any problems. However, if the size of the resulting TEXT or MARKDOWN is important to you, use this setting.
