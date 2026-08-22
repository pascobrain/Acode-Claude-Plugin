import { escapeHtml, copyToClipboard } from "./utils.js";

/**
 * Very small, dependency-free Markdown renderer tuned for chat replies.
 * Handles fenced code blocks (with copy / insert actions), inline code,
 * bold, italics, headings and simple lists. Everything is HTML-escaped
 * before any formatting is applied, so model output cannot inject markup.
 *
 * @param {string} text
 * @param {{ onInsert?: (code: string) => void }} [opts]
 * @returns {HTMLElement}
 */
export function renderMarkdown(text, opts = {}) {
  const container = document.createElement("div");
  container.className = "claude-md";
  for (const part of splitFences(text)) {
    if (part.type === "code") {
      container.appendChild(codeBlock(part.lang, part.code, opts.onInsert));
    } else if (part.text.trim()) {
      renderProse(part.text, container);
    }
  }
  return container;
}

/** Split text into interleaved prose / fenced-code segments. */
function splitFences(text) {
  const parts = [];
  const re = /```([^\n`]*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", text: text.slice(last, m.index) });
    }
    parts.push({ type: "code", lang: m[1].trim(), code: m[2].replace(/\n$/, "") });
    last = re.lastIndex;
  }
  if (last < text.length) {
    parts.push({ type: "text", text: text.slice(last) });
  }
  return parts;
}

/** Build a styled code block element with copy / insert buttons. */
function codeBlock(lang, code, onInsert) {
  const wrap = document.createElement("div");
  wrap.className = "claude-code";

  const bar = document.createElement("div");
  bar.className = "claude-code-bar";

  const label = document.createElement("span");
  label.className = "claude-code-lang";
  label.textContent = lang || "code";
  bar.appendChild(label);

  const actions = document.createElement("span");
  actions.className = "claude-code-actions";

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy";
  copyBtn.onclick = () => copyToClipboard(code);
  actions.appendChild(copyBtn);

  if (onInsert) {
    const insertBtn = document.createElement("button");
    insertBtn.textContent = "Insert";
    insertBtn.onclick = () => onInsert(code);
    actions.appendChild(insertBtn);
  }

  bar.appendChild(actions);
  wrap.appendChild(bar);

  const pre = document.createElement("pre");
  const codeEl = document.createElement("code");
  codeEl.textContent = code;
  pre.appendChild(codeEl);
  wrap.appendChild(pre);
  return wrap;
}

/** Render a prose block: headings, lists and paragraphs with inline styles. */
function renderProse(text, container) {
  const lines = text.split("\n");
  let list = null;

  const flushList = () => {
    if (list) {
      container.appendChild(list);
      list = null;
    }
  };

  let paragraph = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      const p = document.createElement("p");
      p.innerHTML = renderInline(paragraph.join(" "));
      container.appendChild(p);
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    if (heading) {
      flushParagraph();
      flushList();
      const h = document.createElement("h" + heading[1].length);
      h.innerHTML = renderInline(heading[2]);
      container.appendChild(h);
      continue;
    }
    if (bullet || ordered) {
      flushParagraph();
      const wanted = ordered ? "ol" : "ul";
      if (!list || list.tagName.toLowerCase() !== wanted) {
        flushList();
        list = document.createElement(wanted);
      }
      const li = document.createElement("li");
      li.innerHTML = renderInline((bullet || ordered)[1]);
      list.appendChild(li);
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
}

// Placeholder tokens use Unicode private-use characters that never appear in
// real text, so extracted inline-code spans survive escaping and the other
// inline transforms untouched.
const PH_OPEN = "";
const PH_CLOSE = "";

/** Inline formatting: `code`, **bold**, *italic*, links. Input is raw text. */
function renderInline(text) {
  const codes = [];
  let out = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `${PH_OPEN}${codes.length - 1}${PH_CLOSE}`;
  });
  out = escapeHtml(out);
  out = out
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^\w])_([^_]+)_(?=[^\w]|$)/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    );
  const restore = new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, "g");
  out = out.replace(restore, (_, i) => `<code>${escapeHtml(codes[+i])}</code>`);
  return out;
}
