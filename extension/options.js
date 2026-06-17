const fields = ["subjectNames", "pTerms", "dTerms"];
const defaults = globalThis.BDTrialClassifier.DEFAULT_CONFIG;
function lines(v){ return String(v || "").split("\n").map(s=>s.trim()).filter(Boolean); }
async function init(){
  const s = await chrome.storage.local.get(["config"]);
  const config = {...defaults, ...(s.config || {})};
  for (const f of fields) document.getElementById(f).value = (config[f] || []).join("\n");
  document.getElementById("save").onclick = async () => {
    const next = {};
    for (const f of fields) next[f] = lines(document.getElementById(f).value);
    await chrome.storage.local.set({config: next});
    alert("Saved");
  };
  document.getElementById("reset").onclick = async () => { await chrome.storage.local.set({config: defaults}); location.reload(); };
}
init();
