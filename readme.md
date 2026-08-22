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

1. Install the plugin.
2. Get an API key from [console.anthropic.com](https://console.anthropic.com/).
3. Open **Settings → Plugins → Claude AI** and paste your key into
   **Anthropic API key**.
4. Open the chat from the sidebar (the sparkle icon) or run
   **Claude: Open chat** from the command palette.

Your API key is stored locally on your device and is sent only to
`api.anthropic.com`. Usage is billed to your own Anthropic account.

## Settings

| Setting | Description |
| --- | --- |
| Anthropic API key | Your `sk-ant-…` key, stored on-device. |
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
