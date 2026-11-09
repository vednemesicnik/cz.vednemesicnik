# 0074. Feeds are public, and a podcast's feed is found by its id

- Date: 2026-11-08
- Issues: #223

## Context

The site had no feeds; readers had to come back to see what was new. #223 planned RSS and JSON Feed
for articles and the archive in July, with podcasts left out because episodes have no hosted audio.
The scope grew to one feed per podcast, and design `vswhqi52` answered where a reader finds the
feeds: the `/feeds` page (17a, 17b), a footer link (10a) and a link on the podcast page
(13b). Most readers don't know RSS, so the page explains it. A podcast's published address frees its
old slug on a re-publish, and no redirect is kept (log 0039).

## Outcome

- **Feeds are strictly public**: published content only, with no relaxation for a signed-in author,
  since a feed reader has no session (`app/routes/feeds/utils/`).
- **Each published podcast has its own feed, found by the podcast's id**:
  `/feeds/podcasts/:podcastId.xml` and `.json`. A subscription survives a change of the podcast's
  address. The feed of an unknown or unpublished podcast is a bare 404, and it carries only published
  episodes, linking to the episode page. There is no combined podcast feed.
- **No audio, no `<enclosure>`.** A podcast feed announces episodes in a feed reader; it is not a
  podcast-app subscription, and the page says so (copy `uvjknd7d`).
- **The page shows RSS only.** JSON Feed carries the same items but appears only in
  `<link rel="alternate">`, which the website layout writes on every website page for articles and the
  archive. A podcast page and its episodes add that podcast's feed, and `/feeds` lists every one. The
  administration offers none.
- **The page belongs to the headline family.** The footer and the tab title say *Odběr novinek*,
  the headline *Nemusíte nás pořád vyhlížet* (copy `r4teulu8`), as *Technická podpora*, reached only
  from the footer, says *Pomozte nám vylepšit web*. *Odebírat* stays the verb for the action.
- **No XSLT** to dress the XML for a browser: Chrome is removing it, and the page copies the address
  instead of opening it.

## What follows

- A podcast feed's address is part of its public contract. Changing how it is built (for example by
  slug) would break every subscription.
- The page names no feed reader, since the offer changes and nobody would keep the list current (copy
  `drf8a7ql`).
- A `CopyButton` with a visible value shows the value as plain text and a separate *Kopírovat*
  button beside it, the owner's choice over the word inside the value (design `4c4ynjih`). When the
  clipboard refuses, the sentence names the keyboard shortcut with a mouse and asks to select and copy
  the whole text without one (copy `zs8dklyw`).

## Turned down

- **A podcast feed by slug**: it would break subscriptions on a re-publish under another slug.
- **One feed for all podcasts**: a reader follows one podcast, and there is only one today.
- **Showing both formats on the page**: the second address would raise a question that a reader new to
  RSS can't answer.
