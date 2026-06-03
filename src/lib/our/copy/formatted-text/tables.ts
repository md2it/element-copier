import { TABLE_CELL_STYLE, TABLE_STYLE } from "./constants";
import { mergeInlineStyle } from "./style-utils";

export function enhanceClipboardTables(root: Element): void {
  for (const table of root.querySelectorAll("table")) {
    mergeInlineStyle(table, TABLE_STYLE);
    if (!table.hasAttribute("border")) {
      table.setAttribute("border", "1");
    }
    if (!table.hasAttribute("cellspacing")) {
      table.setAttribute("cellspacing", "0");
    }
    if (!table.hasAttribute("cellpadding")) {
      table.setAttribute("cellpadding", "4");
    }

    for (const cell of table.querySelectorAll("th, td")) {
      mergeInlineStyle(cell, TABLE_CELL_STYLE);
    }
  }
}

export function normalizePlainCellText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function tableElementToPlain(table: Element): string {
  const rows: string[] = [];
  for (const row of table.querySelectorAll("tr")) {
    const cells: string[] = [];
    for (const cell of row.querySelectorAll("th, td")) {
      const value = normalizePlainCellText(cell.textContent ?? "");
      if (value) cells.push(value);
    }
    if (cells.length > 0) {
      rows.push(cells.join("\t"));
    }
  }
  return rows.join("\n");
}
