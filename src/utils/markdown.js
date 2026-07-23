import { parse, serialize } from 'preact';

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

export function parseFrontmatter(content) {
  if (!content) return { title: '', tags: [], frontmatter: {}, body: content };

  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    return { title: '', tags: [], frontmatter: {}, body: content };
  }

  const fmText = match[1];
  const body = match[2];
  const frontmatter = {};

  fmText.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      const items = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
      frontmatter[key] = items;
    } else {
      value = value.replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  });

  const title = frontmatter.title || '';
  const tags = frontmatter.tags || [];

  return { title, tags, frontmatter, body };
}

export function buildFrontmatter(frontmatter, body) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  lines.push('');
  lines.push(body.trim());
  lines.push('');
  return lines.join('\n');
}

export function extractTitle(content) {
  const { title, body } = parseFrontmatter(content);
  if (title) return title;
  const headingMatch = body.match(/^#\s+(.+)$/m);
  return headingMatch ? headingMatch[1].trim() : 'Untitled';
}

export function extractPlainText(content, maxLen) {
  const { body } = parseFrontmatter(content);
  const plain = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*`_~>\-]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  if (maxLen && plain.length > maxLen) {
    return plain.substring(0, maxLen) + '...';
  }
  return plain;
}

export function getNoteFiles(items) {
  return items
    .filter((item) => item.kind === 'file' && item.name.endsWith('.md'))
    .map((item) => item.path);
}

export function getImageFiles(items) {
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
  return items
    .filter((item) => {
      if (item.kind !== 'file') return false;
      const ext = '.' + item.name.split('.').pop().toLowerCase();
      return imageExts.includes(ext);
    })
    .map((item) => item.path);
}
