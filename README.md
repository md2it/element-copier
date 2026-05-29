# AGENT

## Всегда
- Избегать оверинженеринга!
- Не коммитить без запроса
- Сборка после каждой итерации кода
   - Из корня `browser-extensions/`: `cd element-copier && npm run build` → stdout: `build ok`

## Если нет lib/node_modules
Из корня `browser-extensions/`: `cd lib && npm install`

## Сборка прод строго по запросу
Из корня `browser-extensions/`: `./lib/scripts/pack-extension.zsh element-copier` → `dist/` и `.zip` в `PUBLICATION/`
