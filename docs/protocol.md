# Participant and prediction-market protocol

## Roles

### Prosecution

The prosecution role filters the local scroll stream toward tweets indicating danger, harmful behavior, exclusion-worthy patterns, or warnings. This is a discovery lens, not an admission decision.

### Defense

The defense role filters toward tweets indicating harmlessness, missing context, outsized reaction, misrepresentation, or default-guilty social compression. This is also a discovery lens, not an admission decision.

### Jury

The jury role sees all Brent-Dill-related captures and can mark individual records as admitted locally. At t=12, jury participants receive analysis tools over the shared dataset and vote on the final resolution.

## Data flow

```text
participant scrolls public X/Twitter
  -> extension detects Brent Dill related tweets
  -> role lens filters display/capture emphasis
  -> local JSONL export
  -> data-mine source pipeline
  -> shared t=0 / weekly collapse block
  -> side beamlines + jury analysis
```

## Weekly collapses

Each week, exported captures are merged into the public shared block pipeline. Weekly collapses are provisional receipts. They do not settle the trial. Only the final t=12 collapse counts for outcome and payout.

## Admission

Admission should be decided by jury workflow, not by prosecution/defense filter terms. The filters discover candidate evidence. The jury decides whether a record belongs in the shared admissible dataset.

## Prediction-market payout sketch

If a market/purse is run, the proposed split is:

- 25% to the jury pool;
- 25% to the winning side's contributor pool;
- 50% recycled back into the prediction market / next liquidity pool.

Important: this repository does not implement trading, custody, securities-like promises, gambling settlement, or legal compliance. It records the intended accounting rail. Any onchain or market implementation needs a separate compliance and blast-radius check before launch. The universe is already hostile enough without accidentally inventing an unlicensed courthouse casino.

## Prediction as support

The intended mechanism is that each prediction is both:

1. a payment in support of a side; and
2. a prediction that may pay out if that side wins.

This must be separated in accounting receipts:

- prediction receipt;
- side-support allocation receipt;
- jury-pool allocation receipt;
- market-recycling receipt;
- final settlement receipt.
