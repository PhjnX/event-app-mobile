/**
 * Đọc đoạn HTML nhỏ trong nội dung bài viết (EditorJS) để hiển thị bằng <Text>.
 *
 * Bản cũ nằm trong NewsDetailScreen chỉ giải mã thực thể HTML ở nhánh dự phòng,
 * mà nhánh chính lại luôn chạy — nên 23/33 bài hiện nguyên văn "&nbsp;" và
 * "&amp;" giữa câu. Bản cũ còn vứt bỏ thẻ <a>, nên link trong bài không bấm được.
 */

const THUC_THE: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  middot: "·",
  copy: "©",
  reg: "®",
  trade: "™",
};

/** "&nbsp;" → " ", "&amp;" → "&", "&#8211;" → "–"… Thực thể lạ thì giữ nguyên. */
export const decodeEntities = (s: string): string =>
  (s || "").replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (goc, ma: string) => {
    if (ma[0] === "#") {
      const so =
        ma[1].toLowerCase() === "x"
          ? parseInt(ma.slice(2), 16)
          : parseInt(ma.slice(1), 10);
      return Number.isFinite(so) && so > 0 ? String.fromCodePoint(so) : goc;
    }
    return THUC_THE[ma.toLowerCase()] ?? goc;
  });

/** Bỏ hết thẻ, giải mã thực thể, gộp khoảng trắng — dùng cho chú thích, ô bảng. */
export const stripHtml = (html: string): string =>
  decodeEntities(
    (html || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();

export type InlineSegment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  mark?: boolean;
  href?: string;
};

/**
 * Tách HTML thành các đoạn chữ kèm kiểu (đậm, nghiêng, link…).
 *
 * Dùng ngăn xếp thẻ nên thẻ lồng nhau như <b><i>…</i></b> vẫn đúng — bản cũ
 * bắt bằng một regex phẳng, gặp thẻ lồng là in nguyên "<i>" ra màn hình.
 * Thẻ không nhận ra thì bỏ thẻ, giữ chữ bên trong.
 */
export const parseInlineHtml = (html: string): InlineSegment[] => {
  const out: InlineSegment[] = [];
  const stack: { tag: string; href?: string }[] = [];
  const re = /<(\/?)([a-z0-9]+)([^>]*)>|([^<]+)/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html || "")) !== null) {
    if (m[4] !== undefined) {
      const text = decodeEntities(m[4]).replace(/\s+/g, " ");
      if (!text) continue;
      const co = (...tags: string[]) => stack.some((s) => tags.includes(s.tag));
      const link = [...stack].reverse().find((s) => s.tag === "a" && s.href);
      out.push({
        text,
        bold: co("b", "strong"),
        italic: co("i", "em"),
        underline: co("u"),
        mark: co("mark"),
        href: link?.href,
      });
      continue;
    }

    const dong = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (tag === "br") {
      out.push({ text: "\n" });
    } else if (dong) {
      const i = stack.map((s) => s.tag).lastIndexOf(tag);
      if (i >= 0) stack.splice(i);
    } else if (!/\/\s*$/.test(m[3])) {
      const href = /href\s*=\s*["']([^"']+)["']/i.exec(m[3]);
      stack.push({ tag, href: href ? decodeEntities(href[1]) : undefined });
    }
  }

  // Cắt khoảng trắng thừa ở hai đầu cả đoạn (thường là "&nbsp;" cuối dòng)
  if (out.length) {
    out[0].text = out[0].text.replace(/^[ \t]+/, "");
    const cuoi = out[out.length - 1];
    cuoi.text = cuoi.text.replace(/[ \t]+$/, "");
  }
  return out.filter((s) => s.text.length > 0);
};
