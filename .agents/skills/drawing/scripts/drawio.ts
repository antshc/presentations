import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

export interface Node {
  tag: string;
  attrs: Record<string, string>;
  children: Node[];
  text: string;
}

export interface Cell {
  id: string;
  parent: string;
  kind: "root" | "layer" | "vertex" | "edge";
  value: string;
  style: string;
  source: string;
  target: string;
  geo?: { x: number; y: number; width: number; height: number };
  image?: { mime: string; bytes: number; sha: string };
}

export interface Page {
  number: number;
  id: string;
  name: string;
  model: Node;
  cells: Cell[];
}

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export function unescapeXml(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : entities[e]!,
  );
}

const badAmp = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/;
const tagRe = /<(!--[\s\S]*?--|\?[\s\S]*?\?|!\[CDATA\[[\s\S]*?\]\]|!DOCTYPE[^>]*|(\/)?([A-Za-z_][\w:.-]*)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/)?)>/g;
const attrRe = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function lineOf(text: string, offset: number): number {
  let n = 1;
  for (let i = text.indexOf("\n"); i !== -1 && i < offset; i = text.indexOf("\n", i + 1)) n++;
  return n;
}

// Returns the root node or throws an Error describing the first well-formedness problem.
export function parseXml(text: string): Node {
  const stack: Node[] = [];
  let root: Node | undefined;
  let last = 0;
  const checkText = (slice: string, at: number) => {
    if (slice.includes("<")) throw new Error(`line ${lineOf(text, at + slice.indexOf("<"))}: stray "<"`);
    if (badAmp.test(slice)) throw new Error(`line ${lineOf(text, at)}: unescaped "&" in text`);
    if (stack.length === 0 && slice.trim()) throw new Error(`line ${lineOf(text, at)}: text outside the root element`);
    if (stack.length && slice.trim()) stack[stack.length - 1]!.text += unescapeXml(slice);
  };
  tagRe.lastIndex = 0;
  for (let m = tagRe.exec(text); m; m = tagRe.exec(text)) {
    checkText(text.slice(last, m.index), last);
    last = tagRe.lastIndex;
    const [, , closing, tag, rawAttrs, selfClosing] = m;
    if (!tag) continue;
    if (closing) {
      const open = stack.pop();
      if (!open || open.tag !== tag) throw new Error(`line ${lineOf(text, m.index)}: </${tag}> does not match <${open?.tag ?? "nothing"}>`);
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of (rawAttrs ?? "").matchAll(attrRe)) {
      const raw = a[2] ?? a[3] ?? "";
      if (badAmp.test(raw)) throw new Error(`line ${lineOf(text, m.index)}: unescaped "&" in attribute ${a[1]}`);
      attrs[a[1]!] = unescapeXml(raw);
    }
    const node: Node = { tag, attrs, children: [], text: "" };
    if (stack.length) stack[stack.length - 1]!.children.push(node);
    else if (root) throw new Error(`line ${lineOf(text, m.index)}: more than one root element`);
    else root = node;
    if (!selfClosing) stack.push(node);
  }
  checkText(text.slice(last), last);
  if (stack.length) throw new Error(`<${stack[stack.length - 1]!.tag}> is never closed`);
  if (!root) throw new Error("no root element");
  return root;
}

export function parseStyle(style: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of style.split(";")) {
    if (!part) continue;
    const i = part.indexOf("=");
    if (i === -1) map.set(part, "");
    else map.set(part.slice(0, i), part.slice(i + 1));
  }
  return map;
}

const imageRe = /(^|;)image=data:([\w/+.-]+)(?:;base64)?,([^;]*)/;

export function describeImage(style: string): Cell["image"] {
  const m = imageRe.exec(style);
  if (!m) return undefined;
  const data = m[3]!;
  const pad = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  return {
    mime: m[2]!,
    bytes: Math.floor((data.length * 3) / 4) - pad,
    sha: createHash("sha256").update(data).digest("hex").slice(0, 8),
  };
}

