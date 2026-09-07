import { useRouter, usePathname } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Blob } from './Blob';
import { LogoMark } from './Logo';
import { Icon, type IconName } from './Icon';
import { initialsOf, useAuth } from '../lib/auth';
import { useStore } from '../lib/store';
import { relative } from '../lib/time';
import { c, f, NAV_OFF, NAV_ON, shadow, tintOf } from '../theme/tokens';

/**
 * The desktop half of the design: the islands unroll into a rail, and the
 * notebook list and note list become permanent columns beside the note.
 */
export function DesktopChrome({ onProfile }: { onProfile: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { notebooks, notes, tagCounts, search, notebookById, createNote } = useStore();
  const { profile, user, avatarUrl } = useAuth();

  const [nbFilter, setNbFilter] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const segment = pathname.split('/')[1] ?? '';
  const selectedId = pathname.split('/')[2];
  const list = search(q, nbFilter);

  const railTone = (on: boolean) => (on ? NAV_ON : NAV_OFF);

  const railButtons: { icon: IconName; label: string; on: boolean; go: () => void }[] = [
    {
      icon: 'calendar',
      label: 'Today',
      on: segment === 'today',
      go: () => {
        setNbFilter(null);
        router.replace('/today');
      },
    },
    {
      icon: 'book',
      label: 'Notebooks',
      on: segment === 'shelf' || segment === 'notebook',
      go: () => router.replace('/shelf'),
    },
    {
      icon: 'search',
      label: 'Search',
      on: segment === 'search',
      go: () => router.replace('/search'),
    },
    {
      icon: 'tag',
      label: 'Tags',
      on: segment === 'tags',
      go: () => router.replace('/tags'),
    },
    {
      icon: 'graph',
      label: 'Link map',
      on: segment === 'graph',
      go: () => router.replace('/graph'),
    },
  ];

  async function newNote() {
    const target = nbFilter ?? notebooks[0]?.id;
    if (!target) {
      router.replace('/shelf');
      return;
    }
    const made = await createNote(target);
    if (made) router.replace(`/editor/${made.id}`);
  }

  return (
    <>
      <View style={styles.rail}>
        <LogoMark size={40} elevated={false} />

        <View style={styles.railIsland}>
          {railButtons.map((b) => {
            const tone = railTone(b.on);
            return (
              <Pressable
                key={b.label}
                accessibilityLabel={b.label}
                onPress={b.go}
                style={[styles.railButton, { backgroundColor: tone.bg }]}
              >
                <Icon name={b.icon} size={20} color={tone.fg} />
              </Pressable>
            );
          })}
        </View>

        <Pressable accessibilityLabel="Profile" onPress={onProfile}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <Blob size={44} color={c.a300}>
              <Text style={styles.initials}>
                {initialsOf(profile?.full_name || user?.email || '')}
              </Text>
            </Blob>
          )}
        </Pressable>
      </View>

      <View style={styles.notebookColumn}>
        <Text style={styles.columnTitle}>Notebooks</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
          <Pressable
            onPress={() => setNbFilter(null)}
            style={[styles.nbRow, !nbFilter && { backgroundColor: c.paper }]}
          >
            <Blob size={11} color={c.n400} />
            <Text style={styles.nbName}>All notes</Text>
            <Text style={styles.nbCount}>{notes.length}</Text>
          </Pressable>

          {notebooks.map((nb) => {
            const tone = tintOf(nb.tint);
            const count = notes.filter((n) => n.notebook_id === nb.id).length;
            return (
              <Pressable
                key={nb.id}
                onPress={() => {
                  setNbFilter(nb.id);
                  router.replace(`/notebook/${nb.id}`);
                }}
                style={[styles.nbRow, nbFilter === nb.id && { backgroundColor: c.paper }]}
              >
                <Blob size={11} color={tone.tint} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.nbName} numberOfLines={1}>
                    {nb.name}
                  </Text>
                  <Text style={styles.nbCode}>{nb.code}</Text>
                </View>
                <Text style={styles.nbCount}>{count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ gap: 8 }}>
          <Text style={styles.kicker}>Tags</Text>
          <View style={styles.tagWrap}>
            {tagCounts.slice(0, 12).map((t) => (
              <Pressable
                key={t.name}
                onPress={() => {
                  setQ('#' + t.name);
                  setNbFilter(null);
                }}
                style={styles.tag}
              >
                <Text style={styles.tagText}>#{t.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.listColumn}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={c.n500} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search all notes"
              placeholderTextColor={c.n500}
              selectionColor={c.accent}
              style={styles.searchInput}
            />
          </View>
          <Pressable accessibilityLabel="New note" onPress={newNote} style={styles.newNote}>
            <Icon name="plus" size={18} color={c.paper} />
          </Pressable>
        </View>

        <Text style={styles.kicker}>
          {nbFilter
            ? notebookById(nbFilter)?.name ?? 'Notebook'
            : q.trim()
              ? `${list.length} found`
              : 'All notes'}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {list.map((n) => {
            const tone = tintOf(notebookById(n.notebook_id)?.tint ?? 0);
            const on = n.id === selectedId;
            return (
              <Pressable
                key={n.id}
                onPress={() => router.replace(`/note/${n.id}`)}
                style={[styles.noteRow, on && { backgroundColor: c.paper, ...shadow.sm }]}
              >
                <View style={styles.noteRowHead}>
                  <View style={[styles.dot, { backgroundColor: tone.tint }]} />
                  <Text style={[styles.noteRowNb, { color: tone.dark }]} numberOfLines={1}>
                    {notebookById(n.notebook_id)?.name ?? 'Notebook'}
                  </Text>
                  <Text style={styles.noteRowWhen}>{relative(n.updated_at)}</Text>
                </View>
                <Text style={styles.noteRowTitle} numberOfLines={2}>
                  {n.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 82,
    backgroundColor: c.n200,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 22,
    paddingBottom: 20,
  },
  railIsland: {
    gap: 3,
    backgroundColor: c.paper,
    borderRadius: 999,
    padding: 5,
    ...shadow.sm,
  },
  railButton: { width: 48, height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 999 },
  initials: { fontFamily: f.head, fontSize: 13, color: c.a900 },

  notebookColumn: {
    width: 244,
    paddingVertical: 26,
    paddingHorizontal: 18,
    gap: 14,
    borderRightWidth: 1,
    borderRightColor: c.n300,
  },
  columnTitle: { fontFamily: f.head, fontSize: 19, color: c.text },
  nbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  nbName: { flex: 1, fontFamily: f.b700, fontSize: 13.5, color: c.text },
  nbCode: { fontFamily: f.b600, fontSize: 11, color: c.n500 },
  nbCount: { fontFamily: f.b700, fontSize: 11.5, color: c.n500 },
  kicker: {
    fontFamily: f.b800,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: c.n500,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { backgroundColor: c.a100, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 },
  tagText: { fontFamily: f.b700, fontSize: 11.5, color: c.a700 },

  listColumn: {
    width: 310,
    paddingVertical: 26,
    paddingHorizontal: 18,
    gap: 14,
    borderRightWidth: 1,
    borderRightColor: c.n300,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: c.n100,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  searchInput: { flex: 1, fontFamily: f.b500, fontSize: 13.5, color: c.text, padding: 0 },
  newNote: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  noteRow: { borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16, gap: 5 },
  noteRowHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 99 },
  noteRowNb: {
    flex: 1,
    fontFamily: f.b800,
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  noteRowWhen: { fontFamily: f.b600, fontSize: 11, color: c.n500 },
  noteRowTitle: { fontFamily: f.b700, fontSize: 14.5, lineHeight: 19, color: c.text },
});
