import type { ExtensionMessage, ExtensionResponse } from "../shared";

export function sendMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response?: ExtensionResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response) {
        reject(new Error("No response from extension worker."));
        return;
      }
      resolve(response);
    });
  });
}
