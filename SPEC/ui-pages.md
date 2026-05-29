# Pages

---

## Приветственное окно
- Cтандартное

### Header
- Стандартный, но адаптирован под данное расширение
- Используем только в приветственном окне

---

## Popup окна
Для всех:
- Открываются в системном popup под иконкой расширения
- Если курсор покинул окно более чем на 1 секунду, то окно пропадает:
   - Учесть, что в момент появления окно может быть не под курсором
   - Чтобы "увести" курсор с окна, сначала пользователь "наводит" на окно
- Содержат меню
- Заголовки:
   - Находятся сверху
   - Отцентрованы по горизонтали
   - Под заголовком разделительная черта

## Вертикальное меню popup окон
- Вёрстка:
   - Прямоугольник чуть темнее фона
   - Слева (даже RTL)
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

### START
- По центру окна большая синяя кнопка "START", закрывает окно, включает расширение в режим выделения
- Внизу страницы toggler "Skip START page", default off

### LANGUAGE
- Text: "TODO"

### SETTINGS
- Toggler "Skip START page", default off

### HISTORY
- Text: "TODO"

### SHORTCUTS
- To run / stop the extension: // bold line
   - 1. Press:  `Ctrl+Shift+X`
      On Mac: `Cmd+Shift+X`
   - 2. Release the keys // "Release" semi-bold
   - 3. Then press `C`
   - <небольшой отступ>
   - "The 3-step shortcut is not obvious." // серый
   - "But it is safer and avoids conflicts with other apps." // серый
- <разделительная черта>
- To stop: `Esc` // "To stop:" bold, `Esc` monospace
- <разделительная черта>

### ABOUT
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

### COPIED
- "Copied!". Крупный, зелёный, центрованный
- "Saved to your clipboard". Просто центрованный, обычный
- Эта страница не может быть вызвана из меню

## Пункты контекстного меню расширения
- Все имеющиеся окна (кроме START и SAVED) можно открыть через это меню
