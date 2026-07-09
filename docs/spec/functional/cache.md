## CACHE

- Save all formats to the cache:
   - Even if Developer tools are disabled, save this data in case they are enabled later
- If one format can be easily derived from another:
   - Store only one version and convert the other on demand
   - For markdown and .html, store only the text; generate the file each time immediately before download
   - For text, store text/html and derive text/plain
- The cache retains the state of the latest copy indefinitely
- When new content is copied:
   - Delete all previous values completely
   - Perform the new copy with an empty cache
- The UI does not provide complete cache clearing
- Do not write empty values to the cache
   - String formats containing only whitespace characters are considered empty
