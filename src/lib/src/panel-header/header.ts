export type PanelHeaderOptions = {
  title: string;
  subtitle: string;
  logoSvg?: string;
};

export function createPanelDivider(): HTMLDivElement {
  const divider = document.createElement("div");
  divider.className = "dd-panel-divider";
  divider.setAttribute("aria-hidden", "true");
  return divider;
}

export function createPanelHeader(options: PanelHeaderOptions): HTMLElement {
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
