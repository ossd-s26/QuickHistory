import { useCallback, useEffect, useState } from "react";
import { Clock, Eye, Loader2, RotateCcw, Search, Send, Settings, Trash2, Wrench } from "lucide-react";
import {
  DEFAULT_DAYS_BACK,
  DEFAULT_MAX_ITEMS,
  DEFAULT_MODEL,
  type AskQuestionResponse,
  type ClearConversationResponse,
  type DeleteHistoryResponse,
  type ErrorResponse,
  type GetSettingsResponse,
  type HistoryEntry,
  type PreviewHistoryResponse,
  type SearchHistoryResponse,
  type ToolAction,
} from "../shared";
import { sendMessage } from "../hooks/use-chrome-message";
import { Button } from "./ui/button";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

function toSafeInt(value: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}

function formatVisitTime(timestamp: number | null) {
  if (!timestamp) return "unknown";
  return new Date(timestamp).toLocaleString();
}

export function PopupApp() {
  const [daysBack, setDaysBack] = useState(String(DEFAULT_DAYS_BACK));
  const [maxItems, setMaxItems] = useState(String(DEFAULT_MAX_ITEMS));
  const [question, setQuestion] = useState("");
  const [modelLabel, setModelLabel] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HistoryEntry[]>([]);
  const [hasConversation, setHasConversation] = useState(false);
  const [toolActions, setToolActions] = useState<ToolAction[]>([]);

  const handleNewChat = useCallback(async () => {
    try {
      const response = (await sendMessage({
        type: "clearConversation",
      })) as ClearConversationResponse | ErrorResponse;

      if (!response.ok) {
        setStatus({ text: response.error, isError: true });
        return;
      }

      setHasConversation(false);
      setAnswer(null);
      setSources([]);
      setToolActions([]);
      setQuestion("");
      setStatus(null);
    } catch {
      setStatus({ text: "Failed to clear conversation.", isError: true });
    }
  }, []);

  const handleDeleteEntry = useCallback(
    async (url: string, source: "search" | "sources") => {
      try {
        const response = (await sendMessage({
          type: "deleteHistory",
          url,
        })) as DeleteHistoryResponse | ErrorResponse;

        if (!response.ok) {
          setStatus({ text: response.error, isError: true });
          return;
        }

        if (source === "search") {
          setSearchResults((prev) => prev.filter((e) => e.url !== url));
        } else {
          setSources((prev) => prev.filter((e) => e.url !== url));
        }
      } catch {
        setStatus({ text: "Failed to delete entry.", isError: true });
      }
    },
    [],
  );

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setStatus({ text: "Type a keyword to search.", isError: true });
      return;
    }

    const days = toSafeInt(daysBack, DEFAULT_DAYS_BACK, 1, 365);
    const items = toSafeInt(maxItems, DEFAULT_MAX_ITEMS, 10, 500);

    setBusy(true);
    setStatus(null);
    try {
      const response = (await sendMessage({
        type: "searchHistory",
        query: q,
        daysBack: days,
        maxItems: items,
      })) as SearchHistoryResponse | ErrorResponse;

      if (!response.ok) {
        setStatus({ text: response.error, isError: true });
        return;
      }

      setSearchResults(response.entries);
      setStatus({
        text: `Found ${response.entries.length} matching entries.`,
        isError: false,
      });
    } catch (error) {
      setStatus({
        text: error instanceof Error ? error.message : "Search failed.",
        isError: true,
      });
    } finally {
      setBusy(false);
    }
  }, [searchQuery, daysBack, maxItems]);

  useEffect(() => {
    (async () => {
      try {
        const response = (await sendMessage({
          type: "getSettings",
        })) as GetSettingsResponse | ErrorResponse;

        if (!response.ok) {
          setStatus({ text: response.error, isError: true });
          return;
        }

        setModelLabel(
          response.hasApiKey
            ? response.model || DEFAULT_MODEL
            : "No API key \u2014 open Settings"
        );
      } catch {
        setStatus({ text: "Failed to load settings.", isError: true });
      }
    })();
  }, []);

  const handlePreview = useCallback(async () => {
    const days = toSafeInt(daysBack, DEFAULT_DAYS_BACK, 1, 365);
    const items = toSafeInt(maxItems, DEFAULT_MAX_ITEMS, 10, 500);

    setBusy(true);
    setStatus(null);
    try {
      const response = (await sendMessage({
        type: "previewHistory",
        daysBack: days,
        maxItems: items,
      })) as PreviewHistoryResponse | ErrorResponse;

      if (!response.ok) {
        setStatus({ text: response.error, isError: true });
        return;
      }

      setAnswer(`Loaded ${response.entries.length} history items.`);
      setSources(response.entries.slice(0, 12));
      setStatus({
        text: `Preview: ${response.entries.length} items found.`,
        isError: false,
      });
    } catch (error) {
      setStatus({
        text: error instanceof Error ? error.message : "Failed to load preview.",
        isError: true,
      });
    } finally {
      setBusy(false);
    }
  }, [daysBack, maxItems]);

  const handleAsk = useCallback(async () => {
    const q = question.trim();
    const days = toSafeInt(daysBack, DEFAULT_DAYS_BACK, 1, 365);
    const items = toSafeInt(maxItems, DEFAULT_MAX_ITEMS, 10, 500);

    if (!q) {
      setStatus({ text: "Type a question first.", isError: true });
      return;
    }

    setBusy(true);
    setStatus(null);
    setAnswer("");

    try {
      const response = (await sendMessage({
        type: "askQuestion",
        question: q,
        daysBack: days,
        maxItems: items,
        model: "",
      })) as AskQuestionResponse | ErrorResponse;

      if (!response.ok) {
        setAnswer("Could not get an answer.");
        setStatus({ text: response.error, isError: true });
        return;
      }

      setHasConversation(true);
      setAnswer(response.answer);
      setToolActions(response.toolActions);
      setSources((prev) => {
        const merged = [...prev];
        for (const entry of response.usedEntries) {
          if (!merged.some((e) => e.url === entry.url)) {
            merged.push(entry);
          }
        }
        return merged;
      });
      setQuestion("");
      setStatus({ text: `Answered via ${response.model}`, isError: false });
    } catch (error) {
      setAnswer("Could not get an answer.");
      setStatus({
        text: error instanceof Error ? error.message : "Request failed.",
        isError: true,
      });
    } finally {
      setBusy(false);
    }
  }, [question, daysBack, maxItems]);

  return (
    <main className="w-[400px] p-4 flex flex-col gap-3">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">QuickHistory</h1>
            <p className="text-[11px] text-muted-foreground font-medium">
              {modelLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasConversation && (
            <Button
              variant="icon"
              size="icon"
              title="New Chat"
              onClick={handleNewChat}
            >
              <RotateCcw size={16} />
            </Button>
          )}
          <Button
            variant="icon"
            size="icon"
            title="Settings"
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            <Settings size={18} />
          </Button>
        </div>
      </header>

      {/* Params bar */}
      <div className="flex items-end gap-2 px-3 py-2.5 bg-card border border-border rounded-lg">
        <label className="flex flex-col gap-0.5 flex-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Days back
          </span>
          <Input
            type="number"
            min={1}
            max={365}
            value={daysBack}
            onChange={(e) => setDaysBack(e.target.value)}
            className="py-1 px-2 bg-background"
          />
        </label>
        <label className="flex flex-col gap-0.5 flex-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Max items
          </span>
          <Input
            type="number"
            min={10}
            max={500}
            value={maxItems}
            onChange={(e) => setMaxItems(e.target.value)}
            className="py-1 px-2 bg-background"
          />
        </label>
        <Button
          variant="ghost"
          size="sm"
          title="Preview history"
          disabled={busy}
          onClick={handlePreview}
        >
          <Eye size={14} />
          Preview
        </Button>
      </div>

      {/* Keyword search */}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search history by keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          className="flex-1"
        />
        <Button variant="ghost" size="sm" disabled={busy} onClick={handleSearch}>
          <Search size={14} />
          Search
        </Button>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <Card>
          <CardTitle>Search Results</CardTitle>
          <CardContent>
            <ul className="list-none max-h-[180px] overflow-y-auto">
              {searchResults.map((entry, i) => (
                <li
                  key={entry.id ?? i}
                  className="flex items-start gap-1 py-1.5 border-b border-border last:border-b-0 last:pb-0 first:pt-0"
                >
                  <div className="flex flex-col gap-px flex-1 min-w-0">
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-[#06c] no-underline leading-snug hover:underline"
                    >
                      {truncate(entry.title || entry.url, 80)}
                    </a>
                    <span className="text-[10px] text-muted-foreground">
                      {formatVisitTime(entry.lastVisitTime)} &middot;{" "}
                      {entry.visitCount ?? 0} visits
                    </span>
                  </div>
                  <button
                    type="button"
                    title="Delete from history"
                    className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteEntry(entry.url, "search")}
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Question input */}
      <div className="flex flex-col gap-2">
        <Textarea
          rows={3}
          placeholder={
            hasConversation
              ? "Ask a follow-up question..."
              : "Ask anything about your browsing history..."
          }
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button fullWidth disabled={busy} onClick={handleAsk}>
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Send size={16} />
              {hasConversation ? "Follow Up" : "Ask Agent"}
            </>
          )}
        </Button>
      </div>

      {/* Status */}
      {status && (
        <p
          className={`min-h-4 text-[11px] font-medium text-center ${
            status.isError ? "text-destructive" : "text-success"
          }`}
        >
          {status.text}
        </p>
      )}

      {/* Tool actions */}
      {toolActions.length > 0 && (
        <div className="flex flex-col gap-1 px-1">
          {toolActions.map((action, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <Wrench size={11} className="shrink-0" />
              <span>{action.summary}</span>
            </div>
          ))}
        </div>
      )}

      {/* Answer */}
      {answer !== null && (
        <Card>
          <CardTitle>Answer</CardTitle>
          <CardContent className="text-[13px] leading-relaxed whitespace-pre-wrap break-words max-h-[220px] overflow-y-auto">
            {answer || "No answer yet."}
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <Card>
          <CardTitle>Sources</CardTitle>
          <CardContent>
            <ul className="list-none max-h-[180px] overflow-y-auto">
              {sources.map((entry, i) => (
                <li
                  key={entry.id ?? i}
                  className="flex items-start gap-1 py-1.5 border-b border-border last:border-b-0 last:pb-0 first:pt-0"
                >
                  <div className="flex flex-col gap-px flex-1 min-w-0">
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-[#06c] no-underline leading-snug hover:underline"
                    >
                      {truncate(entry.title || entry.url, 80)}
                    </a>
                    <span className="text-[10px] text-muted-foreground">
                      {formatVisitTime(entry.lastVisitTime)} &middot;{" "}
                      {entry.visitCount ?? 0} visits
                    </span>
                  </div>
                  <button
                    type="button"
                    title="Delete from history"
                    className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteEntry(entry.url, "sources")}
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
