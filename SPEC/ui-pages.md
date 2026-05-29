# Popup окна

## Для всех

- Открываются в системном popup под иконкой расширения
- Если курсор покинул окно более чем на 1 секунду, то окно пропадает:
  - Учесть, что в момент появления окно может быть не под курсором
  - Чтобы "увести" курсор с окна, сначала пользователь "наводит" на окно
- Содержат меню
- Заголовки:
  - Находятся сверху
  - Отцентрованы по горизонтали
  - Под заголовком разделительная черта

## START
- По центру окна большая синяя кнопка "START", закрывает окно, включает расширение в режим выделения
- Внизу страницы toggler "Skip START page", default off

## LANGUAGE
- Text: "TODO"

## SETTINGS
- Блок основных настроек:
   - Toggler "Skip START page", default off
   - Настройка копирования по дефолту:
      - Заголовок "Copy default"
      - Выпадающий список в одну строку с заголовком
      - Если строка в поле не помещается, то частично обрезается
      - Поле позволяет выбрать из имеющихся форматов, что именно сохранять в буфер обмена при копировании
      - Есть вариант "nothing", если выбран этот вариант. Этот вариант первый в списке, серый
- Блок вариантов сохранения и копирования:
   - Inline
   - Заголовок "COPIED page options"
   - Чипсы с названиями форматов:
      - Включённые имеют зелёный цвет и жирный чёрный текст
      - Выключенные имеют серый цвет и обычный серый текст
      - Иконки на чипсах аналогичны тем, что пользователь увидит на странице SAVED
   - По умолчанию включены все
- Между всеми блоками настроек разделительная черта

## HISTORY
- Text: "TODO"

## SHORTCUTS
- To run / stop the extension: // bold line
  - 1. Press:  `Ctrl+Shift+X`
    n Mac: `Cmd+Shift+X`
  - 1. Release the keys // "Release" semi-bold
  - 1. Then press `C`
  - [небольшой отступ]
  - "The 3-step shortcut is not obvious." // серый
  - "But it is safer and avoids conflicts with other apps." // серый
- [разделительная черта]
- To stop: `Esc` // "To stop:" bold, `Esc` monospace
- [разделительная черта]

## ABOUT
-  On/Off with one click
-  On/Off with shortcuts
-  Copy to clipboard
-  Doesn't use the network
-  Doesn't collect data
- Минифутер внизу:
  - [разделительная черта]
  - "Element-Copier"
  - "© Alex T" // "Alex T" = ссылка на [https://www.linkedin.com/in/alex-terekhov/](https://www.linkedin.com/in/alex-terekhov/) , underline
  - Текст, включая ссылку серый, центрирован

## COPIED
Описано в fr-copy.md
