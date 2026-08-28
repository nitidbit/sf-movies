# 5. User-facing prose is written in Hemingway's style

Date: 2026-08-27

## Status

Accepted

## Context

The site's prose had accumulated in the default voice of software: friendly,
hedged, over-explained, ending on an exclamation mark. The front page told
visitors what the site "collects," walked them through the star in a sentence
with an em-dash and a subordinate clause, and closed with "IRL!". It was not
bad writing. It was writing nobody had decided anything about.

Two things made a decision worth making. The site is a list of old films
playing in old neighborhood houses — the Balboa, the Vogue, the 4-Star — and
plain, concrete prose suits that better than product copy does. And we
introduced a change log, which is prose a visitor reads for pleasure or not at
all, so its voice is the whole of its appeal.

Without a record, the next person to touch this copy will improve it back
toward the default. That is the failure mode this record exists to prevent.

## Decision

Visitor-facing prose is written in Hemingway's style.

In practice:

- Short declarative sentences. Join them with "and" rather than nesting
  clauses inside them.
- Concrete nouns and plain verbs. Few adjectives. No adverb propping up a weak
  verb.
- No exclamation marks. No enthusiasm the reader has not earned.
- State the fact and stop. Do not explain the feeling the fact should produce.
- Admit what was wrong plainly, in the same flat tone as everything else.
- No cleverness, no puns, no wordplay. He did not do it and it curdles fast.

The change log is a diary. It is titled *Diario*, entries are first person
plural and past tense, dates are Spanish (`27 de agosto de 2026`), and the
typography is uniform — dates are set at body size, because a journal is
written in one hand.

An illustration, from the front page:

> Before — The Browsing list shows local movie showings. Click the ★ on any
> showing to start your wish list — starred showings will show up in your Wish
> List. Then send your list to friends to arrange a movie night out, IRL!

> After — Look through the Browsing list. When you find a showing you want,
> click the ★. It goes to your Wish List. Send the list to your friends and go.

**Scope.** This applies to the front page and the change log: prose a
moviegoer reads. It does not apply to the status page, which is an operator
tool where precision beats voice, and it does not apply to code comments,
ADRs, PRDs, issue files, or the README. Technical writing has a different job
and borrowing this style there would cost clarity for nothing.

## Consequences

The prose is shorter, which is most of the benefit. The front page lost about
a third of its words and gained the instruction it was burying.

Copy now takes longer to write, and invites disagreement about wording that
functional copy would not. That cost is accepted; it is the same cost as
having a visual design.

Terseness can cut past usefulness. The test for any instruction is whether a
first-time visitor can still work the site after reading it — voice never wins
against that.

There is a standing risk of pastiche. The style is short sentences and
concrete nouns, not bullfighting, not weather, not "it was good and true."
When in doubt, cut a word rather than add a flourish.

The site's name is being chosen in this spirit and is not yet settled; the
candidates are listed on the front page for visitors to weigh in on.
