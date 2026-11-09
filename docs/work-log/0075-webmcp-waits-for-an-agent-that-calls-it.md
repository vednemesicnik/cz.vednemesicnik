# 0075. WebMCP waits for an agent that calls it, on the website and in the administration

- Date: 2026-11-09

## Context

WebMCP lets a page register tools that an AI agent in the browser can call: a name, a description,
a JSON Schema for the input and a handler in the page's own JavaScript. Forms can also be annotated
with HTML attributes instead. The proposal was weighed twice, once per surface, since each would
gain something different: the public website, for readers whose agent reads the magazine, and the
administration, for the editorial team, whose agent could create drafts, fill in metadata and run
bulk actions.

As of November 2026 WebMCP is a W3C Community Group draft, not on the standards track. Chrome
(from 149) and Edge run it as an origin trial, off by default in every browser. A July 2026 draft
moved the API from `navigator.modelContext` to `document.modelContext`. No mainstream agent calls
the tools yet: Google announced at I/O 2026 that Gemini in Chrome would support them "soon", and
Claude, ChatGPT and Perplexity read pages from the DOM or screenshots.

## Outcome

- **Neither surface registers WebMCP tools.** The round stopped at who would use them: no reader
  or member of the editorial team has an agent that calls them.
- **The website already serves agents by what it publishes**: semantic HTML, the sitemap, the
  RSS and JSON feeds (log 0074), and the Schema.org structured data planned in #154 (#151, #152,
  #153). Every agent reads these, not only one browser's.
- **The website has no tool worth offering.** There is no search to expose (#234 is deferred),
  and its only forms, the membership application (log 0057, 0073) and the editorial-board
  enrolment (log 0066), take personal data, a signature or an e-mail code, which a person fills
  in themselves.

## What follows

- The administration comes first when this is revisited: it is where a tool saves work, a
  few articles a month by a small team. The website gains little over what it already publishes.
- An administration tool runs with the signed-in session. Text pasted into an article could carry
  a prompt injection that leads the agent to publish, archive or delete. Before any tool exists,
  the mechanism that keeps a state change behind a person's confirmation is a security design of
  its own (see `docs/_author-roles-and-permissions.md` for what each role may do).
- Bulk work that does not need a browser, such as the Medium import (#738), belongs on the server,
  not in a tool in a tab.
- Reasons to revisit: WebMCP on by default in a stable browser, and an agent that the editorial team
  or readers actually use calling the tools.

## Turned down

- **Tools on the website now**: nothing calls them, and nothing on the site needs one.
- **Tools in the administration now**: nothing calls them, the API is still moving, and the
  confirmation mechanism for state changes is undesigned.
- **Declarative attributes on the public forms**: those forms hold personal data and consent,
  which an agent should not fill in for a person.