// Style with every embedded image payload replaced by a short marker.
export function stripStyle(style: string): string {
  return style.replace(imageRe, (_, lead: string, mime: string, data: string) => {
    const img = describeImage(`image=data:${mime},${data}`)!;
    return `${lead}image=<IMG ${img.bytes} bytes ${img.mime} sha:${img.sha}>`;
  });
}

export function isImageCell(c: Cell): boolean {
  return c.kind === "vertex" && parseStyle(c.style).has("image");
}

function toCell(node: Node, wrapper?: Node): Cell {
  const a = node.attrs;
  const geoNode = node.children.find((c) => c.tag === "mxGeometry");
  const num = (k: string) => Number(geoNode?.attrs[k] ?? 0);
  const parent = a.parent ?? "";
  const kind: Cell["kind"] = !parent ? "root" : a.vertex === "1" ? "vertex" : a.edge === "1" ? "edge" : "layer";
  const style = a.style ?? "";
  return {
    id: wrapper?.attrs.id ?? a.id ?? "",
    parent,
    kind,
    value: wrapper?.attrs.label ?? a.value ?? "",
    style,
    source: a.source ?? "",
    target: a.target ?? "",
    geo: geoNode && kind !== "edge" ? { x: num("x"), y: num("y"), width: num("width"), height: num("height") } : undefined,
    image: describeImage(style),
  };
}

export function cellsOf(model: Node): Cell[] {
  const root = model.children.find((c) => c.tag === "root");
  if (!root) return [];
  const cells: Cell[] = [];
  for (const n of root.children) {
    if (n.tag === "mxCell") cells.push(toCell(n));
    else if (n.tag === "object" || n.tag === "UserObject") {
      const inner = n.children.find((c) => c.tag === "mxCell");
      if (inner) cells.push(toCell(inner, n));
    }
  }
  return cells;
}

function modelOf(diagram: Node): Node {
  const inline = diagram.children.find((c) => c.tag === "mxGraphModel");
  if (inline) return inline;
  const packed = diagram.text.trim();
  if (!packed) throw new Error("diagram has no mxGraphModel");
  const xml = decodeURIComponent(inflateRawSync(Buffer.from(packed, "base64")).toString("utf8"));
  return parseXml(xml);
}

export interface Drawio {
  path: string;
  text: string;
  pages: Page[];
}

export function loadDrawio(path: string): Drawio {
  const text = readFileSync(path, "utf8");
  const root = parseXml(text);
  if (root.tag !== "mxfile") throw new Error(`root element is <${root.tag}>, expected <mxfile>`);
  const pages = root.children
    .filter((c) => c.tag === "diagram")
    .map((d, i): Page => {
      const model = modelOf(d);
      return { number: i + 1, id: d.attrs.id ?? "", name: d.attrs.name ?? "", model, cells: cellsOf(model) };
    });
  return { path, text, pages };
}

// Selector: 1-based number (`4` or `P4`), page id, or case-insensitive name fragment.
export function selectPage(pages: Page[], selector: string): Page {
  const byId = pages.find((p) => p.id === selector);
  if (byId) return byId;
  const n = /^p?(\d+)$/i.exec(selector);
  if (n) {
    const page = pages[Number(n[1]) - 1];
    if (!page) throw new Error(`page ${n[1]} does not exist; file has ${pages.length} page(s)`);
    return page;
  }
  const hits = pages.filter((p) => p.name.toLowerCase().includes(selector.toLowerCase()));
  if (hits.length === 1) return hits[0]!;
  if (hits.length === 0) throw new Error(`no page matches "${selector}"; use a number, id or name`);
  throw new Error(`"${selector}" matches ${hits.length} pages: ${hits.map((p) => p.id).join(", ")}`);
}

// Visible text of an HTML cell value.
export function plainText(value: string): string {
  return unescapeXml(
    value
      .replace(/<br\s*\/?>|<\/(?:div|p|li)>/gi, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}
