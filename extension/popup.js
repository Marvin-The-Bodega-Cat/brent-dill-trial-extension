async function get(keys){ return await chrome.storage.local.get(keys); }
async function set(obj){ return await chrome.storage.local.set(obj); }
function jsonl(rows){ return rows.map(r => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""); }
function setBadgeCount(n){
  chrome.action.setBadgeText({ text: n > 0 ? String(n) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#444" });
}
async function refreshCount(){
  const state = await get(["captures"]);
  const n = (state.captures || []).length;
  document.getElementById("count").textContent = String(n);
  setBadgeCount(n);
}
async function init(){
  const role = document.getElementById("role");
  const enabled = document.getElementById("enabled");
  const state = await get(["role", "enabled", "captures"]);
  role.value = state.role || "jury";
  enabled.checked = state.enabled !== false;
  await refreshCount();
  role.addEventListener("change", () => set({role: role.value}));
  enabled.addEventListener("change", () => set({enabled: enabled.checked}));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.captures) refreshCount();
  });
  document.getElementById("export").addEventListener("click", async () => {
    const s = await get(["captures"]);
    const blob = new Blob([jsonl(s.captures || [])], {type:"application/jsonl"});
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({url, filename:`brent-dill-trial-captures-${new Date().toISOString().slice(0,10)}.jsonl`, saveAs:true});
  });
  document.getElementById("clear").addEventListener("click", async () => {
    if (confirm("Clear local captures?")) {
      await set({captures: []});
      await refreshCount();
    }
  });
}
init();
