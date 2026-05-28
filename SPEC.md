# SPECIFICATION RU: ELEMENT COPIER

> [!IMPORTANT] Учитываем общие правила тоже lib/README.md

---

## ОПИСАНИЕ

- Браузерное расширение
- Копировать или сохранить необходимую информацию в буфер обмена или файл за минимум кликов

### Особенности
- Raw, текст, выбранная нотация
- Форма выделения идеально повторяет контур элемента
- Минимум кликов
- Очень легковесное
- Красивое
- Простые достаточные настройки

### Приватность и безопасность
- Расширение не использует сеть
- Расширение не передаёт данные о вас и странице

## РАЗРЕШЕНИЯ БРАУЗЕРА
- Заполнять по мере появления в манифесте

## ПОЛЬЗОВАТЕЛЬСКИЙ ПУТЬ

U = user, E = extension

### Основной пользовательский путь
1. U запускает E
2. E открывает окно START
3. U (опциональный шаг) производит в окне START любое или все дейстия:
   - применяет настройки
   - скрывает окно
4. U наводит на элемент
5. E подсвечивает элемент
6. U нажимает на элемент
7. E все:
   - Сохраняет данные согласно настройкам
   - Открывает окно с пояснением
   - Выключает режим выделения элемента

### Пользовательский путь "История"
1. U запускает E
2. E открывает окно START
3. U переходит в историю и выполняет любые действия:
   - Копировать запись в истории в любом доступном формате
   - Удалить запись из истории
   - Очистить историю
   - Выключить/включить историю
   - Настроить автоудаление

---

## ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### Включение и выключение режима выделения
**Запуск:**
- По хоткею
- Если "Skip START page":
   - OFF: По нажатию кнопки "START" из popup страницы START
   - ON: По нажатию на иконку расширения в панели браузера
**Завершение:**
- По повторному нажатию на иконку расширения в панели браузера
- По хоткею (два варианта хоткеев)
- По клику на элемент (при этом происходит копирование)
- При переходе со страницы START на другие страницы расширения
**Учитывать:**
- На системных страницах и на некоторых сайтах расширения не работают. У нас есть стандартный обработчик таких ситуаций

### Выделение
- Работает когда расширение запущено
- Не работает, когда расширение не запущено
- Использует стандартное выделение элемента под кусором с инъекцией в DOM

### Открытие окна (popup)
- Строго под иконкой в панели браузера

### Хоткеи
- Префикс-режим:
   - Default `Ctrl+Shift+X` → `C`
   - Mac `Cmd+Shift+X` → `C`
   - Правила обработки хоткея и badge стандартные
- Простой:
   - `Esc` — выкл режима копирования
   - Только когда расширение активно на странице
   - Без `suggested_key` в манифесте (content-слушатель)

### Копирование в один клик
- Копирование происходит в момент нажатия на элемент
- Когда произошло копирование, то:
   - Расширение выключается
   - Появляется окно "Saved"
- На данный момент копируем в буфер обмена

### История копирования
- TODO сделаем позже

---

## UX UI ТРЕБОВАНИЯ

### Ключевой цвет приложения
- #012292

### Иконка расширения
- lucide files, #fff
- Фон #012292

### Badge
- Badge логика стандартная
- Варианты текста badge:
   - C
      - Ожидает завершения "префикс режим"
      - Фон белый, цвет синий
   - ◉
      - В режиме выделения и копирования
      - Цвет фона синий
      - Цвет текст анимирован через состояния:
         - Опорные цвета: белый, синий
         - Количество шагов: 40
         - Время шага: 25ms
   - ✓
      - Только пока открыта страница SAVED
      - Фон зелёный, цвет белый
   - ✕
      - Только пока показывается уведомление о невозможности работы на странице
      - Фон светло серый, цвет тёмно серый
- В иных случаях badge нет

### Пункты контекстного меню расширения
- Все имеющиеся окна (кроме START и SAVED) можно открыть через это меню

### Header
- Стандартный, но адаптирован под данное расширение
- Используем только в приветственном окне

### Приветственное окно
- Cтандартное

### Вертикальное меню
- Вёрстка:
   - Прямоугольник чуть темнее фона
   - Слева
   - Заполянет материнский элементе по высоте
   - Слева, сверху и снизу отступ 2 мм
- Пункты меню:
   - Без подписей, только lucide иконки
   - Список:
      - files // START
      - globe // LANGUAGE
      - settings // SETTINGS
      - history // HISTORY
      - keyboard // SHORTCUTS
      - info // ABOUT
   - Tooltip на каждом пункте меню без задержек. Текст tooltip совпадает с названием страницы
   - Отступы между элементами равны
   - Отступы от гарниц самого элемента меню равны

### Popup окна
- Для всех:
   - Открываются в системном popup под иконкой расширения
   - Если курсор покинул окно более чем на 1 секунду, то окно пропадает:
      - Учесть, что в момент появления окно может быть не под курсором
      - Чтобы "увести" курсор с окна, сначала пользователь "наводит" на окно
   - Содержат меню
   - Заголовки:
      - Находятся сверху
      - Отцентрованы по горизонтали
      - Под заголовком разделительная черта
