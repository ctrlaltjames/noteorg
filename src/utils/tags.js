const TAGS_STORAGE_KEY = 'noteorg.tags';

export function loadTags() {
  try {
    const stored = localStorage.getItem(TAGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveTags(tags) {
  try {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
  } catch (e) {
    // ignore
  }
}

export function addTag(tags, tagName) {
  if (!tagName || tagName.trim().length === 0) return tags;
  const normalized = tagName.trim().toLowerCase();
  if (tags.some((t) => t.toLowerCase() === normalized)) return tags;

  const newTags = [...tags, { name: tagName.trim(), color: generateColor(tags) }];
  saveTags(newTags);
  return newTags;
}

export function removeTag(tags, tagName) {
  const filtered = tags.filter((t) => t.name !== tagName);
  saveTags(filtered);
  return filtered;
}

export function updateTag(tags, oldName, newName) {
  return tags.map((t) =>
    t.name === oldName ? { ...t, name: newName } : t
  );
}

export function getAllTagsFromNotes(notes) {
  const tagMap = new Map();
  for (const note of notes) {
    const noteTags = note.tags || [];
    for (const tag of noteTags) {
      const lower = tag.toLowerCase();
      if (tagMap.has(lower)) {
        tagMap.get(lower).count++;
      } else {
        const existing = tags.find((t) => t.name.toLowerCase() === lower);
        tagMap.set(lower, {
          tag: tag,
          count: 1,
          color: existing?.color || generateColor(Array.from(tagMap.values())),
        });
      }
    }
  }
  return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
}

export function getNoteTags(content) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  if (!match) return [];

  const fmText = match[1];
  const tagsMatch = fmText.match(/tags:\s*\[([^\]]*)\]/);
  if (!tagsMatch) return [];

  return tagsMatch[1]
    .split(',')
    .map((t) => t.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

export function setNoteTags(content, tags) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  if (!match) return content;

  const fmText = match[1];
  const body = match[2];
  const tagsLine = `tags: [${tags.join(', ')}]`;

  if (fmText.includes('tags:')) {
    const updatedFm = fmText.replace(/tags:\s*\[([^\]]*)\]/, tagsLine);
    return `---\n${updatedFm}\n---\n${body}`;
  }

  const insertIndex = fmText.lastIndexOf('\n') + 1;
  const updatedFm = fmText.slice(0, insertIndex) + tagsLine + '\n' + fmText.slice(insertIndex);
  return `---\n${updatedFm}\n---\n${body}`;
}

function generateColor(tags) {
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
  const hash = tags.length * 7 + Date.now();
  return colors[Math.abs(hash) % colors.length];
}
