import { describe, expect, it } from 'vitest';

import { pasteRuns } from '../field';
import { parseRuns, serializeRuns, type Run } from '../rich';

const NO_MENTIONS: string[] = [];

/** Each run as "text{marks}", which is what these cases are about. */
function shape(runs: Run[]): string[] {
  return runs.map((r) => r.text + '{' + Object.keys(r.marks).sort().join(',') + '}');
}

describe('parseRuns', () => {
  it('annotates a pair nested inside another', () => {
    expect(shape(parseRuns('**bold *italic* bold**'))).toEqual([
      'bold {bold}',
      'italic{bold,em}',
      ' bold{bold}',
    ]);
  });

  // The closing run is three stars: one closes the em, two close the bold.
  it('shares out a closing run of stars between the pairs it ends', () => {
    expect(shape(parseRuns('**bold *italic***'))).toEqual(['bold {bold}', 'italic{bold,em}']);
    expect(shape(parseRuns('***italic* bold**'))).toEqual(['italic{bold,em}', ' bold{bold}']);
  });

  it('reads bold nested inside italic', () => {
    expect(shape(parseRuns('*em **strong** em*'))).toEqual([
      'em {em}',
      'strong{bold,em}',
      ' em{em}',
    ]);
  });

  it('takes "***x***" as both at once', () => {
    expect(shape(parseRuns('***both***'))).toEqual(['both{bold,em}']);
  });

  it('keeps a star that closes nothing', () => {
    expect(shape(parseRuns('**a***'))).toEqual(['a{bold}', '*{}']);
  });

  it('leaves arithmetic alone', () => {
    expect(shape(parseRuns('2 * 3 * 4'))).toEqual(['2 * 3 * 4{}']);
  });

  it('keeps code literal inside a pair around it', () => {
    expect(shape(parseRuns('**bold `code` bold**'))).toEqual([
      'bold {bold}',
      'code{bold,code}',
      ' bold{bold}',
    ]);
  });
});

describe('serializeRuns', () => {
  // Wrapped run by run, the bold closed and reopened around the italic, and
  // "**bold *****italic***** bold**" reads back as literal stars.
  it('writes a shared mark once around the whole stretch', () => {
    expect(serializeRuns(parseRuns('**bold *italic* bold**'))).toBe('**bold *italic* bold**');
    expect(serializeRuns(parseRuns('==mark *em* mark=='))).toBe('==mark *em* mark==');
  });

  it('round-trips every nest the parser reads', () => {
    [
      '**bold *italic* bold**',
      '**bold *italic***',
      '***both***',
      '*em **strong** em*',
      '**a** and *b*',
      '**bold `code` bold**',
      '~~gone *and* gone~~',
      '[**label**](https://x.test)',
      '2 * 3 * 4',
    ].forEach((md) => {
      expect(shape(parseRuns(serializeRuns(parseRuns(md))))).toEqual(shape(parseRuns(md)));
    });
  });
});

describe('pasteRuns', () => {
  it('reads a pasted nest all the way down', () => {
    const put = pasteRuns([], 0, 0, '**bold *italic* bold**', NO_MENTIONS);

    expect(shape(put.runs)).toEqual(['bold {bold}', 'italic{bold,em}', ' bold{bold}']);
    expect(put.plain).toBe('bold italic bold');
    expect(put.caret).toBe(16);
  });

  it('lands inside what is already there', () => {
    const runs = parseRuns('ab');
    const put = pasteRuns(runs, 1, 1, '*em*', NO_MENTIONS);

    expect(shape(put.runs)).toEqual(['a{}', 'em{em}', 'b{}']);
    expect(put.caret).toBe(3);
  });

  it('takes the annotation of the selection it replaced', () => {
    const runs = parseRuns('**bold**');
    const put = pasteRuns(runs, 0, 4, 'new *bit*', NO_MENTIONS);

    expect(shape(put.runs)).toEqual(['new {bold}', 'bit{bold,em}']);
  });

  it('keeps a paste inside code as it was written', () => {
    const runs = parseRuns('`code`');
    const put = pasteRuns(runs, 4, 4, '*em*', NO_MENTIONS);

    expect(put.plain).toBe('code*em*');
    expect(shape(put.runs)).toEqual(['code*em*{code}']);
  });
});
