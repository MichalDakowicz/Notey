/**
 * What a live field asks of the rich-text model, in one place, so the web and
 * native fields differ only in how they draw and where the caret comes from.
 *
 * Everything here works on runs, not markdown, and every offset is an offset
 * into the plain text — what the writer sees. Markdown is produced only when
 * the block is handed back to the note.
 *
 * Runs have to be the state that is kept between keystrokes. Markdown cannot
 * be: half-typed delimiters are ambiguous, so "Use **Django*" parses back as an
 * italic run and the annotations rot as the writer types.
 */
import {
  applyPlainEdit,
  marksBefore,
  parseRuns,
  plainOf,
  serializeRuns,
  shortcutAt,
  sliceRuns,
  spliceRuns,
  toggleMarkRange,
  type Marks,
  type Pending,
  type Run,
} from './rich';
import { typography } from './typing';

export type Typed = { runs: Run[]; plain: string; caret: number; pending: Pending };

export function runsOf(md: string, mentions: string[]): Run[] {
  return parseRuns(md, mentions);
}

export function mdOf(runs: Run[]): string {
  return serializeRuns(runs);
}

export function plainFor(md: string, mentions: string[]): string {
  return plainOf(parseRuns(md, mentions));
}

/**
 * The field's plain text changed. Reannotate what stayed, polish the typing,
 * then give the live shortcut a chance to close a pair at the caret.
 */
export function typeInto(runs: Run[], nextPlain: string, pending: Pending): Typed {
  const before = plainOf(runs);
  let edit = applyPlainEdit(runs, nextPlain, pending ?? undefined);

  // Arrow, dash, ellipsis and quote polish, on text that just grew — but not
  // inside code, where "->" is an operator and has to stay as typed.
  if (nextPlain.length > before.length && !marksBefore(edit.runs, edit.caret).code) {
    const polished = typography(nextPlain, edit.caret);
    if (polished.text !== nextPlain) {
      edit = applyPlainEdit(runs, polished.text, pending ?? undefined);
    }
  }

  const shot = shortcutAt(edit.runs, edit.caret);
  const out = shot ? shot.runs : edit.runs;
  const caret = shot ? shot.caret : edit.caret;

  return {
    runs: out,
    plain: plainOf(out),
    caret,
    pending: shot ? { at: caret, deny: [shot.closed] } : null,
  };
}

/** Return in the middle of a block: the two halves, as markdown. */
export function splitRuns(runs: Run[], caret: number): { head: string; tail: string } {
  const plain = plainOf(runs);
  return {
    head: serializeRuns(sliceRuns(runs, 0, caret)),
    tail: serializeRuns(sliceRuns(runs, caret, plain.length)),
  };
}

/** The selection bar, and Ctrl+B and friends. */
export function toggleRuns(
  runs: Run[],
  start: number,
  end: number,
  kind: keyof Marks,
  value: true | string = true,
): Run[] {
  return toggleMarkRange(runs, start, end, kind, value);
}

/** Replace a stretch of plain text, keeping the annotations around it. */
export function replaceRuns(
  runs: Run[],
  start: number,
  end: number,
  text: string,
  marks: Marks = {},
): { runs: Run[]; caret: number } {
  const insert: Run[] = text ? [{ text, marks }] : [];
  return { runs: spliceRuns(runs, start, end, insert), caret: start + text.length };
}

/** A picked note goes in as a mention run, with a plain space after it. */
export function mentionRuns(
  runs: Run[],
  start: number,
  end: number,
  title: string,
): { runs: Run[]; caret: number } {
  const insert: Run[] = [
    { text: '@' + title, marks: { mention: true } },
    { text: ' ', marks: {} },
  ];
  return { runs: spliceRuns(runs, start, end, insert), caret: start + title.length + 2 };
}

/** Marks under the caret, so the bar can show what is already on. */
export function marksAt(runs: Run[], at: number): Marks {
  return marksBefore(runs, at);
}

/** Marks carried by a whole selection, for the same reason. */
export function marksIn(runs: Run[], start: number, end: number): Marks {
  if (end <= start) return marksBefore(runs, start);
  const inside = sliceRuns(runs, start, end);
  const all: Marks = { ...inside[0]?.marks };
  inside.forEach((r) => {
    (Object.keys(all) as (keyof Marks)[]).forEach((k) => {
      if (!r.marks[k]) delete all[k];
    });
  });
  return all;
}
