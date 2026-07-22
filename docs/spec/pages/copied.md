# PAGE COPIED

---

## IF THE BUFFER IS NOT EMPTY

- All blocks have 2 mm top and bottom spacing
- All blocks except the information and URL blocks have a top border

### Information block
- Fills all available space not occupied by other blocks, pushing them down. Minimum block height is 3 cm
- "Copied!" heading: large, centered, green
- Subtitle:
   - Depends on the latest action
   - If copied:
      - "Copied to clipboard: WHAT_COPIED"
      - WHAT_COPIED = what was copied to the clipboard
      - If WHAT_COPIED != nothing, it is black and bold
      - If WHAT_COPIED = nothing, it is gray (as a fallback)
      - When a new value is saved to the clipboard, WHAT_COPIED changes accordingly
   - If saved:
      - "Downloaded: WHAT_DOWNLOADED"
      - WHAT_DOWNLOADED = the latest downloaded file, black and bold
      - When a file is saved, WHAT_COPIED changes accordingly
   - If nothing has been copied or saved, there is no line
   - The presence or absence of the subtitle must not shift other elements

### URL block
- Inline:
   - The URL itself is in a field similar to the one in the "Developer tools" block, with the same color, truncation, and copying logic. Fills the width of the parent element
- external-link button: opens the link in a new tab

### Copy block
- Everything is inline
- Contains:
   - "Copy"
   - "Text", "Markdown", and "Image" buttons

### Download block
- Contains:
   - "Download"
   - Markdown
   - HTML
   - PNG
   - JPEG
- Clicking a button downloads the corresponding file

### Developer tools
- Show the block only if enabled in the user settings
- The final row is "QA details"; it copies a compact plain-text reference for bug reports
- Each entry:
   - On a separate line
   - Format: [name as the row label] [copy field]
   - The row fills the entire window width without wrapping
   - Copy field:
      - Looks like code
      - Has a copy icon at the end
      - If the string does not fit, it is visually truncated, but the full value remains present
      - The text cannot be selected
      - All copy fields have equal width
      - Treat this field as a button and color it accordingly (normal, unavailable, latest copy)
   - Clicking the row, including the label, copies the value to the clipboard

### Again block
- Two inline buttons: "NEW ELEMENT" and "NEW PAGE"
- Button logic is identical to the buttons on the START page

---

## BUTTON STATES

### Selected button
- If the window has just opened after copying, select the button corresponding to the data saved in the clipboard
- After that, the last clicked button is selected
- If the user reopens the COPIED window, no button is selected
- No more than one button can be selected at a time
- The selected button is green
- When a button is clicked:
   - A copy button copies to the clipboard
   - A download button downloads the file

### If the field/button has no data in the cache
- If an option has nothing to provide to the user, the button is gray and does not change state
- Account for data that is not stored in the cache but is derived from other cached data
- Clicking this format shows the tooltip: "Nothing for this format"

### If the user disabled the format
- The button uses the same style as when there is no data in the cache
- The row text is struck through
- Clicking this format shows the tooltip: "Turned off in the settings"

---

## IF THE CACHE IS EMPTY

- Centered:
   - Gray text:
      - I don't have anything saved in my memory. 
      - Should we copy something?
   - "NEW ELEMENT" button
   - Button logic is identical to the "NEW ELEMENT" button on the START page
