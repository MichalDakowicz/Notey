import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { c, f, shadow } from '../theme/tokens';

export type MentionHit = { id: string; title: string; nbName: string; tint: string };

export function MentionPicker({
  hits,
  onPick,
  bottom,
}: {
  hits: MentionHit[];
  onPick: (id: string) => void;
  bottom: number;
}) {
  if (!hits.length) return null;
  return (
    <View style={[styles.panel, { bottom }]}>
      <Text style={styles.label}>Link a note</Text>
      {hits.map((h) => (
        <Pressable
          key={h.id}
          onPress={() => onPick(h.id)}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.g100 }]}
        >
          <View style={[styles.dot, { backgroundColor: h.tint }]} />
          <Text style={styles.title} numberOfLines={1}>
            {h.title}
          </Text>
          <Text style={styles.nb} numberOfLines={1}>
            {h.nbName}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 18,
    right: 18,
    backgroundColor: c.paper,
    borderRadius: 26,
    padding: 10,
    gap: 2,
    zIndex: 9,
    ...shadow.lg,
  },
  label: {
    fontFamily: f.b800,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: c.n500,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, padding: 12 },
  dot: { width: 9, height: 9, borderRadius: 99 },
  title: { flex: 1, fontFamily: f.b700, fontSize: 14, color: c.text },
  nb: { fontFamily: f.b600, fontSize: 11, color: c.n500, maxWidth: 110 },
});
