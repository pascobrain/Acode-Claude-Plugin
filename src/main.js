import plugin from "../plugin.json";
import { SIDEBAR_ID, MODELS, DEFAULTS } from "./constants.js";
import { sidebar } from "./sidebar.js";
import {
  registerCommands,
  unregisterCommands,
  registerSelectionMenu,
} from "./commands.js";
import { injectStyles, removeStyles } from "./styles.js";
import { getSetting, setSetting } from "./utils.js";
import { resetClient } from "./session.js";

class ClaudeAIPlugin {
  baseUrl = "";

  async init($page, cacheFile, cacheFileUrl) {
    injectStyles();

    // Custom sidebar icon from the bundled icon.png.
    try {
      acode.addIcon("claude-ai-icon", `${this.baseUrl}icon.png`);
    } catch {
      /* icon is cosmetic */
    }

    // The sidebar app's init function runs synchronously here, mounting the UI.
    const sidebarApps = acode.require("sidebarApps");
    sidebarApps.add("claude-ai-icon", SIDEBAR_ID, "Claude AI", (container) => {
      sidebar.mount(container);
    });

    registerCommands();
    registerSelectionMenu();
  }

  async destroy() {
    unregisterCommands();
    try {
      acode.require("sidebarApps").remove(SIDEBAR_ID);
    } catch {
      /* already gone */
    }
    removeStyles();
  }

  /** Settings schema shown on the plugin's settings page. */
  get settings() {
    return {
      list: [
        {
          key: "apiKey",
          text: "Anthropic API key",
          value: getSetting("apiKey"),
          prompt: "sk-ant-...",
          promptType: "text",
          info: "Create a key at console.anthropic.com. Stored locally on this device.",
          valueText: (v) => (v ? "•••• set" : "not set"),
        },
        {
          key: "model",
          text: "Model",
          value: getSetting("model"),
          select: MODELS,
        },
        {
          key: "maxTokens",
          text: "Max output tokens",
          value: getSetting("maxTokens"),
          prompt: String(DEFAULTS.maxTokens),
          promptType: "number",
          info: "Upper bound on the length of each reply.",
        },
        {
          key: "extendedThinking",
          text: "Extended thinking",
          checkbox: !!getSetting("extendedThinking"),
          info: "Let Claude reason before answering (shown collapsed in chat).",
        },
        {
          key: "streaming",
          text: "Stream responses",
          checkbox: !!getSetting("streaming"),
          info: "Show replies token by token. Turn off if your device has trouble.",
        },
        {
          key: "systemPrompt",
          text: "Custom system prompt",
          value: getSetting("systemPrompt"),
          prompt: "Optional extra instructions for Claude",
          promptType: "textarea",
          valueText: (v) => (v ? "custom" : "default"),
        },
      ],
      cb: (key, value) => {
        if (key === "maxTokens") value = Number(value) || DEFAULTS.maxTokens;
        setSetting(key, value);
        if (key === "apiKey") resetClient();
        if (key === "model") sidebar.renderModelBadge?.();
      },
    };
  }
}

if (window.acode) {
  const claudePlugin = new ClaudeAIPlugin();

  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      claudePlugin.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      await claudePlugin.init($page, cacheFile, cacheFileUrl);
    },
    claudePlugin.settings,
  );

  acode.setPluginUnmount(plugin.id, () => {
    claudePlugin.destroy();
  });
}
