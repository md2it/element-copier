function buildAboutListItems(copy) {
  return copy.aboutBullets.map((text, index) => ({
    text,
    href: index === copy.aboutBullets.length - 2
      ? "https://github.com/md2it/browser-extension-element-copier"
      : undefined
  }));
}

export { buildAboutListItems };
