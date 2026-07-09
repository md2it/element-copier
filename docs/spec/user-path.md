# USER PATHS

U = User
E = Extension

### Main flow

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

### Start with a keyboard shortcut

1. U presses the start keyboard shortcut
2. The flow continues from step 4 of the main flow, when U hovers over an element

The earlier steps of the main flow are skipped.

### Cache

1. U copies content
2. E fills the cache with the first set of values
3. U can access the first set of values:
   - Immediately from the COPIED page
   - After reopening COPIED from another page
   - After updating the extension
   - After restarting the browser
4. U copies new content
5. E performs all of the following:
   - Removes the first set of values
   - Fills the cache with the second set of values
6. U:
   - Can no longer access the first set of values
   - Can access the second set of values

### Rich text

1. U starts E
2. U hovers over an element
3. U clicks the element
4. The content is copied to the clipboard automatically or U copies it with a button
5. U pastes the content into Google Docs or Word

Expected result: the text is pasted with formatting similar to content selected directly on the page, with additional formatting improvements.

### Actions on the copied page

- Copy Text copies `text/html` and `text/plain` to the clipboard
- Copy Markdown copies Markdown as plain text
- Copy for an image copies the image as a file to the clipboard
- Download saves the corresponding file
- Copy for a developer format copies the corresponding information to the clipboard