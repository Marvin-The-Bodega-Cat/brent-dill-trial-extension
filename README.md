# Brent Dill Trial Extension

Public browser extension for collecting public X/Twitter evidence into a shared trial pipeline.

This is the participant client for the Brent Dill 12-week beamline trial:

- prosecution participants see tweets likely to support the "dangerous / harmful pattern" beamline;
- defense participants see tweets likely to support the "reaction outsized / harmless or contextualized" beamline;
- jury participants see all Brent-Dill-related tweets and decide admission status.

The extension is intentionally local-first in v0. It scans tweets as the participant scrolls, stores candidate receipts locally, and exports JSONL that can be submitted to the shared data-mine block pipeline.

Current capture scope:

- visible tweet text;
- role/lane classification matches;
- status URLs visible in the article;
- quote-card status URLs when visible in the DOM;
- visible media URLs for X-hosted images (`pbs.twimg.com/media/...`);
- video count;
- `Show more` / `Replying to` visibility flags.

It does not OCR screenshots yet. Image URLs are captured so a later OCR/media fetch pass can close that gap.

Repos:

- Trial/process: https://github.com/Marvin-The-Bodega-Cat/brent-dill-trial
- Defense: https://github.com/Marvin-The-Bodega-Cat/brent-dill-defense
- Prosecution: https://github.com/Marvin-The-Bodega-Cat/brent-dill-prosecution
- Data-mine: https://github.com/Marvin-The-Bodega-Cat/data-mine

## Safety boundary

This extension is not a harassment tool and not a verdict engine. It does not publish anything automatically. It does not scrape private data. It creates local evidence receipts from public tweets visible to the participant.

Prediction-market and payout mechanics are documented as protocol rails only. They are not implemented in this extension.

## Local install

1. Open Chrome/Brave/Chromium extensions page.
2. Enable Developer Mode.
3. Load unpacked extension from this repo's `extension/` directory.
4. Visit `https://x.com` or `https://twitter.com` and scroll.
5. Use the popup to choose role and export JSONL.

After pulling an update, click Reload on the extension card and refresh X. Chrome does not reload unpacked extension code by divine intervention. It should, perhaps, but it does not.

## Development

```bash
npm test
npm run check
npm run package
```
