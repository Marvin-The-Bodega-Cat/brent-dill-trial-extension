async function refreshBadge() {
  const current = await chrome.storage.local.get(["captures"]);
  const count = (current.captures || []).length;
  await chrome.action.setBadgeText({ text: count ? String(count) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#444" });
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(["role", "enabled", "captures"]);
  await chrome.storage.local.set({
    role: current.role || "jury",
    enabled: current.enabled !== false,
    captures: current.captures || []
  });
  await refreshBadge();
});

chrome.runtime.onStartup.addListener(refreshBadge);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "capture-count") {
    chrome.action.setBadgeText({ text: message.count ? String(message.count) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#444" });
    sendResponse({ ok: true });
    return false;
  }
  if (message && message.type === "storage-get") {
    chrome.storage.local.get(message.keys ?? null, values => sendResponse({ ok: true, values }));
    return true;
  }
  if (message && message.type === "storage-set") {
    chrome.storage.local.set(message.values || {}, () => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.captures) refreshBadge();
});
