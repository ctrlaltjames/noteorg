import { marked } from 'marked';
import Prism from 'prismjs';

// Load common languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Render markdown string to HTML with Prism.js syntax highlighting
 */
export function renderMarkdown(markdown) {
  const renderer = new marked.Renderer();

  // Override code block rendering with Prism.js syntax highlighting
  renderer.code = function (code, language) {
    const text = code.text || code;
    const validLang = language && Prism.languages[language];
    const highlighted = validLang
      ? Prism.highlight(text, Prism.languages[language], language)
      : text;

    return `<pre class="bg-dark-bg border border-dark-border rounded p-3 overflow-auto my-2"><code class="${
      language || ''
    } language-${language || 'text'} text-sm" ${
      validLang ? `data-language="${language}"` : ''
    }>${highlighted}</code></pre>`;
  };

  // Override inline code rendering
  renderer.code = renderer.code || function (code, language) {
    const text = code.text || code;
    const validLang = language && Prism.languages[language];
    const highlighted = validLang
      ? Prism.highlight(text, Prism.languages[language], language)
      : text;

    return `<pre class="bg-dark-bg border border-dark-border rounded p-3 overflow-auto my-2"><code class="${
      language || ''
    } language-${language || 'text'} text-sm">${highlighted}</code></pre>`;
  };

  return marked.parse(markdown || '');
}

/**
 * Get a plain text preview from markdown content
 */
export function getPreview(text, maxLength = 150) {
  if (!text) return '';
  const plain = text.replace(/[#*`_~\[\]]/g, '').replace(/\n+/g, ' ').trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trim() + '...';
}
