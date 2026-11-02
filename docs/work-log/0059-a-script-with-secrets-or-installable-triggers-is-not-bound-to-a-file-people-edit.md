# 0059. A script with secrets or installable triggers is not bound to a file people edit

- Date: 2026-11-02
- Issues: #393, #385

## Context

`SCRIPT__Membership__Applications` was bound to the sheet of applications. The leadership group edits
that sheet, because recording an admission means ticking a box, and Google gives everyone with edit
access to a file the same access to its bound project.

Google documents that script properties are shared with collaborators and that installable triggers
run as the account that created them. So an editor of the sheet could read `MAILER_SECRET`, and the
Mailer sends anything to anyone from its mailbox; log 0037 kept that key away from the app for exactly
this reason. The same secret signs the sign-in link's requests.

Google does not say outright that a trigger runs code saved by another editor, only that the head
deployment is the latest saved code. If it does, that code runs as the deploying account with the full
`drive` scope, which also reaches the other projects that account owns, sign-in link included. None of
this was tested: the readable secret alone justified the change.

Only trusted people had edit access, so nothing was exposed in practice. A change of the statutes may
add people to the group, and adding someone would have handed them all this with no sign of it.

## Outcome

A script that holds secrets or runs installable triggers is a standalone project, owned by its
deploying account and shared with nobody. It opens the file it needs by id. People keep working in the
file, and the script's edit trigger still fires on their edits.

## What follows

- The membership script moved before the form's link went out, so changing its address cost nothing.
  The setup and the steps of the move are in that repository's README and CHANGELOG.
- The old bound project cannot be detached from the sheet. It stays there, empty and without properties.
- The editorial-board enrolment (#385) starts as a standalone project.
- `SCRIPT__Publication__Article_Approve` and `SCRIPT__Editorial_Board__Contacts` also read their active
  file, so they may be bound. Neither has the `drive` scope in its manifest or installs a trigger in
  code; their properties have not been looked at.
- A bound script stays fine when it has no secrets and no authority beyond what its editors already have.

## Turned down

- **Secrets in User Properties of the deploying account.** Collaborators cannot see them, but changed
  trigger code can read and send them out.
- **A dedicated account for this project.** It narrows what `drive` reaches, but the secret stays
  readable.
- **Protected ranges or view-only access.** Access to the bound project follows access to the file, and
  ticking the box needs edit access.
- **Rotating the Mailer's secret now.** It touches three projects and the sign-in path, and only
  trusted people ever had access. Rotate it if one of those accounts comes into doubt.
