/**
 * The markdown dialect from the design: headings, bullets, numbers,
 * checkboxes, quotes, fences, rules, `code`, **bold**, *em*, ==mark==,
 * #tags and @Note mentions.
 */
export type Inline =
  | { t: 'text'; v: string }
  | { t: 'bold'; kids: Inline[] }
  | { t: 'em'; kids: Inline[] }
  | { t: 'mark'; kids: Inline[] }
  | { t: 'strike'; kids: Inline[] }
  | { t: 'code'; v: string }
  | { t: 'link'; href: string; kids: Inline[] }
  | { t: 'tag'; v: string }
  | { t: 'mention'; v: string; id: string };

export type ListItem = {
  kind: 'bullet' | 'number' | 'todo';
  marker: string;
  done: boolean;
  kids: Inline[];
};

export type Block =
  | { t: 'h1' | 'h2' | 'h3'; kids: Inline[] }
  | { t: 'p'; kids: Inline[] }
  | { t: 'quote'; kids: Inline[] }
  | { t: 'list'; items: ListItem[] }
  | { t: 'fence'; v: string }
  | { t: 'table'; rows: Inline[][][] }
  | { t: 'rule' }
  | { t: 'space' };

export type Mentionable = { id: string; title: string };

const isSpace = (ch: string | undefined) => ch === undefined || /\s/.test(ch);

