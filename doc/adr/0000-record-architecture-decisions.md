# 0. Record architecture decisions

Date: 2026-08-27

## Status

Accepted

## Context

This project is small and moves fast, and most of it explains itself: the
scrapers, the event store, and the page are readable on their own. What is not
readable is why certain choices were made *against* an obvious alternative.
Several decisions here look like oversights unless you know the reasoning, and
that reasoning currently lives only in commit messages and in conversations
that are gone.

The specific risk is a future reader — including a future agent — "fixing"
something that is deliberate.

## Decision

Record significant decisions as Architecture Decision Records in `doc/adr/`,
following Michael Nygard's format: context, decision, consequences.

Records are numbered and append-only. When a decision changes, write a new
record that supersedes the old one and mark the old one superseded; do not
edit the original. The point is to keep the reasoning legible over time, not
to keep the file accurate to today.

Write a record when a decision closes off a plausible alternative, when it
accepts a known cost, or when the code alone would mislead someone about
intent. Do not write one for routine implementation choices.

## Consequences

There is a place to look before re-litigating a decision, and a place to point
when explaining one.

The records need discipline to stay useful: an unwritten decision is invisible,
and a record nobody supersedes becomes quietly wrong. Neither failure is
enforced by tooling.
