import Fuse from 'fuse.js';
import { parseFrontmatter, extractPlainText } from './markdown';

const SEARCH_INDEX_KEY = 'noteorg.searchIndex';

function buildIndex(notes) {
  const indexData = notes.map((note) => ({
    path: note.path,
    name: note.name,
    title: note.title || '',
    content: note.content || '',
    tags: note.tags || [],
    plainText: extractPlainText(note.content, 2000),
    type: note.type || 'note',
  }));

  return new Fuse(indexData, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'name', weight: 0.3 },
      { name: 'plainText', weight: 0.3 },
      { name: 'tags', weight: 0.5 },
    ],
    includeScore: true,
    includeMatches: true,
    threshold: 0.35,
    minMatchCharLength: 2,
    ignoreLocation: true,
    distance: 100,
    shouldSort: true,
    findAllMatches: false,
    useExtendedSearch: true,
    isCaseSensitive: false,
    sortFn: (a, b) => {
      const scoreDiff = (b.item._score || 0) - (a.item._score || 0);
      if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
      return (a.item.title || '').localeCompare(b.item.title || '');
    },
  });
}

export function indexNotes(notes) {
  const index = buildIndex(notes);
  try {
    const serialized = notes.map((n) => ({
      path: n.path,
      name: n.name,
      title: n.title,
      tags: n.tags,
      content: n.content,
      type: n.type,
    }));
    localStorage.setItem(SEARCH_INDEX_KEY, JSON.stringify(serialized));
  } catch (e) {
    // ignore storage errors
  }
  return index;
}

export function loadCachedIndex() {
  try {
    const cached = localStorage.getItem(SEARCH_INDEX_KEY);
    if (cached) {
      const notes = JSON.parse(cached);
      return { index: buildIndex(notes), notes };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function search(index, query) {
  if (!index || !query || query.length < 2) return [];
  const results = index.search(query);
  return results
    .filter((r) => (r.score || 0) < 0.5)
    .slice(0, 20)
    .map((r) => ({
      path: r.item.path,
      name: r.item.name,
      title: r.item.title,
      tags: r.item.tags,
      content: r.item.content,
      plainText: r.item.plainText,
      type: r.item.type,
      score: Math.round((r.score || 0) * 100),
      matches: r.matches || [],
    }));
}

export function searchByTag(notes, tag) {
  return notes.filter((note) => {
    const tags = note.tags || [];
    return tags.some((t) => t.toLowerCase() === tag.toLowerCase());
  });
}

export function getAllTags(notes) {
  const tagMap = new Map();
  for (const note of notes) {
    const tags = note.tags || [];
    for (const tag of tags) {
      const lower = tag.toLowerCase();
      if (tagMap.has(lower)) {
        tagMap.get(lower).count++;
      } else {
        tagMap.set(lower, { tag, count: 1, display: tag });
      }
    }
  }
  return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
}

export function getTagColor(tag) {
  const colors = [
    'bg-red-100 text-red-700',
    'bg-orange-100 text-orange-700',
    'bg-amber-100 text-amber-700',
    'bg-green-100 text-green-700',
    'bg-teal-100 text-teal-700',
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-gray-100 text-gray-700',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
