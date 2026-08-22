const CSS = `
.claude-root {
  --claude-bg: var(--secondary-color, #16161e);
  --claude-fg: var(--secondary-text-color, #dcdce4);
  --claude-muted: color-mix(in srgb, var(--claude-fg) 55%, transparent);
  --claude-accent: var(--active-color, #cc785c);
  --claude-border: var(--border-color, rgba(255,255,255,0.12));
  --claude-surface: color-mix(in srgb, var(--claude-fg) 6%, transparent);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  color: var(--claude-fg);
  background: var(--claude-bg);
  font-size: 14px;
  overflow: hidden;
}
.claude-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--claude-border);
  flex: 0 0 auto;
}
.claude-title { font-weight: 600; font-size: 13px; }
.claude-model {
  font-size: 11px;
  color: var(--claude-muted);
  margin-left: 2px;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.claude-spacer { flex: 1 1 auto; }
.claude-iconbtn {
  background: transparent;
  border: none;
  color: var(--claude-fg);
  font-size: 18px;
  line-height: 1;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
}
.claude-iconbtn:active { background: var(--claude-surface); }

.claude-messages {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 12px 10px 4px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  -webkit-overflow-scrolling: touch;
}
.claude-empty {
  margin: auto;
  text-align: center;
  color: var(--claude-muted);
  padding: 24px 16px;
  line-height: 1.5;
}
.claude-empty b { color: var(--claude-fg); }

.claude-msg { display: flex; flex-direction: column; gap: 4px; }
.claude-role {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--claude-muted);
}
.claude-msg.user .claude-role { color: var(--claude-accent); }
.claude-body {
  border: 1px solid var(--claude-border);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--claude-surface);
  overflow-wrap: anywhere;
}
.claude-msg.user .claude-body {
  background: color-mix(in srgb, var(--claude-accent) 14%, transparent);
  border-color: color-mix(in srgb, var(--claude-accent) 35%, transparent);
}
.claude-stream { white-space: pre-wrap; word-break: break-word; }
.claude-cursor::after {
  content: "▍";
  animation: claude-blink 1s steps(2) infinite;
  color: var(--claude-accent);
}
@keyframes claude-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

.claude-thinking {
  font-size: 12px;
  color: var(--claude-muted);
  margin-bottom: 4px;
}
.claude-thinking > summary { cursor: pointer; user-select: none; }
.claude-thinking pre { white-space: pre-wrap; margin: 6px 0 0; font-style: italic; }

.claude-md > *:first-child { margin-top: 0; }
.claude-md > *:last-child { margin-bottom: 0; }
.claude-md p { margin: 6px 0; line-height: 1.5; }
.claude-md h1,.claude-md h2,.claude-md h3,.claude-md h4 { margin: 10px 0 6px; line-height: 1.3; }
.claude-md ul,.claude-md ol { margin: 6px 0; padding-left: 20px; }
.claude-md li { margin: 3px 0; }
.claude-md a { color: var(--link-text-color, #89b4fa); }
.claude-md code {
  font-family: var(--editor-font, monospace);
  background: color-mix(in srgb, var(--claude-fg) 12%, transparent);
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 0.9em;
}
.claude-error { color: var(--error-text-color, #f38ba8); }
.claude-meta { font-size: 11px; color: var(--claude-muted); margin-top: 2px; }

.claude-code {
  border: 1px solid var(--claude-border);
  border-radius: 8px;
  overflow: hidden;
  margin: 8px 0;
  background: var(--primary-color, #11111b);
}
.claude-code-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-bottom: 1px solid var(--claude-border);
  background: var(--claude-surface);
}
.claude-code-lang { font-size: 11px; color: var(--claude-muted); }
.claude-code-actions { display: flex; gap: 6px; }
.claude-code-actions button {
  font-size: 11px;
  border: 1px solid var(--claude-border);
  background: transparent;
  color: var(--claude-fg);
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
}
.claude-code-actions button:active { background: var(--claude-surface); }
.claude-code pre {
  margin: 0;
  padding: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.claude-code code {
  font-family: var(--editor-font, monospace);
  font-size: 12.5px;
  white-space: pre;
  background: none;
  padding: 0;
}

.claude-context {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px 0;
  flex: 0 0 auto;
}
.claude-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  border: 1px solid var(--claude-border);
  border-radius: 999px;
  padding: 2px 4px 2px 10px;
  color: var(--claude-muted);
  max-width: 100%;
}
.claude-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.claude-chip button {
  border: none; background: transparent; color: inherit;
  font-size: 14px; line-height: 1; cursor: pointer; padding: 0 4px;
}

.claude-composer {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--claude-border);
}
.claude-attach { display: flex; flex-direction: column; gap: 4px; }
.claude-attach button {
  border: 1px solid var(--claude-border);
  background: transparent;
  color: var(--claude-fg);
  border-radius: 6px;
  width: 30px; height: 22px;
  font-size: 13px; line-height: 1; cursor: pointer;
}
.claude-input {
  flex: 1 1 auto;
  resize: none;
  min-height: 40px;
  max-height: 140px;
  border: 1px solid var(--claude-border);
  border-radius: 10px;
  background: var(--claude-surface);
  color: var(--claude-fg);
  padding: 9px 10px;
  font-family: inherit;
  font-size: 14px;
  outline: none;
}
.claude-input:focus { border-color: var(--claude-accent); }
.claude-send {
  flex: 0 0 auto;
  border: none;
  border-radius: 10px;
  background: var(--claude-accent);
  color: #fff;
  width: 44px;
  height: 40px;
  font-size: 18px;
  cursor: pointer;
}
.claude-send:disabled { opacity: .5; }
.claude-send.stop { background: var(--error-text-color, #f38ba8); }
`;

let injected = false;

/** Inject the plugin stylesheet once. */
export function injectStyles() {
  if (injected) return;
  const style = document.createElement("style");
  style.id = "claude-ai-styles";
  style.textContent = CSS;
  document.head.appendChild(style);
  injected = true;
}

/** Remove the injected stylesheet (on plugin unmount). */
export function removeStyles() {
  document.getElementById("claude-ai-styles")?.remove();
  injected = false;
}
