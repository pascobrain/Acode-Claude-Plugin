import { PLUGIN_ID, DEFAULTS } from "./constants.js";

/** Escape a string for safe insertion into HTML. */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The Acode settings store object for this plugin (created lazily). */
export function pluginStore() {
  const appSettings = acode.require("settings");
  if (!appSettings.value[PLUGIN_ID]) {
    appSettings.value[PLUGIN_ID] = { ...DEFAULTS };
    appSettings.update(false);
  }
  return appSettings.value[PLUGIN_ID];
}

/** Read a single setting, falling back to the documented default. */
export function getSetting(key) {
  const store = pluginStore();
  const value = store[key];
  return value === undefined || value === null ? DEFAULTS[key] : value;
}

/** Persist a single setting. */
export function setSetting(key, value) {
  const appSettings = acode.require("settings");
  const store = pluginStore();
  store[key] = value;
  appSettings.update(false);
}

/** Human friendly label for the current editor language, e.g. "javascript". */
export function activeLanguage() {
  try {
    const file = editorManager.activeFile;
    const modeId = file?.session?.getMode?.()?.$id || "";
    const lang = modeId.split("/").pop();
    return lang && lang !== "text" ? lang : "";
  } catch {
    return "";
  }
}

/** Currently selected text in the active editor, or "" when nothing is selected. */
export function getSelectedText() {
  try {
    return editorManager.editor.getSelectedText() || "";
  } catch {
    return "";
  }
}

/** Full text of the active file. */
export function getActiveFileContent() {
  try {
    return editorManager.editor.session.getValue() || "";
  } catch {
    return "";
  }
}

/** Name of the active file, or a placeholder. */
export function activeFileName() {
  try {
    return editorManager.activeFile?.filename || "untitled";
  } catch {
    return "untitled";
  }
}

/**
 * Replace the current selection (or insert at the cursor when nothing is
 * selected) with `text`, then focus the editor.
 */
export function replaceSelection(text) {
  const editor = editorManager.editor;
  const range = editor.getSelectionRange();
  if (range && !range.isEmpty()) {
    editor.session.replace(range, text);
  } else {
    editor.insert(text);
  }
  editor.focus();
}

/** Insert text at the current cursor position. */
export function insertAtCursor(text) {
  editorManager.editor.insert(text);
  editorManager.editor.focus();
}

/**
 * Remove a single wrapping Markdown code fence from a model response, so a
 * "code only" answer can be inserted verbatim even if the model added fences.
 */
export function stripCodeFences(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return match ? match[1] : trimmed;
}

/** Copy text to the clipboard, best-effort, with a toast on success. */
export async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else if (window.cordova?.plugins?.clipboard) {
      window.cordova.plugins.clipboard.copy(text);
    } else {
      throw new Error("clipboard unavailable");
    }
    acode.require("toast")("Copied", 2000);
  } catch {
    acode.require("toast")("Could not copy", 3000);
  }
}
