import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Settings } from "lucide-react";
import {
  DEFAULT_MODEL,
  type ErrorResponse,
  type GetSettingsResponse,
} from "../shared";
import { sendMessage } from "../hooks/use-chrome-message";
import { Button } from "./ui/button";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function SettingsApp() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [status, setStatus] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

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

        setModel(response.model || DEFAULT_MODEL);
        if (response.hasApiKey) {
          setKeyStatus({ text: "API key is saved", ok: true });
        } else {
          setKeyStatus({ text: "No API key saved yet", ok: false });
        }
      } catch {
        setStatus({ text: "Failed to load settings.", isError: true });
      }
    })();
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedKey = apiKey.trim();
    const trimmedModel = model.trim() || DEFAULT_MODEL;

    if (!trimmedKey) {
      setStatus({ text: "Enter an API key before saving.", isError: true });
      return;
    }

    setSaving(true);
    try {
      const response = await sendMessage({
        type: "saveSettings",
        apiKey: trimmedKey,
        model: trimmedModel,
      });

      if (!response.ok) {
        setStatus({ text: response.error, isError: true });
        return;
      }

      setApiKey("");
      setKeyStatus({ text: "API key is saved", ok: true });
      setStatus({ text: "Settings saved successfully.", isError: false });
    } catch (error) {
      setStatus({
        text:
          error instanceof Error ? error.message : "Failed to save settings.",
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  }, [apiKey, model]);

  return (
    <main className="flex justify-center px-4 py-10 min-h-screen">
      <div className="w-full max-w-[440px] flex flex-col gap-4">
        {/* Header */}
        <header className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Settings</h1>
            <p className="text-xs text-muted-foreground">
              Configure your AI connection
            </p>
          </div>
        </header>

        {/* API Configuration Card */}
        <Card>
          <CardTitle>API Configuration</CardTitle>
          <CardContent className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <Label htmlFor="apiKeyInput">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="apiKeyInput"
                  type={showKey ? "text" : "password"}
                  placeholder="sk-..."
                  autoComplete="off"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  title={showKey ? "Hide key" : "Show key"}
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-7 border-none bg-transparent text-muted-foreground flex items-center justify-center rounded-md cursor-pointer hover:bg-accent hover:text-primary"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {keyStatus && (
                <span
                  className={`text-[11px] ${
                    keyStatus.ok ? "text-success" : "text-warning"
                  }`}
                >
                  {keyStatus.text}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="modelInput">Model</Label>
              <Input
                id="modelInput"
                type="text"
                placeholder="gpt-5-nano"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <span className="text-[11px] text-muted-foreground">
                OpenAI model identifier
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <Button fullWidth disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>

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
      </div>
    </main>
  );
}
