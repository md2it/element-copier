# ELEMENT COPY LOGIC

---

## Starting a copy to the extension buffer

- From selection mode: clicking the target element copies that element
- Clicking "NEW PAGE" copies the entire page

---

## Processing the DOM element

### When copying by clicking an element
1. Disable selection mode
2. Process the information:
   1. Perform processing according to processing.md
   2. Perform the default action (from the cache and only if specified in "Default action")
   - If processing takes more than 0.5 seconds from the user's click, open the LOADING window
   - Selection-copy mode cannot be started again until data processing is complete
3. Open the COPIED window

### When copying the entire page
- Processing is the same as when copying a specific element
- Treat the entire page as the element
- The selection step is not required

---

## COPY WHOLE PAGE
1. Do not start any selection modes or close the popup
2. Process the page's entire `<html>...</html>` as if the user had selected that element

---

## Copying to the clipboard on the COPIED page

1. Retrieve the corresponding snapshot from the extension cache
2. Save the result to the clipboard
