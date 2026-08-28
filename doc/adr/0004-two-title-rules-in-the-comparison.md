# 4. The comparison uses two different title rules, deliberately

Date: 2026-08-27

## Status

Accepted

## Context

The comparison module compares titles in two different places, and they do not
use the same rule. This looks like an oversight. It is not.

**Matching** our showing against SceneF's asks whether two titles name the same
film. Venues annotate ("Akira 4K"), SceneF uses the canonical title ("Akira").
Normalizing to lowercase alphanumerics and testing whether one *contains* the
other handles this well.

**Deduplicating** SceneF's own feed asks whether two of its screenings are the
same show published twice. The observed duplicates differ by a word inserted
in the *middle* of the title:

    Twin Peaks: SEASON 1, EP. 1 (Northwest Passage)
    TWIN PEAKS FEST: Season 1, Ep. 1 (Northwest Passage)

Normalized, neither string contains the other — "fest" sits between "peaks"
and "season". Containment cannot see this pair, and every such screening was
being reported as a showing we had missed.

The obvious unification is to use the looser rule everywhere. That is the
thing to avoid: treating titles as word sets, and matching on subset, is
permissive enough to merge genuinely different films. "The Room" is a subset
of "The Room Next Door".

## Decision

Keep both rules, each scoped to its own job.

- Matching keeps substring containment.
- Deduplication uses token-subset: the titles as sets of normalized words, one
  a subset of the other.

The permissive rule is safe in deduplication because it is not the only
condition. A pair must *also* share an exact start instant and come from
entirely disjoint sources before it is collapsed. Those two conditions carry
most of the discriminating power; the title rule only has to avoid collapsing
two different films that a single venue happens to start at the same minute
from two different feeds.

## Consequences

Someone reading the module will see two normalization helpers and reasonably
suspect duplication. This record is the answer.

Loosening the matching rule to token-subset later would be a separate decision
with a different risk profile, and should supersede this record rather than be
folded in as cleanup.

The narrower cost: a venue that genuinely runs two different films at one
instant, reported from two different sources, with one title a word-subset of
the other, would be wrongly collapsed. No such case has been observed, and the
same-source double bookings that do exist (the Balboa starting Akira and
*cocoon* together) are protected by the disjoint-sources condition.
