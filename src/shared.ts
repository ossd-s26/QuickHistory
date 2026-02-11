export const DEFAULT_MODEL = "gpt-5-nano";
export const DEFAULT_DAYS_BACK = 30;
export const DEFAULT_MAX_ITEMS = 120;
export const MAX_CONTEXT_CHARS = 14000;

export type HistoryEntry = {
  id: string;
  url: string;
  title: string;
  lastVisitTime: number | null;
  visitCount: number | null;
};

export type GetSettingsMessage = {
  type: "getSettings";
};

export type SaveSettingsMessage = {
  type: "saveSettings";
  apiKey: string;
  model: string;
};

export type AskQuestionMessage = {
  type: "askQuestion";
  question: string;
  daysBack: number;
  maxItems: number;
  model: string;
};

export type PreviewHistoryMessage = {
  type: "previewHistory";
  daysBack: number;
  maxItems: number;
};

export type SearchHistoryMessage = {
  type: "searchHistory";
  query: string;
  daysBack: number;
  maxItems: number;
};

export type DeleteHistoryMessage = {
  type: "deleteHistory";
  url: string;
};

export type ClearConversationMessage = {
  type: "clearConversation";
};

export type ExtensionMessage =
  | GetSettingsMessage
  | SaveSettingsMessage
  | AskQuestionMessage
  | PreviewHistoryMessage
  | SearchHistoryMessage
  | DeleteHistoryMessage
  | ClearConversationMessage;

export type ErrorResponse = {
  ok: false;
  error: string;
};

export type GetSettingsResponse = {
  ok: true;
  hasApiKey: boolean;
  model: string;
};

export type SaveSettingsResponse = {
  ok: true;
};

export type ToolAction = {
  tool: string;
  summary: string;
};

export type AskQuestionResponse = {
  ok: true;
  answer: string;
  usedEntries: HistoryEntry[];
  toolActions: ToolAction[];
  model: string;
};

export type PreviewHistoryResponse = {
  ok: true;
  entries: HistoryEntry[];
};

export type SearchHistoryResponse = {
  ok: true;
  entries: HistoryEntry[];
};

export type DeleteHistoryResponse = {
  ok: true;
};

export type ClearConversationResponse = {
  ok: true;
};

export type ExtensionResponse =
  | ErrorResponse
  | GetSettingsResponse
  | SaveSettingsResponse
  | AskQuestionResponse
  | PreviewHistoryResponse
  | SearchHistoryResponse
  | DeleteHistoryResponse
  | ClearConversationResponse;
