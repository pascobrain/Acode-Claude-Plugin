# Claude AI for Acode

Chat with **Claude** (Anthropic) and run AI code actions without leaving the
[Acode](https://acode.app) editor.

## Features

- **Chat sidebar** — a full conversation panel with streamed replies, Markdown
  and syntax-aware code blocks, and one-tap **Copy** / **Insert** buttons.
- **Attach context** — send the current file or your selection to Claude as
  context with a single tap.
- **Editor commands** (command palette → search "Claude"):
  - Claude: Open chat — `Ctrl-Shift-L`
  - Claude: Ask about code
  - Claude: Explain selection
  - Claude: Refactor / improve selection
  - Claude: Find & fix bugs in selection
  - Claude: Add doc comments to selection
- **Selection menu** — select code and pick **✦ Explain** or **✦ Ask Claude**.
- **Model picker** — Claude Opus 5 (default), Sonnet 5, Haiku 4.5, Opus 4.8 and
  Fable 5, with optional extended thinking and streaming toggles.

## Setup

Pick one of two ways to connect:

**A. Sign in with OpenRouter (no API key to create)**

1. Install the plugin and open the chat (sparkle icon in the sidebar).
2. Tap **Sign in with OpenRouter** (or run **Claude: Connect**).
3. Authorize in the in-app browser — the plugin receives a key automatically
   and talks to Claude models through [OpenRouter](https://openrouter.ai).
   Usage is billed to your OpenRouter account.

**B. Anthropic API key (direct)**

1. Get a key from [console.anthropic.com](https://console.anthropic.com/).
2. Open **Settings → Plugins → Claude AI**, set **Provider** to
   *Anthropic API key*, and paste your key into **Anthropic API key**.
3. Usage is billed to your own Anthropic account.

Keys are stored locally on your device. In direct mode requests go only to
`api.anthropic.com`; in OpenRouter mode, only to `openrouter.ai`.

## Settings

| Setting | Description |
| --- | --- |
| Provider | Anthropic API key, or OpenRouter sign-in. |
| Anthropic API key | Your `sk-ant-…` key, stored on-device (Anthropic provider). |
| OpenRouter key | Set automatically after sign-in; or paste an `sk-or-…` key. |
| Model | Which Claude model to use. |
| Max output tokens | Upper bound on the length of each reply. |
| Extended thinking | Let Claude reason before answering (shown collapsed). |
| Stream responses | Show replies token by token. |
| Custom system prompt | Extra instructions added to every request. |

## Development

```sh
npm install
npm run dev     # watch + serve plugin.zip on http://<ip>:3000/plugin.zip
npm run build   # bundle and write plugin.zip
```

In Acode, install with **Plugins → + → Remote** using the dev-server URL, or
**Local** with the built `plugin.zip`.

## License

MIT © cr4sh3ur. Not affiliated with Anthropic or the Acode Foundation.
"Claude" is a trademark of Anthropic.
