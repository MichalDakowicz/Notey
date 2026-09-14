import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputKeyPressEventData,
  type TextStyle,
} from 'react-native';

import { tabText } from '../lib/typing';
import { useLiveBlock } from './useLiveBlock';
import type { Marks } from '../lib/rich';
import { c, f } from '../theme/tokens';

export type Range = { start: number; end: number };

/** What the editor can ask of the focused field. */
export type LiveFieldHandle = {
  toggleMark: (kind: keyof Marks, value?: true | string) => void;
  replaceMention: (start: number, end: number, title: string) => void;
};

export type LiveFieldProps = {
  /** The block as markdown; the field shows it as annotated text. */
  text: string;
  mentions: string[];
  /** Caret the editor wants, in plain-text offsets. */
  selection: Range | null;
  autoFocus?: boolean;
  placeholder?: string;
  style?: StyleProp<TextStyle>;
  onChangeText: (md: string) => void;
  /** Plain text and caret, for the block markers and the two pickers. */
  onContext: (plain: string, caret: number) => void;
  onSelection: (range: Range, marks: Marks) => void;
  /** Return: the block split in two, already markdown. */
  onEnter: (head: string, tail: string) => void;
  onBackspaceAtStart: () => void;
  onFocus: () => void;
  /**
   * Tab: nest a list item, or step to the next table cell. Returns whether the
   * key was taken — a block with nothing to nest or step to leaves it, and the
   * field puts a tab in the text instead.
   */
  onTab?: (back: boolean) => boolean;
  /** Up and down: step between table rows, or move a menu's highlight. */
  onArrow?: (dir: -1 | 1) => void;
  /**
   * Where the caret is on screen, for a menu that follows it. React Native has
   * no caret geometry, so the native field reports the foot of the block it is
   * in and a menu opens under that line.
   */
  onCaretSpot?: (spot: { x: number; y: number; height: number } | null) => void;
  /**
   * Up or down pressed on the first or last line of the block: the caret is
   * leaving, so the editor moves it to the block above or below.
   */
  onCross?: (dir: -1 | 1) => void;
  /** Shift with up or down: the selection is growing past this block. */
  onSelectAcross?: (dir: -1 | 1) => void;
  /** Marks this field's element, so a selection can be traced back to a block. */
  blockId?: string;
};

/**
 * One block, edited as rich text: markdown delimiters are consumed and the text
 * carries the annotation, so `**bold**` goes bold the moment the pair closes
 * and the asterisks are gone.
 *
 * The runs are drawn with `Text` children, the only way React Native styles
 * parts of an editable field. Android rejects `value` together with children
 * ("Cannot specify both value and children"), so the field is uncontrolled and
 * a remount is what puts outside changes on screen.
 *
 * The web build uses LiveField.web.tsx, where a textarea cannot do this at all.
 */
export const LiveField = forwardRef<LiveFieldHandle, LiveFieldProps>(function LiveField(
  {
    text,
    mentions,
    selection,
    autoFocus,
    placeholder,
    style,
    onChangeText,
    onContext,
    onSelection,
    onEnter,
    onBackspaceAtStart,
    onFocus,
    onTab,
    onCaretSpot,
  },
  ref,
) {
  const block = useLiveBlock(text, mentions, onChangeText);
  const shown = useRef(block.plain);
  const caret = useRef(0);
  const [generation, setGeneration] = useState(0);
  const box = useRef<TextInput | null>(null);
  /**
   * The caret has to be handed back to the field after every keystroke.
   * Restyling the runs replaces the field's spannable text, and Android puts the
   * caret at offset 0 when that happens unless it is told otherwise — which is
   * what "the cursor is locked at the start" looks like.
   */
  const [held, setHeld] = useState<Range | null>({ start: 0, end: 0 });

  // Text that did not come from this field needs a fresh mount to show up.
  useEffect(() => {
    if (block.plain === shown.current) return;
    shown.current = block.plain;
    setGeneration((g) => g + 1);
  }, [block.plain]);

  // A caret the editor asks for takes over from the one being held.
  useEffect(() => {
    if (selection) setHeld(selection);
  }, [selection]);

  useImperativeHandle(ref, () => ({
    toggleMark(kind, value) {
      block.toggle(caret.current, caret.current, kind, value ?? true);
    },
    replaceMention(start, end, title) {
      caret.current = block.mention(start, end, title);
      setHeld({ start: caret.current, end: caret.current });
    },
  }));

  function handleChange(next: string) {
    const nl = next.indexOf('\n');
    if (nl >= 0) {
      const split = block.split(nl);
      shown.current = next.slice(0, nl) + next.slice(nl + 1);
      onEnter(split.head, split.tail);
      return;
    }

    const typed = block.type(next);
    shown.current = typed.plain;
    caret.current = typed.caret;
    setHeld({ start: typed.caret, end: typed.caret });
    onContext(typed.plain, typed.caret);
    report();
  }

  /** The foot of this block, in window coordinates. */
  function report() {
    if (!onCaretSpot) return;
    box.current?.measureInWindow((x, y, _w, h) => onCaretSpot({ x, y: y + h - 4, height: 4 }));
  }

  function handleKey(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    const key = e.nativeEvent.key;
    // Only a hardware keyboard sends Tab; soft keyboards have none to send.
    if (key === 'Tab') {
      if (onTab?.(false)) return;
      const put = tabText(block.plain, caret.current, caret.current, false);
      if (!put) return;
      const typed = block.type(put.text);
      shown.current = typed.plain;
      caret.current = typed.caret;
      setHeld({ start: typed.caret, end: typed.caret });
      onContext(typed.plain, typed.caret);
      return;
    }
    if (key === 'Backspace' && caret.current === 0) onBackspaceAtStart();
  }

  return (
    <TextInput
      ref={box}
      key={generation}
      multiline
      autoFocus={autoFocus}
      spellCheck={false}
      selection={selection ?? held ?? undefined}
      onChangeText={handleChange}
      onSelectionChange={(e) => {
        const now = e.nativeEvent.selection;
        block.moved(now.start);
        caret.current = now.start;
        setHeld(now);
        onSelection(now, block.marks(now.start, now.end));
      }}
      onKeyPress={handleKey}
      onFocus={() => {
        onFocus();
        report();
      }}
      placeholder={placeholder}
      placeholderTextColor={c.n400}
      selectionColor={c.accent}
      style={[styles.field, style]}
    >
      {block.runs.map((run, i) => (
        <Text key={i} style={styleOf(run.marks)}>
          {run.text}
        </Text>
      ))}
    </TextInput>
  );
});

/** Annotations as text styles. */
export function styleOf(marks: Marks): TextStyle[] {
  const out: TextStyle[] = [];
  if (marks.bold) out.push({ fontFamily: f.b800 });
  if (marks.em) out.push({ fontStyle: 'italic' });
  if (marks.strike) out.push({ textDecorationLine: 'line-through' });
  if (marks.mark) out.push({ backgroundColor: c.a200, color: c.a900 });
  if (marks.code) out.push({ fontFamily: f.mono, fontSize: 13.5, color: c.a800 });
  if (marks.tag) out.push({ fontFamily: f.b700, color: c.a700 });
  if (marks.mention) out.push({ fontFamily: f.b600, color: c.g800 });
  if (marks.link) out.push({ fontFamily: f.b600, color: c.a700, textDecorationLine: 'underline' });
  return out;
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    fontFamily: f.b400,
    fontSize: 15,
    lineHeight: 25,
    color: c.n900,
    padding: 0,
    textAlignVertical: 'top',
  },
});
