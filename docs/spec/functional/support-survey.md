# SUPPORT SURVEY

---

## Common logic

- Keep one cumulative successful action counter that never resets: successful copies from the web page to the extension
- Keep a survey action anchor: the successful action counter value from which the next survey threshold is calculated
- Keep the survey action threshold as a configurable value, not as a fixed part of the logic. It is `3` for development and testing and will be `25` for the product release; the value may be changed later.
- Show the survey only when the successful action counter reaches or crosses the survey action anchor plus the configured survey action threshold
- Do not show the survey if any condition is true:
   - The user previously selected "Never ask"
   - The user already clicked "Star on GitHub"
   - The user already clicked "Rate in store"
- The survey may be shown again after a new threshold crossing from the survey action anchor; neither cumulative counter is reset
- Do not show the survey earlier than 60 days after the previous survey display
- Show the survey only after a successful scenario is complete

---

## Survey flow

### Was this extension useful?

- "Ask me later" closes the survey, saves the current successful action counter as the survey action anchor, and keeps survey logic active
- "Never ask" closes the survey and disables future surveys
- "No" opens "Sorry to hear that. You can send feedback"
- "Yes" opens "Thank you. You can support the project"

### Thank you. You can support the project

- "Later" closes the survey, saves the current successful action counter as the survey action anchor, and keeps survey logic active
- "Star on GitHub" opens the project GitHub page and marks the survey as completed
- "Rate in store" opens the installed store listing and marks the survey as completed

### Sorry to hear that. You can send feedback

- "Send an email" opens `mailto:contact@md2it.com`
- "Later" closes the survey, saves the current successful action counter as the survey action anchor, and keeps survey logic active
- "Never ask" closes the survey and disables future surveys

---

## Window behavior

- Every survey window has a close button
- The close button works as "Ask me later" or "Later"
- Survey windows close only by explicit controls
- Clicking outside the survey does not close it
- Record the previous survey display time when the first survey window is shown

---

## Information page

- Show the cumulative successful action counter on the existing information page (for example, About or Info)
- Use concise text, for example: "Copied elements: 102"

---

## Backward compatibility

- Do not run migrations for existing user data
- Do not modify or reinterpret existing storage keys
- Support survey may create its own new storage key or fields
- Missing survey state is valid and must be handled safely
- If survey state cannot be read or written, skip survey logic and continue the main user scenario

---

## Element Copier rules

- Counter tick:
   - Successful copy of an element or page from the web page to the extension
- No counter tick:
   - Copying a result from the extension to the clipboard
   - Downloading a result from the extension
- Survey window:
   - A modal window inside the extension popup
- Survey trigger:
   - Only after a successful download from the extension
   - Only if the counter already reached the threshold
   - Never after any copy action
