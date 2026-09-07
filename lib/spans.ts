/**
 * Inline tokens for a block that is being typed into.
 *
 * Every character of the block, markers included, comes back in some span:
 * what is drawn has to be exactly what is stored, or the caret offset stops
 * agreeing with the text and the cursor starts jumping. Markers are dimmed
 * rather than dropped for the same reason.
 */

export type SpanKind =
  | 'plain'
  | 'marker'
  | 'bold'
  | 'em'
  | 'mark'
  | 'code'
  | 'tag'
  | 'mention'
  | 'link'
  | 'href';

export type Span = { v: string; k: SpanKind };

const push = (out: Span[], v: string, k: SpanKind) => {
  if (!v) return;
  const last = out[out.length - 1];
  if (last && last.k === k) last.v += v;
  else out.push({ v, k });
};

export function inlineSpans(text: string, mentions: string[] = []): Span[] {
  const titles = mentions.slice().sort((a, b) => b.length - a.length);
  const out: Span[] = [];
  let i = 0;

  const wrapped = (fence: string, kind: SpanKind): boolean => {
    if (!text.startsWith(fence, i)) return false;
    const end = text.indexOf(fence, i + fence.length);
    if (end <= i + fence.length) return false;
    push(out, fence, 'marker');
    push(out, text.slice(i + fence.length, end), kind);
    push(out, fence, 'marker');
    i = end + fence.length;
    return true;
  };

  while (i < text.length) {
    const rest = text.slice(i);

    if (text[i] === '@') {
      const hit = titles.find((t) => rest.startsWith('@' + t));
      if (hit) {
        push(out, '@' + hit, 'mention');
        i += hit.length + 1;
        continue;
      }
    }

    if (text[i] === '[') {
      const m = /^\[([^\]]*)\]\(([^)\s]+)\)/.exec(rest);
      if (m) {
        push(out, '[', 'marker');
        push(out, m[1], 'link');
        push(out, '](', 'marker');
        push(out, m[2], 'href');
        push(out, ')', 'marker');
        i += m[0].length;
        continue;
      }
    }

    if (wrapped('`', 'code')) continue;
    if (wrapped('**', 'bold')) continue;
    if (wrapped('==', 'mark')) continue;
    if (wrapped('*', 'em')) continue;

    if (text[i] === '#' && (i === 0 || /\s/.test(text[i - 1]))) {
      const m = /^#[a-z0-9-]+/i.exec(rest);
      if (m) {
        push(out, m[0], 'tag');
        i += m[0].length;
        continue;
      }
    }

    push(out, text[i], 'plain');
    i += 1;
  }

  return out;
}
