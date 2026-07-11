# SUPPORT SURVEY

---

## Common logic

- Keep a successful action counter
- Show the survey only when the counter reaches or crosses 25
- Do not show the survey if any condition is true:
   - The user previously selected "Never ask"
   - The user already clicked "Star on GitHub"
   - The user already clicked "Rate in store"
- The survey may be shown again after the counter reset and a new threshold crossing
- Do not show the survey earlier than 60 days after the previous survey display
- Show the survey only after a successful scenario is complete

---

## Survey flow

### Was this extension useful?

- "Ask me later" closes the survey, resets the counter, and keeps survey logic active
- "Never ask" closes the survey and disables future surveys
- "No" opens "Sorry to hear that. You can send feedback"
- "Yes" opens "Thank you. You can support the project"

### Thank you. You can support the project

- "Later" closes the survey, resets the counter, and keeps survey logic active
- "Star on GitHub" opens the project GitHub page and marks the survey as completed
- "Rate in store" opens the installed store listing and marks the survey as completed

### Sorry to hear that. You can send feedback

- "Send an email" opens `mailto:contact@md2it.com`
- "Later" closes the survey, resets the counter, and keeps survey logic active
- "Never ask" closes the survey and disables future surveys

---

## Window behavior

- Every survey window has a close button
- The close button works as "Ask me later" or "Later"
- Survey windows close only by explicit controls
- Clicking outside the survey does not close it

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
