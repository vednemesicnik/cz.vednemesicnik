# 0068. Acceptance refuses a different name, and a refused fill-down goes to pending

- Date: 2026-11-04
- Issues: #928, #385

## Context

`Přijato` on `Přihlášky` has to put the person on `Kontakty` without retyping, through the edit trigger
in `SCRIPT__Editorial_Board__Membership`. The issue left open what acceptance does when rows with another
name hold the address (log 0064), and asked for `Stav` to go back to what it was on a refusal.

Google gives no old value for a range, so a fill-down cannot go back. Writing to the multiple-selection
`Role` chips had also never been tried, and the feature rests on it.

## Outcome

A row with the address and another name refuses the acceptance and writes nothing. That holds for one such
row too, although the issue reads as refreshing it. The editor aligns the names, or changes the
application's e-mail, and picks `Přijato` again.

A refused row goes back to its old value when it is one cell, and to `Čeká na přijetí` in a range. An old
value of `Přijato` also goes to pending, because a row that claims a decision with nothing behind it looks
done.

A refresh leaves the name and e-mail alone: the row was found by them, the name on the web stays what the
editors keep, and a second address survives. A phone is written only when the application has one, and
`Poznámka` only when empty. Of several rows with one name, only the first is written.

A failure refuses too, and the execution still fails. `Zápis do Kontaktů` is stamped last and is what stops
a second write.

## What follows

- `setValue('A, B')` writes two chips to a multiple-selection cell, and an unknown role throws. Tried on
  Google on 4 Nov 2026, on a throwaway project and a scratch sheet of made-up people, with the chips set by
  hand. Picks and a fill-down went through the real trigger, and a pick from an account that only edits the
  sheet ran as `web.app@`. A paste into one cell and a real lock timeout were not tried.
- Several rows with one name run the other way from `confirmActive` and `leave`, which change them all,
  because a missed row there stays published. Here a missed row only stays as it was.
- `Kontakty` has to keep its `Poznámka` column, which the setup does not add. Without it each acceptance is
  refused with the failure note.
- #391's Monday reminder sees a refused fill-down as pending, even one that was `Nepřijato`. If that keeps
  misleading anyone, it is a reason to revisit keeping the old values.
- The first sentence of the note approved in copy thread `63x81fno` promised the previous value, which a
  range cannot keep. Thread `8b7ril08` replaced it for all three refusals.

The current state is in [the editorial-board sheet](../_editorial-board-google-sheet.md) and the project's
README.

## Turned down

- **Writing to the row with another name.** It would hand a role to a stranger and publish the wrong person.
- **A new row for another name.** Two rows on one address make `confirmActive` and `leave` answer
  `ambiguous` from then on.
- **A shadow column or a stored copy of the old values,** so a fill-down could go back. A lot of machinery
  for a rare case, when the wrong direction costs a line in a reminder.
- **Leaving `Přijato` on a refused row.** It claims a decision that did not take effect.
