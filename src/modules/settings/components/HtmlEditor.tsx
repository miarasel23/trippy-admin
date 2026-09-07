import React, { useRef, useEffect, useState } from 'react';

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  initialTheme?: 'dark' | 'light';
}

export const HtmlEditor: React.FC<HtmlEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write or paste policy content here...',
  minHeight = '320px',
  initialTheme = 'dark',
}) => {
  const [mode, setMode] = useState<'visual' | 'code' | 'preview'>('visual');
  const [theme, setTheme] = useState<'dark' | 'light'>(initialTheme);
  const editableRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Sync value to editable div when external value changes or mode changes
  useEffect(() => {
    if (mode === 'visual' && editableRef.current) {
      if (!isInternalUpdate.current && editableRef.current.innerHTML !== value) {
        editableRef.current.innerHTML = value || '';
      }
    }
    isInternalUpdate.current = false;
  }, [value, mode]);

  // Handle visual editor input
  const handleInput = () => {
    if (editableRef.current) {
      isInternalUpdate.current = true;
      const html = editableRef.current.innerHTML;
      onChange(html);
    }
  };

  // Execute formatting commands
  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (mode !== 'visual') return;
    if (editableRef.current) {
      editableRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleFormatBlock = (tag: string) => {
    executeCommand('formatBlock', tag);
  };

  const handleInsertLink = () => {
    const url = prompt('Enter URL link (e.g. https://example.com):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl overflow-hidden border transition-colors flex flex-col shadow-md ${
        isDark
          ? 'bg-black border-gray-800 text-gray-100'
          : 'bg-white border-gray-200 text-gray-800'
      }`}
    >
      {/* Top Toolbar */}
      <div
        className={`p-2.5 flex flex-wrap items-center justify-between gap-1.5 select-none shrink-0 border-b ${
          isDark
            ? 'bg-[#111827] border-gray-800 text-gray-200'
            : 'bg-gray-50/95 border-gray-200 text-gray-700'
        }`}
      >
        {/* Formatting Actions (Active only in visual mode) */}
        <div
          className={`flex flex-wrap items-center gap-1 ${
            mode !== 'visual' ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          {/* Heading / Block selector */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleFormatBlock(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className={`text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none cursor-pointer border transition ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-1 focus:ring-blue-500'
                : 'bg-white border-gray-200 text-gray-700 focus:ring-1 focus:ring-blue-500'
            }`}
            title="Block Formatting"
          >
            <option value="" disabled>
              Format
            </option>
            <option value="<p>">Normal Paragraph</option>
            <option value="<h1>">Heading 1</option>
            <option value="<h2>">Heading 2</option>
            <option value="<h3>">Heading 3</option>
            <option value="<pre>">Code Block</option>
          </select>

          <span
            className={`w-px h-5 mx-0.5 ${
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            }`}
          />

          {/* Bold, Italic, Underline, Strikethrough */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('bold');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Bold (Ctrl+B)"
          >
            <i className="fa fa-bold"></i>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('italic');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Italic (Ctrl+I)"
          >
            <i className="fa fa-italic"></i>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('underline');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Underline (Ctrl+U)"
          >
            <i className="fa fa-underline"></i>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('strikeThrough');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Strikethrough"
          >
            <i className="fa fa-strikethrough"></i>
          </button>

          <span
            className={`w-px h-5 mx-0.5 ${
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            }`}
          />

          {/* Bulleted & Numbered Lists */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('insertUnorderedList');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Bullet List"
          >
            <i className="fa fa-list-ul"></i>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('insertOrderedList');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Numbered List"
          >
            <i className="fa fa-list-ol"></i>
          </button>

          <span
            className={`w-px h-5 mx-0.5 ${
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            }`}
          />

          {/* Text Alignment */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('justifyLeft');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Align Left"
          >
            <i className="fa fa-align-left"></i>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('justifyCenter');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Align Center"
          >
            <i className="fa fa-align-center"></i>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('justifyRight');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Align Right"
          >
            <i className="fa fa-align-right"></i>
          </button>

          <span
            className={`w-px h-5 mx-0.5 ${
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            }`}
          />

          {/* Link, Divider, Clear formatting */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleInsertLink();
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Insert Link"
          >
            <i className="fa fa-link"></i>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('insertHorizontalRule');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Horizontal Divider"
          >
            <i className="fa fa-minus"></i>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('removeFormat');
            }}
            className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-xs transition ${
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-rose-400'
                : 'text-gray-700 hover:bg-gray-200/80'
            }`}
            title="Clear Formatting"
          >
            <i className="fa fa-eraser text-rose-500"></i>
          </button>
        </div>

        {/* Right side: Theme Switcher & Mode Switcher */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 border ${
              isDark
                ? 'bg-gray-800/90 border-gray-700 text-amber-300 hover:bg-gray-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100 shadow-2xs'
            }`}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Black/Dark Theme'}
          >
            <i className={`fa ${isDark ? 'fa-sun-o text-amber-300' : 'fa-moon-o text-indigo-600'}`}></i>
            <span className="text-[10px] font-bold">{isDark ? 'Black' : 'Light'}</span>
          </button>

          {/* Mode Switcher: Visual WYSIWYG, HTML Code, Live Preview */}
          <div
            className={`flex items-center gap-0.5 p-0.5 rounded-lg text-xs border ${
              isDark
                ? 'bg-gray-900 border-gray-800'
                : 'bg-gray-200/80 border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setMode('visual')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                mode === 'visual'
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-blue-600 shadow-xs'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Visual WYSIWYG Editor"
            >
              <i className="fa fa-font"></i>
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('code')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                mode === 'code'
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-blue-600 shadow-xs'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="HTML Source Code"
            >
              <i className="fa fa-code"></i>
              <span>HTML Code</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                mode === 'preview'
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-blue-600 shadow-xs'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Live Rendered Preview"
            >
              <i className="fa fa-eye"></i>
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body */}
      <div
        className={`relative flex-1 transition-colors ${
          isDark ? 'bg-black text-gray-100' : 'bg-white text-gray-800'
        }`}
        style={{ minHeight }}
      >
        {mode === 'visual' && (
          <div
            ref={editableRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            className={`p-4 outline-none text-xs leading-relaxed overflow-y-auto max-h-[420px] focus:outline-none transition-colors ${
              isDark
                ? 'text-gray-100 bg-black selection:bg-blue-600 selection:text-white'
                : 'text-gray-800 bg-white selection:bg-blue-100'
            }`}
            style={{ minHeight }}
            data-placeholder={placeholder}
          />
        )}

        {mode === 'code' && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Edit raw HTML code..."
            className={`w-full p-4 font-mono text-xs leading-relaxed outline-none resize-y max-h-[420px] ${
              isDark
                ? 'bg-black text-emerald-400 selection:bg-emerald-900 selection:text-white'
                : 'bg-slate-900 text-slate-100 selection:bg-slate-700'
            }`}
            style={{ minHeight }}
          />
        )}

        {mode === 'preview' && (
          <div
            className={`p-4 text-xs leading-relaxed overflow-y-auto max-h-[420px] transition-colors ${
              isDark ? 'bg-[#030712] text-gray-100' : 'bg-gray-50/50 text-gray-800'
            }`}
            style={{ minHeight }}
          >
            {value ? (
              <div
                className={isDark ? 'prose-invert' : ''}
                dangerouslySetInnerHTML={{ __html: value }}
              />
            ) : (
              <span className="text-gray-400 italic">Nothing to preview</span>
            )}
          </div>
        )}
      </div>

      {/* Editor Footer / Info */}
      <div
        className={`px-3 py-1.5 border-t flex items-center justify-between text-[10px] shrink-0 transition-colors ${
          isDark
            ? 'bg-[#111827] border-gray-800 text-gray-400'
            : 'bg-gray-50 border-gray-100 text-gray-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <span>
            Mode: <strong className="uppercase font-semibold text-blue-400">{mode}</strong>
          </span>
          <span className="text-gray-600">•</span>
          <span>
            Theme: <strong className="uppercase font-semibold text-amber-300">{theme}</strong>
          </span>
        </div>
        <span>
          {value ? `${value.length} characters` : 'Empty content'}
        </span>
      </div>
    </div>
  );
};

export default HtmlEditor;
