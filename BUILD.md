# BUILD

## Архитектурный статус

- `extension/` — готовое расширение для `Load unpacked` и упаковки в AMO.
- Runtime-код самодостаточен: внешних CDN, npm-пакетов или файлов вне проекта расширение не требует.
- Переиспользуемые и vendor-модули скопированы в `src/lib/`; это локальный код проекта, а не ссылка на общий каталог.
- Dev-сборка использует только devDependencies (`esbuild`, `typescript`). В каталожном окружении скрипт также умеет использовать уже установленный общий toolchain как fallback.

## Dev-сборка

Из корня `browser-extensions/`:

```sh
cd element-copier && npm run build
```

Ожидаемый stdout содержит:

```text
build ok
```

## Публикационная сборка

Только по явному запросу:

```sh
cd element-copier && npm run dist
```

Архив создаётся в `PUBLICATION/`.
