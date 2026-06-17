(() => {
  const SCANNED_ATTR = "data-bd-trial-scanned";
  const BADGE_CLASS = "bd-trial-badge";
  const defaultState = { role: "jury", enabled: true, config: globalThis.BDTrialClassifier.DEFAULT_CONFIG };
  let state = { ...defaultState };
  const seen = new Set();

  function storageGet(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  }
  function storageSet(obj) {
    return new Promise(resolve => chrome.storage.local.set(obj, resolve));
  }

  async function loadState() {
    const stored = await storageGet(["role", "enabled", "config"]);
    state = { ...defaultState, ...stored, config: { ...defaultState.config, ...(stored.config || {}) } };
  }

  function tweetIdFromArticle(article) {
    const link = article.querySelector('a[href*="/status/"]');
    const href = link ? link.href : location.href;
    const match = href.match(/status\/(\d+)/);
    return match ? match[1] : null;
  }

  function tweetUrlFromArticle(article) {
    const id = tweetIdFromArticle(article);
    return id ? `https://x.com/i/web/status/${id}` : location.href;
  }

  function authorFromArticle(article) {
    const userLink = article.querySelector('a[href^="/"], a[href^="https://x.com/"]');
    if (!userLink) return null;
    const href = userLink.getAttribute("href") || "";
    const match = href.match(/(?:x\.com)?\/?([A-Za-z0-9_]{1,15})(?:$|[/?])/);
    return match ? match[1] : null;
  }

  function pageContextText() {
    const parts = [location.href];
    const searchInput = document.querySelector('input[data-testid="SearchBox_Search_Input"], input[aria-label="Search query"]');
    if (searchInput && searchInput.value) parts.push(searchInput.value);
    const params = new URLSearchParams(location.search);
    for (const key of ["q", "src"]) {
      const value = params.get(key);
      if (value) parts.push(value);
    }
    return parts.join(" ");
  }

  function addBadge(article, classification) {
    if (article.querySelector(`.${BADGE_CLASS}`)) return;
    const badge = document.createElement("button");
    badge.className = `${BADGE_CLASS} ${classification.lane}`;
    badge.textContent = `BD trial: ${classification.lane}`;
    badge.title = "Captured locally for Brent Dill trial export";
    badge.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const tweetId = tweetIdFromArticle(article);
      await markAdmission(tweetId, "admitted_by_participant");
      badge.textContent = `BD trial: admitted`;
      badge.classList.add("admitted");
    });
    article.prepend(badge);
  }

  async function markAdmission(tweetId, admission) {
    const stored = await storageGet(["captures"]);
    const captures = stored.captures || [];
    for (const rec of captures) {
      if (rec.tweet_id === tweetId) rec.admission = admission;
    }
    await storageSet({ captures });
  }

  async function persistReceipt(receipt) {
    if (!receipt.tweet_id && seen.has(receipt.text)) return;
    const key = receipt.tweet_id || receipt.text;
    if (seen.has(key)) return;
    seen.add(key);
    const stored = await storageGet(["captures"]);
    const captures = stored.captures || [];
    if (!captures.some(r => (r.tweet_id && r.tweet_id === receipt.tweet_id) || (!r.tweet_id && r.text === receipt.text))) {
      captures.push(receipt);
      await storageSet({ captures });
      chrome.runtime.sendMessage({ type: "capture-count", count: captures.length }).catch(() => {});
    }
  }

  async function scan() {
    if (!state.enabled) return;
    const articles = Array.from(document.querySelectorAll('article[role="article"]'));
    for (const article of articles) {
      if (article.getAttribute(SCANNED_ATTR) === "1") continue;
      article.setAttribute(SCANNED_ATTR, "1");
      const text = article.innerText || "";
      const classification = globalThis.BDTrialClassifier.classifyTweet(text, state.config, pageContextText());
      if (!globalThis.BDTrialClassifier.roleAllows(state.role, classification)) continue;
      const receipt = globalThis.BDTrialClassifier.receiptFromTweet({
        tweetId: tweetIdFromArticle(article),
        url: tweetUrlFromArticle(article),
        author: authorFromArticle(article),
        text,
        role: state.role,
        classification
      });
      addBadge(article, classification);
      await persistReceipt(receipt);
    }
  }

  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    const run = async () => { scheduled = false; await loadState(); await scan(); };
    if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 1000 });
    else setTimeout(run, 250);
  }

  chrome.storage.onChanged.addListener(() => scheduleScan());
  loadState().then(scan);
  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
})();
