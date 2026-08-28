# 3. A theater is green only when every discrepancy class is empty

Date: 2026-08-27

## Status

Accepted

## Context

The status page needs a verdict per theater that can be read at a glance. The
comparison produces five classes: matched, time mismatches, title mismatches,
showings only we list, and showings only SceneF lists.

Which of those should withhold a green check is a judgement call, and the
alternatives were real:

- **Ours fully verified.** Green when everything *we* publish is confirmed,
  ignoring showings only SceneF has. Balboa would go green today.
- **A percentage, no verdict.** Show the numbers and let the reader judge.

The tension is that SceneF legitimately carries things we never will —
festival passes, which are ticketing products rather than screenings — and
that some venues re-title events editorially in ways no rule will reconcile.
Under a strict rule those theaters stay red permanently.

## Decision

Green only when the comparison ran and all four discrepancy classes are empty.
Anything else is red, with per-class counts.

Excluded showings (outside the window both feeds cover) and collapsed SceneF
duplicates are context, not discrepancies, and do not withhold green.

## Consequences

A green check means something exact: every showing, on both sides, agreed.
That is worth more than a green check that means "green under the current
definition of green."

The cost is that some theaters may never be green. 4-Star is the clear case —
SceneF rewrites its event titles editorially, producing title mismatches that
are not errors on either side. Balboa is close behind, carrying festival
passes and box-office-only screenings.

This creates a standing temptation: a permanently red theater looks broken,
and the apparent fix is to loosen the rule. Do not, without deciding
deliberately and superseding this record. The intended response to persistent
red is to reduce genuine noise at its source — which is what deduplicating
SceneF's duplicate listings did, cutting Balboa from 35 rows to 18 — or to
accept that a theater has real, explainable disagreement.
