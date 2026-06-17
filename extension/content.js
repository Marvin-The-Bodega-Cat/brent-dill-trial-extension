(() => {
  const SCANNED_ATTR = "data-bd-trial-scanned";
  const BADGE_CLASS = "bd-trial-badge";
  const defaultState = { role: "jury", enabled: true, config: globalThis.BDTrialClassifier.DEFAULT_CONFIG };
  let state = { ...defaultState };
  const seen = new Set();

  function hasChromeStorage() {
    return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
  }

  function storageGet(keys) {
    return new Promise(resolve => {
      if (hasChromeStorage()) return chrome.storage.local.get(keys, resolve);
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        return chrome.runtime.sendMessage({ type: "storage-get", keys }, response => resolve((response && response.values) || {}));
      }
      resolve({});
    });
  }

  function storageSet(obj) {
    return new Promise(resolve => {
      if (hasChromeStorage()) return chrome.storage.local.set(obj, resolve);
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        return chrome.runtime.sendMessage({ type: "storage-set", values: obj }, () => resolve());
      }
      resolve();
    });
  }

  function sendRuntimeMessage(message) {
    try {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) return;
      const maybePromise = chrome.runtime.sendMessage(message);
      if (maybePromise && typeof maybePromise.catch === "function") maybePromise.catch(() => {});
    } catch (_) {}
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

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function statusUrlsFromArticle(article) {
    return unique(Array.from(article.querySelectorAll('a[href*="/status/"]')).map(a => a.href));
  }

  function domFeaturesFromArticle(article, mainTweetId) {
    const statusUrls = statusUrlsFromArticle(article);
    const imageUrls = unique(Array.from(article.querySelectorAll('img[src*="pbs.twimg.com/media/"]')).map(img => img.src));
    const linkUrls = unique(Array.from(article.querySelectorAll('a[href]')).map(a => a.href));
    const quotedStatusUrls = statusUrls.filter(url => !mainTweetId || !url.includes(`/status/${mainTweetId}`));
    const text = article.innerText || "";
    return {
      status_urls: statusUrls,
      quoted_status_urls: quotedStatusUrls,
      has_quote_card: quotedStatusUrls.length > 0 || /\bQuote\b/.test(text),
      image_urls: imageUrls,
      image_count: imageUrls.length,
      video_count: article.querySelectorAll('video').length,
      has_media: imageUrls.length > 0 || article.querySelectorAll('video').length > 0,
      link_urls: linkUrls,
      visible_has_show_more: /\bShow more\b/.test(text),
      visible_has_replying_to: /\bReplying to\b/.test(text)
    };
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
      sendRuntimeMessage({ type: "capture-count", count: captures.length });
    }
  }

  async function scan() {
    if (!state.enabled) return;
    const articles = Array.from(document.querySelectorAll('article[role="article"]'));
    for (const article of articles) {
      const text = article.innerText || "";
      const classification = globalThis.BDTrialClassifier.classifyTweet(text, state.config, pageContextText());
      if (!globalThis.BDTrialClassifier.roleAllows(state.role, classification)) continue;
      const tweetId = tweetIdFromArticle(article);
      const receipt = globalThis.BDTrialClassifier.receiptFromTweet({
        tweetId,
        url: tweetUrlFromArticle(article),
        author: authorFromArticle(article),
        text,
        role: state.role,
        classification,
        domFeatures: domFeaturesFromArticle(article, tweetId)
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
