'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Lightweight Markdown editor for blog post content.
 *
 * No new dependencies: a formatting toolbar that inserts Markdown syntax
 * into a textarea, plus a live preview rendered with the same bare
 * <ReactMarkdown> setup as the public /blog/[slug] page, so the preview
 * matches the published post. The stored value stays plain Markdown.
 */

type Mode = 'write' | 'preview' | 'split';

const toolbarBtnStyle: CSSProperties = {
  background: '#fff', color: '#111', border: '1px solid #ddd', borderRadius: 6,
  padding: '5px 9px', fontSize: 13, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap',
};

const tabBtnStyle = (active: boolean): CSSProperties => ({
  background: active ? '#111' : '#fff', color: active ? '#fff' : '#111',
  border: '1px solid #111', borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 600,
});

const editorBoxStyle: CSSProperties = {
  border: '1px solid #e5e5e5', borderRadius: 10, overflow: 'hidden', background: '#fff',
};

/** Mirror of the public blog page: a leading "# <title>" heading is dropped there. */
function stripLeadingTitle(content: string, title?: string): string {
  if (!title) return content;
  const lines = content.split('\n');
  if (lines[0]?.startsWith('# ')) {
    const heading = lines[0].slice(2).trim();
    if (heading.toLowerCase() === title.trim().toLowerCase()) {
      return lines.slice(1).join('\n').trimStart();
    }
  }
  return content;
}

export default function MarkdownEditor({
  value,
  onChange,
  title,
  rows = 14,
  minHeight = 240,
  placeholder = 'Write your blog post in Markdown…',
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Post title — used only so the preview drops a duplicated leading H1, like the public page. */
  title?: string;
  rows?: number;
  /** Minimum height (px) of the write/preview panes — smaller for short fields like excerpts. */
  minHeight?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const [mode, setMode] = useState<Mode>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = useMemo(() => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    return value.trim() === '' ? 0 : words.length;
  }, [value]);

  const previewContent = useMemo(() => stripLeadingTitle(value, title), [value, title]);

  /** Replace the current selection (or insert at the cursor) and put the caret back. */
  function applyEdit(newValue: string, selStart: number, selEnd: number): void {
    onChange(newValue);
    // The textarea is controlled by the parent, so wait a tick for the DOM value to update.
    window.setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    }, 0);
  }

  function wrapSelection(before: string, after: string, placeholderText: string): void {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const text = selected || placeholderText;
    const newValue = value.slice(0, start) + before + text + after + value.slice(end);
    applyEdit(newValue, start + before.length, start + before.length + text.length);
  }

  function prefixLines(prefix: string | ((i: number) => string)): void {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || 'List item';
    const lines = selected.split('\n');
    const prefixed = lines.map((line, i) => {
      const p = typeof prefix === 'function' ? prefix(i) : prefix;
      return line.trim() === '' ? line : p + line;
    });
    const newValue = value.slice(0, start) + prefixed.join('\n') + value.slice(end);
    applyEdit(newValue, start, start + prefixed.join('\n').length);
  }

  function insertAtCursor(snippet: string, selectFrom = 0, selectTo?: number): void {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newValue = value.slice(0, start) + snippet + value.slice(end);
    const to = selectTo ?? snippet.length;
    applyEdit(newValue, start + selectFrom, start + to);
  }

  function handleToolbar(action: string): void {
    switch (action) {
      case 'bold': wrapSelection('**', '**', 'bold text'); break;
      case 'italic': wrapSelection('*', '*', 'italic text'); break;
      case 'code': wrapSelection('`', '`', 'code'); break;
      case 'h2': prefixLines('## '); break;
      case 'h3': prefixLines('### '); break;
      case 'quote': prefixLines('> '); break;
      case 'ul': prefixLines('- '); break;
      case 'ol': prefixLines((i) => `${i + 1}. `); break;
      case 'link': wrapSelection('[', '](https://example.com)', 'link text'); break;
      case 'codeblock': {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = value.slice(start, end) || 'code';
        const block = `\`\`\`\n${selected}\n\`\`\``;
        const newValue = value.slice(0, start) + block + value.slice(end);
        applyEdit(newValue, start + 4, start + 4 + selected.length);
        break;
      }
      case 'hr': insertAtCursor('\n\n---\n\n'); break;
      default: break;
    }
  }

  const tools: { action: string; label: string; hint: string }[] = [
    { action: 'bold', label: 'B', hint: 'Bold' },
    { action: 'italic', label: 'I', hint: 'Italic' },
    { action: 'h2', label: 'H2', hint: 'Heading 2' },
    { action: 'h3', label: 'H3', hint: 'Heading 3' },
    { action: 'ul', label: '• List', hint: 'Bullet list' },
    { action: 'ol', label: '1. List', hint: 'Numbered list' },
    { action: 'link', label: '🔗 Link', hint: 'Link' },
    { action: 'quote', label: '❝ Quote', hint: 'Quote' },
    { action: 'code', label: '</> Code', hint: 'Inline code' },
    { action: 'codeblock', label: '{ } Block', hint: 'Code block' },
    { action: 'hr', label: '― Rule', hint: 'Horizontal rule' },
  ];

  const showEditor = mode === 'write' || mode === 'split';
  const showPreview = mode === 'preview' || mode === 'split';

  const textarea = (
    <textarea
      ref={textareaRef}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      style={{
        width: '100%', minHeight, border: 'none', borderRadius: 0,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14,
        lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
      }}
    />
  );

  const preview = (
    <div
      style={{
        padding: '12px 16px', minHeight, fontSize: 15, lineHeight: 1.7,
        overflow: 'auto', background: '#fafafa',
      }}
    >
      {value.trim() === '' ? (
        <p style={{ color: '#999', margin: 0 }}>Nothing to preview yet — start writing.</p>
      ) : (
        <ReactMarkdown>{previewContent}</ReactMarkdown>
      )}
    </div>
  );

  return (
    <div style={editorBoxStyle}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, borderBottom: '1px solid #eee', background: '#f9f9f9' }}>
        {tools.map((t) => (
          <button
            key={t.action}
            type="button"
            title={t.hint}
            aria-label={t.hint}
            style={toolbarBtnStyle}
            onClick={() => handleToolbar(t.action)}
          >
            {t.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button type="button" style={tabBtnStyle(mode === 'write')} onClick={() => setMode('write')}>Write</button>
        <button type="button" style={tabBtnStyle(mode === 'split')} onClick={() => setMode('split')}>Split</button>
        <button type="button" style={tabBtnStyle(mode === 'preview')} onClick={() => setMode('preview')}>Preview</button>
      </div>

      {mode === 'split' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ borderRight: '1px solid #eee' }}>{textarea}</div>
          {preview}
        </div>
      ) : showEditor ? (
        textarea
      ) : (
        preview
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 12px',
        borderTop: '1px solid #eee', fontSize: 12, color: '#666', background: '#f9f9f9',
      }}>
        <span>{wordCount} words · {value.length} characters</span>
        <span>Markdown — renders the same as the published post</span>
      </div>
    </div>
  );
}
