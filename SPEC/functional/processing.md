# ПРОЦЕССИНГ

Описание процессинга snapshot по запросу пользователя.

---

## СОКРАЩЕНИЯ ДОКУМЕНТА

ГОТ = уже готовые данные, которые мы не создаём сами, а просто берём из страницы через API браузера
ВКЭШ = сохраняется в кэш/буфер

---

## ПОСЛЕДОВАТЕЛЬНОСТЬ

1. Пользователь делает snapshot (клик по элементу, снимок всей страницы, хоткей)
2. Смотрятся настройки пользователя. Далее те форматы, которые выключены, не генерируются (пропускаем шаги ниже)
3. url // ГОТ ВКЭШ
4. outerHTML // ГОТ ВКЭШ
5. computedStyles // ГОТ ВКЭШ
6. selector
7. jsPath
8. xpath
9. fullXPath
10. styles
11. text
12. markdown
13. images // см. ### Images

### Images

**Один раз**, если включён png и/или jpeg (ветки 6 и/или 7 — только по включённым форматам):
1. clone node — обход и клонирование DOM
2. embed web font — fetch CSS/шрифтов
3. embed node — fetch картинок, инлайн CSS URL (самый тяжёлый шаг на сложных элементах)
4. foreignObject SVG
5. SVG → canvas — растеризация браузером
   - backgroundColor canvas: effective `background-color` с alpha > 0 (в т.ч. 0 < alpha < 1); иначе прозрачный — как для PNG сейчас (без JPEG-fallback `#ffffff`)
   - на клон перед рендером — effective background как для PNG сейчас: `background-color` с alpha > 0, либо непустые `background` / `background-image`

**Далее ветки PNG и JPEG отличаются** (без повторного domTo*):
6. PNG — `toDataURL('image/png')` с canvas шага 5
   - остальное поведение PNG без изменений (filter, fetch placeholder, …)
7. JPEG
   1. Фон заливки под снимок берётся из `computedStyles`, который уже есть в кэше (не из live DOM)
      - Если элемент непрозрачный `background-color` (alpha > 0) или непустые `background` / `background-image` — этот фон
      - иначе цепочка родителей, `documentElement` — первый подходящий
      - иначе белый #ffffff
   2. Композит на втором canvas: заливка фона → `drawImage` (canvas шага 5) → `toDataURL('image/jpeg', 0.92)`

---

## СВЯЗАННЫЕ СПЕЦИФИКАЦИИ

Эти спецификации не влияют на требования текущего документа. Читать только если это действительно нужно.

- В процессе формирования форматов, происходит пред-пост-обработка, частично описано в fr-cleanup.md, но в коде намного больше логики
- Потом форматы храним в кэше: fr-cache.md
- Форматы markdownFile и htmlFile не формируются в момент snapshot. Их генерируем из markdown и outerHTML:
   - Когда пользователь нажимает кнопку на странице COPIED: page-copied.md
   - Если это дефолтное действие: page-settings.md
