# AGENT

## Всегда
- Избегать оверинженеринга!
- Не коммитить без запроса
- Рабочее расширение для браузера: `element-copier/extension/`
- После правок кода сборка Dev: из корня `browser-extensions/` / `cd element-copier && npm run build` → stdout: `build ok`

## Архитектура
- `extension/` — самодостаточное расширение для Load unpacked / AMO
- `src/` — TypeScript-исходники приложения
- `src/lib/` — локальная копия переиспользуемых модулей и vendor-кода для сборки

## Сборка прод строго по запросу
Из корня `browser-extensions/`: `cd element-copier && npm run dist` → `.zip` в `PUBLICATION/`
