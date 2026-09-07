import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { SlashItem } from '../lib/typing';
import { c, f, shadow } from '../theme/tokens';

/** Where the caret is, in window coordinates. */
export type CaretSpot = { x: number; y: number; height: number };

const WIDTH = 244;
const ROW = 44;
const CHROME = 34;

/**
 * The block list a slash opens.
 *
 * It sits by the caret when the platform can say where that is, and falls back
 * to a panel above the keyboard when it cannot. The first row is highlighted,
 * so Return takes it without anything else being pressed.
 */
export function SlashMenu({
  hits,
  onPick,
  bottom,
  at,
  active = 0,
}: {
  hits: SlashItem[];
  onPick: (item: SlashItem) => void;
  /** Fallback position: above the keyboard. */
  bottom: number;
  /** The caret, when it is known. */
  at?: CaretSpot | null;
  /** Which row Return would take. */
  active?: number;
}) {
  const { width, height } = useWindowDimensions();
  if (!hits.length) return null;

  const shown = hits.slice(0, 5);
  const box = CHROME + shown.length * ROW;

  // By the caret, kept on screen, and flipped above the line when there is no
  // room under it.
  const spot = at
    ? {
        left: Math.max(12, Math.min(at.x, width - WIDTH - 12)),
        top: at.y + at.height + box + 12 > height ? Math.max(12, at.y - box - 8) : at.y + at.height + 6,
        width: WIDTH,
      }
    : { left: 18, right: 18, bottom };

  return (
    <View style={[styles.panel, spot]}>
      <Text style={styles.label}>Insert a block</Text>
      {shown.map((it, i) => (
        <Pressable
          key={it.key}
          onPress={() => onPick(it)}
          style={({ pressed }) => [
            styles.row,
            i === active && styles.rowOn,
            pressed && { backgroundColor: c.a200 },
          ]}
        >
          <View style={[styles.badge, i === active && styles.badgeOn]}>
            <Text style={styles.badgeText}>{it.badge}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {it.label}
          </Text>
          {i === active ? <Text style={styles.enter}>↵</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    backgroundColor: c.paper,
    borderRadius: 22,
    padding: 8,
    gap: 1,
    zIndex: 9,
    ...shadow.lg,
  },
  label: {
    fontFamily: f.b800,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: c.n500,
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 15, padding: 8 },
  rowOn: { backgroundColor: c.a100 },
  badge: {
    minWidth: 34,
    alignItems: 'center',
    backgroundColor: c.n200,
    borderRadius: 9,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  badgeOn: { backgroundColor: c.a200 },
  badgeText: { fontFamily: f.mono, fontSize: 11.5, color: c.n700 },
  title: { flex: 1, fontFamily: f.b700, fontSize: 13.5, color: c.text },
  enter: { fontFamily: f.b700, fontSize: 13, color: c.a600, paddingRight: 4 },
});
