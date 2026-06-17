(function (global) {
  const DEFAULT_CONFIG = {
    subjectNames: ["brent dill", "brentdill", "brent_dill"],
    pTerms: [
      "dangerous", "harm", "harmful", "abuse", "abusive", "pattern", "unsafe", "exclude", "excluded", "predator", "manipulative", "threat", "victim", "warning"
    ],
    dTerms: [
      "harmless", "outsized", "overreaction", "overreacted", "context", "misread", "misrepresented", "clearing", "innocent", "unfair", "mob", "default guilty", "witch hunt"
    ]
  };

  function normalizeText(text) {
    const raw = String(text || "");
    let decoded = raw;
    try { decoded = decodeURIComponent(raw); } catch (_) { decoded = raw; }
    return decoded.toLowerCase().replace(/\s+/g, " ").trim();
  }

  function containsAny(text, terms) {
    const t = normalizeText(text);
    return (terms || []).filter(term => t.includes(normalizeText(term)));
  }

  function classifyTweet(text, config = DEFAULT_CONFIG, contextText = "") {
    const normalized = normalizeText(text);
    const subjectTerms = config.subjectNames || DEFAULT_CONFIG.subjectNames;
    const directSubjectMatches = containsAny(normalized, subjectTerms);
    const contextSubjectMatches = containsAny(contextText, subjectTerms).map(term => `context:${term}`);
    const subjectMatches = [...directSubjectMatches, ...contextSubjectMatches];
    const pMatches = containsAny(normalized, config.pTerms || DEFAULT_CONFIG.pTerms);
    const dMatches = containsAny(normalized, config.dTerms || DEFAULT_CONFIG.dTerms);
    const related = subjectMatches.length > 0;
    if (!related) {
      return { related: false, lane: "irrelevant", subjectMatches: [], prosecutionMatches: [], defenseMatches: [], score: 0 };
    }
    let lane = "jury";
    if (pMatches.length > dMatches.length) lane = "prosecution";
    if (dMatches.length > pMatches.length) lane = "defense";
    if (pMatches.length && dMatches.length && pMatches.length === dMatches.length) lane = "contested";
    const score = subjectMatches.length + pMatches.length + dMatches.length;
    return { related: true, lane, subjectMatches, prosecutionMatches: pMatches, defenseMatches: dMatches, score };
  }

  function roleAllows(role, classification) {
    if (!classification.related) return false;
    if (role === "jury") return true;
    if (role === "prosecution") return classification.lane === "prosecution" || classification.lane === "contested";
    if (role === "defense") return classification.lane === "defense" || classification.lane === "contested";
    return true;
  }

  function receiptFromTweet({ tweetId, url, author, text, role, classification, capturedAt, domFeatures }) {
    return {
      schema_version: "trial-extension-capture/v0.2",
      source_platform: "x",
      source_type: "public_tweet_visible_in_browser",
      tweet_id: tweetId || null,
      url: url || null,
      author: author || null,
      text: text || "",
      participant_role: role || "jury",
      suggested_lane: classification.lane,
      related: classification.related,
      matches: {
        subject: classification.subjectMatches,
        prosecution: classification.prosecutionMatches,
        defense: classification.defenseMatches
      },
      dom_features: domFeatures || {},
      admission: "unreviewed",
      counter_context: "",
      captured_at: capturedAt || new Date().toISOString()
    };
  }

  global.BDTrialClassifier = { DEFAULT_CONFIG, normalizeText, classifyTweet, roleAllows, receiptFromTweet };
})(typeof globalThis !== "undefined" ? globalThis : window);