- *START*
   - По центру окна большая синяя кнопка "START", закрывает окно, включает расширение в режим выделения
   - Внизу страницы toggler "Skip START page", default off
- *LANGUAGE*
   - Text: "TODO"
- *SETTINGS*
   - Toggler "Skip START page", default off
- *HISTORY*
   - Text: "TODO"
- *SHORTCUTS*
   - To run / stop the extension: // bold line
      - 1. Press:  `Ctrl+Shift+X`
         On Mac: `Cmd+Shift+X`
      - 2. Release the keys // "Release" semi-bold
      - 3. Then press `D`
      - <небольшой отступ>
      - "The 3-step shortcut is not obvious." // серый
      - "But it is safer and avoids conflicts with other apps." // серый
   - <разделительная черта>
   - To stop: `Esc` // "To stop:" bold, `Esc` monospace
   - <разделительная черта>
- *ABOUT*
   - <circle-power> On/Off with one click
   - <keyboard> On/Off with shortcuts
   - <files> Copy to clipboard
   - <shield-check> Doesn't use the network
   - <shield-check> Doesn't collect data
   - Минифутер внизу:
      - <разделительная черта>
      - "Element-Copier"
      - "© Alex T" // "Alex T" = ссылка на https://www.linkedin.com/in/alex-terekhov/ , underline
      - Текст, включая ссылку серый, центрирован
- *COPIED*
   - "Copied!". Крупный, зелёный, центрованный
   - "Saved to your clipboard". Просто центрованный, обычный
   - Эта страница не может быть вызвана из меню

---

## ЧЕРНОВИК

### Different
- Save whole page
- History
- meta: weight, symbols, history

### Raw data about the DOM element
> При необходимости, можно посмотреть как реализован аналог https://github.com/viren-vii/quick-dom , мы должны сделать не хуже
- 🟢 element = outerHTML -- content script в том же frame, без доп. permissions; `element.outerHTML`
- 🟡 selector -- content script в том же frame, без доп. permissions; в DOM не хранится, генерируется
  - обход вверх по `parentElement`, сборка `#id` / `[attr]` / `tag:nth-of-type`, проверка `querySelectorAll(sel).length === 1`
  - библиотека-генератор уникального CSS-селектора
- 🟡 JS path -- content script в том же frame, без доп. permissions; в DOM не хранится, собирается строкой
  - `document.querySelector(...)` после готового селектора
  - цепочка `document.body.children[i].…` по индексам среди siblings
- 🟢🟡🔴 styles -- content script в том же frame, без доп. permissions
  - 🟢 inline: `element.style`, `getAttribute('style')`
  - 🟡 computed (итоговый вид): `getComputedStyle(element)`; псевдоэлементы — второй аргумент `'::before'` / `'::after'`
  - 🔴 matched rules с текстом из cross-origin stylesheet — браузер ограничивает доступ к правилам
- 🟡 XPath -- content script в том же frame, без доп. permissions; в DOM не хранится
  - генерация от якоря (`@id`, стабильный `@data-*`) или `tag[n]` среди siblings
  - проверка: `document.evaluate(xpath, context, null, FIRST_ORDERED_NODE_TYPE, null).singleNodeValue === element`
- 🟡 full XPath -- content script в том же frame, без доп. permissions; абсолютный путь от `/html`
  - от `document.documentElement` вниз: `/html/body/div[2]/span[1]` по позициям среди одноимённых siblings
  - та же `document.evaluate` для проверки

### Convert to file from the DOM element
> [!TASK-2]
> Каждую строку отформатировать:
> `- 🟢🟡🔴 str -- requred permissions, possible solutions`
> Если вариантов "possible solutions" много, то подпунктами
- 🟢🟡 Word / Google-words formated text
  - 🟢 html-to-docx
  - 🟡 outerHTML → Clipboard API (`text/html`) — вставка в Word и Google Docs без файла
- 🟢 markdown formated text
  - Turndown
  - node-html-markdown

### Generate and save files from DOM element
> [!TASK-3]
> Каждую строку отформатировать:
> `- 🟢🟡🔴 str -- requred permissions, possible solutions`
> Если вариантов "possible solutions" много, то подпунктами
- 🟢 Word
  - html-to-docx
  - файл: `Blob` → `URL.createObjectURL` → `<a download>` в content script
- 🟢 markdown
  - Turndown
  - файл: `Blob` (`text/markdown`) → тот же download в content script
- 🟢🟡 PDF
  - 🟢 html2pdf.js, jsPDF + html2canvas
  - 🟡 файл: `Blob` (`application/pdf`) → download в content script; слабая поддержка сложного CSS
  - 🟡 рендер из service worker — offscreen document или message в content script
- 🟢 JPG
  - html2canvas, modern-screenshot
  - файл: `canvas.toBlob('image/jpeg')` → download в content script
- 🟢 PNG
  - html2canvas, modern-screenshot
  - файл: `canvas.toBlob('image/png')` → download в content script
