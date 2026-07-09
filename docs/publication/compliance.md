# Element Copier — Chrome Web Store compliance

## Single purpose

Element Copier has one purpose: to let the user copy or download content from the web page they are viewing—either the whole page or a chosen element—in formats they select (for example rich text, Markdown, HTML, images, or developer-oriented selectors and paths). All extraction and conversion run locally in the browser; the extension does not browse the web on its own, show unrelated UI, or collect or transmit page data to any server.

---

## storage

The `storage` permission is used only to save the user’s preferences and short-lived session state on the device—such as theme, language, keyboard-shortcut options, enabled copy formats, panel state, and the most recent copy results per format—so settings persist between browser sessions and the copy panel can show the last result without asking the user to copy again.

---

## unlimitedStorage

The `unlimitedStorage` permission is needed because copied content—especially multi-format output, formatted text, HTML fragments, and image data—can exceed Chrome’s default `storage.local` quota when the user copies large or rich elements; it allows those larger last-copy caches to be kept locally until the user clears them or copies again, without failing silently due to quota limits.

---

## scripting

The `scripting` permission is used solely to inject the extension’s own `content.js` into the active tab when the user turns on copy mode or runs a copy action and the script is not already running in that frame (for example on certain pages or embedded frames), so pick-mode highlighting, element selection, and format extraction can work on the page the user is interacting with.

---

## activeTab

The `activeTab` permission limits access to the tab the user is currently using when they invoke the extension—by clicking the toolbar icon, using a registered keyboard command, or choosing an item from the extension’s context menu—so the extension can read the DOM of that page only at user request to perform copy or download, without broad background access to tabs the user has not engaged with.

---

## contextMenus

The `contextMenus` permission registers menu items on the extension toolbar button (browser action) so the user can open the start or copied panel, settings, shortcuts, or about screen from a right-click on the icon; menus are rebuilt when locale or copy state changes and do not add items to unrelated page context menus.

---

## Host permission

Host access (`<all_urls>` via the registered content script) is required because users can copy from any website they open, and the extension must load its page-side code on that origin to support element picking, keyboard shortcuts, and format extraction in the main document and embedded frames (`all_frames`); the script does not run network requests, does not access page data until the user enables copy mode or triggers a copy action, and never sends page content off the device.
