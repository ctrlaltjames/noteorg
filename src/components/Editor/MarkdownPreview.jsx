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

// Register html alias for markup (marked passes "html" but prism registers it as "markup")
Prism.languages.html = Prism.languages.markup;

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
    const grammar = Prism.languages[lang];
    if (grammar) {
      return Prism.highlight(code, grammar, lang);
    }
    return escapeHtml(code);
  } catch {
    return escapeHtml(code);
  }
}

marked.setOptions({
  breaks: true,
  gfm: true,
});

window.__copyCode = function(buttonEl) {
  const wrapper = buttonEl.closest('.code-block-wrapper');
  const code = wrapper ? wrapper.querySelector('code').textContent : '';
  navigator.clipboard.writeText(code).then(() => {
    const originalText = buttonEl.textContent;
    buttonEl.textContent = 'Copied!';
    setTimeout(() => {
      buttonEl.textContent = originalText;
    }, 1500);
  });
};

export default function MarkdownPreview({ content }) {
  const [html, setHtml] = useState('');

  const renderContent = useCallback(() => {
    if (!content) {
      setHtml('<p class="text-gray-400 italic">Nothing to preview</p>');
      return;
    }

    const renderer = new marked.Renderer();
    renderer.code = function (codeObj, language) {
      const code = typeof codeObj === 'string' ? codeObj : codeObj.text;
      const lang = typeof language === 'string' ? language : codeObj.lang;
      const displayLang = (lang || 'text').toUpperCase();
      const highlighted = highlightCode(code, lang);
      const uniqueId = 'cb-' + Math.random().toString(36).substr(2, 9);
      return `<div class="code-block-wrapper" id="${uniqueId}">
<div class="code-block-header"><span class="code-block-lang">${displayLang}</span><button class="code-block-copy" onclick="window.__copyCode(this)">Copy</button></div>
<pre><code class="language-${lang || 'text'}">${highlighted}</code></pre>
</div>\n`;
    };

    const out = marked.parse(content, { renderer });
    setHtml(out);
  }, [content]);

  useEffect(() => {
    renderContent();
  }, [content, renderContent]);

  return (
    <div
      className="markdown-preview"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
