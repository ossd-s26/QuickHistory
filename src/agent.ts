import { createAgent } from "langchain";
import { tool } from "@langchain/core/tools";
import type { BaseMessageLike } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import {
  DEFAULT_DAYS_BACK,
  DEFAULT_MAX_ITEMS,
  DEFAULT_MODEL,
  type AskQuestionMessage,
  type ExtensionMessage,
  type ExtensionResponse,
  type HistoryEntry,
  type ToolAction,
} from "./shared";

const API_KEY_STORAGE_KEY = "openaiApiKey";
const MODEL_STORAGE_KEY = "model";
const CONVERSATION_KEY = "conversationMessages";
const SYSTEM_PROMPT =
  "You are a personal browser history assistant. " +
  "Use the search_browser_history tool to find relevant history entries before answering. " +
  "You may call the tool multiple times with different queries if needed. " +
  "Use the delete_browser_history_entry tool when the user asks to remove or delete a history entry. " +
  "When you reference evidence, cite the entry title or URL. " +
  "If no relevant history is found, say you do not have enough evidence. " +
  "Keep responses concise and factual.";

function getStorageValue<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => resolve(result[key] as T | undefined));
  });
}

function setStorageValues(values: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(values, () => resolve());
  });
}

function cleanHistoryItems(items: chrome.history.HistoryItem[]): HistoryEntry[] {
  return items
    .filter((item): item is chrome.history.HistoryItem & { url: string } => Boolean(item.url))
    .sort((a, b) => (b.lastVisitTime ?? 0) - (a.lastVisitTime ?? 0))
    .map((item, index) => ({
      id: String(item.id ?? index),
      url: item.url,
      title: item.title?.trim() || "(no title)",
      lastVisitTime: item.lastVisitTime ?? null,
      visitCount: item.visitCount ?? null
    }));
}

function searchHistory(query: string, daysBack: number, maxItems: number): Promise<HistoryEntry[]> {
  const now = Date.now();
  const safeDaysBack = Math.max(1, daysBack || DEFAULT_DAYS_BACK);
  const safeMaxItems = Math.max(10, Math.min(maxItems || DEFAULT_MAX_ITEMS, 500));
  const startTime = now - safeDaysBack * 24 * 60 * 60 * 1000;

  return new Promise((resolve) => {
    chrome.history.search(
      {
        text: query,
        startTime,
        maxResults: safeMaxItems
      },
      (items) => resolve(cleanHistoryItems(items))
    );
  });
}

function createSearchHistoryTool(
  daysBack: number,
  maxItems: number,
  usedEntries: HistoryEntry[]
) {
  return tool(
    async ({ query }) => {
      const results = await searchHistory(query, daysBack, maxItems);

      for (const entry of results) {
        if (!usedEntries.some((e) => e.url === entry.url)) {
          usedEntries.push(entry);
        }
      }

      if (results.length === 0) {
        return JSON.stringify({
          results: [],
          count: 0,
          message: "No history entries matched the query."
        });
      }

      return JSON.stringify({
        results: results.map((r) => ({
          title: r.title,
          url: r.url,
          lastVisitTime: r.lastVisitTime
            ? new Date(r.lastVisitTime).toISOString()
            : null,
          visitCount: r.visitCount
        })),
        count: results.length
      });
    },
    {
      name: "search_browser_history",
      description:
        "Search the user's browser history. Returns titles, URLs, visit times, and visit counts for matching entries.",
      schema: z.object({
        query: z.string().describe("Search query to match against page titles and URLs")
      })
    }
  );
}

function createDeleteHistoryTool() {
  return tool(
    async ({ url }) => {
      await chrome.history.deleteUrl({ url });
      return JSON.stringify({ deleted: true, url });
    },
    {
      name: "delete_browser_history_entry",
      description:
        "Delete a specific URL from the user's browser history. Use this when the user asks to remove or delete a history entry.",
      schema: z.object({
        url: z.string().describe("The exact URL to delete from browser history")
      })
    }
  );
}

// Conversation persistence via chrome.storage.local.
// MemorySaver is in-memory and loses state when the service worker restarts,
// so we serialize messages to chrome.storage.local instead.

interface StoredMessage {
  role: "human" | "ai" | "tool";
  content: string;
  tool_calls?: Array<{ id: string; name: string; args: Record<string, unknown> }>;
  tool_call_id?: string;
}

async function loadConversation(): Promise<StoredMessage[]> {
  const data = await getStorageValue<StoredMessage[]>(CONVERSATION_KEY);
  return data ?? [];
}

async function saveConversation(messages: StoredMessage[]): Promise<void> {
  await setStorageValues({ [CONVERSATION_KEY]: messages });
}

async function clearConversation(): Promise<void> {
  await setStorageValues({ [CONVERSATION_KEY]: [] });
}

