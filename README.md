# ELEMENT COPIER

=-=-=-=-=-=-=-=-= | [DE](./READMIES/DE.md) | EN | [ES](./READMIES/ES.md) | [FR](./READMIES/FR.md) | [RU](./READMIES/RU.md) | [中文](./READMIES/ZH.md) | [عربي](./READMIES/AR.md) | =-=-=-=-=-=-=-=-=

## INSTALLATION

### Stores

- Chrome https://chromewebstore.google.com/detail/element-copier/gdcdnijkedjdjighmalgialikcgkibel
- Firefox https://addons.mozilla.org/firefox/addon/element-copier/ (under moderation)

### Development mode

Load the entire [`extension`](./extension) directory as an unpacked extension.

## DESCRIPTION

Copy and download content from web pages quickly in a convenient format.

Element Copier can process an entire page or a specific element and prepare the result in multiple formats at once. The latest copied content remains available for every enabled format.

## KEY FEATURES

- Copy an entire page or a specific element
- Convert content into multiple formats at once
- Keep the latest copied content for all enabled formats
- Copy content to the clipboard or download it as a file
- Use a configurable default action for faster repeated copying
- Keyboard shortcuts
- Light and dark themes
- Flexible settings

## PRIVACY

- No data collection
- No tracking
- No network requests
- Page content is processed locally in the browser

## SUPPORTED FORMATS

- Rich text for pasting into Google Docs and Word
- Images:
   - PNG
   - JPEG
- Markdown
- HTML
- Developer and testing formats:
   - Selector
   - JS path
   - XPath
   - Full XPath
   - Declared styles
   - Computed styles

## INTERFACE LANGUAGES

- English
- Russian
- Spanish
- French
- German
- Simplified Chinese
- Arabic

## USAGE

U = User
E = Extension

1. U starts E by clicking its button in the browser toolbar
2. E opens a window:
   - If the cache is empty, E opens the START window
   - If the cache is not empty, E opens the COPIED window
3. U clicks START or START OVER
4. U hovers over an element
5. E highlights the element
6. U clicks the element
7. E performs all of the following:
   - Saves data according to the settings
   - Opens a window with information about the result
   - Stops element selection mode

See [all user paths](./SPEC/user-path.md) for keyboard shortcuts, cache behavior, rich-text copying, and actions on copied content.

## PRODUCT NOTES

- Rich-text formatting is designed to produce a better result than basic copy and paste
- Keyboard shortcuts combined with a default action reduce the number of steps for repeated copying
- Developer formats make common inspection data available without opening DevTools
- Markdown processing preserves layout, links, and content images where possible, including converted SVG images

## LIMITATIONS

- **Iframe selection differs** from the selection of other elements:
   - The iframe is selected as a whole
      - This is due to a platform limitation
      - Injecting into the iframe itself is considered undesirable
   - The selection looks visually different
      - This is due to different event handlers
      - It does not affect functionality
      - Unifying the selection would provide no functional benefit
- **Large pages may take some time to process:**
   - Processing speed is limited by third-party libraries
   - The libraries are used unchanged through a wrapper
   - This is an intentional design decision
   - Image generation and saving can be disabled in settings
   - Without image processing, even very large pages are processed in a fraction of a second
- **Opening the result popup may be interrupted:**
   - The browser may open another popup with a higher priority
   - This does not affect extension functionality
   - Processes already started will still be completed
- **Small-image handling in Markdown is optional:**
   - Some use cases require collecting all small images
   - Other use cases require excluding them
   - The extension cannot predict the user's goal
   - This behavior is controlled by a separate setting

## LICENSE

[MIT License](./LICENSE)
