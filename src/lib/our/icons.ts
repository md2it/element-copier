import md2itSvg from "../icons/md2it.svg";

function stripComment(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
}

function inlineSvg(raw: string): string {
  return stripComment(raw).replace(/fill="#000000"/g, 'fill="currentColor"');
}

export const MD2IT = inlineSvg(md2itSvg);