function serializeResultMessages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[]
): StoredMessage[] {
  return messages.map((m) => {
    const type: string = m._getType?.() ?? m.type ?? "unknown";
    const role = type === "human" ? "human" as const
      : type === "ai" ? "ai" as const
      : "tool" as const;
    const base: StoredMessage = {
      role,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    };
    if (m.tool_calls?.length) {
      base.tool_calls = m.tool_calls.map(
        (tc: { id?: string; name: string; args: Record<string, unknown> }) => ({
          id: tc.id ?? "",
          name: tc.name,
          args: tc.args,
        })
      );
    }
    if (m.tool_call_id) {
      base.tool_call_id = m.tool_call_id;
    }
    return base;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractToolActions(messages: any[]): ToolAction[] {
  const actions: ToolAction[] = [];
  for (const m of messages) {
    const type: string = m._getType?.() ?? m.type ?? "";
    if (type !== "ai" || !m.tool_calls?.length) continue;
    for (const tc of m.tool_calls) {
      if (tc.name === "search_browser_history") {
        actions.push({
          tool: "search",
          summary: `Searched history for "${tc.args?.query ?? ""}"`,
        });
      } else if (tc.name === "delete_browser_history_entry") {
        actions.push({
          tool: "delete",
          summary: `Deleted ${tc.args?.url ?? "a history entry"}`,
        });
      }
    }
  }
  return actions;
}

async function answerQuestion(message: AskQuestionMessage): Promise<ExtensionResponse> {
  const apiKey = await getStorageValue<string>(API_KEY_STORAGE_KEY);
  if (!apiKey) {
    return { ok: false, error: "Save your OpenAI API key before asking questions." };
  }

  const selectedModel =
    message.model?.trim() ||
    (await getStorageValue<string>(MODEL_STORAGE_KEY)) ||
    DEFAULT_MODEL;

  const usedEntries: HistoryEntry[] = [];
  const searchTool = createSearchHistoryTool(message.daysBack, message.maxItems, usedEntries);
  const deleteTool = createDeleteHistoryTool();

  const agent = createAgent({
    model: new ChatOpenAI({ apiKey, model: selectedModel }),
    tools: [searchTool, deleteTool],
    systemPrompt: SYSTEM_PROMPT,
  });

  // Load previous conversation from chrome.storage.local
  const previousMessages = await loadConversation();
  const inputMessages: BaseMessageLike[] = [
    ...previousMessages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
    }) as BaseMessageLike),
    { role: "human", content: message.question } as BaseMessageLike,
  ];

  const result = await agent.invoke({ messages: inputMessages });

  const resultMessages = result.messages;
  const lastMessage = resultMessages[resultMessages.length - 1];
  const answer = typeof lastMessage.content === "string"
    ? lastMessage.content
    : JSON.stringify(lastMessage.content);

  // Only extract tool actions from new messages (skip replayed history)
  const newMessages = resultMessages.slice(previousMessages.length);
  const toolActions = extractToolActions(newMessages);

  // Persist all messages to chrome.storage.local so they survive service worker restarts
  await saveConversation(serializeResultMessages(resultMessages));

  return {
    ok: true,
    answer,
    usedEntries,
    toolActions,
    model: selectedModel
  };
}

function toErrorResponse(error: unknown): ExtensionResponse {
  if (error instanceof Error) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Unexpected error." };
}

chrome.runtime.onInstalled.addListener(async () => {
  const storedModel = await getStorageValue<string>(MODEL_STORAGE_KEY);
  if (!storedModel) {
    await setStorageValues({ [MODEL_STORAGE_KEY]: DEFAULT_MODEL });
  }
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    if (message.type === "getSettings") {
      const [apiKey, model] = await Promise.all([
        getStorageValue<string>(API_KEY_STORAGE_KEY),
        getStorageValue<string>(MODEL_STORAGE_KEY)
      ]);
      return {
        ok: true,
        hasApiKey: Boolean(apiKey),
        model: model || DEFAULT_MODEL
      } satisfies ExtensionResponse;
    }

    if (message.type === "saveSettings") {
      const apiKey = message.apiKey.trim();
      const model = message.model.trim() || DEFAULT_MODEL;
      if (!apiKey) {
        return { ok: false, error: "API key is required." } satisfies ExtensionResponse;
      }
      await setStorageValues({
        [API_KEY_STORAGE_KEY]: apiKey,
        [MODEL_STORAGE_KEY]: model
      });
      return { ok: true } satisfies ExtensionResponse;
    }

    if (message.type === "previewHistory") {
      const entries = await searchHistory("", message.daysBack, message.maxItems);
      return {
        ok: true,
        entries
      } satisfies ExtensionResponse;
    }

    if (message.type === "searchHistory") {
      const entries = await searchHistory(message.query, message.daysBack, message.maxItems);
      return {
        ok: true,
        entries
      } satisfies ExtensionResponse;
    }

    if (message.type === "deleteHistory") {
      await chrome.history.deleteUrl({ url: message.url });
      return { ok: true } satisfies ExtensionResponse;
    }

    if (message.type === "clearConversation") {
      await clearConversation();
      return { ok: true } satisfies ExtensionResponse;
    }

    if (message.type === "askQuestion") {
      const question = message.question.trim();
      if (!question) {
        return { ok: false, error: "Question is required." } satisfies ExtensionResponse;
      }
      return await answerQuestion(message);
    }

    return { ok: false, error: "Unsupported message type." } satisfies ExtensionResponse;
  })()
    .then((response) => sendResponse(response))
    .catch((error) => sendResponse(toErrorResponse(error)));

  return true;
});
