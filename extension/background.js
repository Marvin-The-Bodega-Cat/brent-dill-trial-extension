chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(["role", "enabled", "captures"]);
  await chrome.storage.local.set({
    role: current.role || "jury",
    enabled: current.enabled !== false,
    captures: current.captures || []
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === "capture-count") {
    chrome.action.setBadgeText({ text: String(message.count) });
    chrome.action.setBadgeBackgroundColor({ color: "#444" });
  }
});
