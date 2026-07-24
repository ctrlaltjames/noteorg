import { useState, useRef, useEffect } from 'preact/hooks';

export default function InlineMenu({ anchor, mode, text, selectionStart, selectionEnd, onFormat, onClose }) {
  const [showHeading, setShowHeading] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const getLineRange = (pos) => {
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    const lineEnd = text.indexOf('\n', pos);
    return {
      start: lineStart,
      end: lineEnd === -1 ? text.length : lineEnd,
    };
  };

  const trimSelection = (txt, s, e) => {
    let start = s, end = e;
    while (start < end && /\s/.test(txt[start])) start++;
    while (end > start && /\s/.test(txt[end - 1])) end--;
    return { start, end };
  };

  const applyFormat = (type) => {
    const isSelection = selectionStart !== selectionEnd;
    let start, end;
    if (isSelection) {
      ({ start, end } = trimSelection(text, selectionStart, selectionEnd));
    } else {
      ({ start, end } = getLineRange(selectionStart));
    }

    const lineText = text.substring(start, end);
    let newText, newStart, newEnd;

    switch (type) {
      case 'bold':
        newText = text.substring(0, start) + '**' + lineText + '**' + text.substring(end);
        newStart = start + 2;
        newEnd = end + 2;
        break;
      case 'italic':
        newText = text.substring(0, start) + '*' + lineText + '*' + text.substring(end);
        newStart = start + 1;
        newEnd = end + 1;
        break;
      case 'code':
        newText = text.substring(0, start) + '`' + lineText + '`' + text.substring(end);
        newStart = start + 1;
        newEnd = end + 1;
        break;
      case 'strikethrough':
        newText = text.substring(0, start) + '~~' + lineText + '~~' + text.substring(end);
        newStart = start + 2;
        newEnd = end + 2;
        break;
      case 'quote':
        newText = text.substring(0, start) + '> ' + lineText + text.substring(end);
        newStart = start + 2;
        newEnd = end + 2;
        break;
      case 'bullet':
        newText = text.substring(0, start) + '- ' + lineText + text.substring(end);
        newStart = start + 2;
        newEnd = end + 2;
        break;
      case 'numbered':
        newText = text.substring(0, start) + '1. ' + lineText + text.substring(end);
        newStart = start + 3;
        newEnd = end + 3;
        break;
      case 'link':
        newText = text.substring(0, start) + '[' + lineText + ']()' + text.substring(end);
        newStart = start + 1;
        newEnd = start + lineText.length + 1;
        break;
      default:
        return;
    }

    onFormat(newText, newStart, newEnd);
    onClose();
  };

  const applyHeading = (level) => {
    const { start, end } = getLineRange(selectionStart);
    const lineText = text.substring(start, end);
    const newPrefix = '#'.repeat(level) + ' ';

    let strippedText = lineText;
    for (let i = 6; i >= 1; i--) {
      const existingPrefix = '#'.repeat(i) + ' ';
      if (lineText.startsWith(existingPrefix)) {
        strippedText = lineText.substring(existingPrefix.length).trimStart();
        break;
      }
    }

    const newText = text.substring(0, start) + newPrefix + strippedText + text.substring(end);
    const newCursor = start + newPrefix.length;

    onFormat(newText, newCursor, newCursor);
    onClose();
  };

  const MENU_WIDTH = 230;
  const MENU_HEIGHT = showHeading ? 180 : 160;

  let menuX = anchor.x;
  let menuY = anchor.y;

  if (menuX + MENU_WIDTH > window.innerWidth - 16) {
    menuX = anchor.x - MENU_WIDTH;
  }
  if (menuY + MENU_HEIGHT > window.innerHeight - 16) {
    menuY = anchor.y - MENU_HEIGHT;
  }
  menuX = Math.max(8, menuX);
  menuY = Math.max(8, menuY);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: menuX,
        top: menuY,
        zIndex: 1000,
      }}
      className="rounded-lg shadow-lg border theme-bg-panel overflow-hidden"
    >
      <div class="grid grid-cols-3 gap-1 p-2">
        <button
          onClick={() => applyFormat('bold')}
          class="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
        >
          <span class="font-bold text-sm">B</span>
          <span class="text-[10px] opacity-60 mt-0.5">Ctrl+B</span>
        </button>

        <button
          onClick={() => applyFormat('italic')}
          class="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
        >
          <span class="italic text-sm">I</span>
          <span class="text-[10px] opacity-60 mt-0.5">Ctrl+I</span>
        </button>

        <button
          onClick={() => applyFormat('code')}
          class="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
        >
          <span class="text-xs font-mono">&lt;/&gt;</span>
          <span class="text-[10px] opacity-60 mt-0.5">Ctrl+`</span>
        </button>

        <button
          onClick={() => setShowHeading(!showHeading)}
          class="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
        >
          <span class="text-sm font-bold">
            H<span class="text-[8px] ml-0.5">{showHeading ? '\u25B2' : '\u25BC'}</span>
          </span>
          <span class="text-[10px] opacity-60 mt-0.5">Ctrl+H</span>
        </button>

        <button
          onClick={() => applyFormat('quote')}
          class="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
        >
          <span class="text-sm">&gt;</span>
          <span class="text-[10px] opacity-60 mt-0.5">Ctrl+&gt;</span>
        </button>

        <button
          onClick={() => applyFormat('bullet')}
          class="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
        >
          <span class="text-sm">\u2022</span>
          <span class="text-[10px] opacity-60 mt-0.5">Ctrl+8</span>
        </button>

        <button
          onClick={() => applyFormat('numbered')}
          class="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
        >
          <span class="text-sm">1.</span>
          <span class="text-[10px] opacity-60 mt-0.5">Ctrl+7</span>
        </button>

        <button
          onClick={() => applyFormat('link')}
          class="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
        >
          <span class="text-sm">🔗</span>
          <span class="text-[10px] opacity-60 mt-0.5">Ctrl+K</span>
        </button>

        <button
          onClick={() => applyFormat('strikethrough')}
          class="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
        >
          <span class="text-sm line-through">S</span>
          <span class="text-[10px] opacity-60 mt-0.5">Ctrl+X</span>
        </button>
      </div>

      {showHeading && (
        <div class="border-t theme-border">
          <div class="grid grid-cols-3 gap-1 p-2">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <button
                key={level}
                onClick={() => applyHeading(level)}
                class="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 transition-colors theme-text-secondary hover:theme-text"
              >
                <span class="text-sm font-bold">H{level}</span>
                <span class="text-[10px] opacity-60 mt-0.5">Ctrl+{level}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
