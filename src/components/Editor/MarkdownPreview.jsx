import { useEffect, useRef, useState, useCallback } from 'preact/compat';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-java';

marked.setOptions({
  breaks: true,
  gfm: true,
});

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightCode(code, language) {
  if (!language) {
    return escapeHtml(code);
  }
  try {
    const lang = language.toLowerCase();
    if (Prism.languages[lang]) {
      return Prism.highlight(code, Prism.languages[lang], lang);
    }
    return escapeHtml(code);
  } catch {
    return escapeHtml(code);
  }
}

export default function MarkdownPreview({ content }) {
  const [html, setHtml] = useState('');
  const contentRef = useRef(null);

  const renderContent = useCallback(() => {
    if (!content) {
      setHtml('<p class="text-gray-400 italic">Nothing to preview</p>');
      return;
    }

    const tokens = marked.lexer(content, { highlight: null });
    const out = marked.parser(tokens, { highlight: null });
    setHtml(out);
  }, [content]);

  useEffect(() => {
    renderContent();
  }, [content, renderContent]);

  return (
    <div
      ref={contentRef}
      className="markdown-preview"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
