# QuickHistory

Chrome extension that uses LangChain + OpenAI to answer questions about your browsing history.

## Features

- **AI-powered Q&A** — Ask natural-language questions and get answers grounded in your browser history.
- **Follow-up conversations** — Conversation context is persisted across service worker restarts via `chrome.storage.local`.
- **Keyword search** — Instantly search history entries by keyword without using the AI agent.
- **Delete history** — Remove individual URLs from Chrome history directly from the popup, or ask the agent to delete entries.
- **Tool transparency** — See which tools the agent used (e.g. "Searched history for 'react'") alongside each answer.
- **Configurable** — Adjust the model, time range (days back), and max items from the popup or settings page.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build the extension:

   ```bash
   npm run build
   ```

3. Load in Chrome:
   1. Open `chrome://extensions`
   2. Enable **Developer mode**
   3. Click **Load unpacked**
   4. Select the `dist` folder

4. Open the extension popup:
   1. Click the QuickHistory icon
   2. Open **Settings** and save your OpenAI API key
   3. Ask questions about your browsing history

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Bundle the extension into `dist/` |
| `npm run check` | Run TypeScript type-checking |

## Architecture

- **`src/agent.ts`** — Service worker. Runs the LangChain ReAct agent, handles all message routing, and manages conversation persistence.
- **`src/components/PopupApp.tsx`** — React popup UI for search, Q&A, and history management.
- **`src/shared.ts`** — Shared types and constants used by both the agent and the UI.
- **`src/settings.tsx`** — Settings page for API key and model configuration.
- **`src/shims/async_hooks.ts`** — No-op shim for `node:async_hooks` (required by LangGraph, unavailable in service workers).

## Notes

- API keys are stored in `chrome.storage.local`.
- The extension sends history context to OpenAI for answers. Review privacy implications before use.
- Conversation messages are stored in `chrome.storage.local` so follow-ups work even after the service worker restarts. Click **New Chat** to clear.
