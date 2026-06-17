# Data-mine integration

Exports from the extension are JSONL capture files compatible with data-mine's source adapter pattern.

Example source config shape:

```json
{
  "block_id": "brent-dill-week-01",
  "title": "Brent Dill trial week 01 collapse",
  "sources": [
    {
      "name": "extension-captures-week-01",
      "adapter": "jsonl",
      "location": "captures/week-01/extension-captures.jsonl",
      "include": ["Brent Dill", "brentdill"]
    }
  ]
}
```

The extension does not decide truth. It creates candidate receipt rows. data-mine freezes those rows into blocks; beamlines interpret the block.
