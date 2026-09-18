/**
 * Caret arithmetic for the web editor: character offsets into a block, in and
 * out of the DOM the spans are drawn as.
 *
 * Only ever imported from LiveField.web.tsx, so nothing here reaches a native
 * bundle. Offsets count the text as stored, markers included, which is why
 * every character has to live inside a span.
 */

/** How many characters of `root` come before (node, nodeOffset). */
export function offsetOf(root: Node, node: Node, nodeOffset: number): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  try {
    range.setEnd(node, nodeOffset);
  } catch {
    return 0;
  }
  return range.toString().length;
}

/** The current selection as offsets, or null when it is somewhere else. */
export function readRange(root: Node): { start: number; end: number } | null {
  const sel = typeof window === 'undefined' ? null : window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return null;
  return {
    start: offsetOf(root, range.startContainer, range.startOffset),
    end: offsetOf(root, range.endContainer, range.endOffset),
  };
}

/**
 * Put the caret (or a selection) `start`..`end` characters into `root`, by
 * walking its text nodes until the count is reached.
 */
export function putCaret(root: Node, start: number, end: number): void {
  const doc = root.ownerDocument ?? document;
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const range = doc.createRange();
  let seen = 0;
  let opened = false;
  let closed = false;
  let node = walker.nextNode();

  while (node) {
    const len = node.textContent?.length ?? 0;
    if (!opened && seen + len >= start) {
      range.setStart(node, Math.max(0, start - seen));
      opened = true;
    }
    if (opened && !closed && seen + len >= end) {
      range.setEnd(node, Math.max(0, end - seen));
      closed = true;
      break;
    }
    seen += len;
    node = walker.nextNode();
  }

  if (!opened) {
    // Past the end, or nothing to walk: sit at the very end of the block.
    range.selectNodeContents(root);
    range.collapse(false);
  } else if (!closed) {
    range.setEnd(range.startContainer, range.startOffset);
  }

  const sel = (doc.defaultView ?? window).getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}