export function parseInline(src: string, mentions: Mentionable[] = []): Inline[] {
  const sorted = mentions.slice().sort((a, b) => b.title.length - a.title.length);
  const out: Inline[] = [];
  let buf = '';
  const flush = () => {
    if (buf) out.push({ t: 'text', v: buf });
    buf = '';
  };

  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);

    if (src[i] === '@') {
      const hit = sorted.find((m) => rest.startsWith('@' + m.title));
      if (hit) {
        flush();
        out.push({ t: 'mention', v: hit.title, id: hit.id });
        i += hit.title.length + 1;
        continue;
      }
    }

    if (src[i] === '[') {
      const m = /^\[([^\]]*)\]\(([^)\s]+)\)/.exec(rest);
      if (m) {
        flush();
        out.push({ t: 'link', href: m[2], kids: parseInline(m[1], mentions) });
        i += m[0].length;
        continue;
      }
    }

    if (src[i] === '`') {
      const end = src.indexOf('`', i + 1);
      if (end > i + 1) {
        flush();
        out.push({ t: 'code', v: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (rest.startsWith('**')) {
      const end = src.indexOf('**', i + 2);
      if (end > i + 1) {
        flush();
        out.push({ t: 'bold', kids: parseInline(src.slice(i + 2, end), mentions) });
        i = end + 2;
        continue;
      }
    }

    if (rest.startsWith('~~') || (src[i] === '~' && !rest.startsWith('~~'))) {
      const d = rest.startsWith('~~') ? '~~' : '~';
      const end = src.indexOf(d, i + d.length);
      if (end > i + d.length) {
        flush();
        out.push({ t: 'strike', kids: parseInline(src.slice(i + d.length, end), mentions) });
        i = end + d.length;
        continue;
      }
    }

    if (rest.startsWith('==')) {
      const end = src.indexOf('==', i + 2);
      if (end > i + 1) {
        flush();
        out.push({ t: 'mark', kids: parseInline(src.slice(i + 2, end), mentions) });
        i = end + 2;
        continue;
      }
    }

    if (src[i] === '*') {
      const end = src.indexOf('*', i + 1);
      if (end > i + 1) {
        flush();
        out.push({ t: 'em', kids: parseInline(src.slice(i + 1, end), mentions) });
        i = end + 1;
        continue;
      }
    }

    if (src[i] === '#' && isSpace(src[i - 1])) {
      const m = /^#([a-z0-9-]+)/i.exec(rest);
      if (m) {
        flush();
        out.push({ t: 'tag', v: m[1].toLowerCase() });
        i += m[0].length;
        continue;
      }
    }

    buf += src[i];
    i += 1;
  }
  flush();
  return out;
}

const PIPE_ROW = /^\s*\|.*\|\s*$/;
const RULE_CELL = /^:?-+:?$/;

/** "| a | b |" into its cells, with an escaped pipe kept inside one. */
function pipeCells(line: string, mentions: Mentionable[]): Inline[][] {
  const inner = line.trim().replace(/^\|/, '').replace(/\|\s*$/, '');
  const cells: string[] = [];
  let cell = '';
  for (let i = 0; i < inner.length; i += 1) {
    if (inner[i] === String.fromCharCode(92) && inner[i + 1] === '|') {
      cell += '|';
      i += 1;
    } else if (inner[i] === '|') {
      cells.push(cell);
      cell = '';
    } else {
      cell += inner[i];
    }
  }
  cells.push(cell);
  return cells.map((c) => parseInline(c.trim(), mentions));
}

/**
 * Is this the rule under a table's header? Every cell has to be dashes, or a
 * row of empty cells reads as one and the table ends at its header.
 */
function isPipeRule(line: string): boolean {
  if (!PIPE_ROW.test(line)) return false;
  const inner = line.trim().replace(/^\|/, '').replace(/\|\s*$/, '');
  const cells = inner.split('|').map((cell) => cell.trim());
  return cells.length > 0 && cells.every((cell) => RULE_CELL.test(cell));
}

export function parseBlocks(lines: string[], mentions: Mentionable[] = []): Block[] {
  const out: Block[] = [];
  let items: ListItem[] | null = null;
  let fence: string[] | null = null;

  const flushList = () => {
    if (items && items.length) out.push({ t: 'list', items });
    items = null;
  };

  for (let li = 0; li < lines.length; li += 1) {
    const raw = lines[li] ?? '';
    const s = raw.replace(/\s+$/, '');

    if (!fence && PIPE_ROW.test(s) && isPipeRule(lines[li + 1] ?? '')) {
      flushList();
      const rows: Inline[][][] = [pipeCells(s, mentions)];
      let j = li + 2;
      while (j < lines.length && PIPE_ROW.test(lines[j] ?? '') && !isPipeRule(lines[j] ?? '')) {
        rows.push(pipeCells(lines[j] ?? '', mentions));
        j += 1;
      }
      out.push({ t: 'table', rows });
      li = j - 1;
      continue;
    }

    if (/^```/.test(s)) {
      if (fence) {
        out.push({ t: 'fence', v: fence.join('\n') });
        fence = null;
      } else {
        flushList();
        fence = [];
      }
      continue;
    }
    if (fence) {
      fence.push(s);
      continue;
    }

    let m: RegExpExecArray | null;

    if ((m = /^- \[( |x|X)\] (.*)$/.exec(s))) {
      items = items ?? [];
      items.push({
        kind: 'todo',
        marker: '',
        done: m[1].toLowerCase() === 'x',
        kids: parseInline(m[2], mentions),
      });
      continue;
    }
    if ((m = /^[-*] (.*)$/.exec(s))) {
      items = items ?? [];
      items.push({ kind: 'bullet', marker: '•', done: false, kids: parseInline(m[1], mentions) });
      continue;
    }
    if ((m = /^(\d+)\. (.*)$/.exec(s))) {
      items = items ?? [];
      items.push({ kind: 'number', marker: m[1] + '.', done: false, kids: parseInline(m[2], mentions) });
      continue;
    }

    flushList();

    if ((m = /^### (.*)$/.exec(s))) {
      out.push({ t: 'h3', kids: parseInline(m[1], mentions) });
    } else if ((m = /^## (.*)$/.exec(s))) {
      out.push({ t: 'h2', kids: parseInline(m[1], mentions) });
    } else if ((m = /^# (.*)$/.exec(s))) {
      out.push({ t: 'h1', kids: parseInline(m[1], mentions) });
    } else if ((m = /^> (.*)$/.exec(s))) {
      out.push({ t: 'quote', kids: parseInline(m[1], mentions) });
    } else if (/^(---|\*\*\*)$/.test(s)) {
      out.push({ t: 'rule' });
    } else if (!s) {
      out.push({ t: 'space' });
    } else {
      out.push({ t: 'p', kids: parseInline(s, mentions) });
    }
  }

  flushList();
  if (fence) out.push({ t: 'fence', v: fence.join('\n') });
  return out;
}

/** Tags a note carries, in first-seen order. */
export function tagsOf(body: string): string[] {
  const out: string[] = [];
  (body.match(/(^|\s)#[a-z0-9-]+/gi) ?? []).forEach((raw) => {
    const t = raw.trim().slice(1).toLowerCase();
    if (!out.includes(t)) out.push(t);
  });
  return out;
}

/** Body stripped of markup, for card snippets. */
export function plainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*\|[\s:|-]+\|\s*$/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/[#>*`=[\]()_-]|\d\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
