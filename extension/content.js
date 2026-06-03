"use strict";
(() => {
  // src/lib/our/api.ts
  var ext = typeof browser !== "undefined" ? browser : chrome;

  // src/hotkeys/commands.ts
  var PREFIX_ACTION_KEY = "C";

  // src/lib/our/hotkeys/prefix-hint-messages.ts
  var PREFIX_HINT_SHOW = "PREFIX_HINT_SHOW";
  var PREFIX_HINT_HIDE = "PREFIX_HINT_HIDE";
  var PREFIX_HINT_CAN_SHOW = "PREFIX_HINT_CAN_SHOW";
  var PREFIX_HINT_BLOCKED = "PREFIX_HINT_BLOCKED";

  // src/lib/our/hotkeys/prefix-hint-content.ts
  function createContentPrefixHintSink() {
    return {
      show(letter) {
        void ext.runtime.sendMessage({ type: PREFIX_HINT_SHOW, letter }).catch(() => {
        });
      },
      hide() {
        void ext.runtime.sendMessage({ type: PREFIX_HINT_HIDE }).catch(() => {
        });
      }
    };
  }

  // src/lib/our/hotkeys/platform.ts
  function isMacPlatform() {
    return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.platform.toUpperCase().includes("MAC");
  }

  // src/lib/our/hotkeys/keys.ts
  var PREFIX_ACTION_TIMEOUT_MS = 3e3;
  var PREFIX_DOUBLE_ACTION_WINDOW_MS = 400;
  var PREFIX_CHORD_KEY = "x";
  function isEscapeKeyEvent(e) {
    return e.key === "Escape";
  }
  function letterToCode(letter) {
    return `Key${letter.toUpperCase()}`;
  }
  function isLetterKeyEvent(e, letter) {
    const expectedCode = letterToCode(letter);
    if (typeof e.code === "string" && e.code.length > 0) {
      return e.code === expectedCode;
    }
    return e.key.toLowerCase() === letter.toLowerCase();
  }
  function isModifierShiftKeyEvent(e, key, mac = isMacPlatform()) {
    const modifier = mac ? e.metaKey : e.ctrlKey;
    return modifier && e.shiftKey && isLetterKeyEvent(e, key);
  }
  function isPrefixChordKeyEvent(e, mac = isMacPlatform()) {
    return isModifierShiftKeyEvent(e, PREFIX_CHORD_KEY, mac);
  }
  function isPrefixChordHeld(e, mac = isMacPlatform()) {
    const modifier = mac ? e.metaKey : e.ctrlKey;
    return modifier && e.shiftKey;
  }
  function isPrefixActionKeyEvent(e, key) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    return isLetterKeyEvent(e, key);
  }

  // src/lib/our/hotkeys/prefix-mode.ts
  function createPrefixModeController(options) {
    let armed = false;
    let timeoutId;
    let singleActionTimeoutId;
    let chordHeld = false;
    let awaitingRelease = false;
    let firstActionPressAt = 0;
    const doubleActionWindowMs = options.doubleActionWindowMs ?? PREFIX_DOUBLE_ACTION_WINDOW_MS;
    const clearTimeoutIfAny = () => {
      if (timeoutId !== void 0) {
        clearTimeout(timeoutId);
        timeoutId = void 0;
      }
    };
    const clearSingleActionTimeout = () => {
      if (singleActionTimeoutId !== void 0) {
        clearTimeout(singleActionTimeoutId);
        singleActionTimeoutId = void 0;
      }
    };
    const disarm = () => {
      armed = false;
      awaitingRelease = false;
      chordHeld = false;
      firstActionPressAt = 0;
      clearTimeoutIfAny();
      clearSingleActionTimeout();
      options.hint.hide();
    };
    const canOperateOnPage = async () => !options.canShowPrefixHint || await options.canShowPrefixHint();
    const tryArmAfterPrefixRelease = () => {
      void (async () => {
        if (!await options.isEnabled()) {
          options.hint.hide();
          return;
        }
        if (!await canOperateOnPage()) {
          options.hint.hide();
          return;
        }
        arm(options.hintLetter);
      })();
    };
    const arm = (letter) => {
      clearTimeoutIfAny();
      armed = true;
      options.hint.show(letter);
      timeoutId = setTimeout(() => {
        disarm();
      }, PREFIX_ACTION_TIMEOUT_MS);
    };
    const onPrefixChordKeyDown = (e) => {
      if (!isPrefixChordKeyEvent(e)) return;
      chordHeld = true;
    };
    const onPrefixChordKeyUp = (e) => {
      if (!chordHeld && !awaitingRelease) return;
      if (isPrefixChordHeld(e)) return;
      chordHeld = false;
      awaitingRelease = false;
      clearTimeoutIfAny();
      tryArmAfterPrefixRelease();
    };
    const prepareAwaitAction = (_letter = options.hintLetter) => {
      clearTimeoutIfAny();
      armed = false;
      chordHeld = false;
      awaitingRelease = false;
      tryArmAfterPrefixRelease();
    };
    const fireSingleAction = () => {
      clearSingleActionTimeout();
      firstActionPressAt = 0;
      disarm();
      options.onAction();
    };
    const fireDoubleAction = () => {
      clearSingleActionTimeout();
      firstActionPressAt = 0;
      disarm();
      options.onDoubleAction?.();
    };
    const onPrefixActionKeyDown = (e) => {
      if (!isPrefixActionKeyEvent(e, options.hintLetter)) return;
      if (e.repeat) return;
      void (async () => {
        if (!await options.isEnabled()) return;
        const canOperate = await canOperateOnPage();
        if (!armed) {
          if (!canOperate) {
            e.preventDefault();
            e.stopPropagation();
            options.hint.hide();
            options.onPrefixHintBlocked?.();
          }
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (!canOperate) {
          disarm();
          options.onPrefixHintBlocked?.();
          return;
        }
        if (!options.onDoubleAction) {
          disarm();
          options.onAction();
          return;
        }
        const now = Date.now();
        if (firstActionPressAt > 0 && now - firstActionPressAt < doubleActionWindowMs) {
          fireDoubleAction();
          return;
        }
        firstActionPressAt = now;
        clearSingleActionTimeout();
        clearTimeoutIfAny();
        timeoutId = setTimeout(() => {
          disarm();
        }, PREFIX_ACTION_TIMEOUT_MS);
        singleActionTimeoutId = setTimeout(() => {
          singleActionTimeoutId = void 0;
          if (!armed) return;
          fireSingleAction();
        }, doubleActionWindowMs);
      })();
    };
    return {
      onPrefixChordKeyDown,
      onPrefixChordKeyUp,
      onPrefixActionKeyDown,
      prepareAwaitAction,
      arm,
      disarm
    };
  }

  // src/lib/our/hotkeys/registry.ts
  function handlerPropertyKey(namespace, slot) {
    return `__${namespace}HotkeyHandler_${slot}`;
  }
  function registerContentHotkey(namespace, slot, handler) {
    const win = window;
    const key = handlerPropertyKey(namespace, slot);
    const prev = win[key];
    if (prev) {
      window.removeEventListener("keydown", prev, true);
    }
    win[key] = handler;
    window.addEventListener("keydown", handler, true);
  }
  function unregisterContentHotkey(namespace, slot) {
    const win = window;
    const key = handlerPropertyKey(namespace, slot);
    const prev = win[key];
    if (!prev) return;
    window.removeEventListener("keydown", prev, true);
    win[key] = void 0;
  }

  // src/lib/our/hotkeys/prefix-content.ts
  function registerPrefixStartHotkey(options) {
    if (typeof window === "undefined" || window.top !== window) return void 0;
    const controller = createPrefixModeController({
      hintLetter: options.hintLetter,
      hint: createContentPrefixHintSink(),
      isEnabled: options.isEnabled,
      canShowPrefixHint: options.canShowPrefixHint,
      onPrefixHintBlocked: options.onPrefixHintBlocked,
      onAction: options.onAction,
      onDoubleAction: options.onDoubleAction,
      doubleActionWindowMs: options.doubleActionWindowMs
    });
    registerContentHotkey(options.namespace, "prefix-chord", (e) => {
      controller.onPrefixChordKeyDown(e);
    });
    const onKeyUp = (e) => {
      controller.onPrefixChordKeyUp(e);
    };
    const win = window;
    const keyUpProp = `__${options.namespace}_prefixKeyUp`;
    const prev = win[keyUpProp];
    if (prev) window.removeEventListener("keyup", prev, true);
    win[keyUpProp] = onKeyUp;
    window.addEventListener("keyup", onKeyUp, true);
    registerContentHotkey(options.namespace, "prefix-action", (e) => {
      controller.onPrefixActionKeyDown(e);
    });
    return controller;
  }

  // src/lib/our/page-operability/probe.ts
  function probeDocumentOperability() {
    try {
      const root2 = document.documentElement ?? document.body;
      if (!root2) return false;
      const probe = document.createElement("div");
      probe.style.display = "none";
      root2.appendChild(probe);
      const ok = probe.isConnected;
      probe.remove();
      return ok;
    } catch {
      return false;
    }
  }

  // src/lib/our/hotkeys/prefix-operability.ts
  async function queryPrefixHintCanShowFromBackground() {
    try {
      return await ext.runtime.sendMessage({ type: PREFIX_HINT_CAN_SHOW }) === true;
    } catch {
      return false;
    }
  }
  function notifyPrefixHintBlockedOnBackground() {
    void ext.runtime.sendMessage({ type: PREFIX_HINT_BLOCKED }).catch(() => {
    });
  }

  // src/lib/our/hotkeys/suppress.ts
  var DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS = 300;
  function shouldSuppressContentToggleAfterToggleCommand(lastAt, now, windowMs = DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS) {
    return lastAt > 0 && now - lastAt < windowMs;
  }
  function createToggleCommandSuppressTracker(windowMs = DEFAULT_TOGGLE_COMMAND_SUPPRESS_MS) {
    let lastToggleCommandAt = 0;
    return {
      stampToggleCommand: () => {
        lastToggleCommandAt = Date.now();
      },
      shouldSuppressContentToggle: (now = Date.now()) => shouldSuppressContentToggleAfterToggleCommand(
        lastToggleCommandAt,
        now,
        windowMs
      ),
      shouldSuppressToolbarClick: (now = Date.now()) => shouldSuppressContentToggleAfterToggleCommand(
        lastToggleCommandAt,
        now,
        windowMs
      )
    };
  }

  // src/lib/our/hotkeys/settings.ts
  function readBooleanSetting(data, key) {
    const raw = data[key];
    return raw !== false;
  }

  // src/brand.ts
  var PANEL_TITLE = "ELEMENT COPIER";

  // src/messages.ts
  function sendToBackground(msg) {
    void ext.runtime.sendMessage(msg).catch(() => {
    });
  }
  var LOCALE_STORAGE_KEY = "locale";
  var LOCALE_USER_SELECTED_KEY = "localeUserSelected";
  var START_HOTKEY_ENABLED_KEY = "startHotkeyEnabled";
  var ESC_HOTKEY_ENABLED_KEY = "escHotkeyEnabled";
  var ENABLED_FORMATS_KEY = "enabledFormats";
  var DEVELOPER_TOOLS_ENABLED_KEY = "developerToolsEnabled";
  var DARK_THEME_ENABLED_KEY = "darkThemeEnabled";
  var CLIPBOARD_DEFAULT_FORMAT_KEY = "clipboardDefaultFormat";
  var INLINE_IMAGES_KEY = "inlineImages";
  var FRAME_LABEL_STYLE_KEY = "frameLabelStyle";
  var COMPUTE_IMAGES_ENABLED_KEY = "computeImagesEnabled";

  // src/hotkeys/settings.ts
  async function getStartHotkeyEnabled() {
    const data = await ext.storage.local.get(START_HOTKEY_ENABLED_KEY);
    return readBooleanSetting(data, START_HOTKEY_ENABLED_KEY);
  }
  async function getEscHotkeyEnabled() {
    const data = await ext.storage.local.get(ESC_HOTKEY_ENABLED_KEY);
    return readBooleanSetting(data, ESC_HOTKEY_ENABLED_KEY);
  }

  // src/hotkeys/background.ts
  var toggleCommandSuppress = createToggleCommandSuppressTracker();

  // src/hotkeys/keys.ts
  var ABOUT_PREFIX_CHORD_WIN_DISPLAY = "Ctrl+Shift+X";
  var ABOUT_PREFIX_CHORD_MAC_DISPLAY = "Cmd+Shift+X";
  function getStartHotkeyActionLabel() {
    return PREFIX_ACTION_KEY.toUpperCase();
  }
  function isEscHotkeyEvent(e) {
    return isEscapeKeyEvent(e);
  }

  // src/hotkeys/registry.ts
  var HOTKEY_NAMESPACE = "elementCopier";
  function registerContentHotkey2(slot, handler) {
    registerContentHotkey(HOTKEY_NAMESPACE, slot, handler);
  }
  function unregisterContentHotkey2(slot) {
    unregisterContentHotkey(HOTKEY_NAMESPACE, slot);
  }

  // src/hotkeys/copier-content.ts
  var HOTKEY_NAMESPACE2 = "elementCopier";
  var contentHotkeysMounted = false;
  function registerCopierStartHotkey(requestToggle2, requestCopyPage2) {
    registerPrefixStartHotkey({
      namespace: HOTKEY_NAMESPACE2,
      hintLetter: PREFIX_ACTION_KEY,
      isEnabled: getStartHotkeyEnabled,
      canShowPrefixHint: queryPrefixHintCanShowFromBackground,
      onPrefixHintBlocked: notifyPrefixHintBlockedOnBackground,
      onAction: requestToggle2,
      onDoubleAction: requestCopyPage2
    });
  }
  function mountCopierContentHotkeys(host, slots = ["esc"]) {
    if (typeof window !== "undefined" && window.top !== window) return;
    if (contentHotkeysMounted) return;
    contentHotkeysMounted = true;
    if (slots.includes("esc")) {
      registerContentHotkey2("esc", (e) => {
        if (!isEscHotkeyEvent(e)) return;
        if (!host.isActive()) return;
        void (async () => {
          if (!await getEscHotkeyEnabled()) return;
          e.preventDefault();
          e.stopPropagation();
          host.deactivate();
        })();
      });
    }
  }
  function unmountCopierContentHotkeys(slots = ["esc"]) {
    if (!contentHotkeysMounted) return;
    contentHotkeysMounted = false;
    for (const slot of slots) {
      unregisterContentHotkey2(slot);
    }
  }

  // src/lib/our/page-operability/content-probe.ts
  var PROBE_DOCUMENT_OPERABILITY = "PROBE_DOCUMENT_OPERABILITY";
  function isProbeDocumentOperabilityMessage(message) {
    if (typeof message !== "object" || message === null) return false;
    return message.type === PROBE_DOCUMENT_OPERABILITY;
  }
  var probeListenerRegistered = false;
  function registerDocumentOperabilityProbeListener() {
    if (probeListenerRegistered) return;
    probeListenerRegistered = true;
    ext.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!isProbeDocumentOperabilityMessage(message)) return;
      sendResponse(probeDocumentOperability());
      return true;
    });
  }

  // src/lib/our/panel-popup/page-path.ts
  function getPanelPageUrl(pageHtml) {
    return ext.runtime.getURL(pageHtml);
  }
  function isPanelPage(href, pageHtml) {
    return href.startsWith(getPanelPageUrl(pageHtml));
  }

  // src/lib/our/panel-popup/resolve-tab.ts
  function resolveInitialPanelTab(sessionTab, queryTab, defaultTab, validTabs) {
    if (typeof sessionTab === "string" && validTabs.includes(sessionTab)) {
      return sessionTab;
    }
    if (typeof queryTab === "string" && validTabs.includes(queryTab)) {
      return queryTab;
    }
    return defaultTab;
  }
  async function resolvePanelPageInitialTab(config) {
    const { [config.sessionTabKey]: sessionTab } = await ext.storage.session.get(
      config.sessionTabKey
    );
    await ext.storage.session.remove(config.sessionTabKey);
    const tabParam = new URLSearchParams(location.search).get(
      config.tabQueryParam ?? "tab"
    );
    return resolveInitialPanelTab(sessionTab, tabParam, config.defaultTab, config.validTabs);
  }

  // src/lib/our/copy/formatted-text/accessible-text.ts
  function getElementAccessiblePlain(element) {
    const inner = ("innerText" in element ? element.innerText : element.textContent)?.trim() ?? "";
    if (inner) return inner;
    if (element instanceof HTMLImageElement) {
      return element.alt.trim();
    }
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.value.trim() || element.placeholder.trim();
    }
    const labeled = element.getAttribute("aria-label")?.trim() || element.getAttribute("title")?.trim();
    if (labeled) return labeled;
    const parts = [];
    const imgs = element.querySelectorAll("img[alt]");
    for (let i = 0; i < imgs.length; i += 1) {
      const alt = imgs[i].getAttribute("alt")?.trim();
      if (alt) parts.push(alt);
    }
    if (parts.length > 0) {
      return parts.join("\n");
    }
    return (element.textContent ?? "").trim();
  }

  // src/lib/our/copy/formatted-text/html-wrap.ts
  function wrapClipboardHtml(fragment) {
    if (!fragment) return "";
    return '<html><head><meta charset="utf-8"></head><body><!--StartFragment-->' + fragment + "<!--EndFragment--></body></html>";
  }

  // src/lib/our/copy/formatted-text/constants.ts
  var TABLE_STYLE = "border-collapse:collapse;border:1px solid #cccccc;";
  var TABLE_CELL_STYLE = "border:1px solid #cccccc;padding:2px 4px;vertical-align:top;";
  var INLINE_LIST_SEPARATOR = ", ";
  var LIST_TAGS = /* @__PURE__ */ new Set(["UL", "OL"]);

  // src/lib/our/copy/formatted-text/style-utils.ts
  function isInlineLikeDisplay(display) {
    return display === "inline" || display.startsWith("inline-") || display === "contents";
  }
  function mergeInlineStyle(element, extra) {
    const current = element.getAttribute("style")?.trim();
    element.setAttribute("style", current ? `${current};${extra}` : extra);
  }

  // src/lib/our/copy/formatted-text/lists.ts
  function collectListsInDocumentOrder(root2) {
    const lists = [];
    if (LIST_TAGS.has(root2.tagName)) {
      lists.push(root2);
    }
    lists.push(...root2.querySelectorAll("ul, ol"));
    return lists;
  }
  function isInlineLikeList(list, boundary) {
    if (isInlineLikeDisplay(getComputedStyle(list).display)) {
      return true;
    }
    for (let parent = list.parentElement; parent && parent !== boundary; parent = parent.parentElement) {
      if (isInlineLikeDisplay(getComputedStyle(parent).display)) {
        return true;
      }
    }
    const firstItem = list.querySelector(":scope > li");
    if (firstItem && getComputedStyle(firstItem).display !== "list-item") {
      return true;
    }
    return false;
  }
  function flattenInlineList(list) {
    const doc = list.ownerDocument;
    const items = [...list.querySelectorAll(":scope > li")];
    const span = doc.createElement("span");
    for (let i = 0; i < items.length; i++) {
      if (i > 0) {
        span.appendChild(doc.createTextNode(INLINE_LIST_SEPARATOR));
      }
      const item = items[i];
      while (item.firstChild) {
        span.appendChild(item.firstChild);
      }
    }
    list.replaceWith(span);
  }
  function enhanceInlineLists(originalRoot, clonedRoot) {
    const originalLists = collectListsInDocumentOrder(originalRoot);
    const clonedLists = collectListsInDocumentOrder(clonedRoot);
    const count = Math.min(originalLists.length, clonedLists.length);
    for (let i = count - 1; i >= 0; i--) {
      if (isInlineLikeList(originalLists[i], originalRoot)) {
        flattenInlineList(clonedLists[i]);
      }
    }
  }

  // src/lib/our/copy/formatted-text/tables.ts
  function enhanceClipboardTables(root2) {
    for (const table of root2.querySelectorAll("table")) {
      mergeInlineStyle(table, TABLE_STYLE);
      if (!table.hasAttribute("border")) {
        table.setAttribute("border", "1");
      }
      if (!table.hasAttribute("cellspacing")) {
        table.setAttribute("cellspacing", "0");
      }
      if (!table.hasAttribute("cellpadding")) {
        table.setAttribute("cellpadding", "4");
      }
      for (const cell of table.querySelectorAll("th, td")) {
        mergeInlineStyle(cell, TABLE_CELL_STYLE);
      }
    }
  }
  function normalizePlainCellText(text) {
    return text.replace(/\s+/g, " ").trim();
  }
  function tableElementToPlain(table) {
    const rows = [];
    for (const row of table.querySelectorAll("tr")) {
      const cells = [];
      for (const cell of row.querySelectorAll("th, td")) {
        const value = normalizePlainCellText(cell.textContent ?? "");
        if (value) cells.push(value);
      }
      if (cells.length > 0) {
        rows.push(cells.join("	"));
      }
    }
    return rows.join("\n");
  }

  // src/lib/our/copy/formatted-text/extract.ts
  function buildPlainTextClipboardHtml(doc, plain) {
    const wrapper = doc.createElement("div");
    wrapper.style.whiteSpace = "pre-wrap";
    wrapper.textContent = plain;
    return wrapClipboardHtml(wrapper.outerHTML);
  }
  function extractHtmlFromPreparedContainer(element, container) {
    enhanceInlineLists(element, container);
    enhanceClipboardTables(container);
    return wrapClipboardHtml(container.innerHTML.trim());
  }
  function finalizeFormattedHtml(element, html) {
    const resultHtml = html.trim();
    if (resultHtml) return resultHtml;
    const plain = getElementAccessiblePlain(element);
    if (!plain) return "";
    return buildPlainTextClipboardHtml(element.ownerDocument, plain);
  }

  // src/lib/our/copy/formatted-text/plain.ts
  var FRAGMENT_START = "<!--StartFragment-->";
  var FRAGMENT_END = "<!--EndFragment-->";
  var OFFSCREEN_MOUNT_STYLE = "position:fixed;left:-9999px;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
  function extractClipboardHtmlFragment(html) {
    const start = html.indexOf(FRAGMENT_START);
    if (start < 0) return html;
    const contentStart = start + FRAGMENT_START.length;
    const end = html.indexOf(FRAGMENT_END, contentStart);
    if (end < 0) return html.slice(contentStart);
    return html.slice(contentStart, end);
  }
  function normalizeDerivedPlain(text) {
    return text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function readPlainFromHtmlTree(root2, doc) {
    if (root2.isConnected) {
      return root2.innerText;
    }
    const mountParent = doc.body ?? doc.documentElement;
    if (!mountParent) {
      return root2.textContent ?? "";
    }
    root2.style.cssText = OFFSCREEN_MOUNT_STYLE;
    mountParent.appendChild(root2);
    try {
      return root2.innerText;
    } finally {
      root2.remove();
      root2.removeAttribute("style");
    }
  }
  function collectImgAltPlain(container) {
    const parts = [];
    for (const img of Array.from(container.querySelectorAll("img[alt]"))) {
      const alt = img.getAttribute("alt")?.trim();
      if (alt) parts.push(alt);
    }
    return parts.join("\n");
  }
  function hasNonWhitespaceTextInClipboardHtml(html, doc) {
    const fragment = extractClipboardHtmlFragment(html).trim();
    if (!fragment) return false;
    const container = doc.createElement("div");
    container.innerHTML = fragment;
    const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if ((node.textContent ?? "").trim()) return true;
      node = walker.nextNode();
    }
    if (container.querySelector("img[src]")) return true;
    return false;
  }
  function derivePlainFromClipboardHtml(html, doc) {
    const fragment = extractClipboardHtmlFragment(html).trim();
    if (!fragment) return "";
    const container = doc.createElement("div");
    container.innerHTML = fragment;
    const table = container.querySelector(":scope > table");
    if (table && container.children.length === 1) {
      const tsv = tableElementToPlain(table);
      if (tsv) return tsv;
    }
    const plain = readPlainFromHtmlTree(container, doc);
    if (plain.trim()) return normalizeDerivedPlain(plain);
    const fromAlts = collectImgAltPlain(container);
    if (fromAlts.trim()) return normalizeDerivedPlain(fromAlts);
    return "";
  }

  // src/lib/our/copy/formatted-text/cache.ts
  function serializeFormattedTextCache(payload) {
    return JSON.stringify(payload);
  }
  function parseFormattedTextCache(serialized) {
    try {
      const parsed = JSON.parse(serialized);
      if (typeof parsed === "object" && parsed !== null && typeof parsed.html === "string") {
        return { html: parsed.html };
      }
    } catch {
    }
    return null;
  }
  function isFormattedTextCacheStorable(serialized, doc) {
    const payload = parseFormattedTextCache(serialized);
    if (!payload?.html?.trim()) return false;
    if (!doc) return false;
    return hasNonWhitespaceTextInClipboardHtml(payload.html, doc);
  }

  // src/lib/our/copy/formatted-text/clipboard.ts
  function copyFormattedTextLegacy(html, plain) {
    const doc = document;
    const root2 = doc.documentElement ?? doc.body;
    if (!root2) return false;
    const onCopy = (event) => {
      event.preventDefault();
      event.clipboardData?.setData("text/plain", plain);
      event.clipboardData?.setData("text/html", html);
    };
    doc.addEventListener("copy", onCopy);
    const container = doc.createElement("div");
    container.setAttribute("contenteditable", "true");
    container.textContent = plain;
    container.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
    root2.appendChild(container);
    const range = doc.createRange();
    range.selectNodeContents(container);
    const selection = doc.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    let ok = false;
    try {
      ok = doc.execCommand("copy");
    } catch {
      ok = false;
    }
    selection?.removeAllRanges();
    container.remove();
    doc.removeEventListener("copy", onCopy);
    return ok;
  }
  async function copyFormattedTextToClipboard(payload) {
    const { html } = payload;
    if (!html) return false;
    const plain = derivePlainFromClipboardHtml(html, document).trim();
    if (!plain) return false;
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        const items = {
          "text/plain": new Blob([plain], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" })
        };
        await navigator.clipboard.write([new ClipboardItem(items)]);
        return true;
      }
    } catch {
    }
    return copyFormattedTextLegacy(html, plain);
  }

  // src/pick-mode/pick-copy-cache-storage.ts
  var PICK_COPY_CACHE_STORAGE_KEY = "pickCopyCache";
  var PICK_COPY_CACHE_INDEX_KEY = "pickCopyCacheFormats";
  var PICK_COPY_META_STORAGE_KEY = "pickCopyMeta";
  var pickCopyCachePresentSync = false;
  function applyPickCopyCachePresence(record, index) {
    pickCopyCachePresentSync = record !== void 0 && Object.keys(record).length > 0 || Array.isArray(index) && index.length > 0;
  }
  function resolvePickCopyCacheStorageKey(formatId) {
    if (formatId === "markdownFile") return "markdown";
    if (formatId === "htmlFile") return "outerHTML";
    return formatId;
  }
  function isPickCopyCacheValueStorable(formatId, value, doc) {
    if (formatId === "text") {
      return isFormattedTextCacheStorable(value, doc);
    }
    return value.trim() !== "";
  }
  function isPickCopyFormatAvailable(formatId, record, doc) {
    if (!record) return false;
    const value = record[resolvePickCopyCacheStorageKey(formatId)];
    if (value === void 0) return false;
    if (formatId === "text") {
      return isFormattedTextCacheStorable(value, doc);
    }
    return true;
  }
  async function readPickCopyCacheFromStorage() {
    const data = await ext.storage.local.get(PICK_COPY_CACHE_STORAGE_KEY);
    const record = data[PICK_COPY_CACHE_STORAGE_KEY];
    if (!record || typeof record !== "object") return void 0;
    return record;
  }
  async function hasPickCopyCacheInStorage() {
    const record = await readPickCopyCacheFromStorage();
    const data = await ext.storage.local.get(PICK_COPY_CACHE_INDEX_KEY);
    applyPickCopyCachePresence(record, data[PICK_COPY_CACHE_INDEX_KEY]);
    return pickCopyCachePresentSync;
  }
  async function writePickCopyCacheIndex(formatIds) {
    if (formatIds.length === 0) {
      await ext.storage.local.remove(PICK_COPY_CACHE_INDEX_KEY);
      const record2 = await readPickCopyCacheFromStorage();
      applyPickCopyCachePresence(record2, void 0);
      return;
    }
    await ext.storage.local.set({ [PICK_COPY_CACHE_INDEX_KEY]: formatIds });
    const record = await readPickCopyCacheFromStorage();
    applyPickCopyCachePresence(record, formatIds);
  }
  async function writePickCopyCacheToStorage(entries, doc) {
    const record = {};
    for (const { key, value } of entries) {
      if (!isPickCopyCacheValueStorable(key, value, doc)) continue;
      record[key] = value;
    }
    if (Object.keys(record).length === 0) {
      await ext.storage.local.remove(PICK_COPY_CACHE_STORAGE_KEY);
      const data2 = await ext.storage.local.get(PICK_COPY_CACHE_INDEX_KEY);
      applyPickCopyCachePresence(void 0, data2[PICK_COPY_CACHE_INDEX_KEY]);
      return;
    }
    await ext.storage.local.set({ [PICK_COPY_CACHE_STORAGE_KEY]: record });
    const data = await ext.storage.local.get(PICK_COPY_CACHE_INDEX_KEY);
    applyPickCopyCachePresence(record, data[PICK_COPY_CACHE_INDEX_KEY]);
  }
  async function clearPickCopyCacheStorage() {
    await ext.storage.local.remove([
      PICK_COPY_CACHE_STORAGE_KEY,
      PICK_COPY_CACHE_INDEX_KEY,
      PICK_COPY_META_STORAGE_KEY
    ]);
    applyPickCopyCachePresence(void 0, void 0);
  }
  async function writePickCopyMetaToStorage(meta) {
    await ext.storage.local.set({ [PICK_COPY_META_STORAGE_KEY]: meta });
  }
  async function readPickCopyMetaFromStorage() {
    const data = await ext.storage.local.get(PICK_COPY_META_STORAGE_KEY);
    const meta = data[PICK_COPY_META_STORAGE_KEY];
    if (!meta || typeof meta !== "object") return void 0;
    const { tagName, hostname } = meta;
    if (typeof tagName !== "string" || typeof hostname !== "string") return void 0;
    return { tagName, hostname };
  }

  // src/lib/our/panel-tab/index.ts
  var PANEL_TAB_MODE_PARAM = "mode";
  var PANEL_TAB_MODE_VALUE = "tab";
  function isPanelTabMode(modeParam = PANEL_TAB_MODE_PARAM, modeValue = PANEL_TAB_MODE_VALUE, search = location.search) {
    return new URLSearchParams(search).get(modeParam) === modeValue;
  }
  function applyPanelTabPageLayout(pageClass) {
    document.documentElement.classList.add(pageClass);
  }

  // src/panel-tab/constants.ts
  var PANEL_TAB_PAGE_CLASS = "ec-panel-page--tab";
  var PANEL_TAB_HOST_STYLE = "display:block;width:100%;max-width:360px;min-height:280px;position:relative;pointer-events:auto;";

  // src/lib/our/panel-shell/shadow-host.ts
  function mountPanelShadowHost(options) {
    const host = document.createElement("div");
    host.id = options.rootId;
    host.className = options.hostClassName;
    host.setAttribute(options.hostAttr, "true");
    host.style.cssText = options.hostStyle;
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = options.cssContent;
    shadow.appendChild(style);
    return { host, shadow };
  }

  // src/lib/our/i18n/locale-code.ts
  var CHINESE_UI_LOCALE = "zh_CN";
  function normalizeLocaleCode(code) {
    if (code === "zh") return CHINESE_UI_LOCALE;
    return code;
  }
  function localeToHtmlLang(locale) {
    return locale.replace(/_/g, "-");
  }

  // src/lib/our/i18n/detect.ts
  function getAcceptLanguageTags() {
    return new Promise((resolve) => {
      const getAccept = ext.i18n?.getAcceptLanguages;
      if (typeof getAccept !== "function") {
        resolve(fallbackLanguageTags());
        return;
      }
      try {
        const maybePromise = getAccept((languages) => {
          resolve(pickLanguageTags(languages));
        });
        if (maybePromise && typeof maybePromise.then === "function") {
          void maybePromise.then((languages) => resolve(pickLanguageTags(languages))).catch(() => resolve(fallbackLanguageTags()));
        }
      } catch {
        resolve(fallbackLanguageTags());
      }
    });
  }
  function pickLanguageTags(languages) {
    if (languages?.length) return [...languages];
    return fallbackLanguageTags();
  }
  function fallbackLanguageTags() {
    if (typeof navigator !== "undefined" && navigator.languages?.length) {
      return [...navigator.languages];
    }
    try {
      const ui = ext.i18n?.getUILanguage?.();
      return ui ? [ui] : [];
    } catch {
      return [];
    }
  }
  async function detectLocale(mapLanguageTag2, fallbackLocale) {
    const tags = await getAcceptLanguageTags();
    const seen = /* @__PURE__ */ new Set();
    for (const tag of tags) {
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const mapped = mapLanguageTag2(tag);
      if (mapped) return mapped;
    }
    return fallbackLocale;
  }

  // src/i18n/detect.ts
  function mapLanguageTag(tag) {
    const base = tag.trim().toLowerCase().replace(/_/g, "-").split("-")[0];
    if (base === "en") return "en";
    return null;
  }
  function detectLocale2() {
    return detectLocale(mapLanguageTag, "en");
  }

  // src/lib/our/i18n/rtl.ts
  var RTL_LOCALES = /* @__PURE__ */ new Set(["ar"]);
  function isRtlLocale(locale) {
    return RTL_LOCALES.has(locale);
  }

  // src/i18n/locales/ar.ts
  var AR_MESSAGES = {
    restrictedPageNotice: "لا تعمل إضافات المتصفح على صفحات النظام والمواقع المحمية. جرّب موقعًا آخر.",
    panelSubtitle: "إضافة المتصفح",
    titleSettings: "البدء",
    pickElementButtonLabel: "اختيار عنصر",
    capturePageButtonLabel: "لقطة الصفحة",
    settingsDefaultActionLabel: "الإجراء الافتراضي",
    settingsDefaultActionNothing: "لا شيء",
    settingsDefaultActionCopyText: "نسخ النص",
    settingsDefaultActionCopyMarkdown: "نسخ Markdown",
    settingsDefaultActionCopyImage: "نسخ الصورة",
    settingsDefaultActionDownloadMarkdown: "تنزيل Markdown",
    settingsDefaultActionDownloadHtml: "تنزيل HTML",
    settingsDefaultActionDownloadPng: "تنزيل PNG",
    settingsDefaultActionDownloadJpeg: "تنزيل JPEG",
    settingsDefaultActionCopyCode: "نسخ الكود",
    settingsDefaultActionCopySelector: "نسخ المُحدِّد",
    settingsDefaultActionCopyJsPath: "نسخ JS path",
    settingsDefaultActionCopyXPath: "نسخ XPath",
    settingsDefaultActionCopyFullXPath: "نسخ XPath الكامل",
    settingsDefaultActionCopyStyles: "نسخ الأنماط",
    settingsDefaultActionCopyComputedStyles: "نسخ computed",
    settingsCopyDefaultNothing: "لا شيء",
    settingsInlineImagesLabel: "الصور المضمّنة في النص",
    settingsInlineImagesUseAll: "الإبقاء على الكل",
    settingsInlineImagesRemoveLarge: "إزالة الكبيرة",
    settingsInlineImagesRemoveSmall: "إزالة الصغيرة",
    settingsInlineImagesRemoveAll: "إزالة الكل",
    settingsInlineImagesInfoLabel: "عن الصور المضمّنة",
    settingsInlineImagesInfo: "تضمّن بعض الصفحات الصور في HTML كـ Base64 (شائع في Google ومواقع مشابهة). قد يبطئ ذلك النسخ ويكبّر مخرجات النص أو Markdown. الصور الصغيرة غالبًا أيقونات أو أزرار تزيد الفوضى. اضبط ما يُضمَّن من هنا.",
    settingsFrameLabelStyleLabel: "على الإطار",
    settingsFrameLabelNone: "بدون عنوان",
    settingsFrameLabelClickToCopy: "انقر للنسخ",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "مُحدِّد",
    settingsFrameLabelFullXPath: "XPath الكامل",
    infoWindowCloseLabel: "إغلاق",
    settingsComputeImagesLabel: "إنشاء الصور",
    settingsComputeImagesInfoLabel: "حول إنشاء الصور",
    settingsComputeImagesInfo: "في الصفحات الكبيرة، يستغرق إنشاء الصور وقتًا طويلاً. إذا لم تكن بحاجة إليها، أوقفها لتعمل أسرع بكثير.",
    settingsDeveloperToolsToggleLabel: "عرض أدوات المطوّر",
    settingsDarkThemeToggleLabel: "المظهر الداكن",
    copiedFormatTurnedOffInSettings: "مُعطّل في الإعدادات",
    copiedFormatNothingInCache: "لا يوجد شيء لهذا التنسيق",
    formatCode: "كود",
    formatSelector: "مُحدِّد",
    formatJsPath: "JS path",
    formatComputedStyles: "computed",
    formatStyles: "الأنماط",
    formatXPath: "XPath",
    formatFullXPath: "XPath الكامل",
    formatText: "نص",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "صورة",
    formatUrl: "URL",
    tabCopied: "منسوخ",
    copiedTitle: "تم النسخ!",
    loadingDataProcessing: "معالجة البيانات",
    copiedSubtitlePrefix: "نُسخ إلى الحافظة:",
    copiedSubtitleDownloadPrefix: "تم التنزيل:",
    copiedFormatsGroupLabel: "خيارات:",
    copiedFilesLabel: "تنزيل",
    copiedCopyLabel: "نسخ",
    copiedOpenUrlIconLabel: "فتح URL في تبويب جديد",
    copiedImageClipboardUnsupportedTooltip: "لا يستطيع متصفحك نسخ هذا التنسيق إلى الحافظة. استخدم «تنزيل» بدلًا من ذلك.",
    copiedEmptyLine1: "لم يُحفظ شيء بعد.",
    copiedEmptyLine2: "هل ننسخ شيئًا؟",
    pageSettingsTitle: "الإعدادات",
    tabShortcuts: "الاختصارات",
    shortcutsRunStopHeading: "تشغيل / إيقاف الإضافة:",
    shortcutsStepPress: "اضغط:",
    shortcutsStepOnMac: "على Mac:",
    shortcutsStepRelease: "ارفع أصابعك عن المفاتيح",
    shortcutsStepThenPress: "ثم اضغط",
    shortcutsStopHeading: "للإيقاف:",
    shortcutsSafetyLine1: "اختصار الخطوات الثلاث غير بديهي.",
    shortcutsSafetyLine2: "لكنه أكثر أمانًا وأقل تعارضًا مع التطبيقات الأخرى.",
    shortcutsWholePageBefore: "نفس الخطوات، لكن اضغط ",
    shortcutsWholePageAfter: " مرتين لالتقاط الصفحة كاملة فورًا.",
    tabAbout: "حول",
    welcomePin: "لإبقاء الإضافة في متناول اليد:",
    welcomePinStep1: "في الشريط العلوي افتح قائمة الإضافات",
    welcomePinStep2: "في القائمة ابحث عن:",
    welcomePinStep3: "انقر زر التثبيت:",
    aboutBullets: [
      "النسخ إلى الحافظة",
      "التنزيل",
      "يحفظ اللقطات الأخيرة",
      "النصوص: منسّقة، عادية، markdown، HTML",
      "صور: PNG، JPEG",
      "مُحدِّدات الكود: مُحدِّد، JS path، XPath، XPath الكامل",
      "أنماط الكود: المعلنة، المحسوبة",
      "بلا شبكة",
      "بلا جمع بيانات",
      "شكر وتقدير (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/locales/de.ts
  var DE_MESSAGES = {
    restrictedPageNotice: "Browser-Erweiterungen funktionieren nicht auf Systemseiten und geschützten Websites. Versuche es auf einer anderen Seite.",
    panelSubtitle: "Browser-Erweiterung",
    titleSettings: "START",
    pickElementButtonLabel: "ELEMENT WÄHLEN",
    capturePageButtonLabel: "SEITE AUFNEHMEN",
    settingsDefaultActionLabel: "Standardaktion",
    settingsDefaultActionNothing: "NICHTS",
    settingsDefaultActionCopyText: "Text kopieren",
    settingsDefaultActionCopyMarkdown: "Markdown kopieren",
    settingsDefaultActionCopyImage: "Bild kopieren",
    settingsDefaultActionDownloadMarkdown: "Markdown herunterladen",
    settingsDefaultActionDownloadHtml: "HTML herunterladen",
    settingsDefaultActionDownloadPng: "PNG herunterladen",
    settingsDefaultActionDownloadJpeg: "JPEG herunterladen",
    settingsDefaultActionCopyCode: "Code kopieren",
    settingsDefaultActionCopySelector: "Selektor kopieren",
    settingsDefaultActionCopyJsPath: "JS-Pfad kopieren",
    settingsDefaultActionCopyXPath: "XPath kopieren",
    settingsDefaultActionCopyFullXPath: "Vollständigen XPath kopieren",
    settingsDefaultActionCopyStyles: "Stile kopieren",
    settingsDefaultActionCopyComputedStyles: "Computed kopieren",
    settingsCopyDefaultNothing: "nichts",
    settingsInlineImagesLabel: "Eingebettete Bilder im Text",
    settingsInlineImagesUseAll: "Alle behalten",
    settingsInlineImagesRemoveLarge: "Große entfernen",
    settingsInlineImagesRemoveSmall: "Kleine entfernen",
    settingsInlineImagesRemoveAll: "Alle entfernen",
    settingsInlineImagesInfoLabel: "Zu eingebetteten Bildern",
    settingsInlineImagesInfo: "Einige Seiten betten Bilder im HTML als Base64 ein (häufig bei Google und ähnlichen Seiten). Das kann das Kopieren verlangsamen und Text- oder Markdown-Ausgaben aufblähen. Kleine Bilder sind oft Symbole oder Schaltflächen, die stören. Steuere hier, was eingeschlossen wird.",
    settingsFrameLabelStyleLabel: "Am Rahmen",
    settingsFrameLabelNone: "Kein Titel",
    settingsFrameLabelClickToCopy: "klicken zum Kopieren",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "Selektor",
    settingsFrameLabelFullXPath: "vollständiger XPath",
    infoWindowCloseLabel: "Schließen",
    settingsComputeImagesLabel: "Bilder generieren",
    settingsComputeImagesInfoLabel: "Zur Bildgenerierung",
    settingsComputeImagesInfo: "Auf großen Seiten dauert die Bildgenerierung sehr lange. Wenn Sie sie nicht brauchen, schalten Sie sie aus — so läuft alles deutlich schneller.",
    settingsDeveloperToolsToggleLabel: "Entwicklertools anzeigen",
    settingsDarkThemeToggleLabel: "Dunkles Design",
    copiedFormatTurnedOffInSettings: "In den Einstellungen ausgeschaltet",
    copiedFormatNothingInCache: "Nichts für dieses Format",
    formatCode: "Code",
    formatSelector: "Selektor",
    formatJsPath: "JS-Pfad",
    formatComputedStyles: "computed",
    formatStyles: "Stile",
    formatXPath: "XPath",
    formatFullXPath: "vollständiger XPath",
    formatText: "Text",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Bild",
    formatUrl: "URL",
    tabCopied: "KOPIERT",
    copiedTitle: "Kopiert!",
    loadingDataProcessing: "Daten werden verarbeitet",
    copiedSubtitlePrefix: "In die Zwischenablage kopiert:",
    copiedSubtitleDownloadPrefix: "Heruntergeladen:",
    copiedFormatsGroupLabel: "Optionen:",
    copiedFilesLabel: "Herunterladen",
    copiedCopyLabel: "Kopieren",
    copiedOpenUrlIconLabel: "URL in neuem Tab öffnen",
    copiedImageClipboardUnsupportedTooltip: "Dein Browser kann dieses Bildformat nicht in die Zwischenablage kopieren. Nutze stattdessen Herunterladen.",
    copiedEmptyLine1: "Noch nichts gespeichert.",
    copiedEmptyLine2: "Sollen wir etwas kopieren?",
    pageSettingsTitle: "EINSTELLUNGEN",
    tabShortcuts: "TASTENKÜRZEL",
    shortcutsRunStopHeading: "Erweiterung starten / beenden:",
    shortcutsStepPress: "Drücke:",
    shortcutsStepOnMac: "Auf dem Mac:",
    shortcutsStepRelease: "Tasten loslassen",
    shortcutsStepThenPress: "Dann drücke",
    shortcutsStopHeading: "Beenden:",
    shortcutsSafetyLine1: "Die 3-stufige Tastenkombination ist nicht offensichtlich.",
    shortcutsSafetyLine2: "Sie ist aber sicherer und vermeidet Konflikte mit anderen Apps.",
    shortcutsWholePageBefore: "Gleiche Schritte, aber ",
    shortcutsWholePageAfter: " zweimal drücken, um sofort die ganze Seite zu erfassen.",
    tabAbout: "ÜBER",
    welcomePin: "Erweiterung griffbereit halten:",
    welcomePinStep1: "In der oberen Leiste findest du die Erweiterungsliste",
    welcomePinStep2: "Suche in der Liste:",
    welcomePinStep3: "Klicke auf die Anheften-Schaltfläche:",
    aboutBullets: [
      "In die Zwischenablage kopieren",
      "Herunterladen",
      "Merkt sich letzte Aufnahmen",
      "Texte: formatiert, einfach, Markdown, HTML",
      "Bilder: PNG, JPEG",
      "Code-Selektoren: Selektor, JS-Pfad, XPath, vollständiger XPath",
      "Code-Stile: deklariert, berechnet",
      "Nutzt kein Netzwerk",
      "Keine Datenerfassung",
      "Danksagung (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/locales/es.ts
  var ES_MESSAGES = {
    restrictedPageNotice: "Las extensiones no funcionan en páginas del sistema ni en sitios protegidos. Prueba en otro sitio.",
    panelSubtitle: "extensión de navegador",
    titleSettings: "INICIO",
    pickElementButtonLabel: "ELEGIR ELEMENTO",
    capturePageButtonLabel: "CAPTURA DE PÁGINA",
    settingsDefaultActionLabel: "Acción predeterminada",
    settingsDefaultActionNothing: "NADA",
    settingsDefaultActionCopyText: "Copiar texto",
    settingsDefaultActionCopyMarkdown: "Copiar Markdown",
    settingsDefaultActionCopyImage: "Copiar imagen",
    settingsDefaultActionDownloadMarkdown: "Descargar Markdown",
    settingsDefaultActionDownloadHtml: "Descargar HTML",
    settingsDefaultActionDownloadPng: "Descargar PNG",
    settingsDefaultActionDownloadJpeg: "Descargar JPEG",
    settingsDefaultActionCopyCode: "Copiar código",
    settingsDefaultActionCopySelector: "Copiar selector",
    settingsDefaultActionCopyJsPath: "Copiar ruta JS",
    settingsDefaultActionCopyXPath: "Copiar XPath",
    settingsDefaultActionCopyFullXPath: "Copiar XPath completo",
    settingsDefaultActionCopyStyles: "Copiar estilos",
    settingsDefaultActionCopyComputedStyles: "Copiar computed",
    settingsCopyDefaultNothing: "nada",
    settingsInlineImagesLabel: "Imágenes incrustadas en el texto",
    settingsInlineImagesUseAll: "Usar todas",
    settingsInlineImagesRemoveLarge: "Quitar grandes",
    settingsInlineImagesRemoveSmall: "Quitar pequeñas",
    settingsInlineImagesRemoveAll: "Quitar todas",
    settingsInlineImagesInfoLabel: "Sobre imágenes incrustadas",
    settingsInlineImagesInfo: "Algunas páginas incrustan imágenes en el HTML como Base64 (habitual en Google y sitios similares). Esto puede ralentizar la copia e inflar la salida en texto o Markdown. Las imágenes pequeñas suelen ser iconos o botones que añaden ruido. Usa este ajuste para controlar qué se incluye.",
    settingsFrameLabelStyleLabel: "En el marco",
    settingsFrameLabelNone: "Sin título",
    settingsFrameLabelClickToCopy: "clic para copiar",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "selector",
    settingsFrameLabelFullXPath: "XPath completo",
    infoWindowCloseLabel: "Cerrar",
    settingsComputeImagesLabel: "Generar imágenes",
    settingsComputeImagesInfoLabel: "Sobre la generación de imágenes",
    settingsComputeImagesInfo: "En páginas grandes, generar imágenes lleva mucho tiempo. Si no las necesitas, desactívalas para ir mucho más rápido.",
    settingsDeveloperToolsToggleLabel: "Mostrar herramientas para desarrolladores",
    settingsDarkThemeToggleLabel: "Tema oscuro",
    copiedFormatTurnedOffInSettings: "Desactivado en la configuración",
    copiedFormatNothingInCache: "Nada para este formato",
    formatCode: "código",
    formatSelector: "selector",
    formatJsPath: "Ruta JS",
    formatComputedStyles: "computed",
    formatStyles: "estilos",
    formatXPath: "XPath",
    formatFullXPath: "XPath completo",
    formatText: "Texto",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Imagen",
    formatUrl: "URL",
    tabCopied: "COPIADO",
    copiedTitle: "¡Copiado!",
    loadingDataProcessing: "Procesando datos",
    copiedSubtitlePrefix: "Copiado al portapapeles:",
    copiedSubtitleDownloadPrefix: "Descargado:",
    copiedFormatsGroupLabel: "Opciones:",
    copiedFilesLabel: "Descargar",
    copiedCopyLabel: "Copiar",
    copiedOpenUrlIconLabel: "Abrir URL en una pestaña nueva",
    copiedImageClipboardUnsupportedTooltip: "Tu navegador no puede copiar este formato de imagen al portapapeles. Usa Descargar.",
    copiedEmptyLine1: "No hay nada guardado todavía.",
    copiedEmptyLine2: "¿Copiamos algo?",
    pageSettingsTitle: "AJUSTES",
    tabShortcuts: "ATAJOS",
    shortcutsRunStopHeading: "Para iniciar / detener la extensión:",
    shortcutsStepPress: "Pulsa:",
    shortcutsStepOnMac: "En Mac:",
    shortcutsStepRelease: "Suelta las teclas",
    shortcutsStepThenPress: "Luego pulsa",
    shortcutsStopHeading: "Para detener:",
    shortcutsSafetyLine1: "El atajo de 3 pasos no es obvio.",
    shortcutsSafetyLine2: "Pero es más seguro y evita conflictos con otras apps.",
    shortcutsWholePageBefore: "Los mismos pasos, pero pulsa ",
    shortcutsWholePageAfter: " dos veces para capturar toda la página al instante.",
    tabAbout: "ACERCA DE",
    welcomePin: "Para tener la extensión siempre a mano:",
    welcomePinStep1: "En la barra superior hay una lista de extensiones",
    welcomePinStep2: "En la lista, busca:",
    welcomePinStep3: "Pulsa el botón de anclar:",
    aboutBullets: [
      "Copiar al portapapeles",
      "Descargar",
      "Recuerda capturas recientes",
      "Textos: con formato, plano, markdown, HTML",
      "Imágenes: PNG, JPEG",
      "Selectores de código: selector, ruta JS, XPath, XPath completo",
      "Estilos de código: declarados, calculados",
      "No usa la red",
      "No recopila datos",
      "Créditos (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/locales/fr.ts
  var FR_MESSAGES = {
    restrictedPageNotice: "Les extensions ne fonctionnent pas sur les pages système ni les sites protégés. Essayez un autre site.",
    panelSubtitle: "extension de navigateur",
    titleSettings: "DÉMARRER",
    pickElementButtonLabel: "CHOISIR L'ÉLÉMENT",
    capturePageButtonLabel: "CAPTURE DE PAGE",
    settingsDefaultActionLabel: "Action par défaut",
    settingsDefaultActionNothing: "RIEN",
    settingsDefaultActionCopyText: "Copier le texte",
    settingsDefaultActionCopyMarkdown: "Copier Markdown",
    settingsDefaultActionCopyImage: "Copier l'image",
    settingsDefaultActionDownloadMarkdown: "Télécharger Markdown",
    settingsDefaultActionDownloadHtml: "Télécharger HTML",
    settingsDefaultActionDownloadPng: "Télécharger PNG",
    settingsDefaultActionDownloadJpeg: "Télécharger JPEG",
    settingsDefaultActionCopyCode: "Copier le code",
    settingsDefaultActionCopySelector: "Copier le sélecteur",
    settingsDefaultActionCopyJsPath: "Copier le chemin JS",
    settingsDefaultActionCopyXPath: "Copier XPath",
    settingsDefaultActionCopyFullXPath: "Copier le XPath complet",
    settingsDefaultActionCopyStyles: "Copier les styles",
    settingsDefaultActionCopyComputedStyles: "Copier computed",
    settingsCopyDefaultNothing: "rien",
    settingsInlineImagesLabel: "Images intégrées au texte",
    settingsInlineImagesUseAll: "Tout garder",
    settingsInlineImagesRemoveLarge: "Retirer les grandes",
    settingsInlineImagesRemoveSmall: "Retirer les petites",
    settingsInlineImagesRemoveAll: "Tout retirer",
    settingsInlineImagesInfoLabel: "À propos des images intégrées",
    settingsInlineImagesInfo: "Certaines pages intègrent des images dans le HTML en Base64 (fréquent sur Google et sites similaires). Cela peut ralentir la copie et alourdir le texte ou le Markdown. Les petites images sont souvent des icônes ou boutons superflus. Utilisez ce réglage pour choisir ce qui est inclus.",
    settingsFrameLabelStyleLabel: "Sur le cadre",
    settingsFrameLabelNone: "Sans titre",
    settingsFrameLabelClickToCopy: "cliquer pour copier",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "sélecteur",
    settingsFrameLabelFullXPath: "XPath complet",
    infoWindowCloseLabel: "Fermer",
    settingsComputeImagesLabel: "Générer les images",
    settingsComputeImagesInfoLabel: "À propos de la génération d'images",
    settingsComputeImagesInfo: "Sur les grandes pages, la génération d'images prend beaucoup de temps. Si vous n'en avez pas besoin, désactivez-les pour aller beaucoup plus vite.",
    settingsDeveloperToolsToggleLabel: "Afficher les outils de développement",
    settingsDarkThemeToggleLabel: "Thème sombre",
    copiedFormatTurnedOffInSettings: "Désactivé dans les paramètres",
    copiedFormatNothingInCache: "Rien pour ce format",
    formatCode: "code",
    formatSelector: "sélecteur",
    formatJsPath: "Chemin JS",
    formatComputedStyles: "computed",
    formatStyles: "styles",
    formatXPath: "XPath",
    formatFullXPath: "XPath complet",
    formatText: "Texte",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Image",
    formatUrl: "URL",
    tabCopied: "COPIÉ",
    copiedTitle: "Copié !",
    loadingDataProcessing: "Traitement des données",
    copiedSubtitlePrefix: "Copié dans le presse-papiers :",
    copiedSubtitleDownloadPrefix: "Téléchargé :",
    copiedFormatsGroupLabel: "Options :",
    copiedFilesLabel: "Télécharger",
    copiedCopyLabel: "Copier",
    copiedOpenUrlIconLabel: "Ouvrir l'URL dans un nouvel onglet",
    copiedImageClipboardUnsupportedTooltip: "Votre navigateur ne peut pas copier ce format d'image dans le presse-papiers. Utilisez Télécharger.",
    copiedEmptyLine1: "Rien n'est encore enregistré.",
    copiedEmptyLine2: "On copie quelque chose ?",
    pageSettingsTitle: "PARAMÈTRES",
    tabShortcuts: "RACCOURCIS",
    shortcutsRunStopHeading: "Pour démarrer / arrêter l'extension :",
    shortcutsStepPress: "Appuyez sur :",
    shortcutsStepOnMac: "Sur Mac :",
    shortcutsStepRelease: "Relâchez les touches",
    shortcutsStepThenPress: "Puis appuyez sur",
    shortcutsStopHeading: "Pour arrêter :",
    shortcutsSafetyLine1: "Le raccourci en 3 étapes n'est pas évident.",
    shortcutsSafetyLine2: "Mais il est plus sûr et évite les conflits avec d'autres apps.",
    shortcutsWholePageBefore: "Mêmes étapes, mais appuyez sur ",
    shortcutsWholePageAfter: " deux fois pour capturer toute la page immédiatement.",
    tabAbout: "À PROPOS",
    welcomePin: "Pour garder l'extension à portée de main :",
    welcomePinStep1: "La barre supérieure affiche la liste des extensions",
    welcomePinStep2: "Dans la liste, trouvez :",
    welcomePinStep3: "Cliquez sur le bouton d'épinglage :",
    aboutBullets: [
      "Copier dans le presse-papiers",
      "Télécharger",
      "Mémorise les captures récentes",
      "Textes : formaté, brut, markdown, HTML",
      "Images : PNG, JPEG",
      "Sélecteurs de code : sélecteur, chemin JS, XPath, XPath complet",
      "Styles de code : déclarés, calculés",
      "N'utilise pas le réseau",
      "Ne collecte pas de données",
      "Crédits (MIT) : Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/locales/ru.ts
  var RU_MESSAGES = {
    restrictedPageNotice: "Расширения не работают на системных страницах и защищённых сайтах. Откройте другой сайт.",
    panelSubtitle: "расширение для браузера",
    titleSettings: "СТАРТ",
    pickElementButtonLabel: "ВЫБРАТЬ ЭЛЕМЕНТ",
    capturePageButtonLabel: "СКРИНШОТ СТРАНИЦЫ",
    settingsDefaultActionLabel: "Действие по умолчанию",
    settingsDefaultActionNothing: "НИЧЕГО",
    settingsDefaultActionCopyText: "Копировать текст",
    settingsDefaultActionCopyMarkdown: "Копировать Markdown",
    settingsDefaultActionCopyImage: "Копировать изображение",
    settingsDefaultActionDownloadMarkdown: "Скачать Markdown",
    settingsDefaultActionDownloadHtml: "Скачать HTML",
    settingsDefaultActionDownloadPng: "Скачать PNG",
    settingsDefaultActionDownloadJpeg: "Скачать JPEG",
    settingsDefaultActionCopyCode: "Копировать код",
    settingsDefaultActionCopySelector: "Копировать селектор",
    settingsDefaultActionCopyJsPath: "Копировать JS-путь",
    settingsDefaultActionCopyXPath: "Копировать XPath",
    settingsDefaultActionCopyFullXPath: "Копировать полный XPath",
    settingsDefaultActionCopyStyles: "Копировать стили",
    settingsDefaultActionCopyComputedStyles: "Копировать computed",
    settingsCopyDefaultNothing: "ничего",
    settingsInlineImagesLabel: "Встроенные изображения в тексте",
    settingsInlineImagesUseAll: "Оставить все",
    settingsInlineImagesRemoveLarge: "Убрать крупные",
    settingsInlineImagesRemoveSmall: "Убрать мелкие",
    settingsInlineImagesRemoveAll: "Убрать все",
    settingsInlineImagesInfoLabel: "О встроенных изображениях",
    settingsInlineImagesInfo: "Некоторые страницы встраивают изображения в HTML как Base64 (часто у Google и похожих сайтов). Это может замедлить копирование и увеличить результат в текстовом формате или Markdown. Мелкие изображения часто бывают иконками или кнопками и добавляют шум. Здесь можно выбрать, что включать.",
    settingsFrameLabelStyleLabel: "На рамке",
    settingsFrameLabelNone: "Без подписи",
    settingsFrameLabelClickToCopy: "нажмите, чтобы скопировать",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "селектор",
    settingsFrameLabelFullXPath: "полный XPath",
    infoWindowCloseLabel: "Закрыть",
    settingsComputeImagesLabel: "Генерировать изображения",
    settingsComputeImagesInfoLabel: "О генерации изображений",
    settingsComputeImagesInfo: "На больших страницах генерация изображений занимает много времени. Если они не нужны, то отключите, так будет работать намного быстрее.",
    settingsDeveloperToolsToggleLabel: "Показывать инструменты разработчика",
    settingsDarkThemeToggleLabel: "Тёмная тема",
    copiedFormatTurnedOffInSettings: "Выключено в настройках",
    copiedFormatNothingInCache: "Нет данных для этого формата",
    formatCode: "код",
    formatSelector: "селектор",
    formatJsPath: "JS-путь",
    formatComputedStyles: "computed",
    formatStyles: "стили",
    formatXPath: "XPath",
    formatFullXPath: "полный XPath",
    formatText: "Текст",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Картинка",
    formatUrl: "URL",
    tabCopied: "СКОПИРОВАНО",
    copiedTitle: "Скопировано!",
    loadingDataProcessing: "Обработка данных",
    copiedSubtitlePrefix: "Скопировано в буфер обмена:",
    copiedSubtitleDownloadPrefix: "Скачано:",
    copiedFormatsGroupLabel: "Варианты:",
    copiedFilesLabel: "Скачать",
    copiedCopyLabel: "Копировать",
    copiedOpenUrlIconLabel: "Открыть URL в новой вкладке",
    copiedImageClipboardUnsupportedTooltip: "Браузер не может скопировать этот формат изображения в буфер обмена. Используйте «Скачать».",
    copiedEmptyLine1: "Пока ничего не сохранено.",
    copiedEmptyLine2: "Скопировать что-нибудь?",
    pageSettingsTitle: "НАСТРОЙКИ",
    tabShortcuts: "ГОРЯЧИЕ КЛАВИШИ",
    shortcutsRunStopHeading: "Запуск и остановка расширения:",
    shortcutsStepPress: "Нажмите:",
    shortcutsStepOnMac: "На Mac:",
    shortcutsStepRelease: "Отпустите клавиши",
    shortcutsStepThenPress: "Затем нажмите",
    shortcutsStopHeading: "Остановка:",
    shortcutsSafetyLine1: "Трёхшаговые горячие клавиши неочевидны.",
    shortcutsSafetyLine2: "Но оно безопаснее и реже конфликтует с другими приложениями.",
    shortcutsWholePageBefore: "Те же шаги, но нажмите ",
    shortcutsWholePageAfter: " дважды, чтобы сразу снять всю страницу.",
    tabAbout: "О ПРОГРАММЕ",
    welcomePin: "Чтобы расширение было под рукой:",
    welcomePinStep1: "На верхней панели откройте список расширений",
    welcomePinStep2: "В списке найдите:",
    welcomePinStep3: "Нажмите кнопку закрепления:",
    aboutBullets: [
      "Копирование в буфер обмена",
      "Скачивание",
      "Запоминает недавние снимки",
      "Текст: формат., обычный, markdown, HTML",
      "Изображения: PNG, JPEG",
      "Селекторы кода: селектор, JS-путь, XPath, полный XPath",
      "Стили кода: объявленные, вычисленные",
      "Не использует сеть",
      "Без сбора данных",
      "Благодарности (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/locales/zh_CN.ts
  var ZH_CN_MESSAGES = {
    restrictedPageNotice: "浏览器扩展无法在系统页面和受保护网站上使用。请换一个网站试试。",
    panelSubtitle: "浏览器扩展",
    titleSettings: "开始",
    pickElementButtonLabel: "选择元素",
    capturePageButtonLabel: "页面截图",
    settingsDefaultActionLabel: "默认操作",
    settingsDefaultActionNothing: "无",
    settingsDefaultActionCopyText: "复制文本",
    settingsDefaultActionCopyMarkdown: "复制 Markdown",
    settingsDefaultActionCopyImage: "复制图片",
    settingsDefaultActionDownloadMarkdown: "下载 Markdown",
    settingsDefaultActionDownloadHtml: "下载 HTML",
    settingsDefaultActionDownloadPng: "下载 PNG",
    settingsDefaultActionDownloadJpeg: "下载 JPEG",
    settingsDefaultActionCopyCode: "复制代码",
    settingsDefaultActionCopySelector: "复制选择器",
    settingsDefaultActionCopyJsPath: "复制 JS 路径",
    settingsDefaultActionCopyXPath: "复制 XPath",
    settingsDefaultActionCopyFullXPath: "复制完整 XPath",
    settingsDefaultActionCopyStyles: "复制样式",
    settingsDefaultActionCopyComputedStyles: "复制计算样式",
    settingsCopyDefaultNothing: "无",
    settingsInlineImagesLabel: "文本中的内嵌图片",
    settingsInlineImagesUseAll: "全部保留",
    settingsInlineImagesRemoveLarge: "移除大图",
    settingsInlineImagesRemoveSmall: "移除小图",
    settingsInlineImagesRemoveAll: "全部移除",
    settingsInlineImagesInfoLabel: "关于内嵌图片",
    settingsInlineImagesInfo: "部分页面在 HTML 中以 Base64 嵌入图片（Google 等网站较常见）。这会拖慢复制并撑大文本或 Markdown 输出。小图多为图标或按钮，易造成干扰。可用此设置控制包含范围。",
    settingsFrameLabelStyleLabel: "框上显示",
    settingsFrameLabelNone: "无标题",
    settingsFrameLabelClickToCopy: "点击复制",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "选择器",
    settingsFrameLabelFullXPath: "完整 XPath",
    infoWindowCloseLabel: "关闭",
    settingsComputeImagesLabel: "生成图片",
    settingsComputeImagesInfoLabel: "关于生成图片",
    settingsComputeImagesInfo: "在大型页面上，生成图片需要很长时间。如果不需要，请关闭，运行会快很多。",
    settingsDeveloperToolsToggleLabel: "显示开发者工具",
    settingsDarkThemeToggleLabel: "深色主题",
    copiedFormatTurnedOffInSettings: "已在设置中关闭",
    copiedFormatNothingInCache: "此格式无可用内容",
    formatCode: "代码",
    formatSelector: "选择器",
    formatJsPath: "JS 路径",
    formatComputedStyles: "计算样式",
    formatStyles: "样式",
    formatXPath: "XPath",
    formatFullXPath: "完整 XPath",
    formatText: "文本",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "图片",
    formatUrl: "URL",
    tabCopied: "已复制",
    copiedTitle: "已复制！",
    loadingDataProcessing: "正在处理",
    copiedSubtitlePrefix: "已复制到剪贴板：",
    copiedSubtitleDownloadPrefix: "已下载：",
    copiedFormatsGroupLabel: "选项：",
    copiedFilesLabel: "下载",
    copiedCopyLabel: "复制",
    copiedOpenUrlIconLabel: "在新标签页打开 URL",
    copiedImageClipboardUnsupportedTooltip: "浏览器无法将此图片格式复制到剪贴板。请改用「下载」。",
    copiedEmptyLine1: "还没有保存任何内容。",
    copiedEmptyLine2: "要复制一些内容吗？",
    pageSettingsTitle: "设置",
    tabShortcuts: "快捷键",
    shortcutsRunStopHeading: "启动 / 停止扩展：",
    shortcutsStepPress: "按下：",
    shortcutsStepOnMac: "在 Mac 上：",
    shortcutsStepRelease: "松开按键",
    shortcutsStepThenPress: "然后按",
    shortcutsStopHeading: "停止：",
    shortcutsSafetyLine1: "三步快捷键不够直观。",
    shortcutsSafetyLine2: "但更安全，也更少与其他应用冲突。",
    shortcutsWholePageBefore: "步骤相同，但连按两次 ",
    shortcutsWholePageAfter: " 可立即截取整页。",
    tabAbout: "关于",
    welcomePin: "让扩展始终触手可及：",
    welcomePinStep1: "在顶部工具栏打开扩展列表",
    welcomePinStep2: "在列表中找到：",
    welcomePinStep3: "点击固定按钮：",
    aboutBullets: [
      "复制到剪贴板",
      "下载",
      "记住最近的快照",
      "文本：带格式、纯文本、markdown、HTML",
      "图片：PNG、JPEG",
      "代码选择器：选择器、JS 路径、XPath、完整 XPath",
      "代码样式：声明、计算",
      "不使用网络",
      "不收集数据",
      "致谢 (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };

  // src/i18n/strings.ts
  var EN_MESSAGES = {
    restrictedPageNotice: "Browser extensions don't work on system pages and protected sites. Try another site.",
    panelSubtitle: "browser extension",
    titleSettings: "START",
    pickElementButtonLabel: "PICK ELEMENT",
    capturePageButtonLabel: "SCREENSHOT PAGE",
    settingsDefaultActionLabel: "Default action",
    settingsDefaultActionNothing: "NOTHING",
    settingsDefaultActionCopyText: "Copy Text",
    settingsDefaultActionCopyMarkdown: "Copy Markdown",
    settingsDefaultActionCopyImage: "Copy Image",
    settingsDefaultActionDownloadMarkdown: "Download Markdown",
    settingsDefaultActionDownloadHtml: "Download HTML",
    settingsDefaultActionDownloadPng: "Download PNG",
    settingsDefaultActionDownloadJpeg: "Download JPEG",
    settingsDefaultActionCopyCode: "Copy code",
    settingsDefaultActionCopySelector: "Copy selector",
    settingsDefaultActionCopyJsPath: "Copy JS path",
    settingsDefaultActionCopyXPath: "Copy XPath",
    settingsDefaultActionCopyFullXPath: "Copy full XPath",
    settingsDefaultActionCopyStyles: "Copy styles",
    settingsDefaultActionCopyComputedStyles: "Copy computed styles",
    settingsCopyDefaultNothing: "nothing",
    settingsInlineImagesLabel: "Inline images in text",
    settingsInlineImagesUseAll: "Use all",
    settingsInlineImagesRemoveLarge: "Remove large",
    settingsInlineImagesRemoveSmall: "Remove small",
    settingsInlineImagesRemoveAll: "Remove all",
    settingsInlineImagesInfoLabel: "About inline images",
    settingsInlineImagesInfo: "Some pages embed images in the HTML as Base64 (common on Google and similar sites). This can slow copying and bloat Text or Markdown output. Small images are often icons or buttons that add clutter. Use this setting to control what is included.",
    settingsFrameLabelStyleLabel: "On the frame",
    settingsFrameLabelNone: "No title",
    settingsFrameLabelClickToCopy: "click to copy",
    settingsFrameLabelTagIdClass: "tag id class",
    settingsFrameLabelSelector: "selector",
    settingsFrameLabelFullXPath: "full XPath",
    infoWindowCloseLabel: "Close",
    settingsComputeImagesLabel: "Generate images",
    settingsComputeImagesInfoLabel: "About generating images",
    settingsComputeImagesInfo: "On large pages, images take a lot of time to generate. If you don't need them, turn them off to run way faster.",
    settingsDeveloperToolsToggleLabel: "Display developer tools",
    settingsDarkThemeToggleLabel: "Dark theme",
    copiedFormatTurnedOffInSettings: "Turned off in the settings",
    copiedFormatNothingInCache: "Nothing for this format",
    formatCode: "code",
    formatSelector: "selector",
    formatJsPath: "JS path",
    formatComputedStyles: "computed styles",
    formatStyles: "styles",
    formatXPath: "XPath",
    formatFullXPath: "full XPath",
    formatText: "Text",
    formatMarkdown: "Markdown",
    formatHtml: "HTML",
    formatPng: "PNG",
    formatJpeg: "JPEG",
    formatImage: "Image",
    formatUrl: "URL",
    tabCopied: "COPIED",
    copiedTitle: "Copied!",
    loadingDataProcessing: "Data processing",
    copiedSubtitlePrefix: "Copied to clipboard:",
    copiedSubtitleDownloadPrefix: "Downloaded:",
    copiedFormatsGroupLabel: "Options:",
    copiedFilesLabel: "Download",
    copiedCopyLabel: "Copy",
    copiedOpenUrlIconLabel: "Open URL in a new tab",
    copiedImageClipboardUnsupportedTooltip: "Your browser can't copy this image format to the clipboard. Use Download instead.",
    copiedEmptyLine1: "I don't have anything saved in my memory.",
    copiedEmptyLine2: "Should we copy something?",
    pageSettingsTitle: "SETTINGS",
    tabShortcuts: "SHORTCUTS",
    shortcutsRunStopHeading: "To run / stop the extension:",
    shortcutsStepPress: "Press:",
    shortcutsStepOnMac: "On Mac:",
    shortcutsStepRelease: "Release the keys",
    shortcutsStepThenPress: "Then press",
    shortcutsStopHeading: "To stop:",
    shortcutsSafetyLine1: "The 3-step shortcut is not obvious.",
    shortcutsSafetyLine2: "But it is safer and avoids conflicts with other apps.",
    shortcutsWholePageBefore: "Do the steps above, but tap ",
    shortcutsWholePageAfter: " twice to capture the whole page immediately.",
    tabAbout: "ABOUT",
    welcomePin: "To keep the extension handy:",
    welcomePinStep1: "The top bar has an extensions list",
    welcomePinStep2: "In the list, find:",
    welcomePinStep3: "Click the pin button:",
    aboutBullets: [
      "Copy to clipboard",
      "Download",
      "Remembers recent snapshots",
      "Texts: formatted, plain, markdown, HTML",
      "Images: PNG, JPEG",
      "Code selectors: selector, JS path, XPath, full XPath",
      "Code styles: declared, computed",
      "Doesn't use the network",
      "Doesn't collect data",
      "Credits (MIT): Lucide, Modern-Screenshot, Turndown"
    ],
    aboutProductName: "Element-Copier",
    aboutCreditAuthor: "Alex T"
  };
  var LOCALE_MESSAGES = {
    ar: AR_MESSAGES,
    de: DE_MESSAGES,
    es: ES_MESSAGES,
    fr: FR_MESSAGES,
    ru: RU_MESSAGES,
    zh_CN: ZH_CN_MESSAGES
  };
  function t(locale) {
    return LOCALE_MESSAGES[locale] ?? EN_MESSAGES;
  }

  // src/i18n/types.ts
  var LOCALES = [
    "en",
    "es",
    "fr",
    "de",
    "ru",
    "zh_CN",
    "ar"
  ];
  var LOCALE_BUTTON_LABELS = {
    en: "EN",
    es: "ES",
    fr: "FR",
    de: "DE",
    ru: "RU",
    zh_CN: "中文",
    ar: "عربي"
  };
  function isLocale(value) {
    return typeof value === "string" && LOCALES.includes(value);
  }

  // src/storage.ts
  async function getLocale() {
    const data = await ext.storage.local.get(LOCALE_STORAGE_KEY);
    const raw = data[LOCALE_STORAGE_KEY];
    if (typeof raw === "string") {
      const normalized = normalizeLocaleCode(raw);
      if (isLocale(normalized)) {
        if (normalized !== raw) {
          await ext.storage.local.set({ [LOCALE_STORAGE_KEY]: normalized });
        }
        return normalized;
      }
    }
    return detectLocale2();
  }
  async function setLocale(locale) {
    await ext.storage.local.set({
      [LOCALE_STORAGE_KEY]: locale,
      [LOCALE_USER_SELECTED_KEY]: true
    });
  }

  // src/panel-popup/constants.ts
  var PANEL_POPUP_PAGE = "panel-popup-page.html";
  var PANEL_POPUP_ROOT_ID = "element-copier-root";
  var PANEL_POPUP_HOST_ATTR = "data-element-copier-ui";
  var PANEL_POPUP_SESSION_TAB_KEY = "panelPopupTab";
  var PANEL_SESSION_PORT_NAME = "element-copier-panel-session";
  var PANEL_POPUP_WIDTH_FALLBACK_PX = 380;
  function panelPopupHostStyle(widthPx) {
    return `display:block;width:${widthPx}px;min-height:0;height:auto;position:relative;pointer-events:auto;`;
  }
  var PANEL_MENU_TABS = [
    "start",
    "copied",
    "settings",
    "shortcuts",
    "about"
  ];
  var PANEL_POPUP_TABS = [...PANEL_MENU_TABS, "loading"];
  var PANEL_PAGE_CONFIG = {
    pageHtml: PANEL_POPUP_PAGE,
    sessionTabKey: PANEL_POPUP_SESSION_TAB_KEY,
    logLabel: "Element Copier"
  };

  // src/lib/icons/lucide/files.svg
  var files_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />\n  <path d="M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z" />\n  <path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1" />\n</svg>\n';

  // src/lib/icons/lucide/arrow-up.svg
  var arrow_up_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="m5 12 7-7 7 7" />\n  <path d="M12 19V5" />\n</svg>\n';

  // src/lib/icons/lucide/circle-power.svg
  var circle_power_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <circle cx="12" cy="12" r="10" />\n  <path d="M12 7v4" />\n  <path d="M7.998 9.003a5 5 0 1 0 8-.005" />\n</svg>\n';

  // src/lib/icons/lucide/copy.svg
  var copy_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />\n  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />\n</svg>\n';

  // src/lib/icons/lucide/external-link.svg
  var external_link_default = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link-icon lucide-external-link">\n  <path d="M15 3h6v6" />\n  <path d="M10 14 21 3" />\n  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />\n</svg>\n';

  // src/lib/icons/lucide/file-down.svg
  var file_down_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />\n  <path d="M14 2v4a2 2 0 0 0 2 2h4" />\n  <path d="M12 18v-6" />\n  <path d="m9 15 3 3 3-3" />\n</svg>\n';

  // src/lib/icons/lucide/image-down.svg
  var image_down_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21" />\n  <path d="m14 19 3 3v-5.5" />\n  <path d="m17 22 3-3" />\n  <circle cx="9" cy="9" r="2" />\n</svg>\n';

  // src/lib/icons/lucide/images.svg
  var images_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M18 22H4a2 2 0 0 1-2-2V6" />\n  <path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" />\n  <circle cx="12" cy="8" r="2" />\n  <rect width="16" height="16" x="6" y="2" rx="2" />\n</svg>\n';

  // src/lib/icons/lucide/heart.svg
  var heart_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />\n</svg>\n';

  // src/lib/icons/lucide/history.svg
  var history_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />\n  <path d="M3 3v5h5" />\n  <path d="M12 7v5l4 2" />\n</svg>\n';

  // src/lib/icons/lucide/cog.svg
  var cog_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M11 10.27 7 3.34" />\n  <path d="m11 13.73-4 6.93" />\n  <path d="M12 22v-2" />\n  <path d="M12 2v2" />\n  <path d="M14 12h8" />\n  <path d="m17 20.66-1-1.73" />\n  <path d="m17 3.34-1 1.73" />\n  <path d="M2 12h2" />\n  <path d="m20.66 17-1.73-1" />\n  <path d="m20.66 7-1.73 1" />\n  <path d="m3.34 17 1.73-1" />\n  <path d="m3.34 7 1.73 1" />\n  <circle cx="12" cy="12" r="2" />\n  <circle cx="12" cy="12" r="8" />\n</svg>\n';

  // src/lib/icons/lucide/info.svg
  var info_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <circle cx="12" cy="12" r="10" />\n  <path d="M12 16v-4" />\n  <path d="M12 8h.01" />\n</svg>\n';

  // src/lib/icons/lucide/keyboard.svg
  var keyboard_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M10 8h.01" />\n  <path d="M12 12h.01" />\n  <path d="M14 8h.01" />\n  <path d="M16 12h.01" />\n  <path d="M18 8h.01" />\n  <path d="M6 8h.01" />\n  <path d="M7 16h10" />\n  <path d="M8 12h.01" />\n  <rect width="20" height="16" x="2" y="4" rx="2" />\n</svg>\n';

  // src/lib/icons/lucide/pin.svg
  var pin_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M12 17v5" />\n  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />\n</svg>\n';

  // src/lib/icons/lucide/play.svg
  var play_default = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play-icon lucide-play"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>';

  // src/lib/icons/lucide/puzzle.svg
  var puzzle_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" />\n</svg>\n';

  // src/lib/icons/lucide/rotate-cw.svg
  var rotate_cw_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />\n  <path d="M21 3v5h-5" />\n</svg>\n';

  // src/lib/icons/lucide/settings.svg
  var settings_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />\n  <circle cx="12" cy="12" r="3" />\n</svg>\n';

  // src/lib/icons/lucide/shield-check.svg
  var shield_check_default = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n  width="24"\n  height="24"\n  viewBox="0 0 24 24"\n  fill="none"\n  stroke="currentColor"\n  stroke-width="2"\n  stroke-linecap="round"\n  stroke-linejoin="round"\n>\n  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />\n  <path d="m9 12 2 2 4-4" />\n</svg>\n';

  // src/lib/icons/brands/linkedin.svg
  var linkedin_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#000000">\n  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>\n</svg>\n';

  // src/lib/icons/index.ts
  function stripComment(svg) {
    return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
  }
  function lucideUiIcon(raw) {
    return stripComment(raw);
  }
  function brandIcon(raw) {
    return stripComment(raw).replace(/fill="#000000"/g, 'fill="currentColor"');
  }
  var ARROW_UP = lucideUiIcon(arrow_up_default);
  var CIRCLE_POWER = lucideUiIcon(circle_power_default);
  var COG = lucideUiIcon(cog_default);
  var COPY = lucideUiIcon(copy_default);
  var EXTERNAL_LINK = lucideUiIcon(external_link_default);
  var FILE_DOWN = lucideUiIcon(file_down_default);
  var FILES = lucideUiIcon(files_default);
  var IMAGE_DOWN = lucideUiIcon(image_down_default);
  var IMAGES = lucideUiIcon(images_default);
  var HEART = lucideUiIcon(heart_default);
  var HISTORY = lucideUiIcon(history_default);
  var INFO = lucideUiIcon(info_default);
  var KEYBOARD = lucideUiIcon(keyboard_default);
  var SETTINGS = lucideUiIcon(settings_default);
  var SHIELD_CHECK = lucideUiIcon(shield_check_default);
  var PIN = lucideUiIcon(pin_default);
  var PLAY = lucideUiIcon(play_default);
  var PUZZLE = lucideUiIcon(puzzle_default);
  var ROTATE_CW = lucideUiIcon(rotate_cw_default);
  var LINKEDIN = brandIcon(linkedin_default);

  // src/lib/icons/md2it.svg
  var md2it_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 946.295 947.014" width="24" height="24" fill="#000000">\n  <path fill-rule="evenodd" clip-rule="evenodd" d="M0.294998 230.507V461.014H57.295H114.295L114.321 317.264L114.347 173.514L119.729 182.014C131.242 200.194 138.673 212.076 147.245 226.014C152.15 233.989 159.72 246.139 164.067 253.014C168.414 259.889 177.529 274.514 184.323 285.514C197.987 307.639 211.847 329.833 216.794 337.514C218.566 340.264 223.961 348.814 228.784 356.514C241.803 377.3 252.729 393.981 253.295 393.936C253.57 393.914 256.783 389.31 260.436 383.705C264.088 378.1 274.925 361.589 284.519 347.014C294.112 332.439 306.24 313.989 311.47 306.014C316.7 298.039 328.999 279.364 338.8 264.514C348.602 249.664 364.02 226.264 373.064 212.514C382.107 198.764 391.371 184.711 393.651 181.285L397.795 175.056L398.048 318.035L398.302 461.014H455.298H512.295V230.514V0.0139999H443.011H373.726L371.839 3.264C370.8 5.052 365.368 13.939 359.766 23.014C348.231 41.703 333.55 65.582 322.265 84.014C307.818 107.609 298.029 123.527 291.826 133.514C277.383 156.769 269.295 170.081 269.295 170.6C269.295 170.904 268.002 173.035 266.422 175.334C264.842 177.633 261.224 183.452 258.383 188.264C255.542 193.077 252.898 197.008 252.506 197C252.115 196.992 250.503 194.629 248.925 191.75C245.975 186.369 222.868 148.272 218.758 142.014C217.494 140.089 209.141 126.589 200.195 112.014C166.909 57.782 163.441 52.143 153.136 35.514C147.343 26.164 140.152 14.464 137.158 9.514L131.713 0.514L66.004 0.257L0.294998 0V230.507ZM540.295 230.566V461.117L643.545 460.759C743.253 460.413 747.246 460.328 759.951 458.267C786.579 453.949 808.086 447.481 828.992 437.506C870.648 417.63 901.83 386.413 922.717 343.678C933.069 322.495 939.448 300.945 943.929 272.014C946.675 254.283 946.442 212.457 943.49 193.259C940.647 174.774 938.091 163.449 933.656 149.681C915.674 93.867 880.193 51.134 831.073 26.127C809.507 15.147 790.444 8.876 765.795 4.652C739.813 0.2 734.575 0.0139999 635.189 0.0139999H540.295V230.566ZM739.295 115.392C773.348 120.821 799.25 138.981 813.666 167.534C821.407 182.866 826.068 203.012 826.965 225.014C828.571 264.421 818.637 296.12 797.875 317.843C783.839 332.529 767.977 341.016 744.795 346.244C736.861 348.033 731.265 348.329 697.545 348.742L659.295 349.211V231.779C659.295 167.192 659.632 114.008 660.045 113.593C661.417 112.213 728.97 113.747 739.295 115.392ZM162.295 479.597C123.366 484.23 94.04 494.332 66.795 512.496C52.467 522.048 42.425 531.456 32.459 544.664C14.097 568.999 2.966 601.142 0.685997 636.416L0 647.014H57.602H115.204L115.848 643.264C119.075 624.476 127.082 609.374 139.033 599.535C151.737 589.075 168.073 583.811 187.87 583.798C205.641 583.786 220.085 588.054 232.359 596.946C241.176 603.332 248.391 615.313 250.446 626.979C253.356 643.5 244.67 663.689 228.705 677.514C225.529 680.264 210.3 692.06 194.863 703.727C179.425 715.394 164.095 727.003 160.795 729.525C157.495 732.046 143.041 742.976 128.676 753.812C99.224 776.028 70.868 797.623 45.795 816.933C36.445 824.134 22.399 834.861 14.581 840.77L0.365997 851.514L0.330997 899.264L0.294998 947.014H186.295H372.295V895.019V843.024L278.045 842.769L183.795 842.514L192.295 836.212C196.97 832.746 208.22 824.451 217.295 817.779C226.37 811.106 239.645 801.31 246.795 796.009C253.945 790.709 262.27 784.647 265.295 782.539C271.406 778.282 293.855 761.209 307.165 750.698C317.777 742.317 334.967 725.563 341.175 717.55C356.435 697.853 365.255 678.635 369.948 654.861C372.035 644.285 372.321 615.682 370.446 605.014C367.07 585.803 363.897 575.411 356.997 560.97C346.286 538.552 331.67 522.278 309.037 507.569C286.568 492.967 257.662 483.528 223.295 479.571C206.92 477.685 178.255 477.698 162.295 479.597ZM398.295 717.014V947.014H455.295H512.295V717.014V487.014H455.295H398.295V717.014ZM540.295 543.514V600.014H612.295H684.295V773.514V947.014H745.795H807.295V773.514V600.014H876.795H946.295V543.514V487.014H743.295H540.295V543.514Z"/>\n</svg>\n';

  // src/lib/our/icons.ts
  function stripComment2(svg) {
    return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
  }
  function inlineSvg(raw) {
    return stripComment2(raw).replace(/fill="#000000"/g, 'fill="currentColor"');
  }
  var MD2IT = inlineSvg(md2it_default);

  // src/icons.ts
  var INACTIVE_BG = "#012292";
  var TOOLBAR_VIEWBOX = 24;
  var TOOLBAR_RADIUS_RATIO = 0.18;
  var TOOLBAR_PAD_RATIO = 0.1;
  function stripComment3(svg) {
    return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
  }
  function innerSvgMarkup(svg) {
    const match = svg.match(/<svg[\s\S]*?>([\s\S]*)<\/svg>/i);
    return match ? match[1].trim() : svg;
  }
  var filesInner = innerSvgMarkup(stripComment3(files_default));
  var ABOUT_BULLET_ICONS = [
    COPY,
    FILE_DOWN,
    HISTORY,
    FILES,
    IMAGES,
    FILES,
    FILES,
    SHIELD_CHECK,
    SHIELD_CHECK,
    HEART
  ];
  function toolbarWelcomeIconSvg(bg = INACTIVE_BG, size = 16) {
    const r = TOOLBAR_VIEWBOX * TOOLBAR_RADIUS_RATIO;
    const pad = TOOLBAR_VIEWBOX * TOOLBAR_PAD_RATIO;
    const scale = (TOOLBAR_VIEWBOX - pad * 2) / TOOLBAR_VIEWBOX;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${TOOLBAR_VIEWBOX} ${TOOLBAR_VIEWBOX}" aria-hidden="true"><rect width="${TOOLBAR_VIEWBOX}" height="${TOOLBAR_VIEWBOX}" rx="${r}" fill="${bg}"/><g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(${pad} ${pad}) scale(${scale})">${filesInner}</g></svg>`;
  }

  // src/lib/our/panel-footer/constants.ts
  var PANEL_FOOTER_LINKEDIN_URL = "https://www.linkedin.com/in/alex-terekhov/";
  var PANEL_FOOTER_MD2IT_URL = "https://md2it.com";

  // src/lib/our/panel-footer/footer.ts
  var PANEL_FOOTER_LINKS = [
    { href: PANEL_FOOTER_LINKEDIN_URL, title: "LinkedIn", iconHtml: LINKEDIN },
    { href: PANEL_FOOTER_MD2IT_URL, title: "MD2IT", iconHtml: MD2IT }
  ];
  function createFooterLink(link) {
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.title = link.title;
    anchor.innerHTML = link.iconHtml;
    return anchor;
  }
  function attachPanelFooterLinks(footer) {
    for (const anchor of Array.from(
      footer.querySelectorAll("a[href]")
    )) {
      anchor.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }
  }
  function createPanelFooter(config) {
    const footer = document.createElement("div");
    footer.className = config.footerClassName;
    for (const link of PANEL_FOOTER_LINKS) {
      footer.appendChild(createFooterLink(link));
    }
    attachPanelFooterLinks(footer);
    return footer;
  }

  // src/lib/our/panel-header/header.ts
  function createPanelDivider() {
    const divider = document.createElement("div");
    divider.className = "dd-panel-divider";
    divider.setAttribute("aria-hidden", "true");
    return divider;
  }
  function createPanelHeader(options) {
    const header = document.createElement("div");
    header.className = "dd-panel-header";
    const titleRow = document.createElement("div");
    titleRow.className = "dd-panel-title-row";
    const logo = document.createElement("span");
    logo.className = "dd-panel-logo";
    logo.setAttribute("aria-hidden", "true");
    if (options.logoSvg) {
      logo.innerHTML = options.logoSvg;
    }
    const heading = document.createElement("div");
    heading.className = "dd-panel-heading";
    const title = document.createElement("p");
    title.className = "dd-panel-title";
    title.textContent = options.title;
    const subtitle = document.createElement("p");
    subtitle.className = "dd-panel-subtitle";
    subtitle.textContent = options.subtitle;
    heading.append(title, subtitle);
    titleRow.append(logo, heading);
    header.append(titleRow);
    return header;
  }

  // src/ui-config.ts
  var PANEL_FOOTER_CONFIG = {
    footerClassName: "ec-panel-footer"
  };

  // src/settings/theme-settings.ts
  async function getDarkThemeEnabled() {
    const data = await ext.storage.local.get(DARK_THEME_ENABLED_KEY);
    return data[DARK_THEME_ENABLED_KEY] === true;
  }
  async function setDarkThemeEnabled(enabled) {
    await ext.storage.local.set({ [DARK_THEME_ENABLED_KEY]: enabled });
  }

  // src/panel-popup/panel-menu.ts
  var START_ITEM = {
    tab: "start",
    iconSvg: PLAY,
    label: (s) => s.titleSettings
  };
  var COPIED_ITEM = {
    tab: "copied",
    iconSvg: FILES,
    label: (s) => s.tabCopied
  };
  var SECONDARY_MENU_ITEMS = [
    { tab: "settings", iconSvg: SETTINGS, label: (s) => s.pageSettingsTitle },
    { tab: "shortcuts", iconSvg: KEYBOARD, label: (s) => s.tabShortcuts },
    { tab: "about", iconSvg: INFO, label: (s) => s.tabAbout }
  ];
  function resolvePrimaryItem(hasCache) {
    return hasCache ? COPIED_ITEM : START_ITEM;
  }
  function resolveMenuItems(hasCache) {
    return [resolvePrimaryItem(hasCache), ...SECONDARY_MENU_ITEMS];
  }
  function createMenuButton(item, strings) {
    const label = item.label(strings);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ec-panel-menu-btn";
    button.innerHTML = item.iconSvg;
    button.setAttribute("aria-label", label);
    button.dataset.tooltip = label;
    return button;
  }
  function createPanelMenu(strings, hasCache) {
    const nav = document.createElement("nav");
    nav.className = "ec-panel-menu";
    nav.setAttribute("aria-label", "Panel pages");
    const buttons = /* @__PURE__ */ new Map();
    let primaryHasCache = hasCache;
    function mountItems(nextHasCache) {
      nav.replaceChildren();
      buttons.clear();
      for (const item of resolveMenuItems(nextHasCache)) {
        const button = createMenuButton(item, strings);
        buttons.set(item.tab, button);
        nav.append(button);
      }
      primaryHasCache = nextHasCache;
    }
    mountItems(hasCache);
    function syncStrings(nextStrings) {
      for (const item of resolveMenuItems(primaryHasCache)) {
        const button = buttons.get(item.tab);
        if (!button) continue;
        const label = item.label(nextStrings);
        button.setAttribute("aria-label", label);
        button.dataset.tooltip = label;
      }
    }
    const handle = {
      root: nav,
      setActive(tab) {
        for (const [menuTab, button] of buttons) {
          const active = tab !== null && menuTab === tab;
          button.classList.toggle("ec-panel-menu-btn--active", active);
          button.setAttribute("aria-current", active ? "page" : "false");
        }
      },
      syncStrings,
      setCacheState(nextHasCache) {
        if (nextHasCache === primaryHasCache) return;
        const activeTab = [...buttons.entries()].find(
          ([, button]) => button.classList.contains("ec-panel-menu-btn--active")
        )?.[0] ?? null;
        mountItems(nextHasCache);
        handle.setActive(activeTab);
      },
      onSelect: () => {
      }
    };
    nav.addEventListener("click", (event) => {
      const target = event.target?.closest(
        ".ec-panel-menu-btn"
      );
      if (!target) return;
      for (const [tab, button] of buttons) {
        if (button === target) {
          handle.onSelect(tab);
          return;
        }
      }
    });
    return handle;
  }

  // src/panel-popup/build-panel-surface.ts
  var PANEL_DARK_CLASS = "ec-panel--dark";
  async function createPanelSurface(locale, surface) {
    const panelRoot = document.createElement("div");
    panelRoot.className = "ec-panel";
    if (surface === "popup") {
      panelRoot.classList.add("ec-panel--surface-popup");
    }
    panelRoot.lang = localeToHtmlLang(locale);
    panelRoot.dir = isRtlLocale(locale) ? "rtl" : "ltr";
    const strings = t(locale);
    const header = createPanelHeader({
      title: PANEL_TITLE,
      subtitle: strings.panelSubtitle,
      logoSvg: toolbarWelcomeIconSvg()
    });
    const body = document.createElement("div");
    body.className = "ec-panel-body";
    const footer = createPanelFooter(PANEL_FOOTER_CONFIG);
    const topDivider = createPanelDivider();
    const bottomDivider = createPanelDivider();
    let menu = null;
    if (surface === "popup") {
      const hasCache = await hasPickCopyCacheInStorage();
      menu = createPanelMenu(strings, hasCache);
      const main = document.createElement("div");
      main.className = "ec-panel-main";
      const content = document.createElement("div");
      content.className = "ec-panel-content";
      content.append(topDivider, body, bottomDivider);
      main.append(menu.root, content);
      panelRoot.append(header, main, footer);
    } else {
      panelRoot.append(header, topDivider, body, bottomDivider, footer);
    }
    panelRoot.setAttribute(PANEL_POPUP_HOST_ATTR, "true");
    if (await getDarkThemeEnabled()) {
      panelRoot.classList.add(PANEL_DARK_CLASS);
    }
    return { panelRoot, body, menu };
  }

  // src/about.ts
  function buildAboutListItems(copy) {
    return copy.aboutBullets.map((text, index) => ({
      iconKind: "bool",
      iconHtml: ABOUT_BULLET_ICONS[index] ?? ABOUT_BULLET_ICONS[0],
      text
    }));
  }

  // src/formats/definitions.ts
  var COPY_FORMATS = [
    {
      id: "outerHTML",
      label: (s) => s.formatCode,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "selector",
      label: (s) => s.formatSelector,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "jsPath",
      label: (s) => s.formatJsPath,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "xpath",
      label: (s) => s.formatXPath,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "fullXPath",
      label: (s) => s.formatFullXPath,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "styles",
      label: (s) => s.formatStyles,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "computedStyles",
      label: (s) => s.formatComputedStyles,
      actionIcon: "copy",
      settingsGroup: "devtools"
    },
    {
      id: "text",
      label: (s) => s.formatText,
      actionIcon: "copy",
      settingsGroup: "clipboard-copy"
    },
    {
      id: "markdown",
      label: (s) => s.formatMarkdown,
      actionIcon: "copy",
      settingsGroup: "clipboard-copy"
    },
    {
      id: "png",
      label: (s) => s.formatPng,
      actionIcon: "images",
      settingsGroup: "clipboard-copy"
    },
    {
      id: "markdownFile",
      label: (s) => s.formatMarkdown,
      actionIcon: "file-down",
      settingsGroup: "files"
    },
    {
      id: "htmlFile",
      label: (s) => s.formatHtml,
      actionIcon: "file-down",
      settingsGroup: "files"
    },
    {
      id: "jpeg",
      label: (s) => s.formatJpeg,
      actionIcon: "images",
      settingsGroup: "copy-images"
    }
  ];
  function isClipboardCopyFormat(format) {
    return format.actionIcon === "copy";
  }
  var CLIPBOARD_COPY_FORMATS = COPY_FORMATS.filter(isClipboardCopyFormat);
  var DEFAULT_CLIPBOARD_FORMAT_ID = "text";
  var COPY_FORMAT_ID_VALUES = [
    ...COPY_FORMATS.map((format) => format.id),
    "url"
  ];
  function isCopyFormatId(value) {
    return COPY_FORMAT_ID_VALUES.some((formatId) => formatId === value);
  }
  var LEGACY_COPY_FORMAT_ID_ALIASES = {
    declaredStyles: "styles"
  };
  function normalizeCopyFormatId(value) {
    if (isCopyFormatId(value)) return value;
    if (typeof value === "string") {
      const aliased = LEGACY_COPY_FORMAT_ID_ALIASES[value];
      if (aliased) return aliased;
    }
    return void 0;
  }

  // src/lib/our/info-window/info-window.ts
  function createInfoWindowClasses(prefix) {
    return {
      overlay: `${prefix}-info-window-overlay`,
      window: `${prefix}-info-window`,
      close: `${prefix}-info-window-close`,
      content: `${prefix}-info-window-content`
    };
  }
  function createInfoWindow(options) {
    const { classes } = options;
    const overlay = document.createElement("div");
    overlay.className = classes.overlay;
    const windowEl = document.createElement("div");
    windowEl.className = classes.window;
    windowEl.setAttribute("role", "dialog");
    windowEl.setAttribute("aria-modal", "true");
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = classes.close;
    closeBtn.setAttribute("aria-label", options.closeLabel);
    closeBtn.innerHTML = options.closeIconHtml ?? "&times;";
    const content = document.createElement("div");
    content.className = classes.content;
    content.innerHTML = options.contentHtml;
    windowEl.append(closeBtn, content);
    overlay.append(windowEl);
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
      options.onClose?.();
    };
    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    }
    closeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      close();
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", onKeyDown, true);
    return { root: overlay, close };
  }

  // src/settings/compute-formats.ts
  var COMPUTE_IMAGES_FORMAT_IDS = ["png", "jpeg"];
  function defaultComputeFormatsSettings() {
    return {
      computeImages: true
    };
  }
  function isComputeControlledFormat(formatId) {
    return COMPUTE_IMAGES_FORMAT_IDS.includes(formatId);
  }
  function isFormatEnabledByComputeSettings(formatId, settings) {
    if (COMPUTE_IMAGES_FORMAT_IDS.includes(formatId)) return settings.computeImages;
    return true;
  }
  function readStoredBoolean(raw, fallback) {
    return typeof raw === "boolean" ? raw : fallback;
  }
  async function getComputeFormatsSettings() {
    const defaults = defaultComputeFormatsSettings();
    const data = await ext.storage.local.get(COMPUTE_IMAGES_ENABLED_KEY);
    return {
      computeImages: readStoredBoolean(data[COMPUTE_IMAGES_ENABLED_KEY], defaults.computeImages)
    };
  }
  async function setComputeImagesEnabled(enabled) {
    await ext.storage.local.set({ [COMPUTE_IMAGES_ENABLED_KEY]: enabled });
  }

  // src/settings/format-settings.ts
  var DEVTOOLS_FORMAT_IDS = COPY_FORMATS.filter(
    (format) => format.settingsGroup === "devtools"
  ).map((format) => format.id);
  function buildEnabledFormatsMap(developerToolsEnabled, compute) {
    return Object.fromEntries(
      COPY_FORMATS.map((format) => {
        if (format.settingsGroup === "devtools") {
          return [format.id, developerToolsEnabled];
        }
        return [format.id, isFormatEnabledByComputeSettings(format.id, compute)];
      })
    );
  }
  function defaultEnabledFormats() {
    return buildEnabledFormatsMap(true, {
      computeImages: true
    });
  }
  function migrateDeveloperToolsFromLegacyEnabledFormats(raw) {
    if (typeof raw !== "object" || raw === null) {
      return void 0;
    }
    const stored = raw;
    if (DEVTOOLS_FORMAT_IDS.some((id) => stored[id] === true)) {
      return true;
    }
    if (DEVTOOLS_FORMAT_IDS.every((id) => stored[id] === false)) {
      return false;
    }
    if (typeof stored.declaredStyles === "boolean" && typeof stored.styles !== "boolean") {
      if (stored.declaredStyles) return true;
    }
    return void 0;
  }
  async function getDeveloperToolsEnabled() {
    const data = await ext.storage.local.get([
      DEVELOPER_TOOLS_ENABLED_KEY,
      ENABLED_FORMATS_KEY
    ]);
    const stored = data[DEVELOPER_TOOLS_ENABLED_KEY];
    if (typeof stored === "boolean") {
      return stored;
    }
    const migrated = migrateDeveloperToolsFromLegacyEnabledFormats(
      data[ENABLED_FORMATS_KEY]
    );
    return migrated ?? true;
  }
  async function setDeveloperToolsEnabled(enabled) {
    await ext.storage.local.set({ [DEVELOPER_TOOLS_ENABLED_KEY]: enabled });
  }
  async function getEnabledFormats() {
    const [developerToolsEnabled, compute] = await Promise.all([
      getDeveloperToolsEnabled(),
      getComputeFormatsSettings()
    ]);
    return buildEnabledFormatsMap(developerToolsEnabled, compute);
  }
  function isDeveloperToolsGroup(group) {
    return group === "devtools";
  }
  var CLIPBOARD_DEFAULT_NOTHING = "nothing";
  var DEFAULT_ACTION_STORAGE_OPTIONS = [
    CLIPBOARD_DEFAULT_NOTHING,
    "copy:text",
    "copy:markdown",
    "copy:png",
    "download:markdownFile",
    "download:htmlFile",
    "download:png",
    "download:jpeg",
    "copy:outerHTML",
    "copy:selector",
    "copy:jsPath",
    "copy:xpath",
    "copy:fullXPath",
    "copy:styles",
    "copy:computedStyles"
  ];
  var IMAGE_DEFAULT_ACTION_STORAGE_VALUES = [
    "copy:png",
    "download:png",
    "download:jpeg"
  ];
  function isImageDefaultActionStorageValue(value) {
    return IMAGE_DEFAULT_ACTION_STORAGE_VALUES.includes(value);
  }
  function isImageDefaultAction(action) {
    return isImageDefaultActionStorageValue(encodeDefaultAction(action));
  }
  function isActiveDefaultAction(action) {
    return action !== CLIPBOARD_DEFAULT_NOTHING;
  }
  function encodeDefaultAction(action) {
    if (action === CLIPBOARD_DEFAULT_NOTHING) return CLIPBOARD_DEFAULT_NOTHING;
    return `${action.action}:${action.formatId}`;
  }
  function parseStoredDefaultAction(raw) {
    if (raw === CLIPBOARD_DEFAULT_NOTHING) {
      return CLIPBOARD_DEFAULT_NOTHING;
    }
    if (typeof raw === "string") {
      const colon = raw.indexOf(":");
      if (colon > 0) {
        const kind = raw.slice(0, colon);
        const formatId = normalizeCopyFormatId(raw.slice(colon + 1));
        if (formatId && (kind === "copy" || kind === "download")) {
          return { formatId, action: kind };
        }
      }
      const legacyFormatId = normalizeCopyFormatId(raw);
      if (legacyFormatId) {
        return { formatId: legacyFormatId, action: "copy" };
      }
    }
    return { formatId: DEFAULT_CLIPBOARD_FORMAT_ID, action: "copy" };
  }
  function defaultDefaultAction() {
    return { formatId: DEFAULT_CLIPBOARD_FORMAT_ID, action: "copy" };
  }
  async function getDefaultAction() {
    const data = await ext.storage.local.get(CLIPBOARD_DEFAULT_FORMAT_KEY);
    const raw = data[CLIPBOARD_DEFAULT_FORMAT_KEY];
    if (raw === void 0) {
      return defaultDefaultAction();
    }
    return parseStoredDefaultAction(raw);
  }
  async function setDefaultAction(action) {
    await ext.storage.local.set({
      [CLIPBOARD_DEFAULT_FORMAT_KEY]: encodeDefaultAction(action)
    });
  }
  async function ensureDefaultActionAllowsComputeImages() {
    const [compute, action] = await Promise.all([
      getComputeFormatsSettings(),
      getDefaultAction()
    ]);
    if (compute.computeImages || !isImageDefaultAction(action)) {
      return action;
    }
    const reset = defaultDefaultAction();
    await setDefaultAction(reset);
    return reset;
  }

  // src/settings/inline-images.ts
  var DEFAULT_INLINE_IMAGES_MODE = "all";
  var INLINE_IMAGES_MODES = [
    "all",
    "remove-large",
    "remove-small",
    "remove-all"
  ];
  function normalizeInlineImagesMode(raw) {
    return INLINE_IMAGES_MODES.includes(raw) ? raw : DEFAULT_INLINE_IMAGES_MODE;
  }
  async function getInlineImagesMode() {
    const data = await ext.storage.local.get(INLINE_IMAGES_KEY);
    return normalizeInlineImagesMode(data[INLINE_IMAGES_KEY]);
  }
  async function setInlineImagesMode(mode) {
    await ext.storage.local.set({ [INLINE_IMAGES_KEY]: mode });
  }

  // src/settings/frame-label-style.ts
  var DEFAULT_FRAME_LABEL_STYLE = "click-to-copy";
  var FRAME_LABEL_STYLES = [
    "none",
    "click-to-copy",
    "tag-id-class",
    "selector",
    "full-xpath"
  ];
  function normalizeFrameLabelStyle(raw) {
    return FRAME_LABEL_STYLES.includes(raw) ? raw : DEFAULT_FRAME_LABEL_STYLE;
  }
  async function getFrameLabelStyle() {
    const data = await ext.storage.local.get(FRAME_LABEL_STYLE_KEY);
    return normalizeFrameLabelStyle(data[FRAME_LABEL_STYLE_KEY]);
  }
  async function setFrameLabelStyle(style) {
    await ext.storage.local.set({ [FRAME_LABEL_STYLE_KEY]: style });
  }

  // src/panel-popup/panel-theme.ts
  var HOST_DARK_CLASS = "ec-panel-popup--dark";
  var PANEL_DARK_CLASS2 = "ec-panel--dark";
  var themeSyncBound = false;
  function applyPanelTheme(enabled) {
    const host = document.getElementById(PANEL_POPUP_ROOT_ID);
    host?.classList.toggle(HOST_DARK_CLASS, enabled);
    host?.shadowRoot?.querySelectorAll(".ec-panel").forEach((panel) => panel.classList.toggle(PANEL_DARK_CLASS2, enabled));
  }
  async function syncPanelThemeFromStorage() {
    applyPanelTheme(await getDarkThemeEnabled());
  }
  function bindPanelThemeSync() {
    if (themeSyncBound) return;
    themeSyncBound = true;
    ext.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[DARK_THEME_ENABLED_KEY]) return;
      applyPanelTheme(changes[DARK_THEME_ENABLED_KEY].newValue === true);
    });
  }

  // src/panel-popup/toggle-row.ts
  var toggleRowIdCounter = 0;
  function createToggleRow(labelText, enabled, onChange) {
    const row = document.createElement("div");
    row.className = "ec-toggle-row";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "ec-toggle";
    toggle.id = `ec-toggle-${++toggleRowIdCounter}`;
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-checked", enabled ? "true" : "false");
    toggle.setAttribute("aria-label", labelText);
    const label = document.createElement("label");
    label.className = "ec-toggle-label";
    label.htmlFor = toggle.id;
    label.textContent = labelText;
    const sync = (on) => {
      toggle.classList.toggle("is-on", on);
      toggle.setAttribute("aria-checked", on ? "true" : "false");
    };
    sync(enabled);
    toggle.addEventListener("click", () => {
      const next2 = !toggle.classList.contains("is-on");
      sync(next2);
      onChange(next2);
    });
    row.append(label, toggle);
    return row;
  }

  // src/lib/our/copy/cleanup/constants.ts
  var OMIT_TAGS = /* @__PURE__ */ new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEMPLATE",
    "OBJECT",
    "EMBED",
    "IFRAME",
    "CANVAS",
    "LINK",
    "META",
    "BASE"
  ]);
  var LIST_TAGS2 = /* @__PURE__ */ new Set(["UL", "OL"]);

  // src/lib/our/copy/cleanup/sanitize.ts
  function isDerivativeFormatNoiseNode(node) {
    if (node.nodeType === Node.COMMENT_NODE) return true;
    return node instanceof Element && node.tagName === "NOSCRIPT";
  }
  function removeNoscriptAndComments(root2) {
    const ownerDocument = root2.ownerDocument;
    if (!ownerDocument) return;
    const walker = ownerDocument.createTreeWalker(
      root2,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT
    );
    const toRemove = [];
    let node = walker.nextNode();
    while (node) {
      if (isDerivativeFormatNoiseNode(node)) {
        toRemove.push(node);
      }
      node = walker.nextNode();
    }
    for (const node2 of toRemove) {
      node2.parentNode?.removeChild(node2);
    }
  }
  function sanitizeClipboardHtml(root2) {
    const doc = root2.ownerDocument;
    const walker = doc.createTreeWalker(root2, NodeFilter.SHOW_ELEMENT);
    const toRemove = [];
    let node = walker.currentNode;
    while (node) {
      if (OMIT_TAGS.has(node.tagName) || node.tagName === "SVG") {
        toRemove.push(node);
      } else {
        for (const attr of [...node.attributes]) {
          const name = attr.name.toLowerCase();
          if (name.startsWith("on") || name === "contenteditable") {
            node.removeAttribute(attr.name);
          }
        }
      }
      node = walker.nextNode();
    }
    for (const el of toRemove) {
      el.remove();
    }
  }
  function pruneHiddenEmptyTableRows(root2) {
    for (const row of root2.querySelectorAll("tr")) {
      const style = row.getAttribute("style") ?? "";
      if (!/display\s*:\s*none/i.test(style)) continue;
      if ((row.textContent ?? "").trim()) continue;
      row.remove();
    }
  }

  // src/lib/vendor/modern-screenshot/dist/index.mjs
  var _P = "p".charCodeAt(0);
  var _H = "H".charCodeAt(0);
  var _Y = "Y".charCodeAt(0);
  var _S = "s".charCodeAt(0);
  var PREFIX = "[modern-screenshot]";
  var IN_BROWSER = typeof window !== "undefined";
  var SUPPORT_WEB_WORKER = IN_BROWSER && "Worker" in window;
  var SUPPORT_ATOB = IN_BROWSER && "atob" in window;
  var SUPPORT_BTOA = IN_BROWSER && "btoa" in window;
  var USER_AGENT = IN_BROWSER ? window.navigator?.userAgent : "";
  var IN_CHROME = USER_AGENT.includes("Chrome");
  var IN_SAFARI = USER_AGENT.includes("AppleWebKit") && !IN_CHROME;
  var IN_FIREFOX = USER_AGENT.includes("Firefox");
  var isContext = (value) => value && "__CONTEXT__" in value;
  var isCssFontFaceRule = (rule) => rule.constructor.name === "CSSFontFaceRule";
  var isCSSImportRule = (rule) => rule.constructor.name === "CSSImportRule";
  var isLayerBlockRule = (rule) => rule.constructor.name === "CSSLayerBlockRule";
  var isElementNode = (node) => node.nodeType === 1;
  var isSVGElementNode = (node) => typeof node.className === "object";
  var isSVGImageElementNode = (node) => node.tagName === "image";
  var isSVGUseElementNode = (node) => node.tagName === "use";
  var isHTMLElementNode = (node) => isElementNode(node) && typeof node.style !== "undefined" && !isSVGElementNode(node);
  var isCommentNode = (node) => node.nodeType === 8;
  var isTextNode = (node) => node.nodeType === 3;
  var isImageElement = (node) => node.tagName === "IMG";
  var isVideoElement = (node) => node.tagName === "VIDEO";
  var isCanvasElement = (node) => node.tagName === "CANVAS";
  var isTextareaElement = (node) => node.tagName === "TEXTAREA";
  var isInputElement = (node) => node.tagName === "INPUT";
  var isStyleElement = (node) => node.tagName === "STYLE";
  var isScriptElement = (node) => node.tagName === "SCRIPT";
  var isSelectElement = (node) => node.tagName === "SELECT";
  var isSlotElement = (node) => node.tagName === "SLOT";
  var isIFrameElement = (node) => node.tagName === "IFRAME";
  var consoleWarn = (...args) => console.warn(PREFIX, ...args);
  function supportWebp(ownerDocument) {
    const canvas = ownerDocument?.createElement?.("canvas");
    if (canvas) {
      canvas.height = canvas.width = 1;
    }
    return Boolean(canvas) && "toDataURL" in canvas && Boolean(canvas.toDataURL("image/webp").includes("image/webp"));
  }
  var isDataUrl = (url) => url.startsWith("data:");
  function resolveUrl(url, baseUrl) {
    if (url.match(/^[a-z]+:\/\//i))
      return url;
    if (IN_BROWSER && url.match(/^\/\//))
      return window.location.protocol + url;
    if (url.match(/^[a-z]+:/i))
      return url;
    if (!IN_BROWSER)
      return url;
    const doc = getDocument().implementation.createHTMLDocument();
    const base = doc.createElement("base");
    const a = doc.createElement("a");
    doc.head.appendChild(base);
    doc.body.appendChild(a);
    if (baseUrl)
      base.href = baseUrl;
    a.href = url;
    return a.href;
  }
  function getDocument(target) {
    return (target && isElementNode(target) ? target?.ownerDocument : target) ?? window.document;
  }
  var XMLNS = "http://www.w3.org/2000/svg";
  function createSvg(width, height, ownerDocument) {
    const svg = getDocument(ownerDocument).createElementNS(XMLNS, "svg");
    svg.setAttributeNS(null, "width", width.toString());
    svg.setAttributeNS(null, "height", height.toString());
    svg.setAttributeNS(null, "viewBox", `0 0 ${width} ${height}`);
    return svg;
  }
  function svgToDataUrl(svg, removeControlCharacter) {
    let xhtml = new XMLSerializer().serializeToString(svg);
    if (removeControlCharacter) {
      xhtml = xhtml.replace(/[\u0000-\u0008\v\f\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/gu, "");
    }
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xhtml)}`;
  }
  function readBlob(blob, type) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.onabort = () => reject(new Error(`Failed read blob to ${type}`));
      if (type === "dataUrl") {
        reader.readAsDataURL(blob);
      } else if (type === "arrayBuffer") {
        reader.readAsArrayBuffer(blob);
      }
    });
  }
  var blobToDataUrl = (blob) => readBlob(blob, "dataUrl");
  function createImage(url, ownerDocument) {
    const img = getDocument(ownerDocument).createElement("img");
    img.decoding = "sync";
    img.loading = "eager";
    img.src = url;
    return img;
  }
  function loadMedia(media, options) {
    return new Promise((resolve) => {
      const { timeout, ownerDocument, onError: userOnError, onWarn } = options ?? {};
      const node = typeof media === "string" ? createImage(media, getDocument(ownerDocument)) : media;
      let timer = null;
      let removeEventListeners = null;
      function onResolve() {
        resolve(node);
        timer && clearTimeout(timer);
        removeEventListeners?.();
      }
      if (timeout) {
        timer = setTimeout(onResolve, timeout);
      }
      if (isVideoElement(node)) {
        const currentSrc = node.currentSrc || node.src;
        if (!currentSrc) {
          if (node.poster) {
            return loadMedia(node.poster, options).then(resolve);
          }
          return onResolve();
        }
        if (node.readyState >= 2) {
          return onResolve();
        }
        const onLoadeddata = onResolve;
        const onError = (error) => {
          onWarn?.(
            "Failed video load",
            currentSrc,
            error
          );
          userOnError?.(error);
          onResolve();
        };
        removeEventListeners = () => {
          node.removeEventListener("loadeddata", onLoadeddata);
          node.removeEventListener("error", onError);
        };
        node.addEventListener("loadeddata", onLoadeddata, { once: true });
        node.addEventListener("error", onError, { once: true });
      } else {
        const currentSrc = isSVGImageElementNode(node) ? node.href.baseVal : node.currentSrc || node.src;
        if (!currentSrc) {
          return onResolve();
        }
        const onLoad = async () => {
          if (isImageElement(node) && "decode" in node) {
            try {
              await node.decode();
            } catch (error) {
              onWarn?.(
                "Failed to decode image, trying to render anyway",
                node.dataset.originalSrc || currentSrc,
                error
              );
            }
          }
          onResolve();
        };
        const onError = (error) => {
          onWarn?.(
            "Failed image load",
            node.dataset.originalSrc || currentSrc,
            error
          );
          onResolve();
        };
        if (isImageElement(node) && node.complete) {
          return onLoad();
        }
        removeEventListeners = () => {
          node.removeEventListener("load", onLoad);
          node.removeEventListener("error", onError);
        };
        node.addEventListener("load", onLoad, { once: true });
        node.addEventListener("error", onError, { once: true });
      }
    });
  }
  async function waitUntilLoad(node, options) {
    if (isHTMLElementNode(node)) {
      if (isImageElement(node) || isVideoElement(node)) {
        await loadMedia(node, options);
      } else {
        await Promise.all(
          ["img", "video"].flatMap((selectors) => {
            return Array.from(node.querySelectorAll(selectors)).map((el) => loadMedia(el, options));
          })
        );
      }
    }
  }
  var uuid = /* @__PURE__ */ (function uuid2() {
    let counter = 0;
    const random = () => `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4);
    return () => {
      counter += 1;
      return `u${random()}${counter}`;
    };
  })();
  function splitFontFamily(fontFamily) {
    return fontFamily?.split(",").map((val) => val.trim().replace(/"|'/g, "").toLowerCase()).filter(Boolean);
  }
  var uid = 0;
  function createLogger(debug) {
    const prefix = `${PREFIX}[#${uid}]`;
    uid++;
    return {
      // eslint-disable-next-line no-console
      time: (label) => debug && console.time(`${prefix} ${label}`),
      // eslint-disable-next-line no-console
      timeEnd: (label) => debug && console.timeEnd(`${prefix} ${label}`),
      warn: (...args) => debug && consoleWarn(...args)
    };
  }
  function getDefaultRequestInit(bypassingCache) {
    return {
      cache: bypassingCache ? "no-cache" : "force-cache"
    };
  }
  async function orCreateContext(node, options) {
    return isContext(node) ? node : createContext(node, { ...options, autoDestruct: true });
  }
  async function createContext(node, options) {
    const { scale = 1, workerUrl, workerNumber = 1 } = options || {};
    const debug = Boolean(options?.debug);
    const features = options?.features ?? true;
    const ownerDocument = node.ownerDocument ?? (IN_BROWSER ? window.document : void 0);
    const ownerWindow = node.ownerDocument?.defaultView ?? (IN_BROWSER ? window : void 0);
    const requests = /* @__PURE__ */ new Map();
    const context = {
      // Options
      width: 0,
      height: 0,
      quality: 1,
      type: "image/png",
      scale,
      backgroundColor: null,
      style: null,
      filter: null,
      maximumCanvasSize: 0,
      timeout: 3e4,
      progress: null,
      debug,
      fetch: {
        requestInit: getDefaultRequestInit(options?.fetch?.bypassingCache),
        placeholderImage: "data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        bypassingCache: false,
        ...options?.fetch
      },
      fetchFn: null,
      font: {},
      drawImageInterval: 100,
      workerUrl: null,
      workerNumber,
      onCloneEachNode: null,
      onCloneNode: null,
      onEmbedNode: null,
      onCreateForeignObjectSvg: null,
      includeStyleProperties: null,
      autoDestruct: false,
      ...options,
      // InternalContext
      __CONTEXT__: true,
      log: createLogger(debug),
      node,
      ownerDocument,
      ownerWindow,
      dpi: scale === 1 ? null : 96 * scale,
      svgStyleElement: createStyleElement(ownerDocument),
      svgDefsElement: ownerDocument?.createElementNS(XMLNS, "defs"),
      svgStyles: /* @__PURE__ */ new Map(),
      defaultComputedStyles: /* @__PURE__ */ new Map(),
      workers: [
        ...Array.from({
          length: SUPPORT_WEB_WORKER && workerUrl && workerNumber ? workerNumber : 0
        })
      ].map(() => {
        try {
          const worker = new Worker(workerUrl);
          worker.onmessage = async (event) => {
            const { url, result } = event.data;
            if (result) {
              requests.get(url)?.resolve?.(result);
            } else {
              requests.get(url)?.reject?.(new Error(`Error receiving message from worker: ${url}`));
            }
          };
          worker.onmessageerror = (event) => {
            const { url } = event.data;
            requests.get(url)?.reject?.(new Error(`Error receiving message from worker: ${url}`));
          };
          return worker;
        } catch (error) {
          context.log.warn("Failed to new Worker", error);
          return null;
        }
      }).filter(Boolean),
      fontFamilies: /* @__PURE__ */ new Map(),
      fontCssTexts: /* @__PURE__ */ new Map(),
      acceptOfImage: `${[
        supportWebp(ownerDocument) && "image/webp",
        "image/svg+xml",
        "image/*",
        "*/*"
      ].filter(Boolean).join(",")};q=0.8`,
      requests,
      drawImageCount: 0,
      tasks: [],
      features,
      isEnable: (key) => {
        if (key === "restoreScrollPosition") {
          return typeof features === "boolean" ? false : features[key] ?? false;
        }
        if (typeof features === "boolean") {
          return features;
        }
        return features[key] ?? true;
      },
      shadowRoots: []
    };
    context.log.time("wait until load");
    await waitUntilLoad(node, { timeout: context.timeout, onWarn: context.log.warn });
    context.log.timeEnd("wait until load");
    const { width, height } = resolveBoundingBox(node, context);
    context.width = width;
    context.height = height;
    return context;
  }
  function createStyleElement(ownerDocument) {
    if (!ownerDocument)
      return void 0;
    const style = ownerDocument.createElement("style");
    const cssText = style.ownerDocument.createTextNode(`
.______background-clip--text {
  background-clip: text;
  -webkit-background-clip: text;
}
`);
    style.appendChild(cssText);
    return style;
  }
  function resolveBoundingBox(node, context) {
    let { width, height } = context;
    if (isElementNode(node) && (!width || !height)) {
      const box = node.getBoundingClientRect();
      width = width || box.width || Number(node.getAttribute("width")) || 0;
      height = height || box.height || Number(node.getAttribute("height")) || 0;
    }
    return { width, height };
  }
  async function imageToCanvas(image, context) {
    const {
      log,
      timeout,
      drawImageCount,
      drawImageInterval
    } = context;
    log.time("image to canvas");
    const loaded = await loadMedia(image, { timeout, onWarn: context.log.warn });
    const { canvas, context2d } = createCanvas(image.ownerDocument, context);
    const drawImage = () => {
      try {
        context2d?.drawImage(loaded, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        context.log.warn("Failed to drawImage", error);
      }
    };
    drawImage();
    if (context.isEnable("fixSvgXmlDecode")) {
      for (let i = 0; i < drawImageCount; i++) {
        await new Promise((resolve) => {
          setTimeout(() => {
            context2d?.clearRect(0, 0, canvas.width, canvas.height);
            drawImage();
            resolve();
          }, i + drawImageInterval);
        });
      }
    }
    context.drawImageCount = 0;
    log.timeEnd("image to canvas");
    return canvas;
  }
  function createCanvas(ownerDocument, context) {
    const { width, height, scale, backgroundColor, maximumCanvasSize: max } = context;
    const canvas = ownerDocument.createElement("canvas");
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    if (max) {
      if (canvas.width > max || canvas.height > max) {
        if (canvas.width > max && canvas.height > max) {
          if (canvas.width > canvas.height) {
            canvas.height *= max / canvas.width;
            canvas.width = max;
          } else {
            canvas.width *= max / canvas.height;
            canvas.height = max;
          }
        } else if (canvas.width > max) {
          canvas.height *= max / canvas.width;
          canvas.width = max;
        } else {
          canvas.width *= max / canvas.height;
          canvas.height = max;
        }
      }
    }
    const context2d = canvas.getContext("2d");
    if (context2d && backgroundColor) {
      context2d.fillStyle = backgroundColor;
      context2d.fillRect(0, 0, canvas.width, canvas.height);
    }
    return { canvas, context2d };
  }
  function cloneCanvas(canvas, context) {
    if (canvas.ownerDocument) {
      try {
        const dataURL = canvas.toDataURL();
        if (dataURL !== "data:,") {
          return createImage(dataURL, canvas.ownerDocument);
        }
      } catch (error) {
        context.log.warn("Failed to clone canvas", error);
      }
    }
    const cloned = canvas.cloneNode(false);
    const ctx = canvas.getContext("2d");
    const clonedCtx = cloned.getContext("2d");
    try {
      if (ctx && clonedCtx) {
        clonedCtx.putImageData(
          ctx.getImageData(0, 0, canvas.width, canvas.height),
          0,
          0
        );
      }
      return cloned;
    } catch (error) {
      context.log.warn("Failed to clone canvas", error);
    }
    return cloned;
  }
  function cloneIframe(iframe, context) {
    try {
      if (iframe?.contentDocument?.documentElement) {
        return cloneNode(iframe.contentDocument.documentElement, context);
      }
    } catch (error) {
      context.log.warn("Failed to clone iframe", error);
    }
    return iframe.cloneNode(false);
  }
  function cloneImage(image) {
    const cloned = image.cloneNode(false);
    if (image.currentSrc && image.currentSrc !== image.src) {
      cloned.src = image.currentSrc;
      cloned.srcset = "";
    }
    if (cloned.loading === "lazy") {
      cloned.loading = "eager";
    }
    return cloned;
  }
  async function cloneVideo(video, context) {
    if (video.ownerDocument && !video.currentSrc && video.poster) {
      return createImage(video.poster, video.ownerDocument);
    }
    const cloned = video.cloneNode(false);
    cloned.crossOrigin = "anonymous";
    if (video.currentSrc && video.currentSrc !== video.src) {
      cloned.src = video.currentSrc;
    }
    const ownerDocument = cloned.ownerDocument;
    if (ownerDocument) {
      let canPlay = true;
      await loadMedia(cloned, { onError: () => canPlay = false, onWarn: context.log.warn });
      if (!canPlay) {
        if (video.poster) {
          return createImage(video.poster, video.ownerDocument);
        }
        return cloned;
      }
      cloned.currentTime = video.currentTime;
      await new Promise((resolve) => {
        cloned.addEventListener("seeked", resolve, { once: true });
      });
      const canvas = ownerDocument.createElement("canvas");
      canvas.width = video.offsetWidth;
      canvas.height = video.offsetHeight;
      try {
        const ctx = canvas.getContext("2d");
        if (ctx)
          ctx.drawImage(cloned, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        context.log.warn("Failed to clone video", error);
        if (video.poster) {
          return createImage(video.poster, video.ownerDocument);
        }
        return cloned;
      }
      return cloneCanvas(canvas, context);
    }
    return cloned;
  }
  function cloneElement(node, context) {
    if (isCanvasElement(node)) {
      return cloneCanvas(node, context);
    }
    if (isIFrameElement(node)) {
      return cloneIframe(node, context);
    }
    if (isImageElement(node)) {
      return cloneImage(node);
    }
    if (isVideoElement(node)) {
      return cloneVideo(node, context);
    }
    return node.cloneNode(false);
  }
  function getSandBox(context) {
    let sandbox = context.sandbox;
    if (!sandbox) {
      const { ownerDocument } = context;
      try {
        if (ownerDocument) {
          sandbox = ownerDocument.createElement("iframe");
          sandbox.id = `__SANDBOX__${uuid()}`;
          sandbox.width = "0";
          sandbox.height = "0";
          sandbox.style.visibility = "hidden";
          sandbox.style.position = "fixed";
          ownerDocument.body.appendChild(sandbox);
          sandbox.srcdoc = '<!DOCTYPE html><meta charset="UTF-8"><title></title><body>';
          context.sandbox = sandbox;
        }
      } catch (error) {
        context.log.warn("Failed to getSandBox", error);
      }
    }
    return sandbox;
  }
  var ignoredStyles = [
    "width",
    "height",
    "-webkit-text-fill-color"
  ];
  var includedAttributes = [
    "stroke",
    "fill"
  ];
  function getDefaultStyle(node, pseudoElement, context) {
    const { defaultComputedStyles } = context;
    const nodeName = node.nodeName.toLowerCase();
    const isSvgNode = isSVGElementNode(node) && nodeName !== "svg";
    const attributes = isSvgNode ? includedAttributes.map((name) => [name, node.getAttribute(name)]).filter(([, value]) => value !== null) : [];
    const key = [
      isSvgNode && "svg",
      nodeName,
      attributes.map((name, value) => `${name}=${value}`).join(","),
      pseudoElement
    ].filter(Boolean).join(":");
    if (defaultComputedStyles.has(key))
      return defaultComputedStyles.get(key);
    const sandbox = getSandBox(context);
    const sandboxWindow = sandbox?.contentWindow;
    if (!sandboxWindow)
      return /* @__PURE__ */ new Map();
    const sandboxDocument = sandboxWindow?.document;
    let root2;
    let el;
    if (isSvgNode) {
      root2 = sandboxDocument.createElementNS(XMLNS, "svg");
      el = root2.ownerDocument.createElementNS(root2.namespaceURI, nodeName);
      attributes.forEach(([name, value]) => {
        el.setAttributeNS(null, name, value);
      });
      root2.appendChild(el);
    } else {
      root2 = el = sandboxDocument.createElement(nodeName);
    }
    el.textContent = " ";
    sandboxDocument.body.appendChild(root2);
    const computedStyle = sandboxWindow.getComputedStyle(el, pseudoElement);
    const styles = /* @__PURE__ */ new Map();
    for (let len = computedStyle.length, i = 0; i < len; i++) {
      const name = computedStyle.item(i);
      if (ignoredStyles.includes(name))
        continue;
      styles.set(name, computedStyle.getPropertyValue(name));
    }
    sandboxDocument.body.removeChild(root2);
    defaultComputedStyles.set(key, styles);
    return styles;
  }
  function getDiffStyle(style, defaultStyle, includeStyleProperties) {
    const diffStyle = /* @__PURE__ */ new Map();
    const prefixs = [];
    const prefixTree = /* @__PURE__ */ new Map();
    if (includeStyleProperties) {
      for (const name of includeStyleProperties) {
        applyTo(name);
      }
    } else {
      for (let len = style.length, i = 0; i < len; i++) {
        const name = style.item(i);
        applyTo(name);
      }
    }
    for (let len = prefixs.length, i = 0; i < len; i++) {
      prefixTree.get(prefixs[i])?.forEach((value, name) => diffStyle.set(name, value));
    }
    function applyTo(name) {
      const value = style.getPropertyValue(name);
      const priority = style.getPropertyPriority(name);
      const subIndex = name.lastIndexOf("-");
      const prefix = subIndex > -1 ? name.substring(0, subIndex) : void 0;
      if (prefix) {
        let map = prefixTree.get(prefix);
        if (!map) {
          map = /* @__PURE__ */ new Map();
          prefixTree.set(prefix, map);
        }
        map.set(name, [value, priority]);
      }
      if (defaultStyle.get(name) === value && !priority)
        return;
      if (prefix) {
        prefixs.push(prefix);
      } else {
        diffStyle.set(name, [value, priority]);
      }
    }
    return diffStyle;
  }
  function copyCssStyles(node, cloned, isRoot, context) {
    const { ownerWindow, includeStyleProperties, currentParentNodeStyle } = context;
    const clonedStyle = cloned.style;
    const computedStyle = ownerWindow.getComputedStyle(node);
    const defaultStyle = getDefaultStyle(node, null, context);
    currentParentNodeStyle?.forEach((_, key) => {
      defaultStyle.delete(key);
    });
    const style = getDiffStyle(computedStyle, defaultStyle, includeStyleProperties);
    style.delete("transition-property");
    style.delete("all");
    style.delete("d");
    style.delete("content");
    if (isRoot) {
      style.delete("position");
      style.delete("margin-top");
      style.delete("margin-right");
      style.delete("margin-bottom");
      style.delete("margin-left");
      style.delete("margin-block-start");
      style.delete("margin-block-end");
      style.delete("margin-inline-start");
      style.delete("margin-inline-end");
      style.set("box-sizing", ["border-box", ""]);
    }
    if (style.get("background-clip")?.[0] === "text") {
      cloned.classList.add("______background-clip--text");
    }
    if (IN_CHROME) {
      if (!style.has("font-kerning"))
        style.set("font-kerning", ["normal", ""]);
      if ((style.get("overflow-x")?.[0] === "hidden" || style.get("overflow-y")?.[0] === "hidden") && style.get("text-overflow")?.[0] === "ellipsis" && node.scrollWidth === node.clientWidth) {
        style.set("text-overflow", ["clip", ""]);
      }
    }
    for (let len = clonedStyle.length, i = 0; i < len; i++) {
      clonedStyle.removeProperty(clonedStyle.item(i));
    }
    style.forEach(([value, priority], name) => {
      clonedStyle.setProperty(name, value, priority);
    });
    return style;
  }
  function copyInputValue(node, cloned) {
    if (isTextareaElement(node) || isInputElement(node) || isSelectElement(node)) {
      cloned.setAttribute("value", node.value);
    }
  }
  var pseudoClasses = [
    "::before",
    "::after"
    // '::placeholder', TODO
  ];
  var scrollbarPseudoClasses = [
    "::-webkit-scrollbar",
    "::-webkit-scrollbar-button",
    // '::-webkit-scrollbar:horizontal', TODO
    "::-webkit-scrollbar-thumb",
    "::-webkit-scrollbar-track",
    "::-webkit-scrollbar-track-piece",
    // '::-webkit-scrollbar:vertical', TODO
    "::-webkit-scrollbar-corner",
    "::-webkit-resizer"
  ];
  function copyPseudoClass(node, cloned, copyScrollbar, context, addWordToFontFamilies) {
    const { ownerWindow, svgStyleElement, svgStyles, currentNodeStyle } = context;
    if (!svgStyleElement || !ownerWindow)
      return;
    function copyBy(pseudoClass) {
      const computedStyle = ownerWindow.getComputedStyle(node, pseudoClass);
      let content = computedStyle.getPropertyValue("content");
      if (!content || content === "none")
        return;
      addWordToFontFamilies?.(content);
      content = content.replace(/(')|(")|(counter\(.+\))/g, "");
      const klasses = [uuid()];
      const defaultStyle = getDefaultStyle(node, pseudoClass, context);
      currentNodeStyle?.forEach((_, key) => {
        defaultStyle.delete(key);
      });
      const style = getDiffStyle(computedStyle, defaultStyle, context.includeStyleProperties);
      style.delete("content");
      style.delete("-webkit-locale");
      if (style.get("background-clip")?.[0] === "text") {
        cloned.classList.add("______background-clip--text");
      }
      const cloneStyle = [
        `content: '${content}';`
      ];
      style.forEach(([value, priority], name) => {
        cloneStyle.push(`${name}: ${value}${priority ? " !important" : ""};`);
      });
      if (cloneStyle.length === 1)
        return;
      try {
        cloned.className = [cloned.className, ...klasses].join(" ");
      } catch (err) {
        context.log.warn("Failed to copyPseudoClass", err);
        return;
      }
      const cssText = cloneStyle.join("\n  ");
      let allClasses = svgStyles.get(cssText);
      if (!allClasses) {
        allClasses = [];
        svgStyles.set(cssText, allClasses);
      }
      allClasses.push(`.${klasses[0]}${pseudoClass}`);
    }
    pseudoClasses.forEach(copyBy);
    if (copyScrollbar)
      scrollbarPseudoClasses.forEach(copyBy);
  }
  var excludeParentNodes = /* @__PURE__ */ new Set([
    "symbol"
    // test/fixtures/svg.symbol.html
  ]);
  async function appendChildNode(node, cloned, child, context, addWordToFontFamilies) {
    if (isElementNode(child) && (isStyleElement(child) || isScriptElement(child)))
      return;
    if (context.filter && !context.filter(child))
      return;
    if (excludeParentNodes.has(cloned.nodeName) || excludeParentNodes.has(child.nodeName)) {
      context.currentParentNodeStyle = void 0;
    } else {
      context.currentParentNodeStyle = context.currentNodeStyle;
    }
    const childCloned = await cloneNode(child, context, false, addWordToFontFamilies);
    if (context.isEnable("restoreScrollPosition")) {
      restoreScrollPosition(node, childCloned);
    }
    cloned.appendChild(childCloned);
  }
  async function cloneChildNodes(node, cloned, context, addWordToFontFamilies) {
    let firstChild = node.firstChild;
    if (isElementNode(node)) {
      if (node.shadowRoot) {
        firstChild = node.shadowRoot?.firstChild;
        context.shadowRoots.push(node.shadowRoot);
      }
    }
    for (let child = firstChild; child; child = child.nextSibling) {
      if (isCommentNode(child))
        continue;
      if (isElementNode(child) && isSlotElement(child) && typeof child.assignedNodes === "function") {
        const nodes = child.assignedNodes();
        for (let i = 0; i < nodes.length; i++) {
          await appendChildNode(node, cloned, nodes[i], context, addWordToFontFamilies);
        }
      } else {
        await appendChildNode(node, cloned, child, context, addWordToFontFamilies);
      }
    }
  }
  function restoreScrollPosition(node, chlidCloned) {
    if (!isHTMLElementNode(node) || !isHTMLElementNode(chlidCloned))
      return;
    const { scrollTop, scrollLeft } = node;
    if (!scrollTop && !scrollLeft) {
      return;
    }
    const { transform } = chlidCloned.style;
    const matrix = new DOMMatrix(transform);
    const { a, b, c, d } = matrix;
    matrix.a = 1;
    matrix.b = 0;
    matrix.c = 0;
    matrix.d = 1;
    matrix.translateSelf(-scrollLeft, -scrollTop);
    matrix.a = a;
    matrix.b = b;
    matrix.c = c;
    matrix.d = d;
    chlidCloned.style.transform = matrix.toString();
  }
  function applyCssStyleWithOptions(cloned, context) {
    const { backgroundColor, width, height, style: styles } = context;
    const clonedStyle = cloned.style;
    if (backgroundColor)
      clonedStyle.setProperty("background-color", backgroundColor, "important");
    if (width)
      clonedStyle.setProperty("width", `${width}px`, "important");
    if (height)
      clonedStyle.setProperty("height", `${height}px`, "important");
    if (styles) {
      for (const name in styles) clonedStyle[name] = styles[name];
    }
  }
  var NORMAL_ATTRIBUTE_RE = /^[\w-:]+$/;
  async function cloneNode(node, context, isRoot = false, addWordToFontFamilies) {
    const { ownerDocument, ownerWindow, fontFamilies, onCloneEachNode } = context;
    if (ownerDocument && isTextNode(node)) {
      if (addWordToFontFamilies && /\S/.test(node.data)) {
        addWordToFontFamilies(node.data);
      }
      return ownerDocument.createTextNode(node.data);
    }
    if (ownerDocument && ownerWindow && isElementNode(node) && (isHTMLElementNode(node) || isSVGElementNode(node))) {
      const cloned2 = await cloneElement(node, context);
      if (context.isEnable("removeAbnormalAttributes")) {
        const names = cloned2.getAttributeNames();
        for (let len = names.length, i = 0; i < len; i++) {
          const name = names[i];
          if (!NORMAL_ATTRIBUTE_RE.test(name)) {
            cloned2.removeAttribute(name);
          }
        }
      }
      const style = context.currentNodeStyle = copyCssStyles(node, cloned2, isRoot, context);
      if (isRoot)
        applyCssStyleWithOptions(cloned2, context);
      let copyScrollbar = false;
      if (context.isEnable("copyScrollbar")) {
        const overflow = [
          style.get("overflow-x")?.[0],
          style.get("overflow-y")?.[0]
        ];
        copyScrollbar = overflow.includes("scroll") || (overflow.includes("auto") || overflow.includes("overlay")) && (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth);
      }
      const textTransform = style.get("text-transform")?.[0];
      const families = splitFontFamily(style.get("font-family")?.[0]);
      const addWordToFontFamilies2 = families ? (word) => {
        if (textTransform === "uppercase") {
          word = word.toUpperCase();
        } else if (textTransform === "lowercase") {
          word = word.toLowerCase();
        } else if (textTransform === "capitalize") {
          word = word[0].toUpperCase() + word.substring(1);
        }
        families.forEach((family) => {
          let fontFamily = fontFamilies.get(family);
          if (!fontFamily) {
            fontFamilies.set(family, fontFamily = /* @__PURE__ */ new Set());
          }
          word.split("").forEach((text) => fontFamily.add(text));
        });
      } : void 0;
      copyPseudoClass(
        node,
        cloned2,
        copyScrollbar,
        context,
        addWordToFontFamilies2
      );
      copyInputValue(node, cloned2);
      if (!isVideoElement(node)) {
        await cloneChildNodes(
          node,
          cloned2,
          context,
          addWordToFontFamilies2
        );
      }
      await onCloneEachNode?.(cloned2);
      return cloned2;
    }
    const cloned = node.cloneNode(false);
    await cloneChildNodes(node, cloned, context);
    await onCloneEachNode?.(cloned);
    return cloned;
  }
  function destroyContext(context) {
    context.ownerDocument = void 0;
    context.ownerWindow = void 0;
    context.svgStyleElement = void 0;
    context.svgDefsElement = void 0;
    context.svgStyles.clear();
    context.defaultComputedStyles.clear();
    if (context.sandbox) {
      try {
        context.sandbox.remove();
      } catch (err) {
        context.log.warn("Failed to destroyContext", err);
      }
      context.sandbox = void 0;
    }
    context.workers = [];
    context.fontFamilies.clear();
    context.fontCssTexts.clear();
    context.requests.clear();
    context.tasks = [];
    context.shadowRoots = [];
  }
  function baseFetch(options) {
    const { url, timeout, responseType, ...requestInit } = options;
    const controller = new AbortController();
    const timer = timeout ? setTimeout(() => controller.abort(), timeout) : void 0;
    return fetch(url, { signal: controller.signal, ...requestInit }).then((response) => {
      if (!response.ok) {
        throw new Error("Failed fetch, not 2xx response", { cause: response });
      }
      switch (responseType) {
        case "arrayBuffer":
          return response.arrayBuffer();
        case "dataUrl":
          return response.blob().then(blobToDataUrl);
        case "text":
        default:
          return response.text();
      }
    }).finally(() => clearTimeout(timer));
  }
  function contextFetch(context, options) {
    const { url: rawUrl, requestType = "text", responseType = "text", imageDom } = options;
    let url = rawUrl;
    const {
      timeout,
      acceptOfImage,
      requests,
      fetchFn,
      fetch: {
        requestInit,
        bypassingCache,
        placeholderImage
      },
      font,
      workers,
      fontFamilies
    } = context;
    if (requestType === "image" && (IN_SAFARI || IN_FIREFOX)) {
      context.drawImageCount++;
    }
    let request = requests.get(rawUrl);
    if (!request) {
      if (bypassingCache) {
        if (bypassingCache instanceof RegExp && bypassingCache.test(url)) {
          url += (/\?/.test(url) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime();
        }
      }
      const canFontMinify = requestType.startsWith("font") && font && font.minify;
      const fontTexts = /* @__PURE__ */ new Set();
      if (canFontMinify) {
        const families = requestType.split(";")[1].split(",");
        families.forEach((family) => {
          if (!fontFamilies.has(family))
            return;
          fontFamilies.get(family).forEach((text) => fontTexts.add(text));
        });
      }
      const needFontMinify = canFontMinify && fontTexts.size;
      const baseFetchOptions = {
        url,
        timeout,
        responseType: needFontMinify ? "arrayBuffer" : responseType,
        headers: requestType === "image" ? { accept: acceptOfImage } : void 0,
        ...requestInit
      };
      request = {
        type: requestType,
        resolve: void 0,
        reject: void 0,
        response: null
      };
      request.response = (async () => {
        if (fetchFn && requestType === "image") {
          const result = await fetchFn(rawUrl);
          if (result)
            return result;
        }
        if (!IN_SAFARI && rawUrl.startsWith("http") && workers.length) {
          return new Promise((resolve, reject) => {
            const worker = workers[requests.size & workers.length - 1];
            worker.postMessage({ rawUrl, ...baseFetchOptions });
            request.resolve = resolve;
            request.reject = reject;
          });
        }
        return baseFetch(baseFetchOptions);
      })().catch((error) => {
        requests.delete(rawUrl);
        if (requestType === "image" && placeholderImage) {
          context.log.warn("Failed to fetch image base64, trying to use placeholder image", url);
          return typeof placeholderImage === "string" ? placeholderImage : placeholderImage(imageDom);
        }
        throw error;
      });
      requests.set(rawUrl, request);
    }
    return request.response;
  }
  async function replaceCssUrlToDataUrl(cssText, baseUrl, context, isImage) {
    if (!hasCssUrl(cssText))
      return cssText;
    for (const [rawUrl, url] of parseCssUrls(cssText, baseUrl)) {
      try {
        const dataUrl = await contextFetch(
          context,
          {
            url,
            requestType: isImage ? "image" : "text",
            responseType: "dataUrl"
          }
        );
        cssText = cssText.replace(toRE(rawUrl), `$1${dataUrl}$3`);
      } catch (error) {
        context.log.warn("Failed to fetch css data url", rawUrl, error);
      }
    }
    return cssText;
  }
  function hasCssUrl(cssText) {
    return /url\((['"]?)([^'"]+?)\1\)/.test(cssText);
  }
  var URL_RE = /url\((['"]?)([^'"]+?)\1\)/g;
  function parseCssUrls(cssText, baseUrl) {
    const result = [];
    cssText.replace(URL_RE, (raw, quotation, url) => {
      result.push([url, resolveUrl(url, baseUrl)]);
      return raw;
    });
    return result.filter(([url]) => !isDataUrl(url));
  }
  function toRE(url) {
    const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
    return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, "g");
  }
  var properties = [
    "background-image",
    "border-image-source",
    "-webkit-border-image",
    "-webkit-mask-image",
    "list-style-image"
  ];
  function embedCssStyleImage(style, context) {
    return properties.map((property) => {
      const value = style.getPropertyValue(property);
      if (!value || value === "none") {
        return null;
      }
      if (IN_SAFARI || IN_FIREFOX) {
        context.drawImageCount++;
      }
      return replaceCssUrlToDataUrl(value, null, context, true).then((newValue) => {
        if (!newValue || value === newValue)
          return;
        style.setProperty(
          property,
          newValue,
          style.getPropertyPriority(property)
        );
      });
    }).filter(Boolean);
  }
  function embedImageElement(cloned, context) {
    if (isImageElement(cloned)) {
      const originalSrc = cloned.currentSrc || cloned.src;
      if (!isDataUrl(originalSrc)) {
        return [
          contextFetch(context, {
            url: originalSrc,
            imageDom: cloned,
            requestType: "image",
            responseType: "dataUrl"
          }).then((url) => {
            if (!url)
              return;
            cloned.srcset = "";
            cloned.dataset.originalSrc = originalSrc;
            cloned.src = url || "";
          })
        ];
      }
      if (IN_SAFARI || IN_FIREFOX) {
        context.drawImageCount++;
      }
    } else if (isSVGElementNode(cloned) && !isDataUrl(cloned.href.baseVal)) {
      const originalSrc = cloned.href.baseVal;
      return [
        contextFetch(context, {
          url: originalSrc,
          imageDom: cloned,
          requestType: "image",
          responseType: "dataUrl"
        }).then((url) => {
          if (!url)
            return;
          cloned.dataset.originalSrc = originalSrc;
          cloned.href.baseVal = url || "";
        })
      ];
    }
    return [];
  }
  function embedSvgUse(cloned, context) {
    const { ownerDocument, svgDefsElement } = context;
    const href = cloned.getAttribute("href") ?? cloned.getAttribute("xlink:href");
    if (!href)
      return [];
    const [svgUrl, id] = href.split("#");
    if (id) {
      const query = `#${id}`;
      const definition = context.shadowRoots.reduce(
        (res, root2) => {
          return res ?? root2.querySelector(`svg ${query}`);
        },
        ownerDocument?.querySelector(`svg ${query}`)
      );
      if (svgUrl) {
        cloned.setAttribute("href", query);
      }
      if (svgDefsElement?.querySelector(query))
        return [];
      if (definition) {
        svgDefsElement?.appendChild(definition.cloneNode(true));
        return [];
      } else if (svgUrl) {
        return [
          contextFetch(context, {
            url: svgUrl,
            responseType: "text"
          }).then((svgData) => {
            svgDefsElement?.insertAdjacentHTML("beforeend", svgData);
          })
        ];
      }
    }
    return [];
  }
  function embedNode(cloned, context) {
    const { tasks } = context;
    if (isElementNode(cloned)) {
      if (isImageElement(cloned) || isSVGImageElementNode(cloned)) {
        tasks.push(...embedImageElement(cloned, context));
      }
      if (isSVGUseElementNode(cloned)) {
        tasks.push(...embedSvgUse(cloned, context));
      }
    }
    if (isHTMLElementNode(cloned)) {
      tasks.push(...embedCssStyleImage(cloned.style, context));
    }
    cloned.childNodes.forEach((child) => {
      embedNode(child, context);
    });
  }
  async function embedWebFont(clone, context) {
    const {
      ownerDocument,
      svgStyleElement,
      fontFamilies,
      fontCssTexts,
      tasks,
      font
    } = context;
    if (!ownerDocument || !svgStyleElement || !fontFamilies.size) {
      return;
    }
    if (font && font.cssText) {
      const cssText = filterPreferredFormat(font.cssText, context);
      svgStyleElement.appendChild(ownerDocument.createTextNode(`${cssText}
`));
    } else {
      const styleSheets = Array.from(ownerDocument.styleSheets).filter((styleSheet) => {
        try {
          return "cssRules" in styleSheet && Boolean(styleSheet.cssRules.length);
        } catch (error) {
          context.log.warn(`Error while reading CSS rules from ${styleSheet.href}`, error);
          return false;
        }
      });
      const tempDoc = ownerDocument.implementation.createHTMLDocument("");
      const tempStyleEl = tempDoc.createElement("style");
      tempDoc.head.appendChild(tempStyleEl);
      const tempStyleSheet = tempStyleEl.sheet;
      await Promise.all(
        styleSheets.flatMap((styleSheet) => {
          return Array.from(styleSheet.cssRules).map(async (cssRule) => {
            if (isCSSImportRule(cssRule)) {
              const baseUrl = cssRule.href;
              let cssText = "";
              try {
                cssText = await contextFetch(context, {
                  url: baseUrl,
                  requestType: "text",
                  responseType: "text"
                });
              } catch (error) {
                context.log.warn(`Error fetch remote css import from ${baseUrl}`, error);
              }
              const replacedCssText = cssText.replace(
                URL_RE,
                (raw, quotation, url) => raw.replace(url, resolveUrl(url, baseUrl))
              );
              for (const rule of parseCss(replacedCssText)) {
                try {
                  tempStyleSheet.insertRule(rule, tempStyleSheet.cssRules.length);
                } catch (error) {
                  context.log.warn("Error inserting rule from remote css import", { rule, error });
                }
              }
            }
          });
        })
      );
      if (tempStyleSheet.cssRules.length)
        styleSheets.push(tempStyleSheet);
      const cssRules = [];
      styleSheets.forEach((sheet) => {
        unwrapCssLayers(sheet.cssRules, cssRules);
      });
      cssRules.filter((cssRule) => isCssFontFaceRule(cssRule) && hasCssUrl(cssRule.style.getPropertyValue("src")) && splitFontFamily(cssRule.style.getPropertyValue("font-family"))?.some((val) => fontFamilies.has(val))).forEach((value) => {
        const rule = value;
        const cssText = fontCssTexts.get(rule.cssText);
        if (cssText) {
          svgStyleElement.appendChild(ownerDocument.createTextNode(`${cssText}
`));
        } else {
          tasks.push(
            replaceCssUrlToDataUrl(
              rule.cssText,
              rule.parentStyleSheet ? rule.parentStyleSheet.href : null,
              context
            ).then((cssText2) => {
              cssText2 = filterPreferredFormat(cssText2, context);
              fontCssTexts.set(rule.cssText, cssText2);
              svgStyleElement.appendChild(ownerDocument.createTextNode(`${cssText2}
`));
            })
          );
        }
      });
    }
  }
  var COMMENTS_RE = /(\/\*[\s\S]*?\*\/)/g;
  var KEYFRAMES_RE = /((@.*?keyframes [\s\S]*?){([\s\S]*?}\s*?)})/gi;
  function parseCss(source) {
    if (source == null)
      return [];
    const result = [];
    let cssText = source.replace(COMMENTS_RE, "");
    while (true) {
      const matches = KEYFRAMES_RE.exec(cssText);
      if (!matches)
        break;
      result.push(matches[0]);
    }
    cssText = cssText.replace(KEYFRAMES_RE, "");
    const IMPORT_RE = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
    const UNIFIED_RE = new RegExp(
      // eslint-disable-next-line
      "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})",
      "gi"
    );
    while (true) {
      let matches = IMPORT_RE.exec(cssText);
      if (!matches) {
        matches = UNIFIED_RE.exec(cssText);
        if (!matches) {
          break;
        } else {
          IMPORT_RE.lastIndex = UNIFIED_RE.lastIndex;
        }
      } else {
        UNIFIED_RE.lastIndex = IMPORT_RE.lastIndex;
      }
      result.push(matches[0]);
    }
    return result;
  }
  var URL_WITH_FORMAT_RE = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
  var FONT_SRC_RE = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
  function filterPreferredFormat(str, context) {
    const { font } = context;
    const preferredFormat = font ? font?.preferredFormat : void 0;
    return preferredFormat ? str.replace(FONT_SRC_RE, (match) => {
      while (true) {
        const [src, , format] = URL_WITH_FORMAT_RE.exec(match) || [];
        if (!format)
          return "";
        if (format === preferredFormat)
          return `src: ${src};`;
      }
    }) : str;
  }
  function unwrapCssLayers(rules2, out = []) {
    for (const rule of Array.from(rules2)) {
      if (isLayerBlockRule(rule)) {
        out.push(...unwrapCssLayers(rule.cssRules));
      } else if ("cssRules" in rule) {
        unwrapCssLayers(rule.cssRules, out);
      } else {
        out.push(rule);
      }
    }
    return out;
  }
  var SVG_EXTERNAL_RESOURCE_REGEX = /\bx?link:?href\s*=\s*["'](?!data:)[^"']+["']/i;
  function svgHasExternalResources(svg) {
    return SVG_EXTERNAL_RESOURCE_REGEX.test(svg.innerHTML);
  }
  async function domToForeignObjectSvg(node, options) {
    const context = await orCreateContext(node, options);
    if (isElementNode(context.node) && isSVGElementNode(context.node) && !svgHasExternalResources(context.node))
      return context.node;
    const {
      ownerDocument,
      log,
      tasks,
      svgStyleElement,
      svgDefsElement,
      svgStyles,
      font,
      progress,
      autoDestruct,
      onCloneNode,
      onEmbedNode,
      onCreateForeignObjectSvg
    } = context;
    log.time("clone node");
    const clone = await cloneNode(context.node, context, true);
    if (svgStyleElement && ownerDocument) {
      let allCssText = "";
      svgStyles.forEach((klasses, cssText) => {
        allCssText += `${klasses.join(",\n")} {
  ${cssText}
}
`;
      });
      svgStyleElement.appendChild(ownerDocument.createTextNode(allCssText));
    }
    log.timeEnd("clone node");
    await onCloneNode?.(clone);
    if (font !== false && isElementNode(clone)) {
      log.time("embed web font");
      await embedWebFont(clone, context);
      log.timeEnd("embed web font");
    }
    log.time("embed node");
    embedNode(clone, context);
    const count = tasks.length;
    let current = 0;
    const runTask = async () => {
      while (true) {
        const task = tasks.pop();
        if (!task)
          break;
        try {
          await task;
        } catch (error) {
          context.log.warn("Failed to run task", error);
        }
        progress?.(++current, count);
      }
    };
    progress?.(current, count);
    await Promise.all([...Array.from({ length: 4 })].map(runTask));
    log.timeEnd("embed node");
    await onEmbedNode?.(clone);
    const svg = createForeignObjectSvg(clone, context);
    svgDefsElement && svg.insertBefore(svgDefsElement, svg.children[0]);
    svgStyleElement && svg.insertBefore(svgStyleElement, svg.children[0]);
    autoDestruct && destroyContext(context);
    await onCreateForeignObjectSvg?.(svg);
    return svg;
  }
  function createForeignObjectSvg(clone, context) {
    const { width, height } = context;
    const svg = createSvg(width, height, clone.ownerDocument);
    const foreignObject = svg.ownerDocument.createElementNS(svg.namespaceURI, "foreignObject");
    foreignObject.setAttributeNS(null, "x", "0%");
    foreignObject.setAttributeNS(null, "y", "0%");
    foreignObject.setAttributeNS(null, "width", "100%");
    foreignObject.setAttributeNS(null, "height", "100%");
    foreignObject.append(clone);
    svg.appendChild(foreignObject);
    return svg;
  }
  async function domToCanvas(node, options) {
    const context = await orCreateContext(node, options);
    const svg = await domToForeignObjectSvg(context);
    const dataUrl = svgToDataUrl(svg, context.isEnable("removeControlCharacter"));
    if (!context.autoDestruct) {
      context.svgStyleElement = createStyleElement(context.ownerDocument);
      context.svgDefsElement = context.ownerDocument?.createElementNS(XMLNS, "defs");
      context.svgStyles.clear();
    }
    const image = createImage(dataUrl, svg.ownerDocument);
    return await imageToCanvas(image, context);
  }

  // src/copy/screenshot.ts
  var IMAGE_FORMATS = /* @__PURE__ */ new Set(["png", "jpeg"]);
  var TRANSPARENT_CANVAS_FALLBACK = "rgba(0, 0, 0, 0)";
  var FETCH_PLACEHOLDER_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  function cssAlphaIsZero(alpha) {
    const value = alpha.trim();
    if (value.endsWith("%")) {
      return Number.parseFloat(value) === 0;
    }
    return Number.parseFloat(value) === 0;
  }
  function isTransparentBackground(color) {
    const normalized = color.trim().toLowerCase();
    if (!normalized || normalized === "transparent") return true;
    const slashAlpha = normalized.match(/\/\s*([^)]+)\)$/);
    if (slashAlpha) {
      return cssAlphaIsZero(slashAlpha[1]);
    }
    const rgbaAlpha = normalized.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([^)]+)\)$/);
    return rgbaAlpha ? cssAlphaIsZero(rgbaAlpha[1]) : false;
  }
  function isEmptyBackgroundImage(backgroundImage) {
    const normalized = backgroundImage.trim().toLowerCase();
    return !normalized || normalized === "none";
  }
  function getComputedStyleSnapshotProperty(computedStyles, property) {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`(?:^|\\n)${escaped}:\\s*([^;]+);`, "i").exec(computedStyles);
    return match?.[1]?.trim() ?? "";
  }
  function getBackgroundFromComputedStyleSnapshot(computedStyles) {
    if (!computedStyles) return null;
    const backgroundColor = getComputedStyleSnapshotProperty(
      computedStyles,
      "background-color"
    );
    const backgroundImage = getComputedStyleSnapshotProperty(
      computedStyles,
      "background-image"
    );
    const background = getComputedStyleSnapshotProperty(computedStyles, "background");
    const color = isTransparentBackground(backgroundColor) ? null : backgroundColor;
    const visibleBackgroundImage = isEmptyBackgroundImage(backgroundImage) ? null : backgroundImage;
    const visibleBackground = visibleBackgroundImage ? background || null : null;
    if (!color && !visibleBackground && !visibleBackgroundImage) return null;
    return { color, background: visibleBackground, backgroundImage: visibleBackgroundImage };
  }
  function getParentElement(element) {
    if (element.parentElement) return element.parentElement;
    const root2 = element.getRootNode();
    return root2 instanceof ShadowRoot ? root2.host : null;
  }
  function getElementBackground(element) {
    const view = element.ownerDocument.defaultView;
    if (!view) return null;
    const styles = view.getComputedStyle(element);
    const color = isTransparentBackground(styles.backgroundColor) ? null : styles.backgroundColor;
    const background = isEmptyBackgroundImage(styles.backgroundImage) ? null : styles.background;
    const backgroundImage = isEmptyBackgroundImage(styles.backgroundImage) ? null : styles.backgroundImage;
    if (!color && !background && !backgroundImage) return null;
    return { color, background, backgroundImage };
  }
  function createScreenshotBackgroundSnapshot(element, computedStylesSnapshot) {
    const backgrounds = [];
    const targetBackground = getBackgroundFromComputedStyleSnapshot(computedStylesSnapshot);
    if (targetBackground) {
      backgrounds.push(targetBackground);
    }
    let current = element;
    while (current) {
      const background = getElementBackground(current);
      if (background) backgrounds.push(background);
      current = getParentElement(current);
    }
    const { body, documentElement } = element.ownerDocument;
    for (const fallbackElement of [body, documentElement]) {
      if (!fallbackElement) continue;
      const background = getElementBackground(fallbackElement);
      if (background) backgrounds.push(background);
    }
    return backgrounds;
  }
  function getEffectiveBackground(element, backgroundSnapshot) {
    for (const background of backgroundSnapshot ?? []) {
      if (background.color || background.background || background.backgroundImage) {
        return background;
      }
    }
    let current = element;
    while (current) {
      const background = getElementBackground(current);
      if (background) return background;
      current = getParentElement(current);
    }
    const { body, documentElement } = element.ownerDocument;
    for (const fallbackElement of [body, documentElement]) {
      if (!fallbackElement) continue;
      const background = getElementBackground(fallbackElement);
      if (background) return background;
    }
    return { color: null, background: null, backgroundImage: null };
  }
  function resolveJpegCompositeFillColor(backgroundSnapshot) {
    for (const background of backgroundSnapshot ?? []) {
      if (background.color) return background.color;
      if (background.background || background.backgroundImage) {
        return null;
      }
    }
    return "#ffffff";
  }
  function getRenderOptions(element, backgroundSnapshot) {
    const background = getEffectiveBackground(element, backgroundSnapshot);
    const style = {};
    if (background.background) {
      style.background = background.background;
    }
    if (background.backgroundImage) {
      style.backgroundImage = background.backgroundImage;
    }
    if (background.background || background.backgroundImage) {
      style.backgroundColor = background.color ?? TRANSPARENT_CANVAS_FALLBACK;
    }
    return {
      backgroundColor: background.color,
      fetch: {
        requestInit: { cache: "force-cache" },
        placeholderImage: FETCH_PLACEHOLDER_IMAGE
      },
      filter: (node) => !isDerivativeFormatNoiseNode(node),
      style: Object.keys(style).length > 0 ? style : null
    };
  }
  function isImageCopyFormat(formatId) {
    return IMAGE_FORMATS.has(formatId);
  }
  function createCanvasFromSource(source) {
    const doc = source.ownerDocument;
    const canvas = doc.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    return canvas;
  }
  function encodePng(canvas) {
    return canvas.toDataURL("image/png");
  }
  function encodeJpeg(renderedCanvas, backgroundSnapshot) {
    const jpegCanvas = createCanvasFromSource(renderedCanvas);
    const context = jpegCanvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get 2d context for JPEG composition");
    }
    const fillColor = resolveJpegCompositeFillColor(backgroundSnapshot);
    if (fillColor) {
      context.fillStyle = fillColor;
      context.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
    }
    context.drawImage(renderedCanvas, 0, 0);
    return jpegCanvas.toDataURL("image/jpeg", 0.92);
  }
  async function captureElementImages(element, formats, backgroundSnapshot) {
    const requested = new Set(formats);
    if (requested.size === 0) return {};
    const renderedCanvas = await domToCanvas(
      element,
      getRenderOptions(element, backgroundSnapshot)
    );
    const result = {};
    if (requested.has("png")) {
      result.png = encodePng(renderedCanvas);
    }
    if (requested.has("jpeg")) {
      result.jpeg = encodeJpeg(renderedCanvas, backgroundSnapshot);
    }
    return result;
  }

  // src/element-copy/cache.ts
  function createStringCache() {
    const cache2 = /* @__PURE__ */ new Map();
    return {
      snapshot(entries) {
        cache2.clear();
        for (const { key, value } of entries) {
          cache2.set(key, value);
        }
      },
      get(key) {
        return cache2.get(key);
      },
      has() {
        return cache2.size > 0;
      },
      clear() {
        cache2.clear();
      }
    };
  }

  // src/element-copy/download.ts
  function domainWithDashes(hostname) {
    const normalized = hostname.trim() || "unknown";
    const dashed = normalized.replace(/\./g, "-");
    return `-${dashed}`.replace(/-www-/g, "-").slice(1);
  }
  function extensionForDownloadFormat(formatId) {
    switch (formatId) {
      case "markdownFile":
        return "md";
      case "htmlFile":
        return "html";
      case "png":
        return "png";
      case "jpeg":
        return "jpeg";
      default:
        return "txt";
    }
  }
  function buildDownloadFilename(formatId, context) {
    const ext2 = extensionForDownloadFormat(formatId);
    const tagName = context?.tagName?.trim().toLowerCase() || "element";
    const domain = domainWithDashes(context?.hostname ?? "unknown");
    return `copied-${domain}-${tagName}.${ext2}`;
  }
  function mimeTypeForFormat(formatId) {
    switch (formatId) {
      case "markdownFile":
        return "text/markdown;charset=utf-8";
      case "htmlFile":
        return "text/html;charset=utf-8";
      case "png":
        return "image/png";
      case "jpeg":
        return "image/jpeg";
      default:
        return "text/plain;charset=utf-8";
    }
  }
  function isDataUrl2(value) {
    return /^data:[^,]+,/i.test(value);
  }
  function dataUrlToBlob(dataUrl) {
    const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl);
    if (!match) return void 0;
    const mimeType = match[1] || "application/octet-stream";
    const isBase64 = match[2] !== void 0;
    const data = match[3];
    const binary = isBase64 ? atob(data) : decodeURIComponent(data);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mimeType });
  }
  function downloadTextAsFile(formatId, text, context) {
    if (!text) return false;
    try {
      const blob = isDataUrl2(text) ? dataUrlToBlob(text) : new Blob([text], { type: mimeTypeForFormat(formatId) });
      if (!blob) return false;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildDownloadFilename(formatId, context);
      anchor.style.display = "none";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }

  // src/element-copy/clipboard.ts
  function clipboardCanWriteType(mimeType) {
    if (typeof ClipboardItem === "undefined") return false;
    const supports = ClipboardItem.supports;
    if (typeof supports !== "function") return true;
    try {
      return supports.call(ClipboardItem, mimeType);
    } catch {
      return true;
    }
  }
  function copyTextToClipboardFallback(text) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
      const root2 = document.documentElement ?? document.body;
      if (!root2) return false;
      root2.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return ok;
    } catch {
      return false;
    }
  }
  async function copyTextToClipboard(text) {
    if (!text) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
    }
    return copyTextToClipboardFallback(text);
  }
  async function copyImageToClipboard(formatId, dataUrl) {
    if (!isImageCopyFormat(formatId)) return false;
    const blob = dataUrlToBlob(dataUrl);
    if (!blob) return false;
    const mimeType = blob.type || (formatId === "jpeg" ? "image/jpeg" : "image/png");
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      return false;
    }
    if (!clipboardCanWriteType(mimeType)) return false;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })]);
      return true;
    } catch {
      return false;
    }
  }
  function canCopyFormatToClipboard(formatId) {
    if (!isImageCopyFormat(formatId)) return true;
    const mimeType = formatId === "jpeg" ? "image/jpeg" : "image/png";
    return clipboardCanWriteType(mimeType);
  }
  async function copyToClipboardForFormat(formatId, cached) {
    if (formatId === "text") {
      const payload = parseFormattedTextCache(cached);
      if (!payload) return false;
      return copyFormattedTextToClipboard(payload);
    }
    if (isImageCopyFormat(formatId)) {
      return copyImageToClipboard(formatId, cached);
    }
    return copyTextToClipboard(cached);
  }

  // src/formats/format-ui.ts
  var INFO_WINDOW_CLASSES = createInfoWindowClasses("ec");
  function inlineImagesOptionLabel(mode, strings) {
    switch (mode) {
      case "all":
        return strings.settingsInlineImagesUseAll;
      case "remove-large":
        return strings.settingsInlineImagesRemoveLarge;
      case "remove-small":
        return strings.settingsInlineImagesRemoveSmall;
      case "remove-all":
        return strings.settingsInlineImagesRemoveAll;
    }
  }
  function infoWindowContainer(anchor) {
    return anchor.closest(".ec-panel") ?? document.body;
  }
  function openSettingsInfoWindow(anchor, strings, message) {
    const container = infoWindowContainer(anchor);
    container.querySelector(`.${INFO_WINDOW_CLASSES.overlay}`)?.remove();
    const para = document.createElement("p");
    para.textContent = message;
    const { root: root2 } = createInfoWindow({
      classes: INFO_WINDOW_CLASSES,
      contentHtml: para.outerHTML,
      closeLabel: strings.infoWindowCloseLabel
    });
    container.appendChild(root2);
  }
  function createSettingsInfoButton(ariaLabel, onOpen) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ec-inline-images-info";
    button.setAttribute("aria-label", ariaLabel);
    button.innerHTML = INFO;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onOpen(button);
    });
    return button;
  }
  function attachInfoToToggleLabel(row, labelText, infoAriaLabel, infoMessage, strings) {
    const label = row.querySelector(".ec-toggle-label");
    if (!label) return;
    label.classList.add("ec-toggle-label--with-info");
    const labelTextEl = document.createElement("span");
    labelTextEl.className = "ec-toggle-label-text";
    labelTextEl.textContent = labelText;
    label.replaceChildren(
      labelTextEl,
      createSettingsInfoButton(infoAriaLabel, (anchor) => {
        openSettingsInfoWindow(anchor, strings, infoMessage);
      })
    );
  }
  async function createInlineImagesSelect(strings) {
    const selectedMode = await getInlineImagesMode();
    const row = document.createElement("div");
    row.className = "ec-copy-default-row ec-inline-images-row";
    const label = document.createElement("label");
    label.className = "ec-copy-default-label ec-copy-default-label--with-info";
    label.htmlFor = "ec-inline-images-mode";
    const labelText = document.createElement("span");
    labelText.className = "ec-copy-default-label-text";
    labelText.textContent = strings.settingsInlineImagesLabel;
    const select = document.createElement("select");
    select.id = "ec-inline-images-mode";
    select.className = "ec-copy-default-select";
    for (const mode of INLINE_IMAGES_MODES) {
      const option = document.createElement("option");
      option.value = mode;
      option.textContent = inlineImagesOptionLabel(mode, strings);
      option.selected = mode === selectedMode;
      select.append(option);
    }
    select.addEventListener("change", () => {
      void setInlineImagesMode(select.value);
    });
    label.append(
      labelText,
      createSettingsInfoButton(strings.settingsInlineImagesInfoLabel, (anchor) => {
        openSettingsInfoWindow(anchor, strings, strings.settingsInlineImagesInfo);
      })
    );
    row.append(label, select);
    return row;
  }
  function frameLabelStyleOptionLabel(style, strings) {
    switch (style) {
      case "none":
        return strings.settingsFrameLabelNone;
      case "click-to-copy":
        return strings.settingsFrameLabelClickToCopy;
      case "tag-id-class":
        return strings.settingsFrameLabelTagIdClass;
      case "selector":
        return strings.settingsFrameLabelSelector;
      case "full-xpath":
        return strings.settingsFrameLabelFullXPath;
    }
  }
  async function createFrameLabelStyleSelect(strings) {
    const selectedStyle = await getFrameLabelStyle();
    const row = document.createElement("div");
    row.className = "ec-copy-default-row ec-frame-label-style-row";
    const label = document.createElement("label");
    label.className = "ec-copy-default-label";
    label.htmlFor = "ec-frame-label-style";
    label.textContent = strings.settingsFrameLabelStyleLabel;
    const select = document.createElement("select");
    select.id = "ec-frame-label-style";
    select.className = "ec-copy-default-select";
    for (const style of FRAME_LABEL_STYLES) {
      const option = document.createElement("option");
      option.value = style;
      option.textContent = frameLabelStyleOptionLabel(style, strings);
      option.selected = style === selectedStyle;
      select.append(option);
    }
    select.addEventListener("change", () => {
      void setFrameLabelStyle(select.value);
    });
    row.append(label, select);
    return row;
  }
  async function createComputeFormatsSection(strings) {
    const settings = await getComputeFormatsSettings();
    const section = document.createElement("div");
    section.className = "ec-compute-formats-section";
    const imagesRow = createToggleRow(strings.settingsComputeImagesLabel, settings.computeImages, (next2) => {
      void (async () => {
        await setComputeImagesEnabled(next2);
        await syncDefaultActionSelect(strings);
      })();
    });
    imagesRow.classList.add("ec-compute-formats-toggle");
    attachInfoToToggleLabel(
      imagesRow,
      strings.settingsComputeImagesLabel,
      strings.settingsComputeImagesInfoLabel,
      strings.settingsComputeImagesInfo,
      strings
    );
    section.append(imagesRow);
    return section;
  }
  async function createDeveloperToolsToggleRow(strings) {
    const enabled = await getDeveloperToolsEnabled();
    const row = createToggleRow(strings.settingsDeveloperToolsToggleLabel, enabled, (next2) => {
      void setDeveloperToolsEnabled(next2);
    });
    row.classList.add("ec-developer-tools-toggle");
    return row;
  }
  async function createDarkThemeToggleRow(strings) {
    const enabled = await getDarkThemeEnabled();
    const row = createToggleRow(strings.settingsDarkThemeToggleLabel, enabled, (next2) => {
      void setDarkThemeEnabled(next2);
      applyPanelTheme(next2);
    });
    row.classList.add("ec-dark-theme-toggle");
    return row;
  }
  var COPIED_CHIP_GROUPS = [
    { group: "clipboard-copy", label: (strings) => strings.copiedCopyLabel },
    { group: "files", label: (strings) => strings.copiedFilesLabel }
  ];
  function defaultActionOptionLabel(storageValue, strings) {
    switch (storageValue) {
      case CLIPBOARD_DEFAULT_NOTHING:
        return strings.settingsDefaultActionNothing;
      case "copy:text":
        return strings.settingsDefaultActionCopyText;
      case "copy:markdown":
        return strings.settingsDefaultActionCopyMarkdown;
      case "copy:png":
        return strings.settingsDefaultActionCopyImage;
      case "download:markdownFile":
        return strings.settingsDefaultActionDownloadMarkdown;
      case "download:htmlFile":
        return strings.settingsDefaultActionDownloadHtml;
      case "download:png":
        return strings.settingsDefaultActionDownloadPng;
      case "download:jpeg":
        return strings.settingsDefaultActionDownloadJpeg;
      case "copy:outerHTML":
        return strings.settingsDefaultActionCopyCode;
      case "copy:selector":
        return strings.settingsDefaultActionCopySelector;
      case "copy:jsPath":
        return strings.settingsDefaultActionCopyJsPath;
      case "copy:xpath":
        return strings.settingsDefaultActionCopyXPath;
      case "copy:fullXPath":
        return strings.settingsDefaultActionCopyFullXPath;
      case "copy:styles":
        return strings.settingsDefaultActionCopyStyles;
      case "copy:computedStyles":
        return strings.settingsDefaultActionCopyComputedStyles;
    }
  }
  function applyDefaultActionNothingStyle(select) {
    select.classList.toggle("ec-copy-default-select--nothing", select.value === CLIPBOARD_DEFAULT_NOTHING);
  }
  function findDefaultActionSelect() {
    const select = document.getElementById(PANEL_POPUP_ROOT_ID)?.shadowRoot?.querySelector("#ec-clipboard-default-format");
    return select instanceof HTMLSelectElement ? select : null;
  }
  function findComputeImagesToggle() {
    const toggle = document.getElementById(PANEL_POPUP_ROOT_ID)?.shadowRoot?.querySelector(".ec-compute-formats-toggle .ec-toggle");
    return toggle instanceof HTMLButtonElement ? toggle : null;
  }
  function syncComputeImagesToggleUi(enabled) {
    const toggle = findComputeImagesToggle();
    if (!toggle) return;
    toggle.classList.toggle("is-on", enabled);
    toggle.setAttribute("aria-checked", enabled ? "true" : "false");
  }
  async function populateDefaultActionSelect(select, strings) {
    const selectedAction = await ensureDefaultActionAllowsComputeImages();
    const selectedValue = encodeDefaultAction(selectedAction);
    select.replaceChildren();
    for (const storageValue of DEFAULT_ACTION_STORAGE_OPTIONS) {
      const option = document.createElement("option");
      option.value = storageValue;
      option.textContent = defaultActionOptionLabel(storageValue, strings);
      option.selected = storageValue === selectedValue;
      if (storageValue === CLIPBOARD_DEFAULT_NOTHING) {
        option.className = "ec-copy-default-option-nothing";
      }
      select.append(option);
    }
    select.value = selectedValue;
    applyDefaultActionNothingStyle(select);
  }
  async function syncDefaultActionSelect(strings) {
    const select = findDefaultActionSelect();
    if (!select) return;
    await populateDefaultActionSelect(select, strings);
  }
  async function createClipboardDefaultFormatSelect(strings) {
    const row = document.createElement("div");
    row.className = "ec-copy-default-row";
    const label = document.createElement("label");
    label.className = "ec-copy-default-label";
    label.htmlFor = "ec-clipboard-default-format";
    label.textContent = strings.settingsDefaultActionLabel;
    const select = document.createElement("select");
    select.id = "ec-clipboard-default-format";
    select.className = "ec-copy-default-select";
    await populateDefaultActionSelect(select, strings);
    select.addEventListener("change", () => {
      applyDefaultActionNothingStyle(select);
      void (async () => {
        await setDefaultAction(parseStoredDefaultAction(select.value));
        if (isImageDefaultActionStorageValue(select.value)) {
          const settings = await getComputeFormatsSettings();
          if (!settings.computeImages) {
            await setComputeImagesEnabled(true);
            syncComputeImagesToggleUi(true);
          }
        }
      })();
    });
    row.append(label, select);
    return row;
  }
  function isInactiveFormatActionButton(element) {
    return element.classList.contains("ec-format-action-btn--unavailable") || element.classList.contains("ec-format-action-btn--settings-off");
  }
  var FORMAT_ACTION_TOOLTIP_VISIBLE_CLASS = "ec-format-action-btn--show-tooltip";
  var visibleFormatActionTooltipButton = null;
  var formatActionTooltipDismissBound = false;
  function hideAllFormatActionTooltips() {
    visibleFormatActionTooltipButton?.classList.remove(FORMAT_ACTION_TOOLTIP_VISIBLE_CLASS);
    visibleFormatActionTooltipButton = null;
  }
  function isInactiveFormatActionButtonElement(element) {
    return element instanceof HTMLButtonElement && isInactiveFormatActionButton(element);
  }
  function bindFormatActionTooltipDismiss() {
    if (formatActionTooltipDismissBound) return;
    formatActionTooltipDismissBound = true;
    window.addEventListener(
      "click",
      (event) => {
        const inactiveButton = event.composedPath().find(isInactiveFormatActionButtonElement) ?? null;
        const wasSameButton = inactiveButton !== null && inactiveButton === visibleFormatActionTooltipButton;
        hideAllFormatActionTooltips();
        if (inactiveButton && !wasSameButton) {
          inactiveButton.classList.add(FORMAT_ACTION_TOOLTIP_VISIBLE_CLASS);
          visibleFormatActionTooltipButton = inactiveButton;
        }
      },
      true
    );
  }
  function bindInactiveFormatButtonTooltip(button, tooltip) {
    button.dataset.tooltip = tooltip;
    bindFormatActionTooltipDismiss();
  }
  function isCopiedButtonSelected(element, selection) {
    if (element.disabled || isInactiveFormatActionButton(element) || selection === null) return false;
    const action = element.dataset.actionKind === "download" ? "download" : "copy";
    return element.dataset.formatId === selection.formatId && selection.action === action;
  }
  function syncCopiedPanelFormatSelection(container, selection) {
    for (const button of Array.from(
      container.querySelectorAll(".ec-format-action-btn")
    )) {
      const selected = isCopiedButtonSelected(button, selection);
      button.classList.toggle("ec-format-action-btn--selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    }
    for (const row of Array.from(
      container.querySelectorAll(".ec-copied-devtools-row")
    )) {
      const selected = isCopiedButtonSelected(row, selection);
      row.classList.toggle("ec-copied-devtools-row--selected", selected);
      row.setAttribute("aria-pressed", selected ? "true" : "false");
    }
    for (const button of Array.from(
      container.querySelectorAll(".ec-copied-url-copy")
    )) {
      const selected = isCopiedButtonSelected(button, selection);
      button.classList.toggle("ec-copied-url-copy--selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    }
  }
  function formatActionButtonLabel(format, strings, actionKind) {
    if (format.id === "png" && actionKind === "copy") {
      return strings.formatImage;
    }
    return format.label(strings);
  }
  function createFormatActionButton(format, strings, available, actionKind, onActivate, options) {
    const buttonLabel = formatActionButtonLabel(format, strings, actionKind);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ec-format-action-btn";
    button.dataset.formatId = format.id;
    button.dataset.actionKind = actionKind;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", buttonLabel);
    button.textContent = buttonLabel;
    if (options?.settingsOff) {
      button.classList.add("ec-format-action-btn--unavailable", "ec-format-action-btn--settings-off");
      bindInactiveFormatButtonTooltip(
        button,
        options.settingsOffTooltip ?? strings.copiedFormatTurnedOffInSettings
      );
      return button;
    }
    if (!available) {
      button.classList.add("ec-format-action-btn--unavailable");
      bindInactiveFormatButtonTooltip(
        button,
        options?.unavailableTooltip ?? strings.copiedFormatNothingInCache
      );
      return button;
    }
    button.addEventListener("click", () => {
      onActivate(format.id, actionKind);
    });
    return button;
  }
  function isDownloadFormatAction(actionIcon) {
    return actionIcon === "file-down";
  }
  function copiedGroupHasImageDownloads(options) {
    if (!options.onSaveFormat) return false;
    return COPY_FORMATS.some(
      (format) => isImageCopyFormat(format.id) && shouldShowCopiedFormat(format.id, options)
    );
  }
  function shouldShowCopiedFormat(formatId, options) {
    if (options.enabledFormats[formatId]) return true;
    return isComputeControlledFormat(formatId);
  }
  function isCopiedFormatSettingsOff(formatId, options) {
    return !options.enabledFormats[formatId] && isComputeControlledFormat(formatId);
  }
  function createCopiedBlock() {
    const block = document.createElement("div");
    block.className = "ec-copied-block";
    return block;
  }
  function copiedGroupHasFormats(group, options) {
    if (isDeveloperToolsGroup(group) && !options.enabledFormats.outerHTML) {
      return false;
    }
    if (group === "files" && copiedGroupHasImageDownloads(options)) {
      return true;
    }
    return COPY_FORMATS.some((format) => {
      if (format.settingsGroup !== group) return false;
      if (!shouldShowCopiedFormat(format.id, options)) return false;
      const onActivate = isDownloadFormatAction(format.actionIcon) ? options.onSaveFormat : options.onCopyFormat;
      return Boolean(onActivate);
    });
  }
  function copiedFormatActionKind(format, imageDownloadButton) {
    if (imageDownloadButton) return "download";
    return isDownloadFormatAction(format.actionIcon) ? "download" : "copy";
  }
  function createCopiedFormatInlineList(group, labelText, strings, options, onSelectFormat) {
    const row = document.createElement("div");
    row.className = "ec-settings-format-inline-list";
    row.setAttribute("role", "group");
    const labelId = `ec-copied-formats-${group}`;
    row.setAttribute("aria-labelledby", labelId);
    const label = document.createElement("span");
    label.id = labelId;
    label.className = "ec-settings-format-inline-list-label";
    label.textContent = labelText;
    row.append(label);
    for (const format of COPY_FORMATS) {
      if (format.settingsGroup !== group) continue;
      if (!shouldShowCopiedFormat(format.id, options)) continue;
      const isDownload = isDownloadFormatAction(format.actionIcon);
      const onActivate = isDownload ? options.onSaveFormat : options.onCopyFormat;
      if (!onActivate) continue;
      const settingsOff = isCopiedFormatSettingsOff(format.id, options);
      const inCache = isPickCopyFormatAvailable(
        format.id,
        options.pickCopyCacheRecord,
        document
      );
      const clipboardWritable = isDownload || canCopyFormatToClipboard(format.id);
      const available = !settingsOff && inCache && clipboardWritable;
      const unavailableTooltip = !settingsOff && inCache && !clipboardWritable ? strings.copiedImageClipboardUnsupportedTooltip : !settingsOff && !inCache ? strings.copiedFormatNothingInCache : void 0;
      const actionKind = copiedFormatActionKind(format, false);
      row.append(
        createFormatActionButton(
          format,
          strings,
          available,
          actionKind,
          (formatId, kind) => {
            void Promise.resolve(onActivate(formatId)).then((copied) => {
              if (copied) onSelectFormat(formatId, kind);
            });
          },
          {
            unavailableTooltip,
            settingsOff,
            settingsOffTooltip: strings.copiedFormatTurnedOffInSettings
          }
        )
      );
    }
    if (group === "files" && options.onSaveFormat) {
      for (const format of COPY_FORMATS) {
        if (!isImageCopyFormat(format.id)) continue;
        if (!shouldShowCopiedFormat(format.id, options)) continue;
        const settingsOff = isCopiedFormatSettingsOff(format.id, options);
        const inCache = isPickCopyFormatAvailable(
          format.id,
          options.pickCopyCacheRecord,
          document
        );
        const available = !settingsOff && inCache;
        row.append(
          createFormatActionButton(
            format,
            strings,
            available,
            "download",
            (formatId, kind) => {
              void Promise.resolve(options.onSaveFormat?.(formatId)).then((saved) => {
                if (saved) onSelectFormat(formatId, kind);
              });
            },
            {
              unavailableTooltip: !settingsOff && !inCache ? strings.copiedFormatNothingInCache : void 0,
              settingsOff,
              settingsOffTooltip: strings.copiedFormatTurnedOffInSettings
            }
          )
        );
      }
    }
    return row;
  }
  function appendCopiedFieldCopyIcon(field) {
    const icon = document.createElement("span");
    icon.className = "ec-copied-devtools-row-copy-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = COPY;
    field.append(icon);
  }
  function createCopiedUrlInlineRow(strings, options, onSelectFormat) {
    const row = document.createElement("div");
    row.className = "ec-settings-format-inline-list ec-copied-url-inline";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", strings.formatUrl);
    const available = isPickCopyFormatAvailable("url", options.pickCopyCacheRecord, document);
    const urlValue = options.pickCopyCacheRecord?.url ?? "";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "ec-copied-url-copy";
    copyButton.dataset.formatId = "url";
    copyButton.dataset.actionKind = "copy";
    copyButton.setAttribute("aria-pressed", "false");
    copyButton.setAttribute("aria-label", strings.formatUrl);
    copyButton.disabled = !available;
    if (!available) {
      copyButton.classList.add("ec-copied-url-copy--unavailable");
    }
    const field = document.createElement("span");
    field.className = "ec-copied-devtools-row-field";
    const value = document.createElement("span");
    value.className = "ec-copied-devtools-row-value";
    value.textContent = urlValue;
    field.append(value);
    appendCopiedFieldCopyIcon(field);
    copyButton.append(field);
    copyButton.addEventListener("click", () => {
      if (!available) return;
      void Promise.resolve(options.onCopyFormat("url")).then((copied) => {
        if (copied) onSelectFormat("url", "copy");
      });
    });
    const openUrlButton = document.createElement("button");
    openUrlButton.type = "button";
    openUrlButton.className = "ec-copied-url-open";
    openUrlButton.innerHTML = EXTERNAL_LINK;
    openUrlButton.setAttribute("aria-label", strings.copiedOpenUrlIconLabel);
    openUrlButton.disabled = !available || !options.onOpenUrl;
    openUrlButton.addEventListener("click", () => {
      if (!available || !options.onOpenUrl) return;
      void options.onOpenUrl(urlValue);
    });
    row.append(openUrlButton, copyButton);
    return row;
  }
  function createCopiedDeveloperToolsRows(strings, options, onSelectFormat) {
    const formats = COPY_FORMATS.filter(
      (format) => format.settingsGroup === "devtools" && options.enabledFormats[format.id] && options.onCopyFormat
    );
    if (formats.length === 0) return null;
    const block = createCopiedBlock();
    const rows = document.createElement("div");
    rows.className = "ec-copied-devtools-rows";
    for (const format of formats) {
      const available = isPickCopyFormatAvailable(
        format.id,
        options.pickCopyCacheRecord,
        document
      );
      const cacheKey = resolvePickCopyCacheStorageKey(format.id);
      const preview = options.pickCopyCacheRecord?.[cacheKey] ?? "";
      const row = document.createElement("button");
      row.type = "button";
      row.className = "ec-copied-devtools-row";
      row.dataset.formatId = format.id;
      row.setAttribute("aria-pressed", "false");
      row.disabled = !available;
      if (!available) {
        row.classList.add("ec-copied-devtools-row--unavailable");
      }
      const label = document.createElement("span");
      label.className = "ec-copied-devtools-row-label";
      label.textContent = format.label(strings);
      const field = document.createElement("span");
      field.className = "ec-copied-devtools-row-field";
      const value = document.createElement("span");
      value.className = "ec-copied-devtools-row-value";
      value.textContent = preview;
      field.append(value);
      appendCopiedFieldCopyIcon(field);
      row.append(label, field);
      row.dataset.actionKind = "copy";
      row.addEventListener("click", () => {
        if (!available) return;
        void Promise.resolve(options.onCopyFormat(format.id)).then((copied) => {
          if (copied) onSelectFormat(format.id, "copy");
        });
      });
      rows.append(row);
    }
    block.append(rows);
    return block;
  }
  function createCopiedOtherOptionsRow(strings, options) {
    const section = document.createElement("div");
    section.className = "ec-copied-other-options";
    section.setAttribute("role", "group");
    section.setAttribute("aria-label", strings.copiedFormatsGroupLabel);
    const urlBlock = document.createElement("div");
    urlBlock.className = "ec-copied-url-block";
    const selectionSyncRoot = options.selectionSyncRoot ?? section;
    const selectFormat = (formatId, actionKind) => {
      syncCopiedPanelFormatSelection(selectionSyncRoot, {
        formatId,
        action: actionKind
      });
    };
    urlBlock.append(createCopiedUrlInlineRow(strings, options, selectFormat));
    for (const { group, label: groupLabel } of COPIED_CHIP_GROUPS) {
      if (!copiedGroupHasFormats(group, options)) continue;
      const block = createCopiedBlock();
      block.append(
        createCopiedFormatInlineList(group, groupLabel(strings), strings, options, selectFormat)
      );
      section.append(block);
    }
    const devtoolsBlock = createCopiedDeveloperToolsRows(strings, options, selectFormat);
    if (devtoolsBlock) {
      section.append(devtoolsBlock);
    }
    return { root: section, urlBlock, selectFormat };
  }

  // src/panel-popup/language-selector.ts
  function createLanguageSelectorRow(getLocale2, onSelect) {
    const row = document.createElement("div");
    row.className = "ec-lang-row";
    row.dir = "ltr";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Language");
    for (const code of LOCALES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ec-lang-btn";
      button.textContent = LOCALE_BUTTON_LABELS[code];
      button.classList.toggle("is-active", code === getLocale2());
      button.addEventListener("click", () => {
        void Promise.resolve(onSelect(code));
      });
      row.append(button);
    }
    return row;
  }

  // src/settings/copied-session.ts
  var LAST_COPIED_FORMAT_KEY = "lastCopiedFormat";
  var LAST_DOWNLOADED_FORMAT_KEY = "lastDownloadedFormat";
  var LAST_COPIED_PANEL_ACTION_KEY = "lastCopiedPanelAction";
  var COPIED_PANEL_SHOW_STATUS_KEY = "copiedPanelShowStatus";
  async function getLastCopiedFormat() {
    const data = await ext.storage.session.get(LAST_COPIED_FORMAT_KEY);
    const raw = data[LAST_COPIED_FORMAT_KEY];
    return normalizeCopyFormatId(raw) ?? null;
  }
  async function getLastDownloadedFormat() {
    const data = await ext.storage.session.get(LAST_DOWNLOADED_FORMAT_KEY);
    const raw = data[LAST_DOWNLOADED_FORMAT_KEY];
    return normalizeCopyFormatId(raw) ?? null;
  }
  async function getLastCopiedPanelAction() {
    const data = await ext.storage.session.get(LAST_COPIED_PANEL_ACTION_KEY);
    const raw = data[LAST_COPIED_PANEL_ACTION_KEY];
    if (raw === "copied" || raw === "saved") return raw;
    return null;
  }
  async function setLastCopiedFormat(formatId) {
    if (formatId === null) {
      await ext.storage.session.remove(LAST_COPIED_FORMAT_KEY);
      await ext.storage.session.remove(LAST_COPIED_PANEL_ACTION_KEY);
      return;
    }
    await ext.storage.session.set({
      [LAST_COPIED_FORMAT_KEY]: formatId,
      [LAST_COPIED_PANEL_ACTION_KEY]: "copied"
    });
  }
  async function setLastDownloadedFormat(formatId) {
    await ext.storage.session.set({
      [LAST_DOWNLOADED_FORMAT_KEY]: formatId,
      [LAST_COPIED_PANEL_ACTION_KEY]: "saved"
    });
  }
  async function markCopiedPanelShowStatus() {
    await ext.storage.session.set({ [COPIED_PANEL_SHOW_STATUS_KEY]: true });
  }
  async function shouldShowCopiedPanelStatus() {
    const data = await ext.storage.session.get(COPIED_PANEL_SHOW_STATUS_KEY);
    return data[COPIED_PANEL_SHOW_STATUS_KEY] === true;
  }
  function resolveCopiedPanelSelection(lastAction, lastCopiedFormatId, lastDownloadedFormatId, defaultAction = null) {
    if (lastAction === "saved") {
      return lastDownloadedFormatId ? { formatId: lastDownloadedFormatId, action: "download" } : null;
    }
    if (lastAction === "copied" && lastCopiedFormatId) {
      return { formatId: lastCopiedFormatId, action: "copy" };
    }
    return defaultAction ? { formatId: defaultAction.formatId, action: defaultAction.action } : null;
  }

  // src/panel-popup/fetch-picked-format.ts
  async function fetchPickedFormatText(formatId) {
    try {
      const payload = await ext.runtime.sendMessage({
        type: "COPY_PICKED_FORMAT",
        formatId
      });
      if (!payload?.ok || payload.text === void 0) return void 0;
      return payload.text;
    } catch {
      return void 0;
    }
  }

  // src/panel-popup/copy-picked-format.ts
  async function copyPickedFormatFromPanel(formatId) {
    const text = await fetchPickedFormatText(formatId);
    if (text === void 0) return false;
    return copyToClipboardForFormat(formatId, text);
  }

  // src/panel-popup/save-picked-format.ts
  async function savePickedFormatFromPanel(formatId) {
    const [text, meta] = await Promise.all([
      fetchPickedFormatText(formatId),
      readPickCopyMetaFromStorage()
    ]);
    if (text === void 0) return false;
    return downloadTextAsFile(formatId, text, meta);
  }

  // src/panel-popup/lifecycle.ts
  function notifyPanelTabChanged(tab) {
    sendToBackground({ type: "PANEL_TAB_CHANGED", tab });
  }
  function notifyStartPickMode() {
    sendToBackground({ type: "REQUEST_START_PICK_MODE" });
  }
  function notifyCopyPage() {
    sendToBackground({ type: "REQUEST_COPY_PAGE" });
  }
  function notifyPanelClosed() {
    sendToBackground({ type: "PANEL_CLOSED" });
  }
  function bindPanelSessionPort() {
    ext.runtime.connect({ name: PANEL_SESSION_PORT_NAME });
  }

  // src/panel-popup/panel-body.ts
  var PANEL_BODY_CENTERED_CLASS = "ec-panel-body--centered";
  function createPageDivider() {
    const divider = document.createElement("div");
    divider.className = "dd-panel-divider ec-panel-page-divider";
    return divider;
  }
  function createSettingsSectionDivider() {
    const divider = document.createElement("div");
    divider.className = "ec-settings-section-divider";
    divider.setAttribute("aria-hidden", "true");
    return divider;
  }
  function createAboutIcon(iconHtml) {
    const mark = document.createElement("span");
    mark.className = "ec-about-icon";
    mark.setAttribute("aria-hidden", "true");
    mark.innerHTML = iconHtml;
    return mark;
  }
  function createKbd(text) {
    const kbd = document.createElement("kbd");
    kbd.className = "ec-about-kbd";
    kbd.textContent = text;
    return kbd;
  }
  var SHORTCUTS_STEP_RELEASE_EMPHASIS = "Release";
  function appendShortcutsStepRelease(step, text) {
    if (text.startsWith(SHORTCUTS_STEP_RELEASE_EMPHASIS)) {
      const emphasis = document.createElement("span");
      emphasis.className = "ec-shortcuts-step-emphasis";
      emphasis.textContent = SHORTCUTS_STEP_RELEASE_EMPHASIS;
      step.append(emphasis, document.createTextNode(text.slice(SHORTCUTS_STEP_RELEASE_EMPHASIS.length)));
      return;
    }
    step.textContent = text;
  }
  function createShortcutsSectionDivider() {
    const divider = document.createElement("div");
    divider.className = "dd-panel-divider ec-shortcuts-divider";
    divider.setAttribute("aria-hidden", "true");
    return divider;
  }
  function buildShortcutsSteps(strings) {
    const steps = document.createElement("ol");
    steps.className = "ec-shortcuts-steps";
    const step1 = document.createElement("li");
    step1.className = "ec-shortcuts-step--press";
    const pressGrid = document.createElement("div");
    pressGrid.className = "ec-shortcuts-step-press-grid";
    const pressLabel = document.createElement("span");
    pressLabel.className = "ec-shortcuts-step-press-label";
    pressLabel.textContent = strings.shortcutsStepPress;
    const pressChords = document.createElement("div");
    pressChords.className = "ec-shortcuts-step-press-chords";
    pressChords.append(createKbd(ABOUT_PREFIX_CHORD_WIN_DISPLAY));
    const pressMacLabel = document.createElement("span");
    pressMacLabel.className = "ec-shortcuts-step-press-mac-label";
    pressMacLabel.textContent = strings.shortcutsStepOnMac;
    const pressMacChords = document.createElement("div");
    pressMacChords.className = "ec-shortcuts-step-press-mac-chords";
    pressMacChords.append(createKbd(ABOUT_PREFIX_CHORD_MAC_DISPLAY));
    pressGrid.append(pressLabel, pressChords, pressMacLabel, pressMacChords);
    step1.append(pressGrid);
    const step2 = document.createElement("li");
    appendShortcutsStepRelease(step2, strings.shortcutsStepRelease);
    const step3 = document.createElement("li");
    step3.append(
      document.createTextNode(`${strings.shortcutsStepThenPress} `),
      createKbd(getStartHotkeyActionLabel())
    );
    steps.append(step1, step2, step3);
    return steps;
  }
  function createShortcutsWholePageLine(strings) {
    const line = document.createElement("p");
    line.className = "ec-shortcuts-note";
    line.append(
      strings.shortcutsWholePageBefore,
      createKbd(getStartHotkeyActionLabel()),
      strings.shortcutsWholePageAfter
    );
    return line;
  }
  function createAboutCredit(strings) {
    const credit = document.createElement("div");
    credit.className = "ec-about-credit";
    const divider = document.createElement("div");
    divider.className = "dd-panel-divider ec-about-credit-divider";
    divider.setAttribute("aria-hidden", "true");
    const productLine = document.createElement("p");
    productLine.className = "ec-about-credit-line";
    productLine.textContent = strings.aboutProductName;
    const copyrightLine = document.createElement("p");
    copyrightLine.className = "ec-about-credit-line";
    const link = document.createElement("a");
    link.href = PANEL_FOOTER_LINKEDIN_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = strings.aboutCreditAuthor;
    link.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    copyrightLine.append("© ", link);
    credit.append(divider, productLine, copyrightLine);
    return credit;
  }
  function buildStartPanelBody(body, strings, actions) {
    body.replaceChildren();
    const page = document.createElement("div");
    page.className = "ec-panel-page ec-panel-page--start";
    const title = document.createElement("h2");
    title.className = "ec-panel-page-title";
    title.textContent = strings.titleSettings.toUpperCase();
    const center = document.createElement("div");
    center.className = "ec-start-center";
    const copyPageBtn = document.createElement("button");
    copyPageBtn.type = "button";
    copyPageBtn.className = "ec-start-btn";
    copyPageBtn.textContent = strings.capturePageButtonLabel;
    copyPageBtn.addEventListener("click", () => {
      actions.onCopyPage();
    });
    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "ec-start-btn";
    startBtn.textContent = strings.pickElementButtonLabel;
    startBtn.addEventListener("click", () => {
      actions.onStart();
    });
    center.append(copyPageBtn, startBtn);
    page.append(title, createPageDivider(), center);
    body.append(page);
  }
  function buildLoadingPanelBody(body, strings) {
    body.replaceChildren();
    const page = document.createElement("div");
    page.className = "ec-panel-page ec-panel-page--loading";
    const center = document.createElement("div");
    center.className = "ec-loading-center";
    const loader = document.createElement("div");
    loader.className = "ec-loading-spinner";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-label", strings.loadingDataProcessing);
    const label = document.createElement("p");
    label.className = "ec-loading-label";
    label.textContent = strings.loadingDataProcessing;
    center.append(loader, label);
    page.append(center);
    body.append(page);
  }
  async function buildSettingsPanelBody(body, strings, localeOptions) {
    body.replaceChildren();
    const [
      clipboardDefaultFormat,
      inlineImagesSelect,
      frameLabelStyleSelect,
      computeFormatsSection,
      developerToolsToggle,
      darkThemeToggle,
      storedLocale
    ] = await Promise.all([
      createClipboardDefaultFormatSelect(strings),
      createInlineImagesSelect(strings),
      createFrameLabelStyleSelect(strings),
      createComputeFormatsSection(strings),
      createDeveloperToolsToggleRow(strings),
      createDarkThemeToggleRow(strings),
      localeOptions ? Promise.resolve(null) : getLocale()
    ]);
    const getActiveLocale = () => localeOptions?.getLocale() ?? storedLocale ?? "en";
    const languageRow = createLanguageSelectorRow(
      getActiveLocale,
      localeOptions?.onLocaleSelect ?? (() => {
      })
    );
    const togglers = document.createElement("div");
    togglers.className = "ec-settings-togglers";
    togglers.append(computeFormatsSection, developerToolsToggle, darkThemeToggle);
    const page = document.createElement("div");
    page.className = "ec-panel-page ec-panel-page--settings";
    const title = document.createElement("h2");
    title.className = "ec-panel-page-title";
    title.textContent = strings.pageSettingsTitle;
    page.append(
      title,
      createPageDivider(),
      languageRow,
      createSettingsSectionDivider(),
      clipboardDefaultFormat,
      inlineImagesSelect,
      frameLabelStyleSelect,
      createSettingsSectionDivider(),
      togglers
    );
    body.append(page);
  }
  function buildAboutPanelBody(body, strings) {
    body.replaceChildren();
    const page = document.createElement("div");
    page.className = "ec-panel-page ec-panel-page--about";
    const title = document.createElement("h2");
    title.className = "ec-panel-page-title";
    title.textContent = strings.tabAbout;
    const list = document.createElement("ul");
    list.className = "ec-about-list";
    list.setAttribute("aria-label", strings.tabAbout);
    for (const item of buildAboutListItems(strings)) {
      const li = document.createElement("li");
      li.className = "ec-about-item";
      const label = document.createElement("span");
      label.className = "ec-about-text";
      label.textContent = item.text;
      li.append(createAboutIcon(item.iconHtml), label);
      list.appendChild(li);
    }
    page.append(title, createPageDivider(), list, createAboutCredit(strings));
    body.append(page);
  }
  function buildShortcutsPanelBody(body, strings) {
    body.replaceChildren();
    const page = document.createElement("div");
    page.className = "ec-panel-page ec-panel-page--shortcuts";
    const title = document.createElement("h2");
    title.className = "ec-panel-page-title";
    title.textContent = strings.tabShortcuts;
    const runStopHeading = document.createElement("p");
    runStopHeading.className = "ec-shortcuts-heading";
    runStopHeading.textContent = strings.shortcutsRunStopHeading;
    const stopLine = document.createElement("p");
    stopLine.className = "ec-shortcuts-stop";
    const stopLabel = document.createElement("strong");
    stopLabel.textContent = strings.shortcutsStopHeading;
    stopLine.append(stopLabel, " ", createKbd("Esc"));
    const safetyLine1 = document.createElement("p");
    safetyLine1.className = "ec-shortcuts-note";
    safetyLine1.textContent = strings.shortcutsSafetyLine1;
    const safetyLine2 = document.createElement("p");
    safetyLine2.className = "ec-shortcuts-note";
    safetyLine2.textContent = strings.shortcutsSafetyLine2;
    page.append(
      title,
      createPageDivider(),
      runStopHeading,
      buildShortcutsSteps(strings),
      safetyLine1,
      safetyLine2,
      createShortcutsSectionDivider(),
      createShortcutsWholePageLine(strings),
      createShortcutsSectionDivider(),
      stopLine,
      createShortcutsSectionDivider()
    );
    body.append(page);
  }
  function buildCopiedEmptyPanelBody(body, strings, onStart) {
    const page = document.createElement("div");
    page.className = "ec-panel-page ec-panel-page--copied ec-panel-page--copied-empty";
    const message = document.createElement("p");
    message.className = "ec-copied-empty-text";
    message.append(
      document.createTextNode(strings.copiedEmptyLine1),
      document.createElement("br"),
      document.createTextNode(strings.copiedEmptyLine2)
    );
    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "ec-start-btn";
    startBtn.textContent = strings.pickElementButtonLabel;
    startBtn.addEventListener("click", onStart);
    page.append(message, startBtn);
    body.append(page);
  }
  function createCopiedAgainBlock(strings, onStartOver, onNewPage) {
    const again = document.createElement("div");
    again.className = "ec-copied-again";
    const newElementBtn = document.createElement("button");
    newElementBtn.type = "button";
    newElementBtn.className = "ec-start-btn";
    newElementBtn.textContent = strings.pickElementButtonLabel;
    newElementBtn.addEventListener("click", onStartOver);
    const newPageBtn = document.createElement("button");
    newPageBtn.type = "button";
    newPageBtn.className = "ec-start-btn";
    newPageBtn.textContent = strings.capturePageButtonLabel;
    newPageBtn.addEventListener("click", onNewPage);
    again.append(newElementBtn, newPageBtn);
    return again;
  }
  function copiedFormatLabel(formatId, strings, action = null) {
    if (formatId === null) return strings.settingsCopyDefaultNothing;
    if (formatId === "url") return strings.formatUrl;
    if (formatId === "png" && action !== "saved") return strings.formatImage;
    const format = COPY_FORMATS.find((entry) => entry.id === formatId);
    return format ? format.label(strings) : strings.settingsCopyDefaultNothing;
  }
  function copiedSubtitleVisible(state2) {
    if (state2.action === "saved") return state2.downloadedFormatId !== null;
    if (state2.action === "copied") return true;
    return false;
  }
  function updateCopiedPageSubtitle(header, state2, strings) {
    const slot = header.querySelector(".ec-copied-subtitle-slot");
    const subtitle = header.querySelector(".ec-copied-subtitle");
    const prefix = header.querySelector(".ec-copied-subtitle-prefix");
    const what = header.querySelector(".ec-copied-subtitle-what");
    if (!slot || !subtitle || !prefix || !what) return;
    const visible = copiedSubtitleVisible(state2);
    slot.classList.toggle("ec-copied-subtitle-slot--empty", !visible);
    subtitle.hidden = !visible;
    if (!visible) return;
    if (state2.action === "saved" && state2.downloadedFormatId !== null) {
      prefix.textContent = strings.copiedSubtitleDownloadPrefix;
      what.textContent = copiedFormatLabel(state2.downloadedFormatId, strings, "saved");
      what.classList.remove("ec-copied-subtitle-what--nothing");
      return;
    }
    prefix.textContent = strings.copiedSubtitlePrefix;
    what.textContent = copiedFormatLabel(state2.copiedFormatId, strings, "copied");
    what.classList.toggle("ec-copied-subtitle-what--nothing", state2.copiedFormatId === null);
  }
  function createCopiedPageHeader(state2, strings) {
    const header = document.createElement("div");
    header.className = "ec-copied-header";
    const title = document.createElement("h2");
    title.className = "ec-copied-title";
    title.textContent = strings.copiedTitle;
    const slot = document.createElement("div");
    slot.className = "ec-copied-subtitle-slot";
    const subtitle = document.createElement("p");
    subtitle.className = "ec-copied-subtitle";
    const prefix = document.createElement("span");
    prefix.className = "ec-copied-subtitle-prefix";
    const what = document.createElement("span");
    what.className = "ec-copied-subtitle-what";
    subtitle.append(prefix, document.createTextNode(" "), what);
    slot.append(subtitle);
    header.append(title, slot);
    updateCopiedPageSubtitle(header, state2, strings);
    return header;
  }
  var COPIED_HEIGHT_PROBE_PREVIEW = '<div class="ec-probe-preview"><span>preview</span></div>';
  function buildCopiedHeightProbeCacheRecord() {
    const record = {};
    for (const format of COPY_FORMATS) {
      record[resolvePickCopyCacheStorageKey(format.id)] = COPIED_HEIGHT_PROBE_PREVIEW;
    }
    record.url = COPIED_HEIGHT_PROBE_PREVIEW;
    return record;
  }
  async function openCachedUrlFromPanel(url) {
    if (!url.trim()) return false;
    try {
      const response = await ext.runtime.sendMessage({
        type: "OPEN_CACHED_URL",
        url
      });
      return response?.ok === true;
    } catch {
      return false;
    }
  }
  async function buildCopiedPanelBodyForHeightProbe(body, strings) {
    body.replaceChildren();
    const page = document.createElement("div");
    page.className = "ec-panel-page ec-panel-page--copied";
    const subtitleState = {
      action: "copied",
      copiedFormatId: "text",
      downloadedFormatId: null
    };
    const header = createCopiedPageHeader(subtitleState, strings);
    const { root: otherOptions, urlBlock } = createCopiedOtherOptionsRow(strings, {
      enabledFormats: defaultEnabledFormats(),
      pickCopyCacheRecord: buildCopiedHeightProbeCacheRecord(),
      selectionSyncRoot: page,
      onCopyFormat: () => {
      },
      onSaveFormat: () => {
      },
      onOpenUrl: () => {
      }
    });
    page.append(
      header,
      urlBlock,
      otherOptions,
      createCopiedAgainBlock(strings, () => {
      }, () => {
      })
    );
    syncCopiedPanelFormatSelection(page, { formatId: "text", action: "copy" });
    body.append(page);
  }
  async function buildCopiedPanelBody(body, strings, actions = {}) {
    body.replaceChildren();
    const [
      enabledFormats,
      lastCopiedFormatId,
      lastCopiedPanelAction,
      lastDownloadedFormatId,
      hasCache,
      pickCopyCacheRecord,
      defaultActionSetting,
      showCopiedStatus
    ] = await Promise.all([
      getEnabledFormats(),
      getLastCopiedFormat(),
      getLastCopiedPanelAction(),
      getLastDownloadedFormat(),
      hasPickCopyCacheInStorage(),
      readPickCopyCacheFromStorage(),
      getDefaultAction(),
      shouldShowCopiedPanelStatus()
    ]);
    if (!hasCache) {
      buildCopiedEmptyPanelBody(body, strings, actions.onStartOver ?? (() => {
      }));
      return;
    }
    const page = document.createElement("div");
    page.className = "ec-panel-page ec-panel-page--copied";
    const subtitleState = showCopiedStatus ? {
      action: lastCopiedPanelAction,
      copiedFormatId: lastCopiedFormatId,
      downloadedFormatId: lastDownloadedFormatId
    } : {
      action: null,
      copiedFormatId: null,
      downloadedFormatId: null
    };
    const header = createCopiedPageHeader(subtitleState, strings);
    const defaultActionForHighlight = isActiveDefaultAction(defaultActionSetting) ? defaultActionSetting : null;
    const selectedSelection = showCopiedStatus ? resolveCopiedPanelSelection(
      lastCopiedPanelAction,
      lastCopiedFormatId,
      lastDownloadedFormatId,
      defaultActionForHighlight
    ) : null;
    const { root: otherOptions, urlBlock, selectFormat } = createCopiedOtherOptionsRow(strings, {
      enabledFormats,
      pickCopyCacheRecord,
      selectionSyncRoot: page,
      onCopyFormat: async (formatId) => {
        const copied = await copyPickedFormatFromPanel(formatId);
        if (!copied) return false;
        const nextState = {
          action: "copied",
          copiedFormatId: formatId,
          downloadedFormatId: lastDownloadedFormatId
        };
        updateCopiedPageSubtitle(header, nextState, strings);
        await setLastCopiedFormat(formatId);
        await markCopiedPanelShowStatus();
        selectFormat(formatId, "copy");
        return true;
      },
      onSaveFormat: async (formatId) => {
        const saved = await savePickedFormatFromPanel(formatId);
        if (!saved) return false;
        const nextState = {
          action: "saved",
          copiedFormatId: lastCopiedFormatId,
          downloadedFormatId: formatId
        };
        updateCopiedPageSubtitle(header, nextState, strings);
        await setLastDownloadedFormat(formatId);
        await markCopiedPanelShowStatus();
        selectFormat(formatId, "download");
        return true;
      },
      onOpenUrl: async (url) => {
        await openCachedUrlFromPanel(url);
      }
    });
    page.append(
      header,
      urlBlock,
      otherOptions,
      createCopiedAgainBlock(
        strings,
        actions.onStartOver ?? (() => {
        }),
        actions.onNewPage ?? (() => {
        })
      )
    );
    syncCopiedPanelFormatSelection(page, selectedSelection);
    body.append(page);
  }

  // src/panel-popup/panel-heights.ts
  var cachedMaxPopupHeightPx = null;
  var cachedActionPopupWidthPx = null;
  var COPIED_DOWNLOAD_ROW_LABEL_ID = "ec-copied-formats-files";
  function createPanelPopupProbeHost(widthCss) {
    const probeHost = document.createElement("div");
    probeHost.className = "ec-panel-popup";
    probeHost.style.cssText = `position:fixed;left:-9999px;width:${widthCss};max-width:none;visibility:hidden;pointer-events:none;`;
    const shadow = probeHost.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `.ec-panel-header,
.dd-panel-header {
  flex: 0 0 auto;
  padding: 1.125rem 1.125rem 0;
}

.ec-panel-divider,
.dd-panel-divider {
  flex: 0 0 auto;
  width: 90%;
  height: 1px;
  margin-inline: auto;
  background: #012292;
}

.dd-panel-title-row {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas: "stack";
  align-items: center;
}

.dd-panel-logo,
.dd-panel-heading {
  grid-area: stack;
}

.dd-panel-logo {
  display: flex;
  align-items: stretch;
  align-self: stretch;
  justify-self: start;
  line-height: 0;
  z-index: 1;
}

.dd-panel-logo svg {
  display: block;
  height: 100%;
  width: auto;
  aspect-ratio: 1;
  flex-shrink: 0;
}

.dd-panel-heading {
  justify-self: center;
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;
  min-width: 0;
  max-width: 100%;
  font-size: 0.82rem;
}

.dd-panel-title {
  margin: 0;
  font-size: inherit;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-align: center;
  text-transform: uppercase;
  color: #012292;
}

.dd-panel-subtitle {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.2;
  white-space: nowrap;
  text-align: center;
  color: #666666;
}

.ec-panel-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  gap: 0.55rem;
  margin-top: auto;
  padding: 1.125rem;
}

.ec-panel-footer a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: #999;
  border-radius: 0.35rem;
  text-decoration: none;
  background: transparent;
}

.ec-panel-footer a:hover,
.ec-panel-footer a:focus-visible {
  color: #012292;
}

.ec-panel-footer svg {
  display: block;
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
}

:host(.ec-panel-popup) {
  display: flex;
  flex-direction: column;
  position: relative;
  inset: auto;
  width: 100%;
  min-height: 0;
  height: auto;
  pointer-events: auto;
  z-index: 1;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.3;
  color: #1f2937;
}

:host(.ec-panel-popup) *,
:host(.ec-panel-popup) *::before,
:host(.ec-panel-popup) *::after {
  box-sizing: border-box;
}

:host(.ec-panel-popup) button:focus:not(:focus-visible),
:host(.ec-panel-popup) a:focus:not(:focus-visible) {
  outline: none;
}

:host(.ec-panel-popup) button:focus-visible,
:host(.ec-panel-popup) a:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 2px;
}

.ec-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(20rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  overflow: hidden;
  color: #1f2937;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px) saturate(1.35);
  -webkit-backdrop-filter: blur(20px) saturate(1.35);
  border: 1px solid rgba(255, 255, 255, 0.78);
  box-shadow:
    0 18px 48px rgba(1, 34, 146, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.18);
}

.ec-panel--surface-popup {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  height: 100%;
  max-height: none;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

.ec-panel--surface-popup > .dd-panel-header,
.ec-panel--surface-popup > .ec-panel-footer,
.ec-panel--surface-popup > .dd-panel-divider {
  display: none;
}

.ec-panel-main {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
}

.ec-panel--surface-popup > .ec-panel-main {
  align-items: stretch;
  direction: ltr;
}

.ec-panel-menu {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.75rem 0 0.75rem 0.75rem;
  padding: 0.35rem;
  border-radius: 0.5rem;
  background: rgba(1, 34, 146, 0.06);
}

.ec-panel--surface-popup .ec-panel-menu {
  --ec-menu-gap: 0.3rem;
  flex: 0 0 2.85rem;
  width: 2.85rem;
  align-self: stretch;
  justify-content: flex-start;
  gap: var(--ec-menu-gap);
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  margin-inline-start: 0.5rem;
  margin-inline-end: 0;
  padding-block-start: var(--ec-menu-gap);
  padding-inline-end: var(--ec-menu-gap);
  padding-block-end: var(--ec-menu-gap);
  padding-inline-start: var(--ec-menu-gap);
}

.ec-panel-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.ec-panel--surface-popup .ec-panel-content {
  flex: 1 1 0;
  min-width: 0;
}

.ec-panel[dir="rtl"] .ec-panel-content {
  direction: rtl;
}

.ec-panel--surface-popup .ec-panel-content > .dd-panel-divider {
  display: none;
}

.ec-panel-menu-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0.4rem;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
}

.ec-panel-menu-btn svg {
  display: block;
  width: 1.15rem;
  height: 1.15rem;
}

.ec-panel-menu-btn:hover,
.ec-panel-menu-btn:focus-visible {
  color: #012292;
  background: rgba(1, 34, 146, 0.08);
}

.ec-panel-menu-btn--active {
  color: #012292;
  background: rgba(1, 34, 146, 0.14);
}

.ec-panel-menu-btn::after {
  content: attr(data-tooltip);
  position: absolute;
  left: calc(100% + 0.45rem);
  top: 50%;
  z-index: 2;
  transform: translateY(-50%);
  padding: 0.28rem 0.5rem;
  border-radius: 0.35rem;
  background: #111827;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.12s ease,
    visibility 0s linear 0.12s;
}

.ec-panel-menu-btn:hover::after,
.ec-panel-menu-btn:focus-visible::after {
  opacity: 1;
  visibility: visible;
  transition-delay: 0s, 0s;
}

.ec-panel--surface-popup .ec-panel-body.ec-panel-body--centered {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ec-panel-page {
  margin: 0;
}

.ec-panel--surface-popup .ec-panel-body:has(.ec-panel-page--start) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ec-panel-page--start {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.ec-panel--surface-popup .ec-panel-body:has(.ec-panel-page--loading) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ec-panel-page--loading {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.ec-loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
}

.ec-loading-spinner {
  width: 2.8rem;
  height: 2.8rem;
  border: 4px solid rgba(1, 34, 146, 0.18);
  border-top-color: #012292;
  border-radius: 50%;
  animation: ec-loading-spin 0.8s linear infinite;
}

.ec-loading-label {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

@keyframes ec-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

.ec-panel-page-title {
  margin: 0.5rem 0 0.85rem;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #111827;
}

.ec-panel--surface-popup .ec-panel-page-title {
  text-align: center;
}

.ec-panel-page-divider {
  margin: 0 0 0.5rem;
}

.ec-panel-page-text {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  text-align: left;
}

.ec-panel-page--shortcuts {
  width: 100%;
}

.ec-shortcuts-heading {
  margin: 0.5rem 0 0;
  font-size: 0.84rem;
  line-height: 1.45;
  font-weight: 700;
  color: #374151;
}

.ec-shortcuts-stop {
  margin: 0.5rem 0 0;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #374151;
}

.ec-shortcuts-stop strong {
  font-weight: 700;
}

.ec-shortcuts-note {
  margin: 0.2rem 0 0;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #6b7280;
}

.ec-shortcuts-steps + .ec-shortcuts-note {
  margin-top: 0.65rem;
}

.ec-shortcuts-divider {
  width: 100%;
  height: 0;
  margin: 0.7rem 0 0.5rem;
  border: 0;
  border-top: 1px solid rgba(1, 34, 146, 0.14);
  background: transparent;
}

.ec-shortcuts-stop + .ec-shortcuts-divider {
  margin-top: 0.5rem;
}

/* Как в welcome: --welcome-gap (12px) между header и разделителем */
.ec-panel > .dd-panel-divider {
  margin-top: 0.75rem;
}

.ec-panel-body {
  flex: 1 1 auto;
  padding: 1.125rem;
  overflow: auto;
}

.ec-panel--surface-popup .ec-panel-body {
  flex: 1 1 auto;
  overflow: visible;
}

.ec-panel--surface-popup .ec-panel-content .ec-panel-body {
  flex: 1 1 auto;
  padding: 1rem 0.95rem;
}

.ec-panel--surface-popup .ec-panel-page-divider {
  width: 100%;
}

.ec-start-center {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-height: 0;
}

.ec-start-btn {
  width: 100%;
  max-width: 12rem;
  min-width: 8.5rem;
  padding: 0.85rem 2rem;
  border: none;
  border-radius: 0.65rem;
  background: #012292;
  color: #fff;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow:
    0 6px 14px rgba(1, 34, 146, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.08);
}

.ec-start-btn:hover {
  background: #011a6e;
}

.ec-start-btn:active {
  transform: translateY(1px);
}

.ec-panel-page--settings {
  display: flex;
  flex-direction: column;
  width: 100%;
  --ec-settings-row-gap: 0.35rem;
  --ec-settings-row-margin-top: 0.85rem;
}

.ec-lang-row {
  display: flex;
  width: 100%;
  gap: 0.3rem;
  margin-top: 0.85rem;
  /* EN | ES | … order is fixed; panel RTL must not mirror this row. */
  direction: ltr;
}

.ec-lang-btn {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.35rem 0.25rem;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 0.4rem;
  background: #fff;
  color: #1f2937;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 0 10px rgba(0, 0, 0, 0.06);
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.ec-lang-btn.is-active {
  background: #012292;
  border-color: #012292;
  color: #fff;
  box-shadow: none;
}

.ec-lang-btn.is-active:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.9);
}

.ec-lang-btn:not(.is-active):hover,
.ec-lang-btn:not(.is-active):focus-visible {
  color: #012292;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 0 14px rgba(0, 0, 0, 0.09);
}

.ec-lang-btn.is-active:hover,
.ec-lang-btn.is-active:focus-visible {
  color: #fff;
}

.ec-panel-page--settings .ec-copy-default-row,
.ec-panel-page--settings .ec-toggle-row {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
  margin-top: var(--ec-settings-row-margin-top);
}

.ec-panel-page--settings .ec-toggle-row {
  justify-content: space-between;
}

.ec-copy-default-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  column-gap: var(--ec-settings-row-gap);
  width: 100%;
  min-width: 0;
  margin-top: 0.85rem;
}

.ec-copy-default-label {
  min-width: 0;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;
  color: #1f2937;
}

.ec-copy-default-label--with-info {
  display: inline-flex;
  align-items: center;
  gap: 0.14rem;
  width: 100%;
  min-width: 0;
}

.ec-panel-page--settings .ec-copy-default-label,
.ec-panel-page--settings .ec-toggle-label {
  display: flex;
  align-items: center;
  text-align: start;
  flex: 1 1 0;
  min-width: 0;
}

.ec-panel-page--settings .ec-copy-default-label--with-info {
  justify-content: flex-start;
  width: auto;
}

.ec-panel-page--settings .ec-copy-default-select {
  flex: 0 0 50%;
  width: 50%;
  min-width: 0;
}

.ec-panel-page--settings .ec-toggle {
  flex: 0 0 auto;
}

.ec-copy-default-label-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ec-copy-default-select {
  justify-self: stretch;
  width: 100%;
  min-width: 0;
  max-width: none;
  padding: 0.45rem 0.55rem;
  padding-inline-end: 1.45rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0.45rem;
  background: #fff;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.45rem center;
  background-size: 0.62rem 0.42rem;
  color: #1f2937;
  font: inherit;
  font-size: 0.82rem;
  line-height: 1.25;
  text-align: start;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ec-copy-default-select:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 1px;
}

.ec-copy-default-select--nothing {
  color: #6b7280;
}

.ec-copy-default-select option.ec-copy-default-option-nothing {
  color: #6b7280;
}

.ec-inline-images-info {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.ec-inline-images-info:hover,
.ec-inline-images-info:focus-visible {
  color: #012292;
  background: rgba(1, 34, 146, 0.08);
}

.ec-inline-images-info svg {
  display: block;
  width: 1rem;
  height: 1rem;
}

.ec-info-window-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.32);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.ec-info-window {
  position: relative;
  width: 100%;
  max-width: 18rem;
  max-height: calc(100% - 2rem);
  overflow: auto;
  padding: 1.1rem 1.1rem 1rem;
  border-radius: 0.75rem;
  background: #fff;
  color: #1f2937;
  box-shadow: 0 12px 40px rgba(1, 34, 146, 0.22);
}

.ec-info-window-close {
  position: absolute;
  top: 0.4rem;
  inset-inline-end: 0.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #6b7280;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}

.ec-info-window-close:hover,
.ec-info-window-close:focus-visible {
  color: #111827;
  background: rgba(0, 0, 0, 0.06);
}

.ec-info-window-content {
  font-size: 0.82rem;
  line-height: 1.45;
}

.ec-info-window-content p {
  margin: 0;
  padding-inline-end: 0.6rem;
}

.ec-format-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
  margin-top: 0.85rem;
}

.ec-format-field-label {
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;
  color: #1f2937;
}

.ec-format-select {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0.45rem;
  background: #fff;
  color: #1f2937;
  font: inherit;
  font-size: 0.82rem;
  line-height: 1.25;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.ec-format-select:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 1px;
}

.ec-settings-togglers {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: var(--ec-settings-row-margin-top);
}

.ec-settings-togglers .ec-compute-formats-section {
  padding-top: 0;
}

.ec-settings-togglers .ec-compute-formats-section .ec-toggle-row {
  margin-top: 0;
}

.ec-settings-togglers .ec-compute-formats-section + .ec-toggle-row,
.ec-settings-togglers .ec-toggle-row + .ec-toggle-row {
  margin-top: var(--ec-settings-row-margin-top);
}

.ec-panel-page--settings .ec-settings-togglers .ec-developer-tools-toggle,
.ec-panel-page--settings .ec-settings-togglers .ec-dark-theme-toggle {
  width: 100%;
}

.ec-panel-page--settings .ec-toggle-label {
  white-space: nowrap;
}

.ec-settings-format-inline-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.45rem;
  width: 100%;
}

.ec-settings-format-inline-list-label {
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.25;
  color: #374151;
}

.ec-panel-page--settings .ec-panel-page-title + .ec-panel-page-divider {
  margin-top: 0;
}

.ec-panel-page--settings .ec-panel-page-divider {
  margin-top: 0.85rem;
}

.ec-settings-section-divider,
.ec-copied-block {
  border-top: 1px solid rgba(1, 34, 146, 0.14);
}

.ec-settings-section-divider {
  flex: 0 0 auto;
  width: 100%;
  margin-top: var(--ec-settings-row-margin-top);
}

.ec-format-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  width: 100%;
}

.ec-format-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.55rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.78rem;
  line-height: 1.2;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.03);
}

.ec-format-chip.is-enabled {
  background: #dcfce7;
  border-color: #86efac;
  color: #111827;
}

.ec-format-chip:not(.is-enabled):hover,
.ec-format-chip:not(.is-enabled):focus-visible {
  background: #e5e7eb;
}

.ec-format-chip.is-enabled:hover,
.ec-format-chip.is-enabled:focus-visible {
  background: #bbf7d0;
}

.ec-format-chip-label {
  display: inline-grid;
  min-width: 0;
}

.ec-format-chip-label::before {
  content: attr(data-text);
  grid-area: 1 / 1;
  font-weight: 700;
  visibility: hidden;
  pointer-events: none;
  user-select: none;
}

.ec-format-chip-label-text {
  grid-area: 1 / 1;
  min-width: 0;
  font-weight: 400;
}

.ec-format-chip.is-enabled .ec-format-chip-label-text {
  font-weight: 700;
}

.ec-format-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.65rem;
  border: 1px solid rgba(1, 34, 146, 0.14);
  border-radius: 0.45rem;
  background: rgba(1, 34, 146, 0.06);
  color: #012292;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
}

.ec-format-action-btn:hover,
.ec-format-action-btn:focus-visible {
  background: rgba(1, 34, 146, 0.12);
}

.ec-format-action-btn--selected {
  background: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.ec-format-action-btn--selected:hover,
.ec-format-action-btn--selected:focus-visible {
  background: #bbf7d0;
}

.ec-format-action-btn--unavailable {
  position: relative;
  border-color: rgba(107, 114, 128, 0.2);
  background: rgba(107, 114, 128, 0.08);
  color: #9ca3af;
  cursor: default;
}

.ec-format-action-btn--unavailable::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.3rem);
  z-index: 2;
  transform: translateX(-50%);
  padding: 0.22rem 0.42rem;
  border-radius: 0.3rem;
  border: 1px solid rgba(107, 114, 128, 0.22);
  background: #fff;
  color: #6b7280;
  font-size: 0.68rem;
  font-weight: 500;
  line-height: 1.25;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
  opacity: 0;
  visibility: hidden;
}

.ec-format-action-btn--unavailable.ec-format-action-btn--show-tooltip::after {
  opacity: 1;
  visibility: visible;
}

.ec-format-action-btn--unavailable:hover,
.ec-format-action-btn--unavailable:focus-visible {
  background: rgba(107, 114, 128, 0.08);
}

.ec-format-action-btn--settings-off {
  text-decoration: line-through;
}

.ec-compute-formats-section {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

.ec-toggle-label--with-info {
  display: inline-flex;
  align-items: center;
  gap: 0.14rem;
  min-width: 0;
}

.ec-toggle-label-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ec-panel-page--settings .ec-toggle-label--with-info {
  justify-content: flex-start;
  width: auto;
}

.ec-compute-formats-toggle {
  width: 100%;
}

.ec-copied-other-options {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0;
  width: 100%;
  text-align: start;
}

.ec-copied-other-options .ec-settings-format-inline-list-label {
  flex: 0 0 5.25rem;
}

.ec-copied-url-block {
  flex: 0 0 auto;
  width: 100%;
  padding-block: 2mm;
}

.ec-copied-url-inline {
  --ec-copied-field-block-size: calc(0.6rem + 0.72rem * 1.25 + 2px);
  flex-wrap: nowrap;
  align-items: center;
}

.ec-copied-url-inline .ec-copied-url-copy {
  flex: 1 1 0;
  width: 100%;
  min-width: 0;
}

.ec-copied-url-inline .ec-copied-devtools-row-field {
  width: 100%;
  box-sizing: border-box;
}

.ec-copied-url-copy {
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: start;
  cursor: pointer;
}

.ec-copied-url-copy:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 1px;
}

.ec-copied-url-copy:hover .ec-copied-devtools-row-field,
.ec-copied-url-copy:focus-visible .ec-copied-devtools-row-field {
  background: rgba(1, 34, 146, 0.12);
}

.ec-copied-url-copy--unavailable,
.ec-copied-url-copy--unavailable:disabled {
  cursor: default;
  pointer-events: none;
}

.ec-copied-url-copy--unavailable .ec-copied-devtools-row-field {
  color: #9ca3af;
  background: rgba(107, 114, 128, 0.08);
}

.ec-copied-url-copy--selected .ec-copied-devtools-row-field {
  background: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.ec-copied-url-copy--selected:hover .ec-copied-devtools-row-field,
.ec-copied-url-copy--selected:focus-visible .ec-copied-devtools-row-field {
  background: #bbf7d0;
}

.ec-copied-url-open {
  flex: 0 0 var(--ec-copied-field-block-size);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ec-copied-field-block-size);
  height: var(--ec-copied-field-block-size);
  margin: 0;
  padding: 0;
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 0.35rem;
  background: rgba(37, 99, 235, 0.06);
  color: #2563eb;
  font-size: 0.72rem;
  cursor: pointer;
  box-sizing: border-box;
}

.ec-copied-url-open svg {
  display: block;
  width: 0.9em;
  height: 0.9em;
}

.ec-copied-url-open:hover,
.ec-copied-url-open:focus-visible {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.ec-copied-url-open:disabled {
  border-color: rgba(107, 114, 128, 0.2);
  background: rgba(107, 114, 128, 0.08);
  color: #9ca3af;
  cursor: default;
  pointer-events: none;
}

.ec-copied-block {
  flex: 0 0 auto;
  width: 100%;
  padding-block: 2mm;
}

.ec-copied-devtools-rows {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 0.5rem;
  row-gap: 0.35rem;
  width: 100%;
  min-width: 0;
}

.ec-copied-devtools-row {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
  width: 100%;
  min-width: 0;
  white-space: nowrap;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: start;
  cursor: pointer;
}

.ec-copied-devtools-row:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 1px;
}

.ec-copied-devtools-row-label {
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  color: #374151;
  white-space: nowrap;
}

.ec-copied-devtools-row-field {
  --ec-copied-field-block-size: calc(0.6rem + 1.25em + 2px);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  min-height: var(--ec-copied-field-block-size);
  padding: 0.3rem 0.45rem;
  border: 1px solid rgba(1, 34, 146, 0.14);
  border-radius: 0.35rem;
  background: rgba(1, 34, 146, 0.06);
  color: #012292;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 0.72rem;
  line-height: 1.25;
  user-select: none;
}

.ec-copied-devtools-row-value {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ec-copied-devtools-row-copy-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  color: currentColor;
}

.ec-copied-devtools-row-copy-icon svg {
  display: block;
  width: 0.9em;
  height: 0.9em;
}

.ec-copied-devtools-row:hover .ec-copied-devtools-row-field,
.ec-copied-devtools-row:focus-visible .ec-copied-devtools-row-field {
  background: rgba(1, 34, 146, 0.12);
}

.ec-copied-devtools-row--unavailable,
.ec-copied-devtools-row--unavailable:disabled {
  cursor: default;
  pointer-events: none;
}

.ec-copied-devtools-row--unavailable .ec-copied-devtools-row-field {
  color: #9ca3af;
  background: rgba(107, 114, 128, 0.08);
}

.ec-copied-devtools-row--selected .ec-copied-devtools-row-field {
  background: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.ec-copied-devtools-row--selected:hover .ec-copied-devtools-row-field,
.ec-copied-devtools-row--selected:focus-visible .ec-copied-devtools-row-field {
  background: #bbf7d0;
}

.ec-toggle-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ec-toggle-label {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;
  color: #1f2937;
  text-align: start;
  cursor: pointer;
}

.ec-toggle {
  position: relative;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 1.4rem;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.12);
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 0 10px rgba(0, 0, 0, 0.06);
}

.ec-toggle.is-on {
  background: #012292;
  border-color: #012292;
}

.ec-toggle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 0.15rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #fff;
  transform: translateY(-50%);
  transition: left 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.ec-toggle.is-on::after {
  left: calc(100% - 1rem - 0.15rem);
}

.ec-toggle:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 2px;
}

.ec-panel--surface-popup .ec-panel-body:has(.ec-panel-page--copied) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  align-items: stretch;
}

/* Bottom inset lives only on \`.ec-copied-again\` — avoid stacking with panel-body padding. */
.ec-panel--surface-popup
  .ec-panel-body:has(.ec-panel-page--copied:not(.ec-panel-page--copied-empty)) {
  padding-bottom: 0;
}

.ec-panel-page--copied {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.ec-copied-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 3cm;
  gap: 0.25rem;
  width: 100%;
  padding-block: 2mm;
  text-align: center;
}

.ec-copied-title {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.25;
  color: #15803d;
}

.ec-copied-subtitle-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 1.35em;
}

.ec-copied-subtitle-slot--empty .ec-copied-subtitle {
  visibility: hidden;
}

.ec-copied-subtitle {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.35;
}

.ec-copied-subtitle-what {
  color: #111827;
  font-weight: 700;
}

.ec-copied-subtitle-what--nothing {
  color: #6b7280;
  font-weight: 400;
}

.ec-copied-again {
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  align-items: stretch;
  gap: 0.65rem;
  width: 100%;
  padding-block: 0.9rem;
  border-top: 1px solid rgba(1, 34, 146, 0.14);
}

.ec-copied-again .ec-start-btn {
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(1, 34, 146, 0.14);
  border-radius: 0.45rem;
  background: rgba(1, 34, 146, 0.06);
  color: #012292;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.2;
  box-shadow: none;
}

.ec-copied-again .ec-start-btn:hover,
.ec-copied-again .ec-start-btn:focus-visible {
  background: rgba(1, 34, 146, 0.12);
  color: #012292;
}

.ec-copied-again .ec-start-btn:active {
  transform: none;
  background: rgba(1, 34, 146, 0.12);
}

.ec-panel--surface-popup .ec-panel-body:has(.ec-panel-page--copied-empty) {
  justify-content: center;
  align-items: center;
}

.ec-panel-page--copied-empty {
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  text-align: center;
}

.ec-copied-empty-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: #6b7280;
}

.ec-panel--surface-popup .ec-panel-body:has(.ec-panel-page--about) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ec-panel-page--about {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.ec-about-credit {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: auto;
  padding-top: 0.75rem;
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
}

.ec-about-credit-divider {
  width: 100%;
  margin: 0 0 0.5rem;
  background: currentColor;
}

.ec-about-credit-line {
  margin: 0;
  line-height: 1.35;
  color: inherit;
}

.ec-about-credit a:any-link {
  color: inherit;
  text-decoration: underline;
}

.ec-about-credit a:hover,
.ec-about-credit a:focus-visible {
  color: inherit;
}

.ec-panel-page--about .ec-panel-page-title {
  width: 100%;
  text-align: center;
}

.ec-about-list {
  list-style: none;
  width: 100%;
  max-width: 100%;
  margin: 0 0 0.85rem;
  padding: 0;
  text-align: left;
}

.ec-about-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.35rem;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #374151;
  text-align: left;
}

.ec-about-item:last-child {
  margin-bottom: 0;
}

.ec-about-item--hotkey {
  align-items: flex-start;
}

.ec-about-hotkey-content {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.ec-about-text {
  text-align: left;
}

.ec-about-item--hotkey .ec-about-text {
  display: block;
}

.ec-shortcuts-steps,
.ec-about-steps {
  margin: 0.2rem 0 0;
  padding-left: 1.15rem;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #374151;
  text-align: left;
}

.ec-shortcuts-steps li,
.ec-about-steps li {
  margin-bottom: 0.2rem;
}

.ec-shortcuts-steps li:last-child,
.ec-about-steps li:last-child {
  margin-bottom: 0;
}

.ec-shortcuts-step-emphasis {
  font-weight: 600;
}

.ec-shortcuts-step-press-grid,
.ec-about-step-press-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 0.35em;
  align-items: start;
}

.ec-shortcuts-step-press-label,
.ec-about-step-press-label {
  grid-column: 1;
  grid-row: 1;
}

.ec-shortcuts-step-press-chords,
.ec-about-step-press-chords {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

.ec-shortcuts-step-press-mac-label,
.ec-about-step-press-mac-label {
  grid-column: 1;
  grid-row: 2;
}

.ec-shortcuts-step-press-mac-chords,
.ec-about-step-press-mac-chords {
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
}

.ec-about-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  line-height: 0;
  color: #6b7280;
}

.ec-about-icon svg {
  display: block;
  width: 1rem;
  height: 1rem;
}

.ec-about-kbd {
  display: inline-block;
  padding: 0.08rem 0.35rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background: #f9fafb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8em;
  font-weight: 600;
  line-height: 1.3;
  color: #111827;
}

/* Dark theme (SETTINGS → Dark theme, default off) */
:host(.ec-panel-popup--dark) {
  color: #e5e7eb;
}

:host(.ec-panel-popup--dark) button:focus-visible,
:host(.ec-panel-popup--dark) a:focus-visible {
  outline-color: #60a5fa;
}

:host(.ec-panel-popup--dark) .ec-panel {
  color: #e5e7eb;
  background: rgba(17, 24, 39, 0.96);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 18px 48px rgba(0, 0, 0, 0.35),
    0 8px 24px rgba(0, 0, 0, 0.45);
}

:host(.ec-panel-popup--dark) .dd-panel-divider,
:host(.ec-panel-popup--dark) .ec-panel-divider {
  background: rgba(96, 165, 250, 0.55);
}

:host(.ec-panel-popup--dark) .dd-panel-title {
  color: #93c5fd;
}

:host(.ec-panel-popup--dark) .dd-panel-subtitle {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-panel-menu {
  background: rgba(96, 165, 250, 0.12);
}

:host(.ec-panel-popup--dark) .ec-panel-menu-btn {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-panel-menu-btn:hover,
:host(.ec-panel-popup--dark) .ec-panel-menu-btn:focus-visible {
  color: #93c5fd;
  background: rgba(96, 165, 250, 0.16);
}

:host(.ec-panel-popup--dark) .ec-panel-menu-btn--active {
  color: #bfdbfe;
  background: rgba(96, 165, 250, 0.22);
}

:host(.ec-panel-popup--dark) .ec-panel-page-title,
:host(.ec-panel-popup--dark) .ec-copied-title {
  color: #f3f4f6;
}

:host(.ec-panel-popup--dark) .ec-panel-page-text,
:host(.ec-panel-popup--dark) .ec-loading-label,
:host(.ec-panel-popup--dark) .ec-shortcuts-heading,
:host(.ec-panel-popup--dark) .ec-shortcuts-stop,
:host(.ec-panel-popup--dark) .ec-shortcuts-steps,
:host(.ec-panel-popup--dark) .ec-copy-default-label,
:host(.ec-panel-popup--dark) .ec-toggle-label,
:host(.ec-panel-popup--dark) .ec-format-field-label,
:host(.ec-panel-popup--dark) .ec-settings-format-inline-list-label,
:host(.ec-panel-popup--dark) .ec-copied-devtools-row-label,
:host(.ec-panel-popup--dark) .ec-copied-subtitle,
:host(.ec-panel-popup--dark) .ec-copied-subtitle-what,
:host(.ec-panel-popup--dark) .ec-about-item,
:host(.ec-panel-popup--dark) .ec-about-steps {
  color: #d1d5db;
}

:host(.ec-panel-popup--dark) .ec-shortcuts-note,
:host(.ec-panel-popup--dark) .ec-copied-empty-text,
:host(.ec-panel-popup--dark) .ec-copied-subtitle-what--nothing,
:host(.ec-panel-popup--dark) .ec-about-icon,
:host(.ec-panel-popup--dark) .ec-about-text,
:host(.ec-panel-popup--dark) .ec-about-credit {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-shortcuts-divider,
:host(.ec-panel-popup--dark) .ec-settings-section-divider,
:host(.ec-panel-popup--dark) .ec-copied-block {
  border-top-color: rgba(96, 165, 250, 0.22);
}

:host(.ec-panel-popup--dark) .ec-loading-spinner {
  border-color: rgba(96, 165, 250, 0.25);
  border-top-color: #60a5fa;
}

:host(.ec-panel-popup--dark) .ec-lang-btn {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(31, 41, 55, 0.9);
  color: #e5e7eb;
}

:host(.ec-panel-popup--dark) .ec-lang-btn:not(.is-active):hover,
:host(.ec-panel-popup--dark) .ec-lang-btn:not(.is-active):focus-visible {
  color: #93c5fd;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 14px rgba(0, 0, 0, 0.35);
}

:host(.ec-panel-popup--dark) .ec-lang-btn.is-active {
  background: #2563eb;
  border-color: #3b82f6;
  color: #fff;
}

:host(.ec-panel-popup--dark) .ec-copy-default-select,
:host(.ec-panel-popup--dark) .ec-format-select {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(31, 41, 55, 0.95);
  color: #e5e7eb;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06);
}

:host(.ec-panel-popup--dark) .ec-copy-default-select:focus-visible,
:host(.ec-panel-popup--dark) .ec-format-select:focus-visible {
  outline-color: #60a5fa;
}

:host(.ec-panel-popup--dark) .ec-copy-default-select--nothing {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-inline-images-info {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-inline-images-info:hover,
:host(.ec-panel-popup--dark) .ec-inline-images-info:focus-visible {
  color: #93c5fd;
}

:host(.ec-panel-popup--dark) .ec-toggle {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.14);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2), 0 0 10px rgba(0, 0, 0, 0.25);
}

:host(.ec-panel-popup--dark) .ec-toggle.is-on {
  background: #2563eb;
  border-color: #3b82f6;
}

:host(.ec-panel-popup--dark) .ec-toggle:focus-visible {
  outline-color: #60a5fa;
}

:host(.ec-panel-popup--dark) .ec-format-chip {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(55, 65, 81, 0.85);
  color: #a8b0bc;
}

:host(.ec-panel-popup--dark) .ec-format-chip.is-enabled {
  background: rgba(22, 101, 52, 0.45);
  border-color: rgba(74, 222, 128, 0.45);
  color: #d1fae5;
}

:host(.ec-panel-popup--dark) .ec-format-chip:not(.is-enabled):hover,
:host(.ec-panel-popup--dark) .ec-format-chip:not(.is-enabled):focus-visible {
  background: rgba(75, 85, 99, 0.9);
}

:host(.ec-panel-popup--dark) .ec-format-action-btn {
  border-color: rgba(96, 165, 250, 0.28);
  background: rgba(37, 99, 235, 0.18);
  color: #93c5fd;
}

:host(.ec-panel-popup--dark) .ec-format-action-btn:hover,
:host(.ec-panel-popup--dark) .ec-format-action-btn:focus-visible {
  background: rgba(37, 99, 235, 0.3);
}

:host(.ec-panel-popup--dark) .ec-format-action-btn--selected {
  background: rgba(22, 101, 52, 0.45);
  border-color: rgba(74, 222, 128, 0.45);
  color: #86efac;
}

:host(.ec-panel-popup--dark) .ec-format-action-btn--selected:hover,
:host(.ec-panel-popup--dark) .ec-format-action-btn--selected:focus-visible {
  background: rgba(22, 101, 52, 0.6);
}

:host(.ec-panel-popup--dark) .ec-format-action-btn--unavailable {
  border-color: rgba(156, 163, 175, 0.25);
  background: rgba(55, 65, 81, 0.5);
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-format-action-btn--unavailable:hover,
:host(.ec-panel-popup--dark) .ec-format-action-btn--unavailable:focus-visible {
  background: rgba(55, 65, 81, 0.5);
}

:host(.ec-panel-popup--dark) .ec-format-action-btn--unavailable::after {
  border-color: rgba(156, 163, 175, 0.28);
  background: #374151;
  color: #d1d5db;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

:host(.ec-panel-popup--dark) .ec-copied-devtools-row-field {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(31, 41, 55, 0.9);
  color: #d1d5db;
}

:host(.ec-panel-popup--dark) .ec-copied-devtools-row:hover .ec-copied-devtools-row-field,
:host(.ec-panel-popup--dark) .ec-copied-devtools-row:focus-visible .ec-copied-devtools-row-field {
  background: rgba(55, 65, 81, 0.95);
}

:host(.ec-panel-popup--dark) .ec-copied-devtools-row--selected .ec-copied-devtools-row-field {
  background: rgba(22, 101, 52, 0.45);
  border-color: rgba(74, 222, 128, 0.45);
  color: #86efac;
}

:host(.ec-panel-popup--dark) .ec-copied-devtools-row--unavailable .ec-copied-devtools-row-field {
  color: #9ca3af;
  background: rgba(55, 65, 81, 0.5);
}

:host(.ec-panel-popup--dark) .ec-copied-url-open {
  border-color: rgba(96, 165, 250, 0.28);
  background: rgba(37, 99, 235, 0.18);
  color: #93c5fd;
}

:host(.ec-panel-popup--dark) .ec-copied-url-open:hover,
:host(.ec-panel-popup--dark) .ec-copied-url-open:focus-visible {
  background: rgba(37, 99, 235, 0.3);
}

:host(.ec-panel-popup--dark) .ec-start-btn {
  background: #2563eb;
  box-shadow:
    0 6px 14px rgba(37, 99, 235, 0.22),
    0 2px 6px rgba(0, 0, 0, 0.22);
}

:host(.ec-panel-popup--dark) .ec-start-btn:hover,
:host(.ec-panel-popup--dark) .ec-copied-again .ec-start-btn:hover,
:host(.ec-panel-popup--dark) .ec-copied-again .ec-start-btn:focus-visible {
  background: #1d4ed8;
}

:host(.ec-panel-popup--dark) .ec-copied-again .ec-start-btn {
  border-color: rgba(96, 165, 250, 0.35);
  background: rgba(37, 99, 235, 0.2);
  color: #bfdbfe;
}

:host(.ec-panel-popup--dark) .ec-panel-footer a {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-panel-footer a:hover,
:host(.ec-panel-popup--dark) .ec-panel-footer a:focus-visible {
  color: #93c5fd;
}

:host(.ec-panel-popup--dark) .ec-about-kbd {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(31, 41, 55, 0.9);
  color: #e5e7eb;
}

:host(.ec-panel-popup--dark) .ec-info-window {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(17, 24, 39, 0.98);
  color: #e5e7eb;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

:host(.ec-panel-popup--dark) .ec-info-window-close {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-info-window-close:hover,
:host(.ec-panel-popup--dark) .ec-info-window-close:focus-visible {
  color: #e5e7eb;
}
`;
    shadow.append(style);
    return probeHost;
  }
  function measureCopiedDownloadRowPopupWidth(panelRoot) {
    const downloadRow = panelRoot.querySelector(`#${COPIED_DOWNLOAD_ROW_LABEL_ID}`)?.closest(".ec-settings-format-inline-list");
    if (!downloadRow) {
      return PANEL_POPUP_WIDTH_FALLBACK_PX;
    }
    const prevWrap = downloadRow.style.flexWrap;
    const prevWidth = downloadRow.style.width;
    downloadRow.style.flexWrap = "nowrap";
    downloadRow.style.width = "max-content";
    const rowWidth = Math.ceil(downloadRow.getBoundingClientRect().width);
    downloadRow.style.flexWrap = prevWrap;
    downloadRow.style.width = prevWidth;
    const menu = panelRoot.querySelector(".ec-panel-menu");
    const body = panelRoot.querySelector(".ec-panel-content .ec-panel-body");
    let menuChrome = 0;
    if (menu) {
      const menuStyle = getComputedStyle(menu);
      menuChrome = menu.getBoundingClientRect().width + parseFloat(menuStyle.marginInlineStart) + parseFloat(menuStyle.marginInlineEnd);
    }
    let bodyPaddingX = 0;
    if (body) {
      const bodyStyle = getComputedStyle(body);
      bodyPaddingX = parseFloat(bodyStyle.paddingInlineStart) + parseFloat(bodyStyle.paddingInlineEnd);
    }
    return Math.ceil(menuChrome + bodyPaddingX + rowWidth);
  }
  async function getActionPopupWidthPx(locale) {
    if (cachedActionPopupWidthPx !== null) {
      return cachedActionPopupWidthPx;
    }
    const probeHost = createPanelPopupProbeHost("max-content");
    const shadow = probeHost.shadowRoot;
    if (!shadow) {
      return PANEL_POPUP_WIDTH_FALLBACK_PX;
    }
    const strings = t(locale);
    const { panelRoot, body } = await createPanelSurface(locale, "popup");
    await buildCopiedPanelBodyForHeightProbe(body, strings);
    shadow.appendChild(panelRoot);
    document.body.appendChild(probeHost);
    const width = measureCopiedDownloadRowPopupWidth(panelRoot);
    probeHost.remove();
    cachedActionPopupWidthPx = width;
    return width;
  }
  async function measurePanelBodyHeight(locale, fillBody) {
    const probeWidthPx = await getActionPopupWidthPx(locale);
    const probeHost = createPanelPopupProbeHost(`${probeWidthPx}px`);
    const shadow = probeHost.shadowRoot;
    if (!shadow) {
      return 0;
    }
    const { panelRoot, body } = await createPanelSurface(locale, "popup");
    await fillBody(body);
    shadow.appendChild(panelRoot);
    document.body.appendChild(probeHost);
    const height = Math.ceil(panelRoot.getBoundingClientRect().height);
    probeHost.remove();
    return height;
  }
  async function fillPanelTabBody(body, tab, strings) {
    body.classList.toggle(PANEL_BODY_CENTERED_CLASS, tab === "start");
    switch (tab) {
      case "start":
        buildStartPanelBody(body, strings, { onStart: () => {
        }, onCopyPage: () => {
        } });
        break;
      case "copied":
        await buildCopiedPanelBodyForHeightProbe(body, strings);
        break;
      case "settings":
        await buildSettingsPanelBody(body, strings);
        break;
      case "shortcuts":
        buildShortcutsPanelBody(body, strings);
        break;
      case "about":
        buildAboutPanelBody(body, strings);
        break;
      case "loading":
        buildLoadingPanelBody(body, strings);
        break;
    }
  }
  async function getMaxActionPopupHeightPx(locale) {
    if (cachedMaxPopupHeightPx !== null) {
      return cachedMaxPopupHeightPx;
    }
    const strings = t(locale);
    const heights = await Promise.all(
      PANEL_POPUP_TABS.map(
        (tab) => measurePanelBodyHeight(locale, (body) => fillPanelTabBody(body, tab, strings))
      )
    );
    cachedMaxPopupHeightPx = heights.reduce((max, height) => Math.max(max, height), 0);
    return cachedMaxPopupHeightPx;
  }

  // src/panel-popup/fit-popup-height.ts
  function applyActionPopupDocumentWidth(widthPx) {
    const px = `${widthPx}px`;
    document.documentElement.style.width = px;
    document.body.style.width = px;
  }
  async function fitActionPopupToHost(host, locale) {
    const [widthPx, maxHeightPx] = await Promise.all([
      getActionPopupWidthPx(locale),
      getMaxActionPopupHeightPx(locale)
    ]);
    if (widthPx <= 0 && maxHeightPx <= 0) return;
    const apply = () => {
      if (widthPx > 0) {
        applyActionPopupDocumentWidth(widthPx);
        host.style.width = `${widthPx}px`;
      }
      if (maxHeightPx > 0) {
        const px = `${maxHeightPx}px`;
        document.documentElement.style.height = px;
        document.body.style.height = px;
        host.style.height = px;
        host.style.minHeight = px;
      }
    };
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          apply();
          resolve();
        });
      });
    });
  }

  // src/panel-popup/window.ts
  function isMenuTab(tab) {
    return PANEL_MENU_TABS.includes(tab);
  }
  var CopierPanelWindow = class {
    constructor(host) {
      this.host = host;
    }
    panelRoot = null;
    body = null;
    menu = null;
    isOpen() {
      return this.panelRoot !== null && this.body !== null;
    }
    async openPanel(tab) {
      this.close();
      const locale = this.host.getLocale();
      const { panelRoot, body, menu } = await createPanelSurface(locale, this.host.surface);
      this.panelRoot = panelRoot;
      this.body = body;
      this.menu = menu;
      if (menu) {
        menu.onSelect = (nextTab) => {
          void this.showTab(nextTab);
        };
      }
      this.host.shadow.appendChild(panelRoot);
      await syncPanelThemeFromStorage();
      await this.renderTab(tab);
    }
    async showTab(tab) {
      if (!this.body || !this.panelRoot) return;
      await this.renderTab(tab);
    }
    close() {
      this.panelRoot = null;
      this.body = null;
      this.menu = null;
      const panelRoots = Array.from(
        this.host.shadow.querySelectorAll(".ec-panel")
      );
      if (!panelRoots.length) return;
      panelRoots.forEach((node) => node.remove());
      notifyPanelClosed();
      this.host.onClose?.();
    }
    syncPickModeForTab(tab) {
      notifyPanelTabChanged(tab);
    }
    /** CAPTURE PAGE — copy full page without pick mode, keep popup open. */
    copyPageInPopup() {
      notifyCopyPage();
    }
    /** PICK ELEMENT — enable pick mode and close the panel. */
    startPickModeAndClose() {
      notifyStartPickMode();
      this.close();
    }
    applyLocaleToPanelChrome() {
      if (!this.panelRoot) return;
      const locale = this.host.getLocale();
      const strings = t(locale);
      this.panelRoot.lang = localeToHtmlLang(locale);
      this.panelRoot.dir = isRtlLocale(locale) ? "rtl" : "ltr";
      const subtitle = this.panelRoot.querySelector(".dd-panel-subtitle");
      if (subtitle) subtitle.textContent = strings.panelSubtitle;
      this.menu?.syncStrings(strings);
    }
    async changeSettingsLocale(code) {
      if (code === this.host.getLocale()) return;
      await setLocale(code);
      this.host.setLocale?.(code);
      this.applyLocaleToPanelChrome();
      await this.showTab("settings");
    }
    async renderTab(tab) {
      if (!this.body) return;
      this.applyLocaleToPanelChrome();
      const strings = t(this.host.getLocale());
      const centered = tab === "start" || tab === "loading";
      this.body.classList.toggle(PANEL_BODY_CENTERED_CLASS, centered);
      switch (tab) {
        case "start":
          buildStartPanelBody(this.body, strings, {
            onStart: () => {
              this.startPickModeAndClose();
            },
            onCopyPage: () => {
              this.copyPageInPopup();
            }
          });
          break;
        case "copied":
          await buildCopiedPanelBody(this.body, strings, {
            onStartOver: () => {
              this.startPickModeAndClose();
            },
            onNewPage: () => {
              this.copyPageInPopup();
            }
          });
          break;
        case "settings":
          await buildSettingsPanelBody(this.body, strings, {
            getLocale: () => this.host.getLocale(),
            onLocaleSelect: (code) => this.changeSettingsLocale(code)
          });
          break;
        case "shortcuts":
          buildShortcutsPanelBody(this.body, strings);
          break;
        case "about":
          buildAboutPanelBody(this.body, strings);
          break;
        case "loading":
          buildLoadingPanelBody(this.body, strings);
          break;
      }
      if (this.menu) {
        const hasCache = await hasPickCopyCacheInStorage();
        this.menu.setCacheState(hasCache);
        this.menu.setActive(isMenuTab(tab) ? tab : null);
      }
      this.syncPickModeForTab(tab);
      await this.host.onAfterTabRender?.();
    }
  };

  // src/panel-popup/mount-panel-surface.ts
  var activePopupWindow = null;
  async function mountPanelSurface(initialTab, { hostStyle, surface }) {
    let locale = "en";
    let closeNotified = false;
    const { host, shadow } = mountPanelShadowHost({
      rootId: PANEL_POPUP_ROOT_ID,
      hostClassName: "ec-panel-popup",
      hostAttr: PANEL_POPUP_HOST_ATTR,
      hostStyle,
      cssContent: `.ec-panel-header,
.dd-panel-header {
  flex: 0 0 auto;
  padding: 1.125rem 1.125rem 0;
}

.ec-panel-divider,
.dd-panel-divider {
  flex: 0 0 auto;
  width: 90%;
  height: 1px;
  margin-inline: auto;
  background: #012292;
}

.dd-panel-title-row {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas: "stack";
  align-items: center;
}

.dd-panel-logo,
.dd-panel-heading {
  grid-area: stack;
}

.dd-panel-logo {
  display: flex;
  align-items: stretch;
  align-self: stretch;
  justify-self: start;
  line-height: 0;
  z-index: 1;
}

.dd-panel-logo svg {
  display: block;
  height: 100%;
  width: auto;
  aspect-ratio: 1;
  flex-shrink: 0;
}

.dd-panel-heading {
  justify-self: center;
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;
  min-width: 0;
  max-width: 100%;
  font-size: 0.82rem;
}

.dd-panel-title {
  margin: 0;
  font-size: inherit;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-align: center;
  text-transform: uppercase;
  color: #012292;
}

.dd-panel-subtitle {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.2;
  white-space: nowrap;
  text-align: center;
  color: #666666;
}

.ec-panel-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  gap: 0.55rem;
  margin-top: auto;
  padding: 1.125rem;
}

.ec-panel-footer a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: #999;
  border-radius: 0.35rem;
  text-decoration: none;
  background: transparent;
}

.ec-panel-footer a:hover,
.ec-panel-footer a:focus-visible {
  color: #012292;
}

.ec-panel-footer svg {
  display: block;
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
}

:host(.ec-panel-popup) {
  display: flex;
  flex-direction: column;
  position: relative;
  inset: auto;
  width: 100%;
  min-height: 0;
  height: auto;
  pointer-events: auto;
  z-index: 1;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.3;
  color: #1f2937;
}

:host(.ec-panel-popup) *,
:host(.ec-panel-popup) *::before,
:host(.ec-panel-popup) *::after {
  box-sizing: border-box;
}

:host(.ec-panel-popup) button:focus:not(:focus-visible),
:host(.ec-panel-popup) a:focus:not(:focus-visible) {
  outline: none;
}

:host(.ec-panel-popup) button:focus-visible,
:host(.ec-panel-popup) a:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 2px;
}

.ec-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(20rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  overflow: hidden;
  color: #1f2937;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px) saturate(1.35);
  -webkit-backdrop-filter: blur(20px) saturate(1.35);
  border: 1px solid rgba(255, 255, 255, 0.78);
  box-shadow:
    0 18px 48px rgba(1, 34, 146, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.18);
}

.ec-panel--surface-popup {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  height: 100%;
  max-height: none;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

.ec-panel--surface-popup > .dd-panel-header,
.ec-panel--surface-popup > .ec-panel-footer,
.ec-panel--surface-popup > .dd-panel-divider {
  display: none;
}

.ec-panel-main {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
}

.ec-panel--surface-popup > .ec-panel-main {
  align-items: stretch;
  direction: ltr;
}

.ec-panel-menu {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.75rem 0 0.75rem 0.75rem;
  padding: 0.35rem;
  border-radius: 0.5rem;
  background: rgba(1, 34, 146, 0.06);
}

.ec-panel--surface-popup .ec-panel-menu {
  --ec-menu-gap: 0.3rem;
  flex: 0 0 2.85rem;
  width: 2.85rem;
  align-self: stretch;
  justify-content: flex-start;
  gap: var(--ec-menu-gap);
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  margin-inline-start: 0.5rem;
  margin-inline-end: 0;
  padding-block-start: var(--ec-menu-gap);
  padding-inline-end: var(--ec-menu-gap);
  padding-block-end: var(--ec-menu-gap);
  padding-inline-start: var(--ec-menu-gap);
}

.ec-panel-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.ec-panel--surface-popup .ec-panel-content {
  flex: 1 1 0;
  min-width: 0;
}

.ec-panel[dir="rtl"] .ec-panel-content {
  direction: rtl;
}

.ec-panel--surface-popup .ec-panel-content > .dd-panel-divider {
  display: none;
}

.ec-panel-menu-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0.4rem;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
}

.ec-panel-menu-btn svg {
  display: block;
  width: 1.15rem;
  height: 1.15rem;
}

.ec-panel-menu-btn:hover,
.ec-panel-menu-btn:focus-visible {
  color: #012292;
  background: rgba(1, 34, 146, 0.08);
}

.ec-panel-menu-btn--active {
  color: #012292;
  background: rgba(1, 34, 146, 0.14);
}

.ec-panel-menu-btn::after {
  content: attr(data-tooltip);
  position: absolute;
  left: calc(100% + 0.45rem);
  top: 50%;
  z-index: 2;
  transform: translateY(-50%);
  padding: 0.28rem 0.5rem;
  border-radius: 0.35rem;
  background: #111827;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.12s ease,
    visibility 0s linear 0.12s;
}

.ec-panel-menu-btn:hover::after,
.ec-panel-menu-btn:focus-visible::after {
  opacity: 1;
  visibility: visible;
  transition-delay: 0s, 0s;
}

.ec-panel--surface-popup .ec-panel-body.ec-panel-body--centered {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ec-panel-page {
  margin: 0;
}

.ec-panel--surface-popup .ec-panel-body:has(.ec-panel-page--start) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ec-panel-page--start {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.ec-panel--surface-popup .ec-panel-body:has(.ec-panel-page--loading) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ec-panel-page--loading {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.ec-loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
}

.ec-loading-spinner {
  width: 2.8rem;
  height: 2.8rem;
  border: 4px solid rgba(1, 34, 146, 0.18);
  border-top-color: #012292;
  border-radius: 50%;
  animation: ec-loading-spin 0.8s linear infinite;
}

.ec-loading-label {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

@keyframes ec-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

.ec-panel-page-title {
  margin: 0.5rem 0 0.85rem;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #111827;
}

.ec-panel--surface-popup .ec-panel-page-title {
  text-align: center;
}

.ec-panel-page-divider {
  margin: 0 0 0.5rem;
}

.ec-panel-page-text {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  text-align: left;
}

.ec-panel-page--shortcuts {
  width: 100%;
}

.ec-shortcuts-heading {
  margin: 0.5rem 0 0;
  font-size: 0.84rem;
  line-height: 1.45;
  font-weight: 700;
  color: #374151;
}

.ec-shortcuts-stop {
  margin: 0.5rem 0 0;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #374151;
}

.ec-shortcuts-stop strong {
  font-weight: 700;
}

.ec-shortcuts-note {
  margin: 0.2rem 0 0;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #6b7280;
}

.ec-shortcuts-steps + .ec-shortcuts-note {
  margin-top: 0.65rem;
}

.ec-shortcuts-divider {
  width: 100%;
  height: 0;
  margin: 0.7rem 0 0.5rem;
  border: 0;
  border-top: 1px solid rgba(1, 34, 146, 0.14);
  background: transparent;
}

.ec-shortcuts-stop + .ec-shortcuts-divider {
  margin-top: 0.5rem;
}

/* Как в welcome: --welcome-gap (12px) между header и разделителем */
.ec-panel > .dd-panel-divider {
  margin-top: 0.75rem;
}

.ec-panel-body {
  flex: 1 1 auto;
  padding: 1.125rem;
  overflow: auto;
}

.ec-panel--surface-popup .ec-panel-body {
  flex: 1 1 auto;
  overflow: visible;
}

.ec-panel--surface-popup .ec-panel-content .ec-panel-body {
  flex: 1 1 auto;
  padding: 1rem 0.95rem;
}

.ec-panel--surface-popup .ec-panel-page-divider {
  width: 100%;
}

.ec-start-center {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-height: 0;
}

.ec-start-btn {
  width: 100%;
  max-width: 12rem;
  min-width: 8.5rem;
  padding: 0.85rem 2rem;
  border: none;
  border-radius: 0.65rem;
  background: #012292;
  color: #fff;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow:
    0 6px 14px rgba(1, 34, 146, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.08);
}

.ec-start-btn:hover {
  background: #011a6e;
}

.ec-start-btn:active {
  transform: translateY(1px);
}

.ec-panel-page--settings {
  display: flex;
  flex-direction: column;
  width: 100%;
  --ec-settings-row-gap: 0.35rem;
  --ec-settings-row-margin-top: 0.85rem;
}

.ec-lang-row {
  display: flex;
  width: 100%;
  gap: 0.3rem;
  margin-top: 0.85rem;
  /* EN | ES | … order is fixed; panel RTL must not mirror this row. */
  direction: ltr;
}

.ec-lang-btn {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.35rem 0.25rem;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 0.4rem;
  background: #fff;
  color: #1f2937;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 0 10px rgba(0, 0, 0, 0.06);
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.ec-lang-btn.is-active {
  background: #012292;
  border-color: #012292;
  color: #fff;
  box-shadow: none;
}

.ec-lang-btn.is-active:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.9);
}

.ec-lang-btn:not(.is-active):hover,
.ec-lang-btn:not(.is-active):focus-visible {
  color: #012292;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 0 14px rgba(0, 0, 0, 0.09);
}

.ec-lang-btn.is-active:hover,
.ec-lang-btn.is-active:focus-visible {
  color: #fff;
}

.ec-panel-page--settings .ec-copy-default-row,
.ec-panel-page--settings .ec-toggle-row {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
  margin-top: var(--ec-settings-row-margin-top);
}

.ec-panel-page--settings .ec-toggle-row {
  justify-content: space-between;
}

.ec-copy-default-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  column-gap: var(--ec-settings-row-gap);
  width: 100%;
  min-width: 0;
  margin-top: 0.85rem;
}

.ec-copy-default-label {
  min-width: 0;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;
  color: #1f2937;
}

.ec-copy-default-label--with-info {
  display: inline-flex;
  align-items: center;
  gap: 0.14rem;
  width: 100%;
  min-width: 0;
}

.ec-panel-page--settings .ec-copy-default-label,
.ec-panel-page--settings .ec-toggle-label {
  display: flex;
  align-items: center;
  text-align: start;
  flex: 1 1 0;
  min-width: 0;
}

.ec-panel-page--settings .ec-copy-default-label--with-info {
  justify-content: flex-start;
  width: auto;
}

.ec-panel-page--settings .ec-copy-default-select {
  flex: 0 0 50%;
  width: 50%;
  min-width: 0;
}

.ec-panel-page--settings .ec-toggle {
  flex: 0 0 auto;
}

.ec-copy-default-label-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ec-copy-default-select {
  justify-self: stretch;
  width: 100%;
  min-width: 0;
  max-width: none;
  padding: 0.45rem 0.55rem;
  padding-inline-end: 1.45rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0.45rem;
  background: #fff;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.45rem center;
  background-size: 0.62rem 0.42rem;
  color: #1f2937;
  font: inherit;
  font-size: 0.82rem;
  line-height: 1.25;
  text-align: start;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ec-copy-default-select:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 1px;
}

.ec-copy-default-select--nothing {
  color: #6b7280;
}

.ec-copy-default-select option.ec-copy-default-option-nothing {
  color: #6b7280;
}

.ec-inline-images-info {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.ec-inline-images-info:hover,
.ec-inline-images-info:focus-visible {
  color: #012292;
  background: rgba(1, 34, 146, 0.08);
}

.ec-inline-images-info svg {
  display: block;
  width: 1rem;
  height: 1rem;
}

.ec-info-window-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.32);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.ec-info-window {
  position: relative;
  width: 100%;
  max-width: 18rem;
  max-height: calc(100% - 2rem);
  overflow: auto;
  padding: 1.1rem 1.1rem 1rem;
  border-radius: 0.75rem;
  background: #fff;
  color: #1f2937;
  box-shadow: 0 12px 40px rgba(1, 34, 146, 0.22);
}

.ec-info-window-close {
  position: absolute;
  top: 0.4rem;
  inset-inline-end: 0.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #6b7280;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}

.ec-info-window-close:hover,
.ec-info-window-close:focus-visible {
  color: #111827;
  background: rgba(0, 0, 0, 0.06);
}

.ec-info-window-content {
  font-size: 0.82rem;
  line-height: 1.45;
}

.ec-info-window-content p {
  margin: 0;
  padding-inline-end: 0.6rem;
}

.ec-format-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
  margin-top: 0.85rem;
}

.ec-format-field-label {
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;
  color: #1f2937;
}

.ec-format-select {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0.45rem;
  background: #fff;
  color: #1f2937;
  font: inherit;
  font-size: 0.82rem;
  line-height: 1.25;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.ec-format-select:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 1px;
}

.ec-settings-togglers {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: var(--ec-settings-row-margin-top);
}

.ec-settings-togglers .ec-compute-formats-section {
  padding-top: 0;
}

.ec-settings-togglers .ec-compute-formats-section .ec-toggle-row {
  margin-top: 0;
}

.ec-settings-togglers .ec-compute-formats-section + .ec-toggle-row,
.ec-settings-togglers .ec-toggle-row + .ec-toggle-row {
  margin-top: var(--ec-settings-row-margin-top);
}

.ec-panel-page--settings .ec-settings-togglers .ec-developer-tools-toggle,
.ec-panel-page--settings .ec-settings-togglers .ec-dark-theme-toggle {
  width: 100%;
}

.ec-panel-page--settings .ec-toggle-label {
  white-space: nowrap;
}

.ec-settings-format-inline-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.45rem;
  width: 100%;
}

.ec-settings-format-inline-list-label {
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.25;
  color: #374151;
}

.ec-panel-page--settings .ec-panel-page-title + .ec-panel-page-divider {
  margin-top: 0;
}

.ec-panel-page--settings .ec-panel-page-divider {
  margin-top: 0.85rem;
}

.ec-settings-section-divider,
.ec-copied-block {
  border-top: 1px solid rgba(1, 34, 146, 0.14);
}

.ec-settings-section-divider {
  flex: 0 0 auto;
  width: 100%;
  margin-top: var(--ec-settings-row-margin-top);
}

.ec-format-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  width: 100%;
}

.ec-format-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.55rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.78rem;
  line-height: 1.2;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.03);
}

.ec-format-chip.is-enabled {
  background: #dcfce7;
  border-color: #86efac;
  color: #111827;
}

.ec-format-chip:not(.is-enabled):hover,
.ec-format-chip:not(.is-enabled):focus-visible {
  background: #e5e7eb;
}

.ec-format-chip.is-enabled:hover,
.ec-format-chip.is-enabled:focus-visible {
  background: #bbf7d0;
}

.ec-format-chip-label {
  display: inline-grid;
  min-width: 0;
}

.ec-format-chip-label::before {
  content: attr(data-text);
  grid-area: 1 / 1;
  font-weight: 700;
  visibility: hidden;
  pointer-events: none;
  user-select: none;
}

.ec-format-chip-label-text {
  grid-area: 1 / 1;
  min-width: 0;
  font-weight: 400;
}

.ec-format-chip.is-enabled .ec-format-chip-label-text {
  font-weight: 700;
}

.ec-format-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.65rem;
  border: 1px solid rgba(1, 34, 146, 0.14);
  border-radius: 0.45rem;
  background: rgba(1, 34, 146, 0.06);
  color: #012292;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
}

.ec-format-action-btn:hover,
.ec-format-action-btn:focus-visible {
  background: rgba(1, 34, 146, 0.12);
}

.ec-format-action-btn--selected {
  background: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.ec-format-action-btn--selected:hover,
.ec-format-action-btn--selected:focus-visible {
  background: #bbf7d0;
}

.ec-format-action-btn--unavailable {
  position: relative;
  border-color: rgba(107, 114, 128, 0.2);
  background: rgba(107, 114, 128, 0.08);
  color: #9ca3af;
  cursor: default;
}

.ec-format-action-btn--unavailable::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.3rem);
  z-index: 2;
  transform: translateX(-50%);
  padding: 0.22rem 0.42rem;
  border-radius: 0.3rem;
  border: 1px solid rgba(107, 114, 128, 0.22);
  background: #fff;
  color: #6b7280;
  font-size: 0.68rem;
  font-weight: 500;
  line-height: 1.25;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
  opacity: 0;
  visibility: hidden;
}

.ec-format-action-btn--unavailable.ec-format-action-btn--show-tooltip::after {
  opacity: 1;
  visibility: visible;
}

.ec-format-action-btn--unavailable:hover,
.ec-format-action-btn--unavailable:focus-visible {
  background: rgba(107, 114, 128, 0.08);
}

.ec-format-action-btn--settings-off {
  text-decoration: line-through;
}

.ec-compute-formats-section {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

.ec-toggle-label--with-info {
  display: inline-flex;
  align-items: center;
  gap: 0.14rem;
  min-width: 0;
}

.ec-toggle-label-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ec-panel-page--settings .ec-toggle-label--with-info {
  justify-content: flex-start;
  width: auto;
}

.ec-compute-formats-toggle {
  width: 100%;
}

.ec-copied-other-options {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0;
  width: 100%;
  text-align: start;
}

.ec-copied-other-options .ec-settings-format-inline-list-label {
  flex: 0 0 5.25rem;
}

.ec-copied-url-block {
  flex: 0 0 auto;
  width: 100%;
  padding-block: 2mm;
}

.ec-copied-url-inline {
  --ec-copied-field-block-size: calc(0.6rem + 0.72rem * 1.25 + 2px);
  flex-wrap: nowrap;
  align-items: center;
}

.ec-copied-url-inline .ec-copied-url-copy {
  flex: 1 1 0;
  width: 100%;
  min-width: 0;
}

.ec-copied-url-inline .ec-copied-devtools-row-field {
  width: 100%;
  box-sizing: border-box;
}

.ec-copied-url-copy {
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: start;
  cursor: pointer;
}

.ec-copied-url-copy:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 1px;
}

.ec-copied-url-copy:hover .ec-copied-devtools-row-field,
.ec-copied-url-copy:focus-visible .ec-copied-devtools-row-field {
  background: rgba(1, 34, 146, 0.12);
}

.ec-copied-url-copy--unavailable,
.ec-copied-url-copy--unavailable:disabled {
  cursor: default;
  pointer-events: none;
}

.ec-copied-url-copy--unavailable .ec-copied-devtools-row-field {
  color: #9ca3af;
  background: rgba(107, 114, 128, 0.08);
}

.ec-copied-url-copy--selected .ec-copied-devtools-row-field {
  background: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.ec-copied-url-copy--selected:hover .ec-copied-devtools-row-field,
.ec-copied-url-copy--selected:focus-visible .ec-copied-devtools-row-field {
  background: #bbf7d0;
}

.ec-copied-url-open {
  flex: 0 0 var(--ec-copied-field-block-size);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ec-copied-field-block-size);
  height: var(--ec-copied-field-block-size);
  margin: 0;
  padding: 0;
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 0.35rem;
  background: rgba(37, 99, 235, 0.06);
  color: #2563eb;
  font-size: 0.72rem;
  cursor: pointer;
  box-sizing: border-box;
}

.ec-copied-url-open svg {
  display: block;
  width: 0.9em;
  height: 0.9em;
}

.ec-copied-url-open:hover,
.ec-copied-url-open:focus-visible {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.ec-copied-url-open:disabled {
  border-color: rgba(107, 114, 128, 0.2);
  background: rgba(107, 114, 128, 0.08);
  color: #9ca3af;
  cursor: default;
  pointer-events: none;
}

.ec-copied-block {
  flex: 0 0 auto;
  width: 100%;
  padding-block: 2mm;
}

.ec-copied-devtools-rows {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 0.5rem;
  row-gap: 0.35rem;
  width: 100%;
  min-width: 0;
}

.ec-copied-devtools-row {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
  width: 100%;
  min-width: 0;
  white-space: nowrap;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: start;
  cursor: pointer;
}

.ec-copied-devtools-row:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 1px;
}

.ec-copied-devtools-row-label {
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  color: #374151;
  white-space: nowrap;
}

.ec-copied-devtools-row-field {
  --ec-copied-field-block-size: calc(0.6rem + 1.25em + 2px);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  min-height: var(--ec-copied-field-block-size);
  padding: 0.3rem 0.45rem;
  border: 1px solid rgba(1, 34, 146, 0.14);
  border-radius: 0.35rem;
  background: rgba(1, 34, 146, 0.06);
  color: #012292;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 0.72rem;
  line-height: 1.25;
  user-select: none;
}

.ec-copied-devtools-row-value {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ec-copied-devtools-row-copy-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  color: currentColor;
}

.ec-copied-devtools-row-copy-icon svg {
  display: block;
  width: 0.9em;
  height: 0.9em;
}

.ec-copied-devtools-row:hover .ec-copied-devtools-row-field,
.ec-copied-devtools-row:focus-visible .ec-copied-devtools-row-field {
  background: rgba(1, 34, 146, 0.12);
}

.ec-copied-devtools-row--unavailable,
.ec-copied-devtools-row--unavailable:disabled {
  cursor: default;
  pointer-events: none;
}

.ec-copied-devtools-row--unavailable .ec-copied-devtools-row-field {
  color: #9ca3af;
  background: rgba(107, 114, 128, 0.08);
}

.ec-copied-devtools-row--selected .ec-copied-devtools-row-field {
  background: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.ec-copied-devtools-row--selected:hover .ec-copied-devtools-row-field,
.ec-copied-devtools-row--selected:focus-visible .ec-copied-devtools-row-field {
  background: #bbf7d0;
}

.ec-toggle-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ec-toggle-label {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;
  color: #1f2937;
  text-align: start;
  cursor: pointer;
}

.ec-toggle {
  position: relative;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 1.4rem;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.12);
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 0 10px rgba(0, 0, 0, 0.06);
}

.ec-toggle.is-on {
  background: #012292;
  border-color: #012292;
}

.ec-toggle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 0.15rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #fff;
  transform: translateY(-50%);
  transition: left 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.ec-toggle.is-on::after {
  left: calc(100% - 1rem - 0.15rem);
}

.ec-toggle:focus-visible {
  outline: 2px solid #012292;
  outline-offset: 2px;
}

.ec-panel--surface-popup .ec-panel-body:has(.ec-panel-page--copied) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  align-items: stretch;
}

/* Bottom inset lives only on \`.ec-copied-again\` — avoid stacking with panel-body padding. */
.ec-panel--surface-popup
  .ec-panel-body:has(.ec-panel-page--copied:not(.ec-panel-page--copied-empty)) {
  padding-bottom: 0;
}

.ec-panel-page--copied {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.ec-copied-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 3cm;
  gap: 0.25rem;
  width: 100%;
  padding-block: 2mm;
  text-align: center;
}

.ec-copied-title {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.25;
  color: #15803d;
}

.ec-copied-subtitle-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 1.35em;
}

.ec-copied-subtitle-slot--empty .ec-copied-subtitle {
  visibility: hidden;
}

.ec-copied-subtitle {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.35;
}

.ec-copied-subtitle-what {
  color: #111827;
  font-weight: 700;
}

.ec-copied-subtitle-what--nothing {
  color: #6b7280;
  font-weight: 400;
}

.ec-copied-again {
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  align-items: stretch;
  gap: 0.65rem;
  width: 100%;
  padding-block: 0.9rem;
  border-top: 1px solid rgba(1, 34, 146, 0.14);
}

.ec-copied-again .ec-start-btn {
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(1, 34, 146, 0.14);
  border-radius: 0.45rem;
  background: rgba(1, 34, 146, 0.06);
  color: #012292;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.2;
  box-shadow: none;
}

.ec-copied-again .ec-start-btn:hover,
.ec-copied-again .ec-start-btn:focus-visible {
  background: rgba(1, 34, 146, 0.12);
  color: #012292;
}

.ec-copied-again .ec-start-btn:active {
  transform: none;
  background: rgba(1, 34, 146, 0.12);
}

.ec-panel--surface-popup .ec-panel-body:has(.ec-panel-page--copied-empty) {
  justify-content: center;
  align-items: center;
}

.ec-panel-page--copied-empty {
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  text-align: center;
}

.ec-copied-empty-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: #6b7280;
}

.ec-panel--surface-popup .ec-panel-body:has(.ec-panel-page--about) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ec-panel-page--about {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.ec-about-credit {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: auto;
  padding-top: 0.75rem;
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
}

.ec-about-credit-divider {
  width: 100%;
  margin: 0 0 0.5rem;
  background: currentColor;
}

.ec-about-credit-line {
  margin: 0;
  line-height: 1.35;
  color: inherit;
}

.ec-about-credit a:any-link {
  color: inherit;
  text-decoration: underline;
}

.ec-about-credit a:hover,
.ec-about-credit a:focus-visible {
  color: inherit;
}

.ec-panel-page--about .ec-panel-page-title {
  width: 100%;
  text-align: center;
}

.ec-about-list {
  list-style: none;
  width: 100%;
  max-width: 100%;
  margin: 0 0 0.85rem;
  padding: 0;
  text-align: left;
}

.ec-about-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.35rem;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #374151;
  text-align: left;
}

.ec-about-item:last-child {
  margin-bottom: 0;
}

.ec-about-item--hotkey {
  align-items: flex-start;
}

.ec-about-hotkey-content {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.ec-about-text {
  text-align: left;
}

.ec-about-item--hotkey .ec-about-text {
  display: block;
}

.ec-shortcuts-steps,
.ec-about-steps {
  margin: 0.2rem 0 0;
  padding-left: 1.15rem;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #374151;
  text-align: left;
}

.ec-shortcuts-steps li,
.ec-about-steps li {
  margin-bottom: 0.2rem;
}

.ec-shortcuts-steps li:last-child,
.ec-about-steps li:last-child {
  margin-bottom: 0;
}

.ec-shortcuts-step-emphasis {
  font-weight: 600;
}

.ec-shortcuts-step-press-grid,
.ec-about-step-press-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 0.35em;
  align-items: start;
}

.ec-shortcuts-step-press-label,
.ec-about-step-press-label {
  grid-column: 1;
  grid-row: 1;
}

.ec-shortcuts-step-press-chords,
.ec-about-step-press-chords {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

.ec-shortcuts-step-press-mac-label,
.ec-about-step-press-mac-label {
  grid-column: 1;
  grid-row: 2;
}

.ec-shortcuts-step-press-mac-chords,
.ec-about-step-press-mac-chords {
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
}

.ec-about-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  line-height: 0;
  color: #6b7280;
}

.ec-about-icon svg {
  display: block;
  width: 1rem;
  height: 1rem;
}

.ec-about-kbd {
  display: inline-block;
  padding: 0.08rem 0.35rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background: #f9fafb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8em;
  font-weight: 600;
  line-height: 1.3;
  color: #111827;
}

/* Dark theme (SETTINGS → Dark theme, default off) */
:host(.ec-panel-popup--dark) {
  color: #e5e7eb;
}

:host(.ec-panel-popup--dark) button:focus-visible,
:host(.ec-panel-popup--dark) a:focus-visible {
  outline-color: #60a5fa;
}

:host(.ec-panel-popup--dark) .ec-panel {
  color: #e5e7eb;
  background: rgba(17, 24, 39, 0.96);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 18px 48px rgba(0, 0, 0, 0.35),
    0 8px 24px rgba(0, 0, 0, 0.45);
}

:host(.ec-panel-popup--dark) .dd-panel-divider,
:host(.ec-panel-popup--dark) .ec-panel-divider {
  background: rgba(96, 165, 250, 0.55);
}

:host(.ec-panel-popup--dark) .dd-panel-title {
  color: #93c5fd;
}

:host(.ec-panel-popup--dark) .dd-panel-subtitle {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-panel-menu {
  background: rgba(96, 165, 250, 0.12);
}

:host(.ec-panel-popup--dark) .ec-panel-menu-btn {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-panel-menu-btn:hover,
:host(.ec-panel-popup--dark) .ec-panel-menu-btn:focus-visible {
  color: #93c5fd;
  background: rgba(96, 165, 250, 0.16);
}

:host(.ec-panel-popup--dark) .ec-panel-menu-btn--active {
  color: #bfdbfe;
  background: rgba(96, 165, 250, 0.22);
}

:host(.ec-panel-popup--dark) .ec-panel-page-title,
:host(.ec-panel-popup--dark) .ec-copied-title {
  color: #f3f4f6;
}

:host(.ec-panel-popup--dark) .ec-panel-page-text,
:host(.ec-panel-popup--dark) .ec-loading-label,
:host(.ec-panel-popup--dark) .ec-shortcuts-heading,
:host(.ec-panel-popup--dark) .ec-shortcuts-stop,
:host(.ec-panel-popup--dark) .ec-shortcuts-steps,
:host(.ec-panel-popup--dark) .ec-copy-default-label,
:host(.ec-panel-popup--dark) .ec-toggle-label,
:host(.ec-panel-popup--dark) .ec-format-field-label,
:host(.ec-panel-popup--dark) .ec-settings-format-inline-list-label,
:host(.ec-panel-popup--dark) .ec-copied-devtools-row-label,
:host(.ec-panel-popup--dark) .ec-copied-subtitle,
:host(.ec-panel-popup--dark) .ec-copied-subtitle-what,
:host(.ec-panel-popup--dark) .ec-about-item,
:host(.ec-panel-popup--dark) .ec-about-steps {
  color: #d1d5db;
}

:host(.ec-panel-popup--dark) .ec-shortcuts-note,
:host(.ec-panel-popup--dark) .ec-copied-empty-text,
:host(.ec-panel-popup--dark) .ec-copied-subtitle-what--nothing,
:host(.ec-panel-popup--dark) .ec-about-icon,
:host(.ec-panel-popup--dark) .ec-about-text,
:host(.ec-panel-popup--dark) .ec-about-credit {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-shortcuts-divider,
:host(.ec-panel-popup--dark) .ec-settings-section-divider,
:host(.ec-panel-popup--dark) .ec-copied-block {
  border-top-color: rgba(96, 165, 250, 0.22);
}

:host(.ec-panel-popup--dark) .ec-loading-spinner {
  border-color: rgba(96, 165, 250, 0.25);
  border-top-color: #60a5fa;
}

:host(.ec-panel-popup--dark) .ec-lang-btn {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(31, 41, 55, 0.9);
  color: #e5e7eb;
}

:host(.ec-panel-popup--dark) .ec-lang-btn:not(.is-active):hover,
:host(.ec-panel-popup--dark) .ec-lang-btn:not(.is-active):focus-visible {
  color: #93c5fd;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 14px rgba(0, 0, 0, 0.35);
}

:host(.ec-panel-popup--dark) .ec-lang-btn.is-active {
  background: #2563eb;
  border-color: #3b82f6;
  color: #fff;
}

:host(.ec-panel-popup--dark) .ec-copy-default-select,
:host(.ec-panel-popup--dark) .ec-format-select {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(31, 41, 55, 0.95);
  color: #e5e7eb;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06);
}

:host(.ec-panel-popup--dark) .ec-copy-default-select:focus-visible,
:host(.ec-panel-popup--dark) .ec-format-select:focus-visible {
  outline-color: #60a5fa;
}

:host(.ec-panel-popup--dark) .ec-copy-default-select--nothing {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-inline-images-info {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-inline-images-info:hover,
:host(.ec-panel-popup--dark) .ec-inline-images-info:focus-visible {
  color: #93c5fd;
}

:host(.ec-panel-popup--dark) .ec-toggle {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.14);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2), 0 0 10px rgba(0, 0, 0, 0.25);
}

:host(.ec-panel-popup--dark) .ec-toggle.is-on {
  background: #2563eb;
  border-color: #3b82f6;
}

:host(.ec-panel-popup--dark) .ec-toggle:focus-visible {
  outline-color: #60a5fa;
}

:host(.ec-panel-popup--dark) .ec-format-chip {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(55, 65, 81, 0.85);
  color: #a8b0bc;
}

:host(.ec-panel-popup--dark) .ec-format-chip.is-enabled {
  background: rgba(22, 101, 52, 0.45);
  border-color: rgba(74, 222, 128, 0.45);
  color: #d1fae5;
}

:host(.ec-panel-popup--dark) .ec-format-chip:not(.is-enabled):hover,
:host(.ec-panel-popup--dark) .ec-format-chip:not(.is-enabled):focus-visible {
  background: rgba(75, 85, 99, 0.9);
}

:host(.ec-panel-popup--dark) .ec-format-action-btn {
  border-color: rgba(96, 165, 250, 0.28);
  background: rgba(37, 99, 235, 0.18);
  color: #93c5fd;
}

:host(.ec-panel-popup--dark) .ec-format-action-btn:hover,
:host(.ec-panel-popup--dark) .ec-format-action-btn:focus-visible {
  background: rgba(37, 99, 235, 0.3);
}

:host(.ec-panel-popup--dark) .ec-format-action-btn--selected {
  background: rgba(22, 101, 52, 0.45);
  border-color: rgba(74, 222, 128, 0.45);
  color: #86efac;
}

:host(.ec-panel-popup--dark) .ec-format-action-btn--selected:hover,
:host(.ec-panel-popup--dark) .ec-format-action-btn--selected:focus-visible {
  background: rgba(22, 101, 52, 0.6);
}

:host(.ec-panel-popup--dark) .ec-format-action-btn--unavailable {
  border-color: rgba(156, 163, 175, 0.25);
  background: rgba(55, 65, 81, 0.5);
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-format-action-btn--unavailable:hover,
:host(.ec-panel-popup--dark) .ec-format-action-btn--unavailable:focus-visible {
  background: rgba(55, 65, 81, 0.5);
}

:host(.ec-panel-popup--dark) .ec-format-action-btn--unavailable::after {
  border-color: rgba(156, 163, 175, 0.28);
  background: #374151;
  color: #d1d5db;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

:host(.ec-panel-popup--dark) .ec-copied-devtools-row-field {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(31, 41, 55, 0.9);
  color: #d1d5db;
}

:host(.ec-panel-popup--dark) .ec-copied-devtools-row:hover .ec-copied-devtools-row-field,
:host(.ec-panel-popup--dark) .ec-copied-devtools-row:focus-visible .ec-copied-devtools-row-field {
  background: rgba(55, 65, 81, 0.95);
}

:host(.ec-panel-popup--dark) .ec-copied-devtools-row--selected .ec-copied-devtools-row-field {
  background: rgba(22, 101, 52, 0.45);
  border-color: rgba(74, 222, 128, 0.45);
  color: #86efac;
}

:host(.ec-panel-popup--dark) .ec-copied-devtools-row--unavailable .ec-copied-devtools-row-field {
  color: #9ca3af;
  background: rgba(55, 65, 81, 0.5);
}

:host(.ec-panel-popup--dark) .ec-copied-url-open {
  border-color: rgba(96, 165, 250, 0.28);
  background: rgba(37, 99, 235, 0.18);
  color: #93c5fd;
}

:host(.ec-panel-popup--dark) .ec-copied-url-open:hover,
:host(.ec-panel-popup--dark) .ec-copied-url-open:focus-visible {
  background: rgba(37, 99, 235, 0.3);
}

:host(.ec-panel-popup--dark) .ec-start-btn {
  background: #2563eb;
  box-shadow:
    0 6px 14px rgba(37, 99, 235, 0.22),
    0 2px 6px rgba(0, 0, 0, 0.22);
}

:host(.ec-panel-popup--dark) .ec-start-btn:hover,
:host(.ec-panel-popup--dark) .ec-copied-again .ec-start-btn:hover,
:host(.ec-panel-popup--dark) .ec-copied-again .ec-start-btn:focus-visible {
  background: #1d4ed8;
}

:host(.ec-panel-popup--dark) .ec-copied-again .ec-start-btn {
  border-color: rgba(96, 165, 250, 0.35);
  background: rgba(37, 99, 235, 0.2);
  color: #bfdbfe;
}

:host(.ec-panel-popup--dark) .ec-panel-footer a {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-panel-footer a:hover,
:host(.ec-panel-popup--dark) .ec-panel-footer a:focus-visible {
  color: #93c5fd;
}

:host(.ec-panel-popup--dark) .ec-about-kbd {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(31, 41, 55, 0.9);
  color: #e5e7eb;
}

:host(.ec-panel-popup--dark) .ec-info-window {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(17, 24, 39, 0.98);
  color: #e5e7eb;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

:host(.ec-panel-popup--dark) .ec-info-window-close {
  color: #9ca3af;
}

:host(.ec-panel-popup--dark) .ec-info-window-close:hover,
:host(.ec-panel-popup--dark) .ec-info-window-close:focus-visible {
  color: #e5e7eb;
}
`
    });
    locale = await getLocale();
    let panelWindow = null;
    const notifyClosedOnce = () => {
      if (closeNotified) return;
      closeNotified = true;
      notifyPanelClosed();
    };
    const clearActivePopupWindow = () => {
      if (panelWindow && activePopupWindow === panelWindow) {
        activePopupWindow = null;
      }
    };
    panelWindow = new CopierPanelWindow({
      shadow,
      surface,
      onClose: () => {
        clearActivePopupWindow();
        notifyClosedOnce();
        window.close();
      },
      getLocale: () => locale,
      setLocale: (next2) => {
        locale = next2;
      },
      onAfterTabRender: surface === "popup" ? () => fitActionPopupToHost(host, locale) : void 0
    });
    if (surface === "popup") {
      activePopupWindow = panelWindow;
    }
    bindPanelThemeSync();
    await panelWindow.openPanel(initialTab);
    bindPanelSessionPort();
    window.addEventListener(
      "pagehide",
      () => {
        clearActivePopupWindow();
        notifyClosedOnce();
      },
      { once: true }
    );
  }
  async function showMountedPopupTab(tab) {
    if (!activePopupWindow || !activePopupWindow.isOpen()) {
      return false;
    }
    await activePopupWindow.showTab(tab);
    return true;
  }

  // src/panel-tab/layout.ts
  function applyPanelTabPageLayout2() {
    applyPanelTabPageLayout(PANEL_TAB_PAGE_CLASS);
  }

  // src/panel-tab/mount.ts
  async function mountPanelTab(initialTab) {
    applyPanelTabPageLayout2();
    await mountPanelSurface(initialTab, { hostStyle: PANEL_TAB_HOST_STYLE });
  }

  // src/panel-tab/bootstrap.ts
  async function bootstrapPanelTabPageIfNeeded() {
    if (!isPanelPopupPage(location.href)) return;
    if (!isPanelTabMode()) return;
    const tab = await resolvePanelPageInitialTab2();
    await mountPanelTab(tab);
  }

  // src/panel-popup/mount.ts
  async function mountPanelPopup(initialTab) {
    const locale = await getLocale();
    const widthPx = await getActionPopupWidthPx(locale);
    applyActionPopupDocumentWidth(widthPx);
    await mountPanelSurface(initialTab, {
      hostStyle: panelPopupHostStyle(widthPx),
      surface: "popup"
    });
  }

  // src/panel-popup/page.ts
  function isPanelPopupPage(href) {
    return isPanelPage(href, PANEL_POPUP_PAGE);
  }
  async function resolvePanelPageInitialTab2() {
    const tab = await resolvePanelPageInitialTab({
      sessionTabKey: PANEL_PAGE_CONFIG.sessionTabKey,
      defaultTab: "start",
      validTabs: PANEL_POPUP_TABS
    });
    if (tab !== "start") return tab;
    return await hasPickCopyCacheInStorage() ? "copied" : "start";
  }
  async function bootstrapPanelPopupPageIfNeeded() {
    if (!isPanelPopupPage(location.href)) return;
    if (isPanelTabMode()) return;
    const tab = await resolvePanelPageInitialTab2();
    await mountPanelPopup(tab);
  }

  // src/lib/our/copy/cleanup/clone.ts
  function isDomLeafElement(element) {
    return element.childNodes.length === 0;
  }
  function cloneChildNodesForClipboard(parent) {
    const doc = parent.ownerDocument ?? document;
    const fragment = doc.createDocumentFragment();
    for (const child of parent.childNodes) {
      fragment.appendChild(cloneNodeForClipboard(child));
    }
    return fragment;
  }
  function cloneNodeForClipboard(node) {
    if (!(node instanceof Element)) {
      return node.cloneNode(true);
    }
    if (OMIT_TAGS.has(node.tagName)) {
      return node.ownerDocument.createDocumentFragment();
    }
    if (node.shadowRoot) {
      const clone2 = node.cloneNode(false);
      clone2.appendChild(cloneChildNodesForClipboard(node));
      clone2.appendChild(cloneChildNodesForClipboard(node.shadowRoot));
      return clone2;
    }
    const clone = node.cloneNode(false);
    for (const child of node.childNodes) {
      clone.appendChild(cloneNodeForClipboard(child));
    }
    return clone;
  }
  function cloneShadowAwareContents(element) {
    const doc = element.ownerDocument;
    const fragment = doc.createDocumentFragment();
    fragment.appendChild(cloneChildNodesForClipboard(element));
    fragment.appendChild(cloneChildNodesForClipboard(element.shadowRoot));
    return fragment;
  }
  function cloneElementForClipboard(element) {
    if (element.tagName === "TABLE" || LIST_TAGS2.has(element.tagName)) {
      return cloneNodeForClipboard(element);
    }
    if (element.shadowRoot) {
      return cloneShadowAwareContents(element);
    }
    if (isDomLeafElement(element) && !OMIT_TAGS.has(element.tagName)) {
      return cloneNodeForClipboard(element);
    }
    return cloneChildNodesForClipboard(element);
  }

  // src/lib/our/copy/cleanup/inline-images.ts
  var LARGE_INLINE_DATA_URL_CHARS = 2048;
  function shouldMaterializeInlineDataUrl(value, mode) {
    if (mode === "all" || !value.includes("data:")) return true;
    if (mode === "remove-all") return false;
    if (mode === "remove-large") return value.length <= LARGE_INLINE_DATA_URL_CHARS;
    return value.length > LARGE_INLINE_DATA_URL_CHARS;
  }
  var INLINE_DATA_URL_ATTRS = ["src", "href", "poster", "srcset"];
  function applyInlineImagePolicy(root2, mode) {
    if (mode === "all") return;
    for (const el of root2.querySelectorAll("[src], [href], [poster], [srcset]")) {
      for (const attr of INLINE_DATA_URL_ATTRS) {
        const value = el.getAttribute(attr);
        if (!value?.includes("data:")) continue;
        if (!shouldMaterializeInlineDataUrl(value, mode)) {
          el.removeAttribute(attr);
        }
      }
    }
  }

  // src/lib/vendor/turndown/sanitize-alt.ts
  var DEFAULT_IMAGE_ALT = "image";
  function sanitizeMarkdownAltText(alt) {
    const cleaned = alt.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim();
    return cleaned || DEFAULT_IMAGE_ALT;
  }

  // src/lib/our/copy/cleanup/image-src.ts
  var INLINE_IMAGE_SRC_RE = /^(data:|blob:)/i;
  function isInlineImageSrc(src) {
    return INLINE_IMAGE_SRC_RE.test(src.trim());
  }
  function resolveMaterializedImageSrc(raw, doc) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) return null;
    if (isInlineImageSrc(trimmed)) return trimmed;
    try {
      return new URL(trimmed, doc.baseURI).href;
    } catch {
      return null;
    }
  }

  // src/lib/our/copy/cleanup/materialize-visuals.ts
  function keepInlineSrc(src, shouldMaterializeInlineSrc) {
    return shouldMaterializeInlineSrc?.(src) ?? true;
  }
  var BACKGROUND_URL_RE = /url\(\s*(['"]?)(.*?)\1\s*\)/i;
  var MAX_DECORATIVE_UI_SVG_PX = 48;
  var SVG_RASTER_SIDE_CAP_PX = 256;
  function visualAlt(element) {
    return element.getAttribute("aria-label")?.trim() || element.getAttribute("title")?.trim() || element.querySelector(":scope > title")?.textContent?.trim() || element.getAttribute("alt")?.trim() || "";
  }
  function resolveImgAlt(element) {
    return sanitizeMarkdownAltText(visualAlt(element) || DEFAULT_IMAGE_ALT);
  }
  function parseFirstBackgroundUrl(backgroundImage) {
    if (!backgroundImage || backgroundImage === "none" || !backgroundImage.includes("url(")) {
      return null;
    }
    const match = backgroundImage.match(BACKGROUND_URL_RE);
    return match?.[2]?.trim() || null;
  }
  function parseSvgLength(value) {
    if (!value) return void 0;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : void 0;
  }
  function parseViewBoxPair(svg) {
    const raw = svg.getAttribute("viewBox")?.trim().split(/\s+/);
    if (!raw || raw.length < 4) return {};
    const width = Number.parseFloat(raw[2]);
    const height = Number.parseFloat(raw[3]);
    return {
      width: Number.isFinite(width) && width > 0 ? width : void 0,
      height: Number.isFinite(height) && height > 0 ? height : void 0
    };
  }
  function parseCssLength(value) {
    if (!value) return void 0;
    return parseSvgLength(value);
  }
  function svgEffectiveAxisSizes(svg) {
    const viewBox = parseViewBoxPair(svg);
    let displayW;
    let displayH;
    const view = svg.ownerDocument.defaultView;
    if (view) {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0) displayW = rect.width;
      if (rect.height > 0) displayH = rect.height;
    }
    if (displayW == null) displayW = parseSvgLength(svg.getAttribute("width"));
    if (displayH == null) displayH = parseSvgLength(svg.getAttribute("height"));
    const width = Math.max(displayW ?? 0, viewBox.width ?? 0) || void 0;
    const height = Math.max(displayH ?? 0, viewBox.height ?? 0) || void 0;
    return { width, height };
  }
  function svgDisplayDimensions(svg) {
    const view = svg.ownerDocument.defaultView;
    if (view) {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const explicitWidth = parseSvgLength(svg.getAttribute("width"));
        const explicitHeight = parseSvgLength(svg.getAttribute("height"));
        const isSuspiciouslyLargeUiIcon = !explicitWidth && !explicitHeight && (rect.width > SVG_RASTER_SIDE_CAP_PX || rect.height > SVG_RASTER_SIDE_CAP_PX) && isDecorativeSvg(svg) && isUiDecorativeSvgContext(svg) && !isSvgPrimaryContentMedia(svg);
        if (isSuspiciouslyLargeUiIcon) {
          const side = Math.min(MAX_DECORATIVE_UI_SVG_PX, SVG_RASTER_SIDE_CAP_PX);
          return { width: side, height: side };
        }
        return { width: rect.width, height: rect.height };
      }
      const style = view.getComputedStyle(svg);
      const styleWidth = parseCssLength(style.width);
      const styleHeight = parseCssLength(style.height);
      if (styleWidth || styleHeight) {
        const attrWidth2 = parseSvgLength(svg.getAttribute("width"));
        const attrHeight2 = parseSvgLength(svg.getAttribute("height"));
        const width = styleWidth ?? attrWidth2;
        const height = styleHeight ?? attrHeight2;
        if (width && height) {
          return {
            width: Math.min(width, SVG_RASTER_SIDE_CAP_PX),
            height: Math.min(height, SVG_RASTER_SIDE_CAP_PX)
          };
        }
      }
      let ancestorWidth;
      let ancestorHeight;
      for (let ancestor = svg.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const ancestorRect = ancestor.getBoundingClientRect();
        if (!ancestorWidth && ancestorRect.width > 0) ancestorWidth = ancestorRect.width;
        if (!ancestorHeight && ancestorRect.height > 0) ancestorHeight = ancestorRect.height;
        if (ancestorWidth && ancestorHeight) break;
      }
      if (ancestorWidth || ancestorHeight) {
        const attrWidth2 = parseSvgLength(svg.getAttribute("width"));
        const attrHeight2 = parseSvgLength(svg.getAttribute("height"));
        const width = ancestorWidth ?? attrWidth2;
        const height = ancestorHeight ?? attrHeight2;
        if (width && height) {
          return {
            width: Math.min(width, SVG_RASTER_SIDE_CAP_PX),
            height: Math.min(height, SVG_RASTER_SIDE_CAP_PX)
          };
        }
      }
      const attrWidth = parseSvgLength(svg.getAttribute("width"));
      const attrHeight = parseSvgLength(svg.getAttribute("height"));
      if (attrWidth && attrHeight) {
        return {
          width: Math.min(attrWidth, SVG_RASTER_SIDE_CAP_PX),
          height: Math.min(attrHeight, SVG_RASTER_SIDE_CAP_PX)
        };
      }
    }
    const fallbackSide = 24;
    return { width: fallbackSide, height: fallbackSide };
  }
  function svgAccessibleName(svg) {
    const labelledBy = svg.getAttribute("aria-labelledby")?.trim();
    if (labelledBy) {
      const doc = svg.ownerDocument;
      const name = labelledBy.split(/\s+/).map((id) => doc.getElementById(id)?.textContent?.trim() ?? "").filter(Boolean).join(" ");
      if (name) return name;
    }
    return svg.getAttribute("aria-label")?.trim() || svg.querySelector(":scope > title")?.textContent?.trim() || svg.textContent?.trim() || "";
  }
  function hasAriaHiddenAncestor(svg) {
    for (let el = svg.parentElement; el; el = el.parentElement) {
      if (el.getAttribute("aria-hidden") === "true") return true;
    }
    return false;
  }
  function isDecorativeSvg(svg) {
    const ariaHidden = svg.getAttribute("aria-hidden") === "true" || hasAriaHiddenAncestor(svg);
    const role = svg.getAttribute("role")?.toLowerCase();
    if (!ariaHidden && role !== "presentation" && role !== "none") return false;
    return !svgAccessibleName(svg);
  }
  function findUiControl(svg) {
    let el = svg;
    while (el) {
      const tag = el.tagName.toLowerCase();
      if (tag === "button" || tag === "a" || tag === "summary") return el;
      if (el.getAttribute("role")?.toLowerCase() === "button") return el;
      el = el.parentElement;
    }
    return null;
  }
  function hasMeaningfulContentOutsideSvg(control, svg) {
    for (const node of control.childNodes) {
      if (node === svg) continue;
      if (node instanceof Element && node.contains(svg)) continue;
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent?.trim()) return true;
        continue;
      }
      if (node instanceof Element) {
        if (node.tagName === "IMG" && node.getAttribute("alt")?.trim()) return true;
        if ((node.textContent ?? "").trim()) return true;
      }
    }
    return false;
  }
  function isUiDecorativeSvgContext(svg) {
    const control = findUiControl(svg);
    if (!control) return false;
    const tag = control.tagName.toLowerCase();
    if (tag === "button") return true;
    if (control.getAttribute("role")?.toLowerCase() === "button") return true;
    if (tag === "summary") return true;
    if (tag === "a") return !hasMeaningfulContentOutsideSvg(control, svg);
    return false;
  }
  function isSmallDecorativeUiSvg(sourceSvg) {
    const { width, height } = svgEffectiveAxisSizes(sourceSvg);
    if (width == null || height == null) return false;
    return width <= MAX_DECORATIVE_UI_SVG_PX && height <= MAX_DECORATIVE_UI_SVG_PX;
  }
  function hasLargeContentViewBox(sourceSvg) {
    const { width, height } = parseViewBoxPair(sourceSvg);
    return (width ?? 0) > MAX_DECORATIVE_UI_SVG_PX || (height ?? 0) > MAX_DECORATIVE_UI_SVG_PX;
  }
  function resolveSvgRasterAlt(sourceSvg) {
    const direct = visualAlt(sourceSvg);
    if (direct) return sanitizeMarkdownAltText(direct);
    if (!isSmallDecorativeUiSvg(sourceSvg)) {
      const label = findUiControl(sourceSvg)?.getAttribute("aria-label")?.trim();
      if (label) return sanitizeMarkdownAltText(label);
    }
    return DEFAULT_IMAGE_ALT;
  }
  function isSvgPrimaryContentMedia(svg) {
    for (let container = svg.parentElement; container; container = container.parentElement) {
      const tag = container.tagName.toLowerCase();
      if (tag !== "figure" && tag !== "picture" && tag !== "article") continue;
      if (tag === "figure" || tag === "picture") {
        const media = container.querySelectorAll("svg, img, picture, video");
        if (media.length === 1 && media[0] === svg) return true;
        if (svg.parentElement === container) return true;
      }
      if (tag === "article" && svg.parentElement === container) {
        const { width, height } = svgEffectiveAxisSizes(svg);
        if ((width ?? 0) > MAX_DECORATIVE_UI_SVG_PX || (height ?? 0) > MAX_DECORATIVE_UI_SVG_PX) {
          return true;
        }
      }
    }
    return false;
  }
  function shouldRemoveDecorativeUiSvg(sourceSvg) {
    if (hasLargeContentViewBox(sourceSvg)) return false;
    if (!isDecorativeSvg(sourceSvg)) return false;
    if (!isUiDecorativeSvgContext(sourceSvg)) return false;
    if (!isSmallDecorativeUiSvg(sourceSvg)) return false;
    if (isSvgPrimaryContentMedia(sourceSvg)) return false;
    return true;
  }
  function isControlEmptyAfterSvgRemoval(control) {
    if (control.getAttribute("aria-label")?.trim()) return false;
    if (control.getAttribute("title")?.trim()) return false;
    for (const node of control.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent?.trim()) return false;
        continue;
      }
      if (node instanceof Element) return false;
    }
    return true;
  }
  function removeDecorativeUiSvg(sourceSvg, cloneSvg) {
    if (!shouldRemoveDecorativeUiSvg(sourceSvg)) return;
    const control = findUiControl(cloneSvg);
    cloneSvg.remove();
    if (control?.parentNode && isControlEmptyAfterSvgRemoval(control)) {
      control.remove();
    }
  }
  function isSvgTagName(tagName) {
    return tagName.toLowerCase() === "svg";
  }
  function applyImgDimensions(img, width, height) {
    if (width) img.setAttribute("width", String(Math.round(width)));
    if (height) img.setAttribute("height", String(Math.round(height)));
  }
  function resolveCurrentColorInSvgClone(sourceRoot, cloneRoot) {
    const view = sourceRoot.ownerDocument.defaultView;
    if (!view) return;
    const sourceNodes = [sourceRoot, ...sourceRoot.querySelectorAll("*")];
    const cloneNodes = [cloneRoot, ...cloneRoot.querySelectorAll("*")];
    for (let i = 0; i < sourceNodes.length && i < cloneNodes.length; i++) {
      const src = sourceNodes[i];
      const dst = cloneNodes[i];
      if (!(dst instanceof SVGElement)) continue;
      for (const attr of ["fill", "stroke"]) {
        const rawAttr = dst.getAttribute(attr)?.trim();
        const rawStyle = dst.getAttribute("style") ?? "";
        const styleNeedsResolve = new RegExp(`${attr}\\s*:\\s*(?:currentcolor|var\\(--)`, "i").test(rawStyle);
        const needsResolve = styleNeedsResolve || (rawAttr ? /currentcolor/i.test(rawAttr) || /var\(--/i.test(rawAttr) : false);
        if (!needsResolve) continue;
        const style = view.getComputedStyle(src);
        const computedPaint = style.getPropertyValue(attr).trim();
        if (computedPaint && !/var\(--/i.test(computedPaint)) {
          dst.setAttribute(attr, computedPaint);
          continue;
        }
        if (rawAttr && /currentcolor/i.test(rawAttr)) {
          const color = style.color.trim();
          if (color) dst.setAttribute(attr, color);
        }
      }
    }
  }
  function prepareSvgCloneForRasterize(sourceSvg) {
    const clone = sourceSvg.cloneNode(true);
    if (!clone.getAttribute("xmlns")) {
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }
    resolveCurrentColorInSvgClone(sourceSvg, clone);
    const { width, height } = svgDisplayDimensions(sourceSvg);
    if (width && !clone.getAttribute("width")) clone.setAttribute("width", String(width));
    if (height && !clone.getAttribute("height")) clone.setAttribute("height", String(height));
    return clone;
  }
  async function rasterizeSvgToPngDataUrl(sourceSvg) {
    const doc = sourceSvg.ownerDocument;
    const view = doc.defaultView;
    if (!view) return null;
    const clone = prepareSvgCloneForRasterize(sourceSvg);
    if (!clone) return null;
    const serialized = new XMLSerializer().serializeToString(clone);
    if (!serialized) return null;
    const { width, height } = svgDisplayDimensions(sourceSvg);
    if (!width || !height) return null;
    const canvas = doc.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const mount = doc.body ?? doc.documentElement;
    if (!mount) return null;
    const img = doc.createElement("img");
    img.setAttribute("aria-hidden", "true");
    img.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none";
    mount.appendChild(img);
    const objectUrl = URL.createObjectURL(
      new Blob([serialized], { type: "image/svg+xml;charset=utf-8" })
    );
    try {
      img.src = objectUrl;
      if (typeof img.decode === "function") {
        await img.decode();
      } else {
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("svg raster load failed"));
        });
      }
      if (!img.naturalWidth || !img.naturalHeight) return null;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      return dataUrl.startsWith("data:image/png") ? dataUrl : null;
    } catch {
      return null;
    } finally {
      URL.revokeObjectURL(objectUrl);
      img.remove();
    }
  }
  function createImageElement(doc, src, alt, width, height) {
    const img = doc.createElement("img");
    img.src = src;
    img.alt = alt;
    applyImgDimensions(img, width, height);
    return img;
  }
  async function svgElementToImg(sourceSvg, shouldMaterializeInlineSrc) {
    if (!keepInlineSrc("data:", shouldMaterializeInlineSrc)) return null;
    const dataUrl = await rasterizeSvgToPngDataUrl(sourceSvg);
    if (!dataUrl) return null;
    if (!keepInlineSrc(dataUrl, shouldMaterializeInlineSrc)) return null;
    const { width, height } = svgDisplayDimensions(sourceSvg);
    return createImageElement(sourceSvg.ownerDocument, dataUrl, resolveSvgRasterAlt(sourceSvg), width, height);
  }
  function prependBackgroundImage(source, target, shouldMaterializeInlineSrc) {
    const view = source.ownerDocument.defaultView;
    if (!view) return;
    const url = parseFirstBackgroundUrl(view.getComputedStyle(source).backgroundImage);
    if (!url) return;
    const doc = source.ownerDocument;
    const src = resolveMaterializedImageSrc(url, doc);
    if (!src || !keepInlineSrc(src, shouldMaterializeInlineSrc)) return;
    const img = createImageElement(doc, src, resolveImgAlt(source));
    const first = target.firstChild;
    if (first) {
      target.insertBefore(img, first);
    } else {
      target.appendChild(img);
    }
  }
  function normalizeClonedImages(container) {
    const doc = container.ownerDocument;
    for (const img of Array.from(container.querySelectorAll("img[src]"))) {
      const raw = img.getAttribute("src");
      if (!raw) continue;
      const resolved = resolveMaterializedImageSrc(raw, doc);
      if (resolved) img.setAttribute("src", resolved);
    }
  }
  async function walkPairContents(sourceParent, cloneParent, shouldMaterializeInlineSrc) {
    let cloneCursor = cloneParent.firstChild;
    for (const sourceChild of Array.from(sourceParent.childNodes)) {
      if (sourceChild.nodeType === Node.TEXT_NODE) {
        while (cloneCursor?.nodeType === Node.TEXT_NODE) {
          cloneCursor = cloneCursor.nextSibling;
        }
        continue;
      }
      if (!(sourceChild instanceof Element)) continue;
      while (cloneCursor && cloneCursor.nodeType !== Node.ELEMENT_NODE) {
        cloneCursor = cloneCursor.nextSibling;
      }
      if (!(cloneCursor instanceof Element)) break;
      if (cloneCursor.tagName !== sourceChild.tagName) {
        cloneCursor = cloneCursor.nextSibling;
        continue;
      }
      if (isSvgTagName(sourceChild.tagName) && isSvgTagName(cloneCursor.tagName)) {
        const nextClone = cloneCursor.nextSibling;
        removeDecorativeUiSvg(sourceChild, cloneCursor);
        if (cloneCursor.isConnected) {
          const img = await svgElementToImg(sourceChild, shouldMaterializeInlineSrc);
          if (img) {
            cloneCursor.replaceWith(img);
          } else {
            await walkPairElement(sourceChild, cloneCursor, shouldMaterializeInlineSrc);
          }
        }
        cloneCursor = nextClone;
        continue;
      }
      await walkPairElement(sourceChild, cloneCursor, shouldMaterializeInlineSrc);
      cloneCursor = cloneCursor.nextSibling;
    }
  }
  async function walkPairElement(source, clone, shouldMaterializeInlineSrc) {
    prependBackgroundImage(source, clone, shouldMaterializeInlineSrc);
    await walkPairContents(source, clone, shouldMaterializeInlineSrc);
  }
  async function replaceRemainingSvgElementsWithImages(container, shouldMaterializeInlineSrc) {
    for (const svg of Array.from(container.querySelectorAll("svg"))) {
      const img = await svgElementToImg(svg, shouldMaterializeInlineSrc);
      if (img) svg.replaceWith(img);
    }
  }
  async function materializeVisualsInContainer(sourceRoot, container, options) {
    const shouldMaterializeInlineSrc = options?.shouldMaterializeInlineSrc;
    prependBackgroundImage(sourceRoot, container, shouldMaterializeInlineSrc);
    const singleRoot = container.children.length === 1 && container.firstElementChild?.tagName === sourceRoot.tagName ? container.firstElementChild : null;
    if (singleRoot) {
      await walkPairElement(sourceRoot, singleRoot, shouldMaterializeInlineSrc);
    } else {
      await walkPairContents(sourceRoot, container, shouldMaterializeInlineSrc);
    }
    await replaceRemainingSvgElementsWithImages(container, shouldMaterializeInlineSrc);
    normalizeClonedImages(container);
  }

  // src/lib/our/copy/urls.ts
  var URL_ATTRS = ["href", "src", "poster"];
  function absolutizeUrl(value, baseHref) {
    try {
      return new URL(value, baseHref).href;
    } catch {
      return value;
    }
  }
  function absolutizeElementUrls(root2, baseHref) {
    const elements = root2.querySelectorAll("*");
    for (const el of elements) {
      for (const attrName of URL_ATTRS) {
        const value = el.getAttribute(attrName);
        if (value && !value.startsWith("#") && !/^(data:|mailto:|tel:|javascript:)/i.test(value)) {
          el.setAttribute(attrName, absolutizeUrl(value, baseHref));
        }
      }
      const srcset = el.getAttribute("srcset");
      if (srcset) {
        const resolved = srcset.split(",").map((part) => {
          const trimmed = part.trim();
          const spaceIdx = trimmed.search(/\s/);
          if (spaceIdx === -1) {
            return absolutizeUrl(trimmed, baseHref);
          }
          const url = trimmed.slice(0, spaceIdx);
          const descriptor = trimmed.slice(spaceIdx);
          return `${absolutizeUrl(url, baseHref)}${descriptor}`;
        }).join(", ");
        el.setAttribute("srcset", resolved);
      }
    }
  }

  // src/lib/our/copy/cleanup/links.ts
  function absolutizeClipboardLinks(root2, baseHref) {
    if (!baseHref) return;
    absolutizeElementUrls(root2, baseHref);
  }
  function collapseWhitespace(text) {
    return text.replace(/\s+/g, " ").trim();
  }
  function extractVisibleLinkText(anchor) {
    return collapseWhitespace(anchor.textContent ?? "");
  }
  function extractDescendantAltText(anchor) {
    for (const img of Array.from(anchor.querySelectorAll("img[alt]"))) {
      const alt = sanitizeMarkdownAltText(
        collapseWhitespace(img.getAttribute("alt") ?? "")
      );
      if (alt) return alt;
    }
    return "";
  }
  var CONTACT_ACTION_SCHEME_RE = /^(mailto|tel|sms|facetime|tg|whatsapp|skype|slack):/i;
  function hrefToContactActionLabel(href) {
    const trimmed = href.trim();
    if (!CONTACT_ACTION_SCHEME_RE.test(trimmed)) return null;
    try {
      const url = new URL(trimmed);
      let dest = "";
      if (url.hostname) {
        dest = url.hostname;
        if (url.pathname && url.pathname !== "/") {
          dest += url.pathname;
        }
      } else if (url.pathname && url.pathname !== "/") {
        dest = url.pathname.replace(/^\//, "");
      }
      if (url.search) dest += url.search;
      if (url.hash) dest += url.hash;
      if (dest) return dest;
    } catch {
    }
    const colon = trimmed.indexOf(":");
    return colon >= 0 ? trimmed.slice(colon + 1) : trimmed;
  }
  function hrefToDomainShorthand(href, baseHref) {
    const trimmed = href.trim();
    if (/^data:/i.test(trimmed)) return trimmed;
    const contactAction = hrefToContactActionLabel(trimmed);
    if (contactAction !== null) return contactAction;
    try {
      const url = new URL(href, baseHref || void 0);
      let host = url.hostname;
      if (host.startsWith("www.")) host = host.slice(4);
      const hasPath = url.pathname && url.pathname !== "/";
      const hasQuery = Boolean(url.search);
      if (!hasPath && !hasQuery) return host;
      return `${host}/...`;
    } catch {
      if (!trimmed) return "link";
      return trimmed.length > 40 ? `${trimmed.slice(0, 37)}...` : trimmed;
    }
  }
  function resolveLinkLabel(anchor, baseHref) {
    const text = extractVisibleLinkText(anchor);
    if (text) return text;
    const alt = extractDescendantAltText(anchor);
    if (alt) return alt;
    const href = anchor.getAttribute("href");
    if (href) return hrefToDomainShorthand(href, baseHref);
    return "";
  }
  function isImagePrimaryLink(anchor) {
    if (!anchor.querySelector("img")) return false;
    return !extractVisibleLinkText(anchor);
  }
  function trimImagePrimaryLinkMarkup(anchor) {
    const imgs = Array.from(anchor.querySelectorAll("img"));
    if (imgs.length === 0) return;
    anchor.replaceChildren(...imgs.map((img) => img.cloneNode(true)));
  }
  function normalizeClipboardLinks(root2, baseHref) {
    for (const anchor of Array.from(root2.querySelectorAll("a[href]"))) {
      if (!(anchor instanceof HTMLAnchorElement)) continue;
      if (isImagePrimaryLink(anchor)) {
        trimImagePrimaryLinkMarkup(anchor);
        continue;
      }
      const label = resolveLinkLabel(anchor, baseHref);
      if (!label) continue;
      anchor.textContent = sanitizeMarkdownAltText(label);
    }
  }

  // src/lib/our/copy/cleanup/whitespace.ts
  var PRESERVE_WHITESPACE_TAGS = /* @__PURE__ */ new Set(["PRE", "CODE", "TEXTAREA"]);
  function isInsidePreserveWhitespaceElement(node) {
    let el = node.parentElement;
    while (el) {
      if (PRESERVE_WHITESPACE_TAGS.has(el.tagName)) return true;
      el = el.parentElement;
    }
    return false;
  }
  function normalizeClipboardWhitespace(root2) {
    const walker = root2.ownerDocument.createTreeWalker(root2, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node;
      if (!isInsidePreserveWhitespaceElement(text) && text.nodeValue) {
        text.nodeValue = text.nodeValue.replace(/\s+/g, " ");
      }
      node = walker.nextNode();
    }
  }

  // src/lib/our/copy/cleanup/index.ts
  async function prepareElementForCopy(element, options) {
    const doc = element.ownerDocument;
    const container = doc.createElement("div");
    container.appendChild(cloneElementForClipboard(element));
    removeNoscriptAndComments(container);
    const inlineImages = options?.inlineImages ?? "all";
    applyInlineImagePolicy(container, inlineImages);
    await materializeVisualsInContainer(element, container, {
      ...inlineImages === "all" ? {} : { shouldMaterializeInlineSrc: (src) => shouldMaterializeInlineDataUrl(src, inlineImages) }
    });
    sanitizeClipboardHtml(container);
    applyInlineImagePolicy(container, inlineImages);
    normalizeClipboardWhitespace(container);
    if (options?.baseHref) {
      absolutizeClipboardLinks(container, options.baseHref);
    }
    normalizeClipboardLinks(container, options?.baseHref);
    if (options?.pruneHiddenTableRows) {
      pruneHiddenEmptyTableRows(container);
    }
    return container;
  }

  // src/lib/our/copy/selector.ts
  var STABLE_ATTRS = [
    "data-testid",
    "data-test",
    "data-cy",
    "data-qa",
    "name",
    "aria-label"
  ];
  function escapeCssIdent(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/([^\w-])/g, "\\$1");
  }
  function escapeCssAttrValue(value) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function nthChild(element) {
    const parent = element.parentElement;
    if (!parent) return 1;
    return Array.prototype.indexOf.call(parent.children, element) + 1;
  }
  function siblingDisambiguation(element) {
    const parent = element.parentElement;
    if (!parent) return { needsClassNames: false, needsNthChild: false };
    const tag = element.tagName;
    const ownClasses = Array.from(element.classList);
    const sameTagSiblings = Array.from(parent.children).filter(
      (sibling) => sibling !== element && sibling.tagName === tag
    );
    return {
      needsClassNames: sameTagSiblings.length > 0,
      needsNthChild: sameTagSiblings.some(
        (sibling) => ownClasses.length === 0 || ownClasses.every((cls) => sibling.classList.contains(cls))
      )
    };
  }
  function preferredAttribute(element) {
    for (const name of STABLE_ATTRS) {
      const value = element.getAttribute(name);
      if (value) return { name, value };
    }
    return null;
  }
  function matchesOnly(selector, element, doc = element.ownerDocument) {
    try {
      const found = doc.querySelectorAll(selector);
      return found.length === 1 && found[0] === element;
    } catch {
      return false;
    }
  }
  function buildCssSegment(element) {
    if (element.id) {
      return `#${escapeCssIdent(element.id)}`;
    }
    const tag = element.tagName.toLowerCase();
    const attr = preferredAttribute(element);
    if (attr) {
      return `${tag}[${attr.name}="${escapeCssAttrValue(attr.value)}"]`;
    }
    const { needsClassNames, needsNthChild } = siblingDisambiguation(element);
    if (needsNthChild) {
      return `${tag}:nth-child(${nthChild(element)})`;
    }
    if (needsClassNames && element.classList.length > 0) {
      const classPart = Array.from(element.classList).map((name) => `.${escapeCssIdent(name)}`).join("");
      return `${tag}${classPart}`;
    }
    return tag;
  }
  function getCssSelector(element) {
    const doc = element.ownerDocument;
    if (element.id) {
      const byId = `#${escapeCssIdent(element.id)}`;
      if (matchesOnly(byId, element, doc)) return byId;
    }
    const parts = [];
    let node = element;
    while (node && node.nodeType === Node.ELEMENT_NODE) {
      parts.unshift(buildCssSegment(node));
      const candidate = parts.join(" > ");
      const hasIdAnchor = parts.some((part) => part.startsWith("#"));
      if (matchesOnly(candidate, element, doc) && (hasIdAnchor || !node.parentElement)) {
        return candidate;
      }
      node = node.parentElement;
    }
    return parts.join(" > ");
  }

  // src/lib/our/copy/js-path.ts
  function escapeJsString(value) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  function matchesOnly2(selector, element, doc = element.ownerDocument) {
    try {
      const found = doc.querySelectorAll(selector);
      return found.length === 1 && found[0] === element;
    } catch {
      return false;
    }
  }
  function getJsPath(element) {
    const selector = getCssSelector(element);
    if (matchesOnly2(selector, element)) {
      return `document.querySelector("${escapeJsString(selector)}")`;
    }
    return getJsPathByIndex(element);
  }
  function getJsPathByIndex(element) {
    const doc = element.ownerDocument;
    if (element === doc.documentElement) return "document.documentElement";
    if (element === doc.body) return "document.body";
    const segments = [];
    let node = element;
    while (node && node !== doc.body && node !== doc.documentElement) {
      const parent = node.parentElement;
      if (!parent) break;
      const index = Array.prototype.indexOf.call(parent.children, node);
      segments.unshift(`children[${index}]`);
      node = parent;
    }
    if (node === doc.body) {
      return segments.length > 0 ? `document.body.${segments.join(".")}` : "document.body";
    }
    return segments.length > 0 ? `document.documentElement.${segments.join(".")}` : "document.documentElement";
  }

  // src/lib/our/copy/styles-computed.ts
  function getElementComputedStyles(element) {
    const computed = element.ownerDocument.defaultView?.getComputedStyle(element);
    if (!computed) return "";
    const decls = [];
    for (let i = 0; i < computed.length; i += 1) {
      const name = computed.item(i);
      if (!name) continue;
      const value = computed.getPropertyValue(name);
      if (value) decls.push(`${name}: ${value};`);
    }
    return decls.join("\n");
  }

  // src/lib/our/copy/styles.ts
  var INHERITABLE_PROPERTIES = /* @__PURE__ */ new Set([
    "azimuth",
    "border-collapse",
    "border-spacing",
    "caption-side",
    "color",
    "cursor",
    "direction",
    "elevation",
    "empty-cells",
    "font",
    "font-family",
    "font-size",
    "font-style",
    "font-variant",
    "font-weight",
    "letter-spacing",
    "line-height",
    "list-style",
    "list-style-image",
    "list-style-position",
    "list-style-type",
    "orphans",
    "quotes",
    "tab-size",
    "text-align",
    "text-indent",
    "text-size-adjust",
    "text-transform",
    "visibility",
    "white-space",
    "widows",
    "word-spacing",
    "writing-mode",
    "-webkit-font-smoothing",
    "-webkit-text-size-adjust"
  ]);
  function getElementStyles(element) {
    const context = collectStylesheetContext(element);
    let order = 0;
    const inherited = /* @__PURE__ */ new Map();
    for (const ancestor of getAncestorsRootFirst(element)) {
      order = collectMatchingRules(ancestor, context, inherited, order, isInheritableProperty);
    }
    const own = /* @__PURE__ */ new Map();
    order = collectMatchingRules(element, context, own, order, () => true);
    collectInlineStyles(element, own, order);
    const merged = new Map(inherited);
    for (const [name, entry] of own) {
      setCascadeProperty(merged, name, entry);
    }
    const output = /* @__PURE__ */ new Map();
    for (const [name, entry] of merged) {
      output.set(name, formatValue(entry));
    }
    collapseShorthands(output);
    return Array.from(output.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([prop, value]) => `${prop}: ${value};`).join("\n");
  }
  function isInheritableProperty(name) {
    if (name.startsWith("--")) return true;
    return INHERITABLE_PROPERTIES.has(name);
  }
  function getAncestorsRootFirst(element) {
    const ancestors = [];
    let parent = element.parentElement;
    while (parent) {
      ancestors.unshift(parent);
      parent = parent.parentElement;
    }
    return ancestors;
  }
  function collectStylesheetContext(element) {
    const sheets = [];
    const seen = /* @__PURE__ */ new Set();
    const adopted = /* @__PURE__ */ new Set();
    const addSheet = (sheet) => {
      if (!sheet || seen.has(sheet)) return;
      seen.add(sheet);
      sheets.push(sheet);
    };
    const addAdoptedFromRoot = (root2) => {
      const adoptedSheets = root2.adoptedStyleSheets;
      if (!adoptedSheets) return;
      for (const sheet of adoptedSheets) {
        adopted.add(sheet);
        addSheet(sheet);
      }
    };
    const doc = element.ownerDocument;
    for (let i = 0; i < doc.styleSheets.length; i += 1) {
      addSheet(doc.styleSheets[i] ?? null);
    }
    addAdoptedFromRoot(doc);
    let node = element;
    while (node) {
      if (node instanceof ShadowRoot) {
        addAdoptedFromRoot(node);
        const styleElements = node.querySelectorAll("style");
        for (let j = 0; j < styleElements.length; j += 1) {
          addSheet(styleElements[j]?.sheet ?? null);
        }
      }
      node = node.parentNode;
    }
    return { sheets, adopted };
  }
  function isAuthorStylesheet(sheet, adopted) {
    if (adopted.has(sheet)) return true;
    if (sheet.ownerNode) return true;
    if (sheet.href) return true;
    return false;
  }
  function collectMatchingRules(target, context, properties2, order, includeProperty) {
    for (const sheet of context.sheets) {
      if (!isAuthorStylesheet(sheet, context.adopted)) continue;
      order = walkStylesheetRules(
        sheet,
        target,
        (rule, ruleOrder) => {
          const matchedSelector = findMatchingSelector(target, rule.selectorText);
          if (!matchedSelector) return;
          applyStyleDeclarations(rule.style, properties2, {
            specificity: calculateSpecificity(matchedSelector),
            order: ruleOrder,
            isInline: false,
            includeProperty
          });
        },
        order
      );
    }
    return order;
  }
  function collectInlineStyles(element, properties2, order) {
    if (!(element instanceof HTMLElement)) return;
    const inline = element.style;
    for (let i = 0; i < inline.length; i += 1) {
      const name = inline.item(i);
      if (!name) continue;
      const value = inline.getPropertyValue(name);
      if (!value) continue;
      setCascadeProperty(properties2, name, {
        value,
        important: inline.getPropertyPriority(name) === "important",
        specificity: 0,
        order,
        isInline: true
      });
      order += 1;
    }
  }
  function walkStylesheetRules(sheet, element, onStyleRule, order) {
    let rules2;
    try {
      rules2 = sheet.cssRules;
    } catch {
      return order;
    }
    for (let i = 0; i < rules2.length; i += 1) {
      order = walkRule(rules2[i], element, onStyleRule, order, true);
    }
    return order;
  }
  function isMediaRule(rule) {
    return rule.type === CSSRule.MEDIA_RULE;
  }
  function isSupportsRule(rule) {
    return rule.type === CSSRule.SUPPORTS_RULE;
  }
  function isContainerRule(rule) {
    if (typeof CSSContainerRule !== "undefined" && rule instanceof CSSContainerRule) return true;
    return rule.constructor.name === "CSSContainerRule";
  }
  function doesMediaMatch(rule, element) {
    const view = element.ownerDocument.defaultView;
    if (!view) return false;
    const ruleMatches = rule.matches;
    if (typeof ruleMatches === "boolean") return ruleMatches;
    const mediaText = rule.media?.mediaText;
    if (!mediaText) return true;
    const listMatches = rule.media.matches;
    if (typeof listMatches === "boolean") return listMatches;
    return view.matchMedia(mediaText).matches;
  }
  function doesSupportsMatch(rule) {
    const ruleMatches = rule.matches;
    if (typeof ruleMatches === "boolean") return ruleMatches;
    const condition = rule.conditionText;
    if (!condition) return false;
    if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
    return CSS.supports(condition);
  }
  function findNamedContainer(element, name) {
    const view = element.ownerDocument.defaultView;
    if (!view) return null;
    let current = element;
    while (current) {
      const style = view.getComputedStyle(current);
      const names = style.containerName.split(",").map((part) => part.trim()).filter(Boolean);
      const type = style.containerType;
      const isContainer = type !== "" && type !== "normal";
      if (isContainer && (name === "" || names.includes(name))) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }
  function evaluateContainerQuery(queryText, containerEl) {
    const width = containerEl.getBoundingClientRect().width;
    const minMatch = queryText.match(/\(min-width:\s*([\d.]+)px\)/);
    if (minMatch) return width >= Number.parseFloat(minMatch[1]);
    const maxMatch = queryText.match(/\(max-width:\s*([\d.]+)px\)/);
    if (maxMatch) return width <= Number.parseFloat(maxMatch[1]);
    return false;
  }
  function doesContainerMatch(rule, element) {
    const ruleMatches = rule.matches;
    if (typeof ruleMatches === "boolean") return ruleMatches;
    const query = rule.containerQuery;
    if (typeof query === "object" && query !== null && typeof query.matches === "boolean") {
      return query.matches;
    }
    const queryText = typeof query === "string" ? query : String(query);
    const containerEl = findNamedContainer(element, rule.containerName ?? "");
    if (!containerEl) return false;
    return evaluateContainerQuery(queryText, containerEl);
  }
  function isGroupingRuleActive(rule, parentActive, element) {
    if (!parentActive) return false;
    if (isMediaRule(rule)) return doesMediaMatch(rule, element);
    if (isContainerRule(rule)) return doesContainerMatch(rule, element);
    if (isSupportsRule(rule)) return doesSupportsMatch(rule);
    return true;
  }
  function walkRule(rule, element, onStyleRule, order, active) {
    if (rule.type === CSSRule.STYLE_RULE) {
      if (!active) return order;
      onStyleRule(rule, order);
      return order + 1;
    }
    const grouping = rule;
    if (grouping.cssRules) {
      const childActive = isGroupingRuleActive(rule, active, element);
      for (let i = 0; i < grouping.cssRules.length; i += 1) {
        order = walkRule(grouping.cssRules[i], element, onStyleRule, order, childActive);
      }
    }
    return order;
  }
  function findMatchingSelector(element, selectorText) {
    if (!selectorText) return null;
    const selectors = selectorText.split(",").map((part) => part.trim()).filter(Boolean);
    let best = null;
    for (const selector of selectors) {
      try {
        if (!element.matches(selector)) continue;
        const specificity = calculateSpecificity(selector);
        if (!best || specificity >= best.specificity) {
          best = { selector, specificity };
        }
      } catch {
      }
    }
    return best?.selector ?? null;
  }
  function calculateSpecificity(selector) {
    const withoutPseudoElements = selector.replace(/::[\w-]+/g, "");
    const ids = withoutPseudoElements.match(/#[\w-]+/g)?.length ?? 0;
    const classes = withoutPseudoElements.match(/(\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?)/g)?.length ?? 0;
    let elements = 0;
    const parts = selector.split(/[\s>+~]/).filter(Boolean);
    for (const part of parts) {
      const tag = part.replace(/(\.[\w-]+|#[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?|::[\w-]+)/g, "");
      if (/^([a-zA-Z][\w-]*|\*)/.test(tag.trim())) elements += 1;
    }
    elements += selector.match(/::[\w-]+/g)?.length ?? 0;
    return ids * 1e4 + classes * 100 + elements;
  }
  function applyStyleDeclarations(style, properties2, context) {
    for (let i = 0; i < style.length; i += 1) {
      const name = style.item(i);
      if (!name || !context.includeProperty(name)) continue;
      const value = style.getPropertyValue(name);
      if (!value) continue;
      setCascadeProperty(properties2, name, {
        value,
        important: style.getPropertyPriority(name) === "important",
        specificity: context.specificity,
        order: context.order,
        isInline: context.isInline
      });
    }
  }
  function setCascadeProperty(properties2, name, next2) {
    const current = properties2.get(name);
    if (!current || cascadeEntryWins(next2, current)) {
      properties2.set(name, next2);
    }
  }
  function cascadeEntryWins(next2, current) {
    if (next2.important !== current.important) return next2.important;
    if (next2.isInline !== current.isInline) return next2.isInline;
    if (next2.specificity !== current.specificity) return next2.specificity > current.specificity;
    return next2.order >= current.order;
  }
  function formatValue(entry) {
    return entry.important ? `${entry.value} !important` : entry.value;
  }
  function collapseShorthands(properties2) {
    collapseBoxShorthand(properties2, "padding");
    collapseBoxShorthand(properties2, "margin");
    collapseOverflow(properties2);
    collapseWhiteSpace(properties2);
  }
  function collapseBoxShorthand(properties2, prefix) {
    if (properties2.has(prefix)) return;
    const top = properties2.get(`${prefix}-top`);
    const right = properties2.get(`${prefix}-right`);
    const bottom = properties2.get(`${prefix}-bottom`);
    const left = properties2.get(`${prefix}-left`);
    if (top === void 0 || right === void 0 || bottom === void 0 || left === void 0) {
      return;
    }
    let shorthand;
    if (top === right && right === bottom && bottom === left) {
      shorthand = top;
    } else if (top === bottom && right === left) {
      shorthand = `${top} ${right}`;
    } else if (right === left) {
      shorthand = `${top} ${right} ${bottom}`;
    } else {
      shorthand = `${top} ${right} ${bottom} ${left}`;
    }
    properties2.delete(`${prefix}-top`);
    properties2.delete(`${prefix}-right`);
    properties2.delete(`${prefix}-bottom`);
    properties2.delete(`${prefix}-left`);
    properties2.set(prefix, shorthand);
  }
  function collapseOverflow(properties2) {
    if (properties2.has("overflow")) return;
    const x = properties2.get("overflow-x");
    const y = properties2.get("overflow-y");
    if (x === void 0 || y === void 0) return;
    properties2.delete("overflow-x");
    properties2.delete("overflow-y");
    properties2.set("overflow", x === y ? x : `${x} ${y}`);
  }
  var WHITE_SPACE_LONGHANDS = {
    "collapse|nowrap": "nowrap",
    "collapse|wrap": "normal",
    "preserve|wrap": "pre-wrap",
    "preserve|nowrap": "pre",
    "preserve-breaks|wrap": "pre-line",
    "collapse|balance": "balance"
  };
  function collapseWhiteSpace(properties2) {
    if (properties2.has("white-space")) return;
    const collapse = properties2.get("white-space-collapse");
    const wrap = properties2.get("text-wrap-mode");
    if (!collapse || !wrap) return;
    const shorthand = WHITE_SPACE_LONGHANDS[`${collapse}|${wrap}`];
    if (!shorthand) return;
    properties2.delete("white-space-collapse");
    properties2.delete("text-wrap-mode");
    properties2.set("white-space", shorthand);
  }

  // src/lib/vendor/turndown/lib/turndown.browser.es.js
  function extend(destination) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) destination[key] = source[key];
      }
    }
    return destination;
  }
  function repeat(character, count) {
    return Array(count + 1).join(character);
  }
  function trimLeadingNewlines(string) {
    return string.replace(/^\n*/, "");
  }
  function trimTrailingNewlines(string) {
    var indexEnd = string.length;
    while (indexEnd > 0 && string[indexEnd - 1] === "\n") indexEnd--;
    return string.substring(0, indexEnd);
  }
  function trimNewlines(string) {
    return trimTrailingNewlines(trimLeadingNewlines(string));
  }
  var blockElements = ["ADDRESS", "ARTICLE", "ASIDE", "AUDIO", "BLOCKQUOTE", "BODY", "CANVAS", "CENTER", "DD", "DIR", "DIV", "DL", "DT", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "FRAMESET", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HGROUP", "HR", "HTML", "ISINDEX", "LI", "MAIN", "MENU", "NAV", "NOFRAMES", "NOSCRIPT", "OL", "OUTPUT", "P", "PRE", "SECTION", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL"];
  function isBlock(node) {
    return is(node, blockElements);
  }
  var voidElements = ["AREA", "BASE", "BR", "COL", "COMMAND", "EMBED", "HR", "IMG", "INPUT", "KEYGEN", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"];
  function isVoid(node) {
    return is(node, voidElements);
  }
  function hasVoid(node) {
    return has(node, voidElements);
  }
  var meaningfulWhenBlankElements = ["A", "TABLE", "THEAD", "TBODY", "TFOOT", "TH", "TD", "IFRAME", "SCRIPT", "AUDIO", "VIDEO"];
  function isMeaningfulWhenBlank(node) {
    return is(node, meaningfulWhenBlankElements);
  }
  function hasMeaningfulWhenBlank(node) {
    return has(node, meaningfulWhenBlankElements);
  }
  function is(node, tagNames) {
    return tagNames.indexOf(node.nodeName) >= 0;
  }
  function has(node, tagNames) {
    return node.getElementsByTagName && tagNames.some(function(tagName) {
      return node.getElementsByTagName(tagName).length;
    });
  }
  var markdownEscapes = [[/\\/g, "\\\\"], [/\*/g, "\\*"], [/^-/g, "\\-"], [/^\+ /g, "\\+ "], [/^(=+)/g, "\\$1"], [/^(#{1,6}) /g, "\\$1 "], [/`/g, "\\`"], [/^~~~/g, "\\~~~"], [/\[/g, "\\["], [/\]/g, "\\]"], [/^>/g, "\\>"], [/_/g, "\\_"], [/^(\d+)\. /g, "$1\\. "]];
  function escapeMarkdown(string) {
    return markdownEscapes.reduce(function(accumulator, escape) {
      return accumulator.replace(escape[0], escape[1]);
    }, string);
  }
  var rules = {};
  rules.paragraph = {
    filter: "p",
    replacement: function(content) {
      return "\n\n" + content + "\n\n";
    }
  };
  rules.lineBreak = {
    filter: "br",
    replacement: function(content, node, options) {
      return options.br + "\n";
    }
  };
  rules.heading = {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement: function(content, node, options) {
      var hLevel = Number(node.nodeName.charAt(1));
      if (options.headingStyle === "setext" && hLevel < 3) {
        var underline = repeat(hLevel === 1 ? "=" : "-", content.length);
        return "\n\n" + content + "\n" + underline + "\n\n";
      } else {
        return "\n\n" + repeat("#", hLevel) + " " + content + "\n\n";
      }
    }
  };
  rules.blockquote = {
    filter: "blockquote",
    replacement: function(content) {
      content = trimNewlines(content).replace(/^/gm, "> ");
      return "\n\n" + content + "\n\n";
    }
  };
  rules.list = {
    filter: ["ul", "ol"],
    replacement: function(content, node) {
      var parent = node.parentNode;
      if (parent.nodeName === "LI" && parent.lastElementChild === node) {
        return "\n" + content;
      } else {
        return "\n\n" + content + "\n\n";
      }
    }
  };
  rules.listItem = {
    filter: "li",
    replacement: function(content, node, options) {
      var prefix = options.bulletListMarker + "   ";
      var parent = node.parentNode;
      if (parent.nodeName === "OL") {
        var start = parent.getAttribute("start");
        var index = Array.prototype.indexOf.call(parent.children, node);
        prefix = (start ? Number(start) + index : index + 1) + ".  ";
      }
      var isParagraph = /\n$/.test(content);
      content = trimNewlines(content) + (isParagraph ? "\n" : "");
      content = content.replace(/\n/gm, "\n" + " ".repeat(prefix.length));
      return prefix + content + (node.nextSibling ? "\n" : "");
    }
  };
  rules.indentedCodeBlock = {
    filter: function(node, options) {
      return options.codeBlockStyle === "indented" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
    },
    replacement: function(content, node, options) {
      return "\n\n    " + node.firstChild.textContent.replace(/\n/g, "\n    ") + "\n\n";
    }
  };
  rules.fencedCodeBlock = {
    filter: function(node, options) {
      return options.codeBlockStyle === "fenced" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
    },
    replacement: function(content, node, options) {
      var className = node.firstChild.getAttribute("class") || "";
      var language = (className.match(/language-(\S+)/) || [null, ""])[1];
      var code = node.firstChild.textContent;
      var fenceChar = options.fence.charAt(0);
      var fenceSize = 3;
      var fenceInCodeRegex = new RegExp("^" + fenceChar + "{3,}", "gm");
      var match;
      while (match = fenceInCodeRegex.exec(code)) {
        if (match[0].length >= fenceSize) {
          fenceSize = match[0].length + 1;
        }
      }
      var fence = repeat(fenceChar, fenceSize);
      return "\n\n" + fence + language + "\n" + code.replace(/\n$/, "") + "\n" + fence + "\n\n";
    }
  };
  rules.horizontalRule = {
    filter: "hr",
    replacement: function(content, node, options) {
      return "\n\n" + options.hr + "\n\n";
    }
  };
  rules.inlineLink = {
    filter: function(node, options) {
      return options.linkStyle === "inlined" && node.nodeName === "A" && node.getAttribute("href");
    },
    replacement: function(content, node) {
      var href = escapeLinkDestination(node.getAttribute("href"));
      var title = escapeLinkTitle(cleanAttribute(node.getAttribute("title")));
      var titlePart = title ? ' "' + title + '"' : "";
      return "[" + content + "](" + href + titlePart + ")";
    }
  };
  rules.referenceLink = {
    filter: function(node, options) {
      return options.linkStyle === "referenced" && node.nodeName === "A" && node.getAttribute("href");
    },
    replacement: function(content, node, options) {
      var href = escapeLinkDestination(node.getAttribute("href"));
      var title = cleanAttribute(node.getAttribute("title"));
      if (title) title = ' "' + escapeLinkTitle(title) + '"';
      var replacement;
      var reference;
      switch (options.linkReferenceStyle) {
        case "collapsed":
          replacement = "[" + content + "][]";
          reference = "[" + content + "]: " + href + title;
          break;
        case "shortcut":
          replacement = "[" + content + "]";
          reference = "[" + content + "]: " + href + title;
          break;
        default:
          var id = this.references.length + 1;
          replacement = "[" + content + "][" + id + "]";
          reference = "[" + id + "]: " + href + title;
      }
      this.references.push(reference);
      return replacement;
    },
    references: [],
    append: function(options) {
      var references = "";
      if (this.references.length) {
        references = "\n\n" + this.references.join("\n") + "\n\n";
        this.references = [];
      }
      return references;
    }
  };
  rules.emphasis = {
    filter: ["em", "i"],
    replacement: function(content, node, options) {
      if (!content.trim()) return "";
      return options.emDelimiter + content + options.emDelimiter;
    }
  };
  rules.strong = {
    filter: ["strong", "b"],
    replacement: function(content, node, options) {
      if (!content.trim()) return "";
      return options.strongDelimiter + content + options.strongDelimiter;
    }
  };
  rules.code = {
    filter: function(node) {
      var hasSiblings = node.previousSibling || node.nextSibling;
      var isCodeBlock = node.parentNode.nodeName === "PRE" && !hasSiblings;
      return node.nodeName === "CODE" && !isCodeBlock;
    },
    replacement: function(content) {
      if (!content) return "";
      content = content.replace(/\r?\n|\r/g, " ");
      var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? " " : "";
      var delimiter = "`";
      var matches = content.match(/`+/gm) || [];
      while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + "`";
      return delimiter + extraSpace + content + extraSpace + delimiter;
    }
  };
  rules.image = {
    filter: "img",
    replacement: function(content, node) {
      var alt = escapeMarkdown(cleanAttribute(node.getAttribute("alt")));
      var src = escapeLinkDestination(node.getAttribute("src") || "");
      var title = cleanAttribute(node.getAttribute("title"));
      var titlePart = title ? ' "' + escapeLinkTitle(title) + '"' : "";
      return src ? "![" + alt + "](" + src + titlePart + ")" : "";
    }
  };
  function cleanAttribute(attribute) {
    return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
  }
  function escapeLinkDestination(destination) {
    var escaped = destination.replace(/([<>()])/g, "\\$1");
    return escaped.indexOf(" ") >= 0 ? "<" + escaped + ">" : escaped;
  }
  function escapeLinkTitle(title) {
    return title.replace(/"/g, '\\"');
  }
  function Rules(options) {
    this.options = options;
    this._keep = [];
    this._remove = [];
    this.blankRule = {
      replacement: options.blankReplacement
    };
    this.keepReplacement = options.keepReplacement;
    this.defaultRule = {
      replacement: options.defaultReplacement
    };
    this.array = [];
    for (var key in options.rules) this.array.push(options.rules[key]);
  }
  Rules.prototype = {
    add: function(key, rule) {
      this.array.unshift(rule);
    },
    keep: function(filter) {
      this._keep.unshift({
        filter,
        replacement: this.keepReplacement
      });
    },
    remove: function(filter) {
      this._remove.unshift({
        filter,
        replacement: function() {
          return "";
        }
      });
    },
    forNode: function(node) {
      if (node.isBlank) return this.blankRule;
      var rule;
      if (rule = findRule(this.array, node, this.options)) return rule;
      if (rule = findRule(this._keep, node, this.options)) return rule;
      if (rule = findRule(this._remove, node, this.options)) return rule;
      return this.defaultRule;
    },
    forEach: function(fn) {
      for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
    }
  };
  function findRule(rules2, node, options) {
    for (var i = 0; i < rules2.length; i++) {
      var rule = rules2[i];
      if (filterValue(rule, node, options)) return rule;
    }
    return void 0;
  }
  function filterValue(rule, node, options) {
    var filter = rule.filter;
    if (typeof filter === "string") {
      if (filter === node.nodeName.toLowerCase()) return true;
    } else if (Array.isArray(filter)) {
      if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true;
    } else if (typeof filter === "function") {
      if (filter.call(rule, node, options)) return true;
    } else {
      throw new TypeError("`filter` needs to be a string, array, or function");
    }
  }
  function collapseWhitespace2(options) {
    var element = options.element;
    var isBlock2 = options.isBlock;
    var isVoid2 = options.isVoid;
    var isPre = options.isPre || function(node2) {
      return node2.nodeName === "PRE";
    };
    if (!element.firstChild || isPre(element)) return;
    var prevText = null;
    var keepLeadingWs = false;
    var prev = null;
    var node = next(prev, element, isPre);
    while (node !== element) {
      if (node.nodeType === 3 || node.nodeType === 4) {
        var text = node.data.replace(/[ \r\n\t]+/g, " ");
        if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text[0] === " ") {
          text = text.substr(1);
        }
        if (!text) {
          node = remove(node);
          continue;
        }
        node.data = text;
        prevText = node;
      } else if (node.nodeType === 1) {
        if (isBlock2(node) || node.nodeName === "BR") {
          if (prevText) {
            prevText.data = prevText.data.replace(/ $/, "");
          }
          prevText = null;
          keepLeadingWs = false;
        } else if (isVoid2(node) || isPre(node)) {
          prevText = null;
          keepLeadingWs = true;
        } else if (prevText) {
          keepLeadingWs = false;
        }
      } else {
        node = remove(node);
        continue;
      }
      var nextNode = next(prev, node, isPre);
      prev = node;
      node = nextNode;
    }
    if (prevText) {
      prevText.data = prevText.data.replace(/ $/, "");
      if (!prevText.data) {
        remove(prevText);
      }
    }
  }
  function remove(node) {
    var next2 = node.nextSibling || node.parentNode;
    node.parentNode.removeChild(node);
    return next2;
  }
  function next(prev, current, isPre) {
    if (prev && prev.parentNode === current || isPre(current)) {
      return current.nextSibling || current.parentNode;
    }
    return current.firstChild || current.nextSibling || current.parentNode;
  }
  var root = typeof window !== "undefined" ? window : {};
  function canParseHTMLNatively() {
    var Parser = root.DOMParser;
    var canParse = false;
    try {
      if (new Parser().parseFromString("", "text/html")) {
        canParse = true;
      }
    } catch (e) {
    }
    return canParse;
  }
  function createHTMLParser() {
    var Parser = function() {
    };
    {
      if (shouldUseActiveX()) {
        Parser.prototype.parseFromString = function(string) {
          var doc = new window.ActiveXObject("htmlfile");
          doc.designMode = "on";
          doc.open();
          doc.write(string);
          doc.close();
          return doc;
        };
      } else {
        Parser.prototype.parseFromString = function(string) {
          var doc = document.implementation.createHTMLDocument("");
          doc.open();
          doc.write(string);
          doc.close();
          return doc;
        };
      }
    }
    return Parser;
  }
  function shouldUseActiveX() {
    var useActiveX = false;
    try {
      document.implementation.createHTMLDocument("").open();
    } catch (e) {
      if (root.ActiveXObject) useActiveX = true;
    }
    return useActiveX;
  }
  var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();
  function RootNode(input, options) {
    var root2;
    if (typeof input === "string") {
      var doc = htmlParser().parseFromString(
        // DOM parsers arrange elements in the <head> and <body>.
        // Wrapping in a custom element ensures elements are reliably arranged in
        // a single element.
        '<x-turndown id="turndown-root">' + input + "</x-turndown>",
        "text/html"
      );
      root2 = doc.getElementById("turndown-root");
    } else {
      root2 = input.cloneNode(true);
    }
    collapseWhitespace2({
      element: root2,
      isBlock,
      isVoid,
      isPre: options.preformattedCode ? isPreOrCode : null
    });
    return root2;
  }
  var _htmlParser;
  function htmlParser() {
    _htmlParser = _htmlParser || new HTMLParser();
    return _htmlParser;
  }
  function isPreOrCode(node) {
    return node.nodeName === "PRE" || node.nodeName === "CODE";
  }
  function Node2(node, options) {
    node.isBlock = isBlock(node);
    node.isCode = node.nodeName === "CODE" || node.parentNode.isCode;
    node.isBlank = isBlank(node);
    node.flankingWhitespace = flankingWhitespace(node, options);
    return node;
  }
  function isBlank(node) {
    return !isVoid(node) && !isMeaningfulWhenBlank(node) && /^\s*$/i.test(node.textContent) && !hasVoid(node) && !hasMeaningfulWhenBlank(node);
  }
  function flankingWhitespace(node, options) {
    if (node.isBlock || options.preformattedCode && node.isCode) {
      return {
        leading: "",
        trailing: ""
      };
    }
    var edges = edgeWhitespace(node.textContent);
    if (edges.leadingAscii && isFlankedByWhitespace("left", node, options)) {
      edges.leading = edges.leadingNonAscii;
    }
    if (edges.trailingAscii && isFlankedByWhitespace("right", node, options)) {
      edges.trailing = edges.trailingNonAscii;
    }
    return {
      leading: edges.leading,
      trailing: edges.trailing
    };
  }
  function edgeWhitespace(string) {
    var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
    return {
      leading: m[1],
      // whole string for whitespace-only strings
      leadingAscii: m[2],
      leadingNonAscii: m[3],
      trailing: m[4],
      // empty for whitespace-only strings
      trailingNonAscii: m[5],
      trailingAscii: m[6]
    };
  }
  function isFlankedByWhitespace(side, node, options) {
    var sibling;
    var regExp;
    var isFlanked;
    if (side === "left") {
      sibling = node.previousSibling;
      regExp = / $/;
    } else {
      sibling = node.nextSibling;
      regExp = /^ /;
    }
    if (sibling) {
      if (sibling.nodeType === 3) {
        isFlanked = regExp.test(sibling.nodeValue);
      } else if (options.preformattedCode && sibling.nodeName === "CODE") {
        isFlanked = false;
      } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
        isFlanked = regExp.test(sibling.textContent);
      }
    }
    return isFlanked;
  }
  var reduce = Array.prototype.reduce;
  function TurndownService(options) {
    if (!(this instanceof TurndownService)) return new TurndownService(options);
    var defaults = {
      rules,
      headingStyle: "setext",
      hr: "* * *",
      bulletListMarker: "*",
      codeBlockStyle: "indented",
      fence: "```",
      emDelimiter: "_",
      strongDelimiter: "**",
      linkStyle: "inlined",
      linkReferenceStyle: "full",
      br: "  ",
      preformattedCode: false,
      blankReplacement: function(content, node) {
        return node.isBlock ? "\n\n" : "";
      },
      keepReplacement: function(content, node) {
        return node.isBlock ? "\n\n" + node.outerHTML + "\n\n" : node.outerHTML;
      },
      defaultReplacement: function(content, node) {
        return node.isBlock ? "\n\n" + content + "\n\n" : content;
      }
    };
    this.options = extend({}, defaults, options);
    this.rules = new Rules(this.options);
  }
  TurndownService.prototype = {
    /**
     * The entry point for converting a string or DOM node to Markdown
     * @public
     * @param {String|HTMLElement} input The string or DOM node to convert
     * @returns A Markdown representation of the input
     * @type String
     */
    turndown: function(input) {
      if (!canConvert(input)) {
        throw new TypeError(input + " is not a string, or an element/document/fragment node.");
      }
      if (input === "") return "";
      var output = process2.call(this, new RootNode(input, this.options));
      return postProcess.call(this, output);
    },
    /**
     * Add one or more plugins
     * @public
     * @param {Function|Array} plugin The plugin or array of plugins to add
     * @returns The Turndown instance for chaining
     * @type Object
     */
    use: function(plugin) {
      if (Array.isArray(plugin)) {
        for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
      } else if (typeof plugin === "function") {
        plugin(this);
      } else {
        throw new TypeError("plugin must be a Function or an Array of Functions");
      }
      return this;
    },
    /**
     * Adds a rule
     * @public
     * @param {String} key The unique key of the rule
     * @param {Object} rule The rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    addRule: function(key, rule) {
      this.rules.add(key, rule);
      return this;
    },
    /**
     * Keep a node (as HTML) that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    keep: function(filter) {
      this.rules.keep(filter);
      return this;
    },
    /**
     * Remove a node that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    remove: function(filter) {
      this.rules.remove(filter);
      return this;
    },
    /**
     * Escapes Markdown syntax
     * @public
     * @param {String} string The string to escape
     * @returns A string with Markdown syntax escaped
     * @type String
     */
    escape: function(string) {
      return escapeMarkdown(string);
    }
  };
  function process2(parentNode) {
    var self = this;
    return reduce.call(parentNode.childNodes, function(output, node) {
      node = new Node2(node, self.options);
      var replacement = "";
      if (node.nodeType === 3) {
        replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
      } else if (node.nodeType === 1) {
        replacement = replacementForNode.call(self, node);
      }
      return join(output, replacement);
    }, "");
  }
  function postProcess(output) {
    var self = this;
    this.rules.forEach(function(rule) {
      if (typeof rule.append === "function") {
        output = join(output, rule.append(self.options));
      }
    });
    return output.replace(/^[\t\r\n]+/, "").replace(/[\t\r\n\s]+$/, "");
  }
  function replacementForNode(node) {
    var rule = this.rules.forNode(node);
    var content = process2.call(this, node);
    var whitespace = node.flankingWhitespace;
    if (whitespace.leading || whitespace.trailing) content = content.trim();
    return whitespace.leading + rule.replacement(content, node, this.options) + whitespace.trailing;
  }
  function join(output, replacement) {
    var s1 = trimTrailingNewlines(output);
    var s2 = trimLeadingNewlines(replacement);
    var nls = Math.max(output.length - s1.length, replacement.length - s2.length);
    var separator = "\n\n".substring(0, nls);
    return s1 + separator + s2;
  }
  function canConvert(input) {
    return input != null && (typeof input === "string" || input.nodeType && (input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11));
  }

  // src/lib/vendor/turndown/postprocess.ts
  function unescapeBracketEscapesInLabel(label) {
    return label.replace(/\\\[/g, "[").replace(/\\\]/g, "]");
  }
  function repairLinkedImageBreaks(markdown) {
    return markdown.replace(
      /\[(\s*!\[(?:\\.|[^\]])*?\]\((?:\\.|[^)])*?\))\s*\]\(/g,
      (_match, inner) => `[${inner.trim()}](`
    );
  }
  function relaxTurndownBracketEscapes(markdown) {
    return markdown.replace(
      /(!?)\[((?:\\.|[^\]])*?)\]\(/g,
      (match, bang, label) => {
        const plain = unescapeBracketEscapesInLabel(label);
        return plain === label ? match : `${bang}[${plain}](`;
      }
    );
  }

  // src/lib/vendor/turndown/turndown.ts
  var TURNDOWN_OPTIONS = {
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
    emDelimiter: "*",
    strongDelimiter: "**",
    linkStyle: "inlined"
  };
  function cleanAttribute2(attribute) {
    return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
  }
  function escapeImageAlt(alt) {
    return alt.replace(/\\/g, "\\\\").replace(/\*/g, "\\*").replace(/_/g, "\\_").replace(/`/g, "\\`");
  }
  function escapeLinkDestination2(destination) {
    const escaped = destination.replace(/([<>()])/g, "\\$1");
    return escaped.includes(" ") ? `<${escaped}>` : escaped;
  }
  function escapeLinkTitle2(title) {
    return title.replace(/"/g, '\\"');
  }
  function createTurndownService() {
    const service = new TurndownService(TURNDOWN_OPTIONS);
    service.addRule("strikethrough", {
      filter: (node) => ["DEL", "S", "STRIKE"].includes(node.nodeName),
      replacement: (content) => `~~${content}~~`
    });
    service.addRule("image", {
      filter: "img",
      replacement: (_content, node) => {
        const element = node;
        const alt = escapeImageAlt(
          sanitizeMarkdownAltText(cleanAttribute2(element.getAttribute("alt")))
        );
        const src = escapeLinkDestination2(element.getAttribute("src") || "");
        const title = cleanAttribute2(element.getAttribute("title"));
        const titlePart = title ? ` "${escapeLinkTitle2(title)}"` : "";
        return src ? `![${alt}](${src}${titlePart})` : "";
      }
    });
    return service;
  }
  var sharedService;
  function getTurndownService() {
    sharedService ??= createTurndownService();
    return sharedService;
  }
  function finalizeMarkdown(markdown) {
    return repairLinkedImageBreaks(relaxTurndownBracketEscapes(markdown));
  }
  function elementToMarkdown(element) {
    return finalizeMarkdown(getTurndownService().turndown(element));
  }

  // src/lib/our/copy/xpath.ts
  function escapeXPathLiteral(value) {
    if (!value.includes('"')) return `"${value}"`;
    if (!value.includes("'")) return `'${value}'`;
    const parts = value.split("'");
    return `concat(${parts.map((part, i) => {
      const chunks = [];
      if (part) chunks.push(`'${part}'`);
      if (i < parts.length - 1) chunks.push(`"'"`);
      return chunks.join(", ");
    }).join(", ")})`;
  }
  function xpathSegment(element) {
    const tag = element.tagName.toLowerCase();
    const parent = element.parentElement;
    if (!parent) return tag;
    let sameTagCount = 0;
    for (const child of parent.children) {
      if (child.tagName === element.tagName) sameTagCount += 1;
    }
    if (sameTagCount <= 1) return tag;
    let index = 1;
    for (const child of parent.children) {
      if (child === element) break;
      if (child.tagName === element.tagName) index += 1;
    }
    return `${tag}[${index}]`;
  }
  function evaluateXPath(xpath, element, doc = element.ownerDocument) {
    try {
      const result = doc.evaluate(
        xpath,
        doc,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue === element;
    } catch {
      return false;
    }
  }
  function getFullXPath(element) {
    const parts = [];
    let node = element;
    while (node) {
      parts.unshift(xpathSegment(node));
      node = node.parentElement;
    }
    return `/${parts.join("/")}`;
  }
  function getXPath(element) {
    const doc = element.ownerDocument;
    if (element.id) {
      const byId = `//*[@id=${escapeXPathLiteral(element.id)}]`;
      if (evaluateXPath(byId, element, doc)) return byId;
    }
    for (const attrName of ["data-testid", "data-test", "data-cy", "data-qa"]) {
      const attr = element.getAttribute(attrName);
      if (!attr) continue;
      const byAttr = `//*[@${attrName}=${escapeXPathLiteral(attr)}]`;
      if (evaluateXPath(byAttr, element, doc)) return byAttr;
    }
    const parts = [];
    let node = element;
    while (node) {
      parts.unshift(xpathSegment(node));
      if (node.id && node !== element) {
        const tail = parts.slice(1).join("/");
        return tail ? `//*[@id=${escapeXPathLiteral(node.id)}]/${tail}` : `//*[@id=${escapeXPathLiteral(node.id)}]`;
      }
      node = node.parentElement;
    }
    return `//${parts.join("/")}`;
  }

  // src/copy/extract.ts
  function getDocumentBaseHref(element) {
    return element.ownerDocument.baseURI || element.ownerDocument.location?.href || "";
  }
  function getPrepareOptions(element, inlineImages, pruneHiddenTableRows = false) {
    return {
      ...pruneHiddenTableRows ? { pruneHiddenTableRows: true } : {},
      baseHref: getDocumentBaseHref(element),
      inlineImages
    };
  }
  async function getFormattedTextHtml(element, inlineImages) {
    const container = await prepareElementForCopy(
      element,
      getPrepareOptions(element, inlineImages, true)
    );
    const html = extractHtmlFromPreparedContainer(element, container);
    return finalizeFormattedHtml(element, html);
  }
  async function getElementMarkdown(element, inlineImages) {
    const prepared = await prepareElementForCopy(
      element,
      getPrepareOptions(element, inlineImages, true)
    );
    return elementToMarkdown(prepared);
  }
  function getOuterHtml(element) {
    if (!element.shadowRoot) {
      return element.outerHTML;
    }
    const clone = element.cloneNode(false);
    const contents = cloneElementForClipboard(element);
    while (contents.firstChild) {
      clone.appendChild(contents.firstChild);
    }
    const wrapper = element.ownerDocument.createElement("div");
    wrapper.appendChild(clone);
    return wrapper.innerHTML;
  }
  async function extractElementCopyText(element, format, inlineImages = "all") {
    switch (format) {
      case "outerHTML":
      case "htmlFile":
        return getOuterHtml(element);
      case "selector":
        return getCssSelector(element);
      case "jsPath":
        return getJsPath(element);
      case "computedStyles":
        return getElementComputedStyles(element);
      case "styles":
        return getElementStyles(element);
      case "xpath":
        return getXPath(element);
      case "fullXPath":
        return getFullXPath(element);
      case "text":
        return serializeFormattedTextCache({
          html: await getFormattedTextHtml(element, inlineImages)
        });
      case "markdown":
      case "markdownFile":
        return await getElementMarkdown(element, inlineImages);
      case "url":
        return element.ownerDocument.location?.href || "";
      default:
        return "";
    }
  }

  // src/settings/format-settings-cache.ts
  var cachedEnabledFormats = defaultEnabledFormats();
  var cachedDefaultAction = null;
  var cachedInlineImagesMode = DEFAULT_INLINE_IMAGES_MODE;
  var cachedFrameLabelStyle = DEFAULT_FRAME_LABEL_STYLE;
  var cachedFrameClickToCopyLabel = t("en").settingsFrameLabelClickToCopy;
  var bound = false;
  var frameLabelStyleChangeListeners = /* @__PURE__ */ new Set();
  function getCachedEnabledFormats() {
    return cachedEnabledFormats;
  }
  function getCachedDefaultAction() {
    return cachedDefaultAction;
  }
  function getCachedInlineImagesMode() {
    return cachedInlineImagesMode;
  }
  function getCachedFrameLabelStyle() {
    return cachedFrameLabelStyle;
  }
  function getCachedFrameClickToCopyLabel() {
    return cachedFrameClickToCopyLabel;
  }
  function subscribeFrameLabelStyleChange(listener) {
    frameLabelStyleChangeListeners.add(listener);
    return () => frameLabelStyleChangeListeners.delete(listener);
  }
  function shouldRefreshFrameLabel(previousStyle, previousClickToCopyLabel) {
    if (previousStyle !== cachedFrameLabelStyle) return true;
    if (cachedFrameLabelStyle !== "click-to-copy") return false;
    return previousClickToCopyLabel !== cachedFrameClickToCopyLabel;
  }
  async function refreshFormatSettingsCache() {
    const previousFrameLabelStyle = cachedFrameLabelStyle;
    const previousClickToCopyLabel = cachedFrameClickToCopyLabel;
    cachedEnabledFormats = await getEnabledFormats();
    const stored = await ensureDefaultActionAllowsComputeImages();
    cachedDefaultAction = isActiveDefaultAction(stored) ? stored : null;
    cachedInlineImagesMode = await getInlineImagesMode();
    cachedFrameLabelStyle = await getFrameLabelStyle();
    const locale = await getLocale();
    cachedFrameClickToCopyLabel = t(locale).settingsFrameLabelClickToCopy;
    if (shouldRefreshFrameLabel(previousFrameLabelStyle, previousClickToCopyLabel)) {
      for (const listener of frameLabelStyleChangeListeners) {
        listener();
      }
    }
  }
  function bindFormatSettingsCache() {
    if (bound) return;
    bound = true;
    void refreshFormatSettingsCache();
    ext.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes[DEVELOPER_TOOLS_ENABLED_KEY] || changes[ENABLED_FORMATS_KEY] || changes[COMPUTE_IMAGES_ENABLED_KEY] || changes[CLIPBOARD_DEFAULT_FORMAT_KEY] || changes[INLINE_IMAGES_KEY] || changes[FRAME_LABEL_STYLE_KEY] || changes[LOCALE_STORAGE_KEY]) {
        void refreshFormatSettingsCache();
      }
    });
  }

  // src/pick-mode/pick-copy-cache.ts
  var SNAPSHOT_PERF_LOCAL_STORAGE_KEY = "ec:perf:snapshot";
  function nowMs(doc) {
    const view = doc.defaultView;
    const perfNow = view?.performance?.now;
    return typeof perfNow === "function" && view ? perfNow.call(view.performance) : Date.now();
  }
  function isSnapshotPerfEnabled(doc) {
    try {
      return doc.defaultView?.localStorage?.getItem(SNAPSHOT_PERF_LOCAL_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }
  function formatMs(ms) {
    return `${ms.toFixed(1)}ms`;
  }
  function tryPushCacheEntry(entries, key, value, doc) {
    if (isPickCopyCacheValueStorable(key, value, doc)) {
      entries.push({ key, value });
    }
  }
  var SNAPSHOT_CACHE_FORMAT_IDS = [
    "url",
    "outerHTML",
    "computedStyles",
    "selector",
    "jsPath",
    "xpath",
    "fullXPath",
    "styles",
    "text",
    "markdown",
    "png",
    "jpeg"
  ];
  var cache = createStringCache();
  async function snapshotPickCopyCache(element, inlineImages = DEFAULT_INLINE_IMAGES_MODE) {
    cache.clear();
    try {
      await clearPickCopyCacheStorage();
    } catch (error) {
      console.warn("[Element Copier] pick copy cache storage clear failed:", error);
    }
    const enabledFormats = getCachedEnabledFormats();
    const entries = [];
    const doc = element.ownerDocument;
    const perfEnabled = isSnapshotPerfEnabled(doc);
    const snapshotStartedAt = perfEnabled ? nowMs(doc) : 0;
    let extractTimeMs = 0;
    let imageTimeMs = 0;
    let storageTimeMs = 0;
    let imageRenderCount = 0;
    let markdownText;
    let outerHtmlText;
    const needsImageSnapshot = enabledFormats.png || enabledFormats.jpeg;
    let screenshotBackground;
    let cachedImages;
    async function ensureScreenshotBackground() {
      if (!needsImageSnapshot || screenshotBackground) return;
      const computedStylesText = await extractElementCopyText(
        element,
        "computedStyles",
        inlineImages
      );
      screenshotBackground = createScreenshotBackgroundSnapshot(element, computedStylesText);
    }
    for (const formatId of SNAPSHOT_CACHE_FORMAT_IDS) {
      if (formatId !== "url" && !enabledFormats[formatId]) continue;
      if (formatId === "markdown" || formatId === "markdownFile") {
        if (markdownText === void 0) {
          markdownText = await extractElementCopyText(element, "markdown", inlineImages);
          tryPushCacheEntry(entries, "markdown", markdownText, doc);
        }
        continue;
      }
      if (formatId === "outerHTML" || formatId === "htmlFile") {
        if (outerHtmlText === void 0) {
          outerHtmlText = await extractElementCopyText(element, "outerHTML", inlineImages);
          tryPushCacheEntry(entries, "outerHTML", outerHtmlText, doc);
        }
        continue;
      }
      if (formatId === "computedStyles") {
        const extractStartedAt2 = perfEnabled ? nowMs(doc) : 0;
        const computedStylesText = await extractElementCopyText(
          element,
          "computedStyles",
          inlineImages
        );
        if (perfEnabled) {
          extractTimeMs += nowMs(doc) - extractStartedAt2;
        }
        tryPushCacheEntry(entries, formatId, computedStylesText, doc);
        if (needsImageSnapshot) {
          screenshotBackground = createScreenshotBackgroundSnapshot(element, computedStylesText);
        }
        continue;
      }
      if (isImageCopyFormat(formatId)) {
        if (!screenshotBackground) {
          await ensureScreenshotBackground();
        }
        if (!screenshotBackground) continue;
        try {
          if (!cachedImages) {
            const imageFormats = [];
            if (enabledFormats.png) imageFormats.push("png");
            if (enabledFormats.jpeg) imageFormats.push("jpeg");
            const imageStartedAt = perfEnabled ? nowMs(doc) : 0;
            cachedImages = await captureElementImages(element, imageFormats, screenshotBackground);
            if (perfEnabled) {
              imageTimeMs += nowMs(doc) - imageStartedAt;
              imageRenderCount += 1;
            }
          }
          const capturedImage = cachedImages[formatId];
          if (capturedImage) {
            tryPushCacheEntry(entries, formatId, capturedImage, doc);
          }
        } catch (error) {
          console.warn("[Element Copier] image snapshot failed:", formatId, error);
        }
        continue;
      }
      const extractStartedAt = perfEnabled ? nowMs(doc) : 0;
      const extracted = await extractElementCopyText(element, formatId, inlineImages);
      if (perfEnabled) {
        extractTimeMs += nowMs(doc) - extractStartedAt;
      }
      tryPushCacheEntry(
        entries,
        formatId,
        extracted,
        doc
      );
    }
    cache.snapshot(entries);
    try {
      const storageStartedAt = perfEnabled ? nowMs(doc) : 0;
      await writePickCopyCacheIndex(entries.map((entry) => entry.key));
      if (entries.length === 0) {
        if (perfEnabled) {
          storageTimeMs += nowMs(doc) - storageStartedAt;
        }
        return;
      }
      const hostname = doc.location?.hostname?.trim() || "unknown";
      await writePickCopyMetaToStorage({
        tagName: element.tagName.toLowerCase(),
        hostname
      });
      await writePickCopyCacheToStorage(entries, doc);
      if (perfEnabled) {
        storageTimeMs += nowMs(doc) - storageStartedAt;
      }
    } catch (error) {
      console.warn("[Element Copier] pick copy cache storage write failed:", error);
    } finally {
      if (perfEnabled) {
        const totalMs = nowMs(doc) - snapshotStartedAt;
        console.info(
          "[Element Copier][perf] snapshot",
          {
            total: formatMs(totalMs),
            extract: formatMs(extractTimeMs),
            images: formatMs(imageTimeMs),
            storage: formatMs(storageTimeMs),
            imageRenders: imageRenderCount,
            cachedEntries: entries.length,
            enabledPng: Boolean(enabledFormats.png),
            enabledJpeg: Boolean(enabledFormats.jpeg)
          }
        );
      }
    }
  }
  function getCachedCopyText(formatId) {
    if (formatId === "markdownFile") {
      return cache.get("markdown");
    }
    if (formatId === "htmlFile") {
      return cache.get("outerHTML");
    }
    return cache.get(formatId);
  }

  // src/lib/our/element-under-cursor.ts
  var MIN_IFRAME_PICK_PX = 4;
  function isPointInElement(el, x, y) {
    const rect = el.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }
  function listIframesWithin(root2, isOurNode) {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const scan = (node) => {
      for (const el of Array.from(node.querySelectorAll("iframe"))) {
        if (el instanceof HTMLIFrameElement && !seen.has(el) && !isOurNode(el)) {
          seen.add(el);
          out.push(el);
        }
      }
      for (const el of Array.from(node.querySelectorAll("*"))) {
        if (el instanceof Element && el.shadowRoot) {
          scan(el.shadowRoot);
        }
      }
    };
    scan(root2);
    return out;
  }
  function isIframeHitTestable(iframe) {
    if (iframe.hasAttribute("hidden")) return false;
    const style = getComputedStyle(iframe);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (parseFloat(style.opacity) <= 0) return false;
    const rect = iframe.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }
  function isSignificantIframe(iframe) {
    const rect = iframe.getBoundingClientRect();
    return rect.width >= MIN_IFRAME_PICK_PX && rect.height >= MIN_IFRAME_PICK_PX;
  }
  function iframeContainsPoint(iframe, x, y) {
    const rect = iframe.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }
  function findIframeAtPoint(x, y, options) {
    let best = null;
    let bestArea = Infinity;
    for (const node of listIframesWithin(document, options.isOurNode)) {
      if (!isIframeHitTestable(node) || !isSignificantIframe(node) || !iframeContainsPoint(node, x, y)) {
        continue;
      }
      const rect = node.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area < bestArea) {
        bestArea = area;
        best = node;
      }
    }
    return best;
  }
  function pickElementUnderCursor(x, y, options) {
    const iframe = findIframeAtPoint(x, y, options);
    if (iframe) return iframe;
    const stack = document.elementsFromPoint(x, y);
    for (const node of stack) {
      if (!(node instanceof Element)) continue;
      if (options.isOurNode(node)) continue;
      if (node === document.documentElement || node === document.body) continue;
      return node;
    }
    return null;
  }

  // src/lib/our/highlight/classes.ts
  function createHighlightUiClasses(prefix) {
    return {
      highlightTarget: `${prefix}-highlight`,
      highlightFill: `${prefix}-highlight-fill`,
      highlightFrame: `${prefix}-highlight-frame`,
      elementLabel: `${prefix}-element-label`
    };
  }

  // src/lib/our/highlight/page-styles.ts
  function buildGenericHighlightPageCss(classes) {
    return `
.${classes.highlightTarget} {
  cursor: crosshair !important;
}
iframe {
  pointer-events: none !important;
  cursor: crosshair !important;
}
iframe.${classes.highlightFill} {
  /* Approximate highlight fill over varied iframe content (not exact rgba). */
  filter: sepia(0.65) saturate(11) hue-rotate(342deg) brightness(0.88) !important;
}
`;
  }
  function ensurePageHighlightStyles(config) {
    if (document.getElementById(config.styleId)) return;
    const style = document.createElement("style");
    style.id = config.styleId;
    style.textContent = config.pageCss;
    document.documentElement.appendChild(style);
  }
  function removePageHighlightStyles(styleId) {
    document.getElementById(styleId)?.remove();
  }

  // src/lib/our/highlight/visual.ts
  var HIGHLIGHT_FRAME_INSET = 2;
  var ElementHighlightVisual = class {
    constructor(host, pageStyles) {
      this.host = host;
      this.pageStyles = pageStyles;
    }
    elementLabelEl = null;
    highlightFrameEl = null;
    highlightTransitionToken = 0;
    highlightTransitionCleanup = null;
    bindExistingElements(elementLabelEl, highlightFrameEl) {
      this.elementLabelEl = elementLabelEl;
      this.highlightFrameEl = highlightFrameEl;
    }
    installPageStyles() {
      ensurePageHighlightStyles(this.pageStyles);
    }
    uninstallPageStyles() {
      removePageHighlightStyles(this.pageStyles.styleId);
    }
    clear() {
      this.cancelHighlightTransition();
      this.clearTargetMarkers();
      this.hideHighlightFrame();
      this.hideElementLabel();
    }
    syncElementLabel(target) {
      if (!this.host.getElementLabelEnabled() || !target) {
        this.hideElementLabel();
        return;
      }
      const label = this.ensureElementLabel();
      label.textContent = this.host.formatElementLabel(target);
      label.style.display = "block";
      this.syncElementLabelPosition(target);
    }
    render(target, options) {
      const { animateFrom } = options;
      const targetClass = this.host.classes.highlightTarget;
      this.cancelHighlightTransition();
      this.hideElementLabel();
      const animate = animateFrom !== null && animateFrom.isConnected && animateFrom !== target;
      if (!animate) {
        this.showHighlightFrameFor(target);
        target.classList.add(targetClass);
        this.syncIframeFill(target);
        this.syncElementLabel(target);
        return;
      }
      this.runHighlightTransition(animateFrom, target, options.isStillTarget);
      this.syncElementLabel(target);
    }
    refresh(target) {
      this.syncIframeFill(target);
      this.syncHighlightOverlay(target);
      this.syncElementLabel(target);
    }
    removeTargetClass(target) {
      target.classList.remove(this.host.classes.highlightTarget);
    }
    clearTargetMarkers() {
      this.clearIframeFill();
    }
    clearIframeFill() {
      const fillClass = this.host.classes.highlightFill;
      for (const node of Array.from(
        document.querySelectorAll(`iframe.${fillClass}`)
      )) {
        node.classList.remove(fillClass);
      }
    }
    rectOverlapArea(a, b) {
      const left = Math.max(a.left, b.left);
      const right = Math.min(a.right, b.right);
      const top = Math.max(a.top, b.top);
      const bottom = Math.min(a.bottom, b.bottom);
      if (right <= left || bottom <= top) return 0;
      return (right - left) * (bottom - top);
    }
    collectIframeFillTargets(target) {
      if (target instanceof HTMLIFrameElement) {
        return isIframeHitTestable(target) && isSignificantIframe(target) ? [target] : [];
      }
      const out = [];
      const targetRect = target.getBoundingClientRect();
      for (const node of listIframesWithin(target, (n) => this.host.isOurNode(n))) {
        if (!isIframeHitTestable(node) || !isSignificantIframe(node)) {
          continue;
        }
        const rect = node.getBoundingClientRect();
        const iframeArea = rect.width * rect.height;
        if (iframeArea <= 0) continue;
        if (this.rectOverlapArea(targetRect, rect) / iframeArea >= 0.5) {
          out.push(node);
        }
      }
      return out;
    }
    syncIframeFill(target) {
      const fillClass = this.host.classes.highlightFill;
      this.clearIframeFill();
      for (const iframe of this.collectIframeFillTargets(target)) {
        iframe.classList.add(fillClass);
      }
    }
    cancelHighlightTransition() {
      this.highlightTransitionToken += 1;
      this.highlightTransitionCleanup?.();
      this.highlightTransitionCleanup = null;
    }
    ensureHighlightFrame() {
      if (!this.highlightFrameEl) {
        const el = document.createElement("div");
        el.className = this.host.classes.highlightFrame;
        el.setAttribute(this.host.hostAttr, "true");
        el.setAttribute("aria-hidden", "true");
        this.host.shadow.insertBefore(el, this.host.shadow.firstChild);
        this.highlightFrameEl = el;
      }
      return this.highlightFrameEl;
    }
    hideHighlightFrame() {
      if (!this.highlightFrameEl) return;
      this.highlightFrameEl.style.display = "none";
    }
    showHighlightFrameFor(target) {
      const frame = this.ensureHighlightFrame();
      frame.style.display = "block";
      this.applyHighlightFrame(frame, target);
    }
    syncHighlightFrame(target) {
      const frame = this.highlightFrameEl;
      if (!frame || frame.style.display === "none") return;
      this.applyHighlightFrame(frame, target);
    }
    syncHighlightOverlay(target) {
      this.syncHighlightFrame(target);
      this.syncElementLabelPosition(target);
    }
    applyHighlightFrame(frame, target) {
      const rect = target.getBoundingClientRect();
      frame.style.top = `${rect.top}px`;
      frame.style.left = `${rect.left}px`;
      frame.style.width = `${rect.width}px`;
      frame.style.height = `${rect.height}px`;
      const style = getComputedStyle(target);
      frame.style.borderRadius = style.borderRadius;
      const clipPath = style.clipPath;
      frame.style.clipPath = clipPath && clipPath !== "none" ? clipPath : "";
    }
    runHighlightTransition(from, to, isStillTarget) {
      const frame = this.ensureHighlightFrame();
      const targetClass = this.host.classes.highlightTarget;
      const token = this.highlightTransitionToken;
      let done = false;
      if (frame.style.display !== "block") {
        frame.classList.add("is-instant");
        frame.style.display = "block";
        this.applyHighlightFrame(frame, from);
        frame.classList.remove("is-instant");
        void frame.offsetWidth;
      } else {
        frame.style.display = "block";
      }
      this.applyHighlightFrame(frame, to);
      const finish = () => {
        if (done) return;
        if (token !== this.highlightTransitionToken) return;
        if (isStillTarget && !isStillTarget(to)) return;
        done = true;
        this.highlightTransitionCleanup?.();
        this.highlightTransitionCleanup = null;
        this.showHighlightFrameFor(to);
        to.classList.add(targetClass);
        this.syncIframeFill(to);
        this.syncElementLabel(to);
      };
      const onTransitionEnd = (event) => {
        if (event.target !== frame) return;
        if (event.propertyName !== "width") return;
        finish();
      };
      frame.addEventListener("transitionend", onTransitionEnd);
      const timeoutId = window.setTimeout(finish, 225);
      this.highlightTransitionCleanup = () => {
        frame.removeEventListener("transitionend", onTransitionEnd);
        window.clearTimeout(timeoutId);
      };
    }
    ensureElementLabel() {
      if (!this.elementLabelEl) {
        const el = document.createElement("div");
        el.className = this.host.classes.elementLabel;
        el.setAttribute(this.host.hostAttr, "true");
        el.setAttribute("aria-hidden", "true");
        this.host.shadow.appendChild(el);
        this.elementLabelEl = el;
      }
      return this.elementLabelEl;
    }
    hideElementLabel() {
      if (!this.elementLabelEl) return;
      this.elementLabelEl.style.display = "none";
    }
    syncElementLabelPosition(target) {
      const el = this.elementLabelEl;
      if (!el || el.style.display === "none") return;
      const rect = target.getBoundingClientRect();
      const frameTop = rect.top - HIGHLIGHT_FRAME_INSET;
      const frameLeft = rect.left - HIGHLIGHT_FRAME_INSET;
      el.style.top = `${frameTop}px`;
      el.style.left = `${frameLeft}px`;
    }
  };

  // src/lib/our/highlight/selector.ts
  var HighlightSystem = class {
    highlighted = null;
    visual;
    host;
    pageStyles;
    domMutationObserver = null;
    lastPointerX = -1;
    lastPointerY = -1;
    highlightRefreshRaf = 0;
    boundMove;
    boundPointerMove;
    boundScroll;
    boundResize;
    constructor(options) {
      this.host = options.host;
      this.pageStyles = options.pageStyles;
      this.visual = new ElementHighlightVisual(this.host, this.pageStyles);
      this.boundMove = (e) => this.updateHighlightAt(e.clientX, e.clientY);
      this.boundPointerMove = (e) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        this.updateHighlightAt(e.clientX, e.clientY);
      };
      this.boundScroll = () => this.scheduleHighlightRefresh();
      this.boundResize = () => this.scheduleHighlightRefresh();
    }
    bindExistingElements(elementLabelEl, highlightFrameEl) {
      this.visual.bindExistingElements(elementLabelEl, highlightFrameEl);
    }
    activate() {
      this.visual.installPageStyles();
      this.lastPointerX = -1;
      this.lastPointerY = -1;
      this.domMutationObserver = new MutationObserver(
        () => this.scheduleHighlightRefresh()
      );
      this.domMutationObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class", "width", "height", "hidden"]
      });
      document.addEventListener("mousemove", this.boundMove, true);
      document.addEventListener("pointermove", this.boundPointerMove, true);
      document.addEventListener("scroll", this.boundScroll, true);
      window.addEventListener("resize", this.boundResize);
    }
    deactivate() {
      document.removeEventListener("mousemove", this.boundMove, true);
      document.removeEventListener("pointermove", this.boundPointerMove, true);
      document.removeEventListener("scroll", this.boundScroll, true);
      window.removeEventListener("resize", this.boundResize);
      this.domMutationObserver?.disconnect();
      this.domMutationObserver = null;
      if (this.highlightRefreshRaf) {
        cancelAnimationFrame(this.highlightRefreshRaf);
        this.highlightRefreshRaf = 0;
      }
      this.lastPointerX = -1;
      this.lastPointerY = -1;
      this.clear();
      removePageHighlightStyles(this.pageStyles.styleId);
    }
    getHighlighted() {
      return this.highlighted;
    }
    clear() {
      if (this.highlighted) {
        this.visual.removeTargetClass(this.highlighted);
        this.highlighted = null;
      }
      this.visual.clear();
    }
    clearIfTarget(target) {
      if (this.highlighted === target) {
        this.clear();
      }
    }
    syncElementLabel() {
      this.visual.syncElementLabel(this.highlighted);
    }
    updateHighlightAt(x, y) {
      this.lastPointerX = x;
      this.lastPointerY = y;
      const el = pickElementUnderCursor(x, y, {
        isOurNode: (node) => this.host.isOurNode(node)
      });
      if (!el) {
        this.clear();
        return;
      }
      this.setHighlighted(el);
    }
    scheduleHighlightRefresh() {
      if (this.highlightRefreshRaf) return;
      this.highlightRefreshRaf = requestAnimationFrame(() => {
        this.highlightRefreshRaf = 0;
        if (this.lastPointerX < 0) return;
        this.updateHighlightAt(this.lastPointerX, this.lastPointerY);
      });
    }
    setHighlighted(el) {
      if (this.highlighted === el) {
        if (el) this.visual.refresh(el);
        return;
      }
      const prev = this.highlighted;
      if (!el) {
        if (prev) this.visual.removeTargetClass(prev);
        this.highlighted = null;
        this.visual.clear();
        return;
      }
      if (prev) this.visual.removeTargetClass(prev);
      this.highlighted = el;
      this.visual.render(el, {
        animateFrom: prev,
        isStillTarget: (target) => this.highlighted === target
      });
    }
  };

  // src/pick-mode/element-label.ts
  function formatTagIdClassLabel(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id.trim();
    if (id) return `${tag}#${id}`;
    const classes = Array.from(el.classList).map((c) => c.trim()).filter(Boolean);
    if (classes.length > 0) {
      return `${tag}.${classes.slice(0, 3).join(".")}`;
    }
    return tag;
  }
  function formatFrameElementLabel(el, style, clickToCopyLabel) {
    switch (style) {
      case "none":
        return "";
      case "click-to-copy":
        return clickToCopyLabel;
      case "tag-id-class":
        return formatTagIdClassLabel(el);
      case "selector":
        return getCssSelector(el);
      case "full-xpath":
        return getFullXPath(el);
    }
  }

  // src/pick-mode/constants.ts
  var PICK_ROOT_ID = "element-copier-pick-root";
  var PICK_HOST_ATTR = "data-element-copier-pick";

  // src/pick-mode/page-styles.ts
  var HIGHLIGHT_STYLE_ID = "element-copier-highlight-style";
  var HIGHLIGHT_UI = createHighlightUiClasses("ec");
  var HIGHLIGHT_PAGE_CSS = buildGenericHighlightPageCss(HIGHLIGHT_UI);
  var COPIER_HIGHLIGHT_PAGE_STYLE = {
    styleId: HIGHLIGHT_STYLE_ID,
    pageCss: HIGHLIGHT_PAGE_CSS
  };

  // src/pick-mode/pick-ui.ts
  var CopierPickUI = class {
    host;
    shadow;
    highlight;
    onPick;
    boundClick;
    unsubscribeFrameLabelStyle;
    constructor(onPick) {
      this.onPick = onPick;
      this.boundClick = (e) => this.handleClick(e);
      const existing = document.getElementById(PICK_ROOT_ID);
      if (existing?.isConnected) {
        this.host = existing;
        this.shadow = existing.shadowRoot ?? existing.attachShadow({ mode: "open" });
      } else {
        existing?.remove();
        const root2 = document.documentElement ?? document.body;
        if (!root2) {
          throw new Error("document has no mount root");
        }
        this.host = document.createElement("div");
        this.host.id = PICK_ROOT_ID;
        this.host.setAttribute(PICK_HOST_ATTR, "true");
        this.host.style.cssText = "position:fixed;inset:0;z-index:2147483645;pointer-events:none;";
        root2.appendChild(this.host);
        this.shadow = this.host.attachShadow({ mode: "open" });
      }
      let style = this.shadow.querySelector("style");
      if (!style) {
        style = document.createElement("style");
        this.shadow.appendChild(style);
      }
      style.textContent = ":host {\n  all: initial;\n  position: fixed;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  pointer-events: none;\n  z-index: 2147483645;\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;\n  font-size: 14px;\n  line-height: 1.3;\n  color: #fff;\n}\n\n*,\n*::before,\n*::after {\n  box-sizing: border-box;\n}\n\n@keyframes ec-highlight-pulse {\n  0%,\n  100% {\n    outline-color: rgba(1, 34, 146, 0.95);\n    box-shadow:\n      0 0 10px 2px rgba(1, 34, 146, 0.45),\n      0 0 20px 6px rgba(1, 34, 146, 0.22);\n  }\n  50% {\n    outline-color: rgba(1, 34, 146, 0.75);\n    box-shadow:\n      0 0 14px 4px rgba(1, 34, 146, 0.55),\n      0 0 28px 10px rgba(1, 34, 146, 0.38);\n  }\n}\n\n.ec-highlight-frame {\n  position: absolute;\n  z-index: 0;\n  display: none;\n  pointer-events: none;\n  box-sizing: border-box;\n  background: rgba(1, 34, 146, 0.18);\n  outline-width: 1px;\n  outline-style: solid;\n  outline-offset: 2px;\n  box-shadow:\n    0 0 10px 2px rgba(1, 34, 146, 0.45),\n    0 0 20px 6px rgba(1, 34, 146, 0.22);\n  animation: ec-highlight-pulse 2s ease-in-out infinite;\n  transition:\n    top 0.15s ease,\n    left 0.15s ease,\n    width 0.15s ease,\n    height 0.15s ease,\n    border-radius 0.15s ease;\n}\n\n.ec-highlight-frame.is-instant {\n  transition: none;\n}\n\n.ec-element-label {\n  position: absolute;\n  z-index: 1;\n  display: none;\n  pointer-events: none;\n  margin: 0;\n  padding: 0.15rem 0.35rem;\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;\n  font-size: 0.68rem;\n  font-weight: 600;\n  line-height: 1.2;\n  white-space: nowrap;\n  color: #fff;\n  border-radius: 0.25rem;\n  background: rgba(1, 34, 146, 0.96);\n  border: 1px solid rgba(255, 255, 255, 0.38);\n  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.18);\n  transform: translateY(-100%);\n}\n";
      const existingLabel = this.shadow.querySelector(".ec-element-label");
      const existingFrame = this.shadow.querySelector(".ec-highlight-frame");
      this.highlight = new HighlightSystem({
        host: {
          shadow: this.shadow,
          isOurNode: (node) => this.isOurNode(node),
          getElementLabelEnabled: () => getCachedFrameLabelStyle() !== "none",
          formatElementLabel: (target) => formatFrameElementLabel(
            target,
            getCachedFrameLabelStyle(),
            getCachedFrameClickToCopyLabel()
          ),
          hostAttr: PICK_HOST_ATTR,
          classes: HIGHLIGHT_UI
        },
        pageStyles: COPIER_HIGHLIGHT_PAGE_STYLE
      });
      this.highlight.bindExistingElements(
        existingLabel instanceof HTMLElement ? existingLabel : null,
        existingFrame instanceof HTMLElement ? existingFrame : null
      );
      this.unsubscribeFrameLabelStyle = subscribeFrameLabelStyleChange(() => {
        this.syncFrameLabel();
      });
    }
    syncFrameLabel() {
      this.highlight.syncElementLabel();
    }
    isHostConnected() {
      return this.host.isConnected;
    }
    isOurNode(node) {
      if (!node) return true;
      if (node === this.host || this.host.contains(node)) return true;
      return !!node.closest?.(`[${PICK_HOST_ATTR}]`);
    }
    activate() {
      this.highlight.activate();
      document.addEventListener("click", this.boundClick, true);
    }
    deactivate() {
      document.removeEventListener("click", this.boundClick, true);
      this.highlight.deactivate();
    }
    dispose() {
      this.unsubscribeFrameLabelStyle();
      this.deactivate();
    }
    handleClick(e) {
      const pickOptions = { isOurNode: (node) => this.isOurNode(node) };
      const iframeAtPoint = findIframeAtPoint(e.clientX, e.clientY, pickOptions);
      const target = iframeAtPoint ?? this.highlight.getHighlighted();
      if (!target) return;
      const hit = e.target;
      if (hit instanceof Element && this.isOurNode(hit)) return;
      const onTarget = hit === target || hit instanceof Element && target.contains(hit) || isPointInElement(target, e.clientX, e.clientY);
      if (!onTarget) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.onPick(target);
    }
  };
  function notifyElementPicked(element) {
    sendToBackground({
      type: "ELEMENT_PICKED",
      tagName: element.tagName,
      id: element.id,
      className: element.className
    });
  }

  // src/content.ts
  function getState() {
    if (!window.__ecState) {
      window.__ecState = { active: false, pick: null, pickInit: null };
    }
    return window.__ecState;
  }
  function resetState(state2) {
    unmountCopierContentHotkeys();
    state2.active = false;
    tearDownPick(state2);
  }
  function notifyBackgroundActive(isActive) {
    sendToBackground({ type: "ACTIVE_CHANGED", active: isActive });
  }
  function requestToggle() {
    sendToBackground({ type: "TOGGLE_REQUEST" });
  }
  function requestCopyPage() {
    sendToBackground({ type: "REQUEST_COPY_PAGE" });
  }
  function requestCopiedPanel(formatId, panelAction) {
    sendToBackground({ type: "OPEN_PANEL", tab: "copied", formatId, panelAction });
  }
  function notifyPickCopyFlowStarted(requestId, startedAtMs) {
    sendToBackground({ type: "PICK_COPY_FLOW_STARTED", requestId, startedAtMs });
  }
  function notifyPickCopyFlowFinished(requestId) {
    sendToBackground({ type: "PICK_COPY_FLOW_FINISHED", requestId });
  }
  function waitForDomRoot(timeoutMs = 5e3) {
    if (document.documentElement ?? document.body) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;
      const done = () => {
        observer.disconnect();
        resolve();
      };
      const observer = new MutationObserver(() => {
        if (document.documentElement ?? document.body) {
          done();
        } else if (Date.now() >= deadline) {
          done();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
      if (document.documentElement ?? document.body) {
        done();
      }
    });
  }
  function waitForNextFrame() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }
  function tearDownPick(state2) {
    state2.pick?.dispose();
    state2.pick = null;
    state2.pickInit = null;
    document.getElementById(PICK_ROOT_ID)?.remove();
  }
  function isPickRootConnected() {
    return document.getElementById(PICK_ROOT_ID)?.isConnected === true;
  }
  function attachMessageHandler(state2) {
    const prev = window.__ecMessageHandler;
    if (prev) {
      try {
        ext.runtime.onMessage.removeListener(prev);
      } catch {
      }
    }
    const deactivate = () => {
      const wasActive = state2.active;
      state2.active = false;
      unmountCopierContentHotkeys();
      tearDownPick(state2);
      if (wasActive) {
        notifyBackgroundActive(false);
      }
    };
    let pickCopyInFlight = false;
    let pickCopyFlowSeq = 0;
    const runPickCopyFlow = async (element) => {
      if (pickCopyInFlight) return;
      pickCopyInFlight = true;
      const requestId = `pick-copy-${Date.now()}-${++pickCopyFlowSeq}`;
      try {
        notifyPickCopyFlowStarted(requestId, Date.now());
        deactivate();
        await refreshFormatSettingsCache();
        await snapshotPickCopyCache(element, getCachedInlineImagesMode());
        const defaultAction = getCachedDefaultAction();
        let copiedFormatId = null;
        let panelAction;
        if (defaultAction !== null) {
          const { formatId, action } = defaultAction;
          const defaultText = getCachedCopyText(formatId);
          if (defaultText !== void 0) {
            if (action === "copy") {
              const copied = await copyToClipboardForFormat(formatId, defaultText);
              if (copied) {
                copiedFormatId = formatId;
                panelAction = "copy";
              } else {
                console.warn("[Element Copier] clipboard copy failed");
              }
            } else {
              const meta = await readPickCopyMetaFromStorage();
              const saved = downloadTextAsFile(formatId, defaultText, meta);
              if (saved) {
                copiedFormatId = formatId;
                panelAction = "download";
              } else {
                console.warn("[Element Copier] default download failed");
              }
            }
          } else {
            console.warn("[Element Copier] default format not cached (disabled?)");
          }
        }
        notifyElementPicked(element);
        requestCopiedPanel(copiedFormatId, panelAction);
      } finally {
        notifyPickCopyFlowFinished(requestId);
        pickCopyInFlight = false;
      }
    };
    const handleElementPicked = async (element) => {
      if (!state2.active) return;
      await runPickCopyFlow(element);
    };
    const ensurePick = async () => {
      if (state2.pick?.isHostConnected() && isPickRootConnected()) {
        return state2.pick;
      }
      tearDownPick(state2);
      if (!state2.pickInit) {
        state2.pickInit = (async () => {
          await waitForDomRoot();
          await waitForNextFrame();
          const pick = new CopierPickUI((element) => {
            void handleElementPicked(element);
          });
          state2.pick = pick;
          return pick;
        })();
      }
      try {
        return await state2.pickInit;
      } catch (error) {
        state2.pickInit = null;
        throw error;
      }
    };
    const hotkeysHost = {
      isActive: () => state2.active,
      deactivate
    };
    const activate = async () => {
      if (typeof window !== "undefined" && window.top !== window) return false;
      if (pickCopyInFlight) {
        notifyBackgroundActive(false);
        return true;
      }
      if (state2.active) {
        if (state2.pick?.isHostConnected() && isPickRootConnected()) {
          state2.pick.activate();
          mountCopierContentHotkeys(hotkeysHost);
          notifyBackgroundActive(true);
          return true;
        }
        state2.active = false;
        tearDownPick(state2);
      }
      try {
        await refreshFormatSettingsCache();
        const pick = await ensurePick();
        state2.active = true;
        mountCopierContentHotkeys(hotkeysHost);
        pick.activate();
        const ok = pick.isHostConnected() && isPickRootConnected();
        if (!ok) {
          deactivate();
          return false;
        }
        notifyBackgroundActive(true);
        return true;
      } catch (err) {
        console.warn("[Element Copier] activate failed:", err);
        deactivate();
        return false;
      }
    };
    const handler = (message, _sender, sendResponse) => {
      if (message.type === "SET_ACTIVE") {
        if (typeof window !== "undefined" && window.top !== window) {
          return;
        }
        if (message.active) {
          void activate().then((ok) => sendResponse({ ok }));
          return true;
        }
        deactivate();
        return;
      }
      if (message.type === "GET_PICK_COPY_TEXT") {
        if (typeof window !== "undefined" && window.top !== window) {
          sendResponse({ ok: false });
          return;
        }
        const text = getCachedCopyText(message.formatId);
        if (text === void 0) {
          sendResponse({ ok: false });
          return;
        }
        sendResponse({ ok: true, text });
        return;
      }
      if (message.type === "SET_POPUP_TAB") {
        if (typeof window !== "undefined" && window.top !== window) {
          sendResponse({ ok: false });
          return;
        }
        if (!isPanelPopupPage(location.href) || isPanelTabMode()) {
          sendResponse({ ok: false });
          return;
        }
        void showMountedPopupTab(message.tab).then((ok) => sendResponse({ ok }));
        return true;
      }
      if (message.type === "COPY_PAGE") {
        if (typeof window !== "undefined" && window.top !== window) {
          sendResponse({ ok: false });
          return;
        }
        const root2 = document.documentElement;
        if (!root2) {
          sendResponse({ ok: false });
          return;
        }
        void runPickCopyFlow(root2).then(() => sendResponse({ ok: true }));
        return true;
      }
    };
    window.__ecMessageHandler = handler;
    ext.runtime.onMessage.addListener(handler);
  }
  var state = getState();
  var runtimeId = ext.runtime.id;
  if (window.__ecRuntimeId !== void 0 && window.__ecRuntimeId !== runtimeId) {
    resetState(state);
  }
  window.__ecRuntimeId = runtimeId;
  registerDocumentOperabilityProbeListener();
  bindFormatSettingsCache();
  attachMessageHandler(state);
  registerCopierStartHotkey(requestToggle, requestCopyPage);
  void bootstrapPanelTabPageIfNeeded();
  void bootstrapPanelPopupPageIfNeeded();
})();
