async function get(keys){ return await chrome.storage.local.get(keys); }
async function set(obj){ return await chrome.storage.local.set(obj); }
function jsonl(rows){ return rows.map(r => JSON.stringify(r)).join("
") + (rows.length ? "
" : ""); }
async function init(){
  const role = document.getElementById("role");
  const enabled = document.getElementById("enabled");
  const count = document.getElementById("count");
  const state = await get(["role", "enabled", "captures"]);
  role.value = state.role || "jury";
  enabled.checked = state.enabled !== false;
  count.textContent = String((state.captures || []).length);
  role.addEventListener("change", () => set({role: role.value}));
  enabled.addEventListener("change", () => set({enabled: enabled.checked}));
  document.getElementById("export").addEventListener("click", async () => {
    const s = await get(["captures"]);
    const blob = new Blob([jsonl(s.captures || [])], {type:"application/jsonl"});
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({url, filename:`brent-dill-trial-captures-${new Date().toISOString().slice(0,10)}.jsonl`, saveAs:true});
  });
  document.getElementById("clear").addEventListener("click", async () => {
    if (confirm("Clear local captures?")) { await set({captures: []}); count.textContent = "0"; }
  });
}
init();
