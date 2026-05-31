# ЗАДАЧА ДЛЯ УЛУЧШЕНИЯ ОБРАБОТКИ SVG

## Текущая ситуация
- Мы уже преобразуем SVG в inline-image для лучшего отображения в форматах text/html и markdown
- Для части SVG файлов всё происходит успешно и изображение верно отображается
- Для части SVG результат:
   - В markdown выглядит как строка, а не изображение
   - В текстовых редакторах теряется (отображается как серый квадрат)
- Я даже не уверен, откуда эти псевдо-изображения берутся

## Цель
- Изображения SVG должны преобразовываться так, чтобы они потом верно отображались
- Нет мусора

## Acceptance criteria
- Все изображения из `copied-www-google-com-div.html` корректно читаются в `copied-www-google-com-div.md`
- Нет ни одного изображения в `copied-www-google-com-div.md`, которое выглядит как строка
- Для визуальной проверки человек использует:
   - https://github.com/md-reader/md-reader
   - https://docs.google.com/document/

## Дополнительная информация
Здесь явно отмечаю примеры, которые отображается корректно (✅), а что некорректно (🔴)
- ✅ Atrial septal defect - Wikipedia // id="dimg_eqUcaoyXMoSci-gPhZTn0Qc_1"
- ✅ Wikipedia // id="tsuid_eqUcaoyXMoSci-gPhZTn0Qc_52"
- 🔴 Не ясно, откуда берётся в `copied-www-google-com-div.md`
   - ![image](data:image/svg+xml;charset=utf-8,%3Csvg%20focusable%3D%22false%22%20aria-hidden%3D%22true%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M12%208c1.1%200%202-.9%202-2s-.9-2-2-2-2%20.9-2%202%20.9%202%202%202zm0%202c-1.1%200-2%20.9-2%202s.9%202%202%202%202-.9%202-2-.9-2-2-2zm0%206c-1.1%200-2%20.9-2%202s.9%202%202%202%202-.9%202-2-.9-2-2-2z%22%2F%3E%3C%2Fsvg%3E)
- ✅ What Is Autism Spectrum Disorder (ASD)? - Autism Support // id="dimg_eqUcaoyXMoSci-gPhZTn0Qc_5"
