# 0070. Scheduled jobs stamp each job when it finishes and resume on the next night

- Date: 2026-11-04
- Issues: #391, #385

## Context

A confirmed enrolment waits on `Přihlášky` until an editor-in-chief decides, and nothing prompted them. The form
promises deletion after 12 months, and log 0060 moved the sort of `Kontakty` off the edit trigger to a nightly job
that did not exist. All three need a clock, and `SCRIPT__Editorial_Board__Membership` had only an edit trigger.

The data, the mailbox and the cadence all live in the script, so the app would only forward a tick. Unlike
`SCRIPT__Mail__Bounces`, which the app polls, this script schedules itself.

Apps Script kills an execution at six minutes, a trigger can fire twice, and the Mailer's idempotency cache lasts
only hours.

## Outcome

One daily trigger between 4 and 5 a.m. calls `runScheduledJobs`, and #392 adds its job behind the same entry point.

- **Each job stamps its own day in a Script Property, only when it finished.** A re-run retries what failed and
  repeats nothing else, and one failure blocks no other job. The run still throws, so it shows under Executions. The
  Mailer's key, namespaced by that Monday's date, is only a backstop.
- **Unfinished work resumes on the next run.** The deletion takes at most 50 rows a run and stops at a 4-minute
  budget, so a large backlog takes several nights.
- **A missed Monday is not made up.** The next Monday says the same, and a failed one can be re-run by hand that day.
- **The deletion ignores `Stav`.** Someone left `Čeká na přijetí` for a year goes undecided, as the form's notice
  says. A row without a real date stays, because the script writes that date with every application and a guess
  would delete by mistake.
- **The reminder names nobody:** a count, the longest wait and a link. Names and addresses in the group's mailboxes
  would outlive the 12-month deletion (decided 4 Nov 2026). When nobody waits, nothing goes out.

## What follows

A failed run raises no alarm: it shows only under Executions, and Google's failure digest goes to `web.app@`. If a
missed reminder turns out to matter, that is the reason to add one. #392's mail loop is the first job that will
really lean on the time budget, and a reason to revisit resuming on the next night if a wave cannot wait that long.

Current state: `docs/_editorial-board-google-sheet.md` and the README of `SCRIPT__Editorial_Board__Membership`.

## Turned down

- **A continuation trigger** after the budget runs out: more moving parts for a backlog that does not exist, and it
  would break "exactly one daily trigger".
- **One stamp for the whole run:** a failed reminder would either block a retry or repeat the other jobs.
- **A retry on Tuesday:** the reminder would stop meaning Monday, and the next Monday carries the same news.
- **A list of who waits:** see above. The sheet shows who, behind its own access.
- **A one-off e-mail per enrolment:** it arrives once and gets buried, where a standing reminder keeps pressing until
  the list is empty.
