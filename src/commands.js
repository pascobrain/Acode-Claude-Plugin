import { COMMANDS, CODE_ONLY_SYSTEM_PROMPT } from "./constants.js";
import { sidebar } from "./sidebar.js";
import { requireClient, chatOptions } from "./session.js";
import { completeChat, describeError } from "./api.js";
import {
  getSelectedText,
  getActiveFileContent,
  activeLanguage,
  activeFileName,
  replaceSelection,
  stripCodeFences,
} from "./utils.js";

function toast(msg, dur = 3000) {
  acode.require("toast")(msg, dur);
}

function fenced(code, lang) {
  return "```" + (lang || "") + "\n" + code + "\n```";
}

/** Selection if present, otherwise the whole active file. Returns null if empty. */
function selectionOrFile() {
  const selection = getSelectedText();
  if (selection.trim()) {
    return { code: selection, scope: "selection", whole: false };
  }
  const file = getActiveFileContent();
  if (file.trim()) return { code: file, scope: "file", whole: true };
  return null;
}

/** Route a question about the current code into the streaming chat sidebar. */
function askInChat(question, { includeCode = true } = {}) {
  let contextText = "";
  if (includeCode) {
    const src = selectionOrFile();
    if (src) {
      const header = src.whole ? `File: ${activeFileName()}` : "Selected code:";
      contextText = `${header}\n${fenced(src.code, activeLanguage())}`;
    }
  }
  sidebar.open();
  sidebar.submit(question, contextText);
}

/**
 * Code-only transformation: send the current selection/file with an
 * instruction, then offer to replace it with the returned code.
 */
async function transform(instruction) {
  const client = requireClient();
  if (!client) return;

  const src = selectionOrFile();
  if (!src) {
    toast("Select some code (or open a non-empty file) first.");
    return;
  }

  const lang = activeLanguage();
  const loader = acode.require("loader");
  loader.create("Claude AI", "Thinking…");

  try {
    const opts = chatOptions({ system: CODE_ONLY_SYSTEM_PROMPT, thinking: false });
    const userContent =
      `${instruction}\n\n` +
      `Language: ${lang || "unknown"}\n\n` +
      fenced(src.code, lang);

    const result = await completeChat(client, {
      ...opts,
      messages: [{ role: "user", content: userContent }],
    });
    loader.destroy();

    const cleaned = stripCodeFences(result);
    if (!cleaned.trim()) {
      toast("Claude returned an empty result.");
      return;
    }

    const scopeLabel = src.whole ? "the whole file" : "the selection";
    const ok = await acode.confirm(
      "Claude AI",
      `Replace ${scopeLabel} with Claude's result?`,
    );
    if (ok) {
      if (src.whole) {
        editorManager.editor.session.setValue(cleaned);
        editorManager.editor.focus();
      } else {
        replaceSelection(cleaned);
      }
      toast("Applied Claude's changes.", 2000);
    }
  } catch (error) {
    loader.destroy();
    toast(describeError(error), 4000);
  }
}

/** All commands, keyed by name, registered via acode.addCommand. */
export const commandList = [
  {
    name: COMMANDS.OPEN_CHAT,
    description: "Claude: Open chat",
    bindKey: { win: "Ctrl-Shift-L", mac: "Cmd-Shift-L" },
    exec: () => {
      sidebar.open();
      return true;
    },
  },
  {
    name: COMMANDS.ASK,
    description: "Claude: Ask about code",
    exec: async () => {
      const question = await acode.prompt(
        "Ask Claude about this code",
        "",
        "textarea",
        { placeholder: "e.g. What does this function do?" },
      );
      if (question && question.trim()) {
        askInChat(question.trim(), { includeCode: true });
      }
      return true;
    },
  },
  {
    name: COMMANDS.EXPLAIN,
    description: "Claude: Explain selection",
    exec: () => {
      askInChat(
        "Explain what this code does, step by step, and point out anything noteworthy.",
        { includeCode: true },
      );
      return true;
    },
  },
  {
    name: COMMANDS.REFACTOR,
    description: "Claude: Refactor / improve selection",
    exec: () => {
      transform(
        "Refactor and improve this code for readability and correctness while " +
          "preserving its behavior. Keep the same language.",
      );
      return true;
    },
  },
  {
    name: COMMANDS.FIX,
    description: "Claude: Find & fix bugs in selection",
    exec: () => {
      transform(
        "Fix any bugs or errors in this code. Return the corrected code with the " +
          "same public behavior and language.",
      );
      return true;
    },
  },
  {
    name: COMMANDS.DOCUMENT,
    description: "Claude: Add doc comments to selection",
    exec: () => {
      transform(
        "Add clear documentation comments (docstrings / JSDoc as appropriate for " +
          "the language) to this code. Do not change the logic.",
      );
      return true;
    },
  },
];

/** Register every command with Acode. */
export function registerCommands() {
  for (const cmd of commandList) {
    acode.addCommand({
      name: cmd.name,
      description: cmd.description,
      ...(cmd.bindKey ? { bindKey: cmd.bindKey } : {}),
      exec: cmd.exec,
    });
  }
}

/** Remove every command from Acode. */
export function unregisterCommands() {
  for (const cmd of commandList) {
    acode.removeCommand(cmd.name);
  }
}

/** Add the quick "Explain / Ask Claude" entries to the editor selection menu. */
export function registerSelectionMenu() {
  const selectionMenu = acode.require("selectionMenu");
  selectionMenu.add(
    () =>
      askInChat(
        "Explain what this selected code does, step by step.",
        { includeCode: true },
      ),
    "✦ Explain",
    "selected",
  );
  selectionMenu.add(
    async () => {
      const q = await acode.prompt("Ask Claude about the selection", "", "textarea");
      if (q && q.trim()) askInChat(q.trim(), { includeCode: true });
    },
    "✦ Ask Claude",
    "selected",
  );
}
