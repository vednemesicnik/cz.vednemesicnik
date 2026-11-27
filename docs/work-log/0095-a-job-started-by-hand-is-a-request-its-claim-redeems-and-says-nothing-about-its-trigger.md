# 0095. A job started by hand is a request its claim redeems, and says nothing about its trigger

- Date: 2026-11-27
- Issues: #1083

## Context

The design draws _Spustit teď_ on the rows of _Úlohy na pozadí_ (`14d`) and on each job's page
(`14e`): one click, after which the row is _Běží_ until the run reports, and a failed request
leaves the row as it was (`11c`). Publikace's `AGENTS.md` already said the app could start a job
through the script's `doPost`, and `.env.example` documented a `SCRIPT_RUN_SECRET` that nothing
read (review finding P-02, `apps/publikace/docs/review-2026-11-24.md`). Five Apps Script jobs
report to the app: `Artwork_Replies`, `Article_Approvals`, `Print_Handoff`, `Article_Comments`
and `Proofreading_Digest`. Each opens its run with a claim through `/api/v1`, and the app knows a
job only from those runs.

## Outcome

**A start is a request, not a run.** The app records who asked in `job_starts` with a one-time
`startKey` and posts `{ job, startKey }` to the job's `doPost` in the Mailer's signed envelope.
The `doPost` keeps the key and runs the job from a one-off trigger, as `publikace.app@`. The
job's claim carries `startKey` back, and the app opens the run only for an unredeemed start of
that job (else 409 `unknown_start`). That run is then the starter's, shown in the history with
their name. While a start waits for its run, at most the 10 minutes a run can last, the job is
_Běží_ from the moment it was asked for.

**Health comes from scheduled runs only.** _Neběží_, the next-run estimate and the banner's
_stopped_ read the latest run that has no start. A run by hand decides only the outcome tag, so
one click on a job whose trigger is gone does not clear _Neběží_ or the banner. That is what the
sentence by the button, „Jeden běh beze změny plánu.“, warns about.

**One pair of variables per job, `GAS_<JOB>_URL` and `GAS_<JOB>_SECRET`, optional in
production.** A job without both has no button and keeps the texts that do not offer it, so the
release changes nothing until the `doPost`s are deployed and the secrets set. The API change is
additive: an optional `startKey` on every claim. `apps/publikace/docs/architecture.md`
§ Background work describes the current state.

## What follows

- Each job's secret starts only that job. A leaked one starts that job once per signed request;
  it reads and writes nothing else.
- A job only ever started by hand has no estimate and is never _Neběží_: no trigger, no interval
  to miss.
- A start the `doPost` took but whose run never claims (a one-off trigger Apps Script refused, a
  run that threw before its claim) leaves no trace: the job is _Běží_ for 10 minutes and then
  shows its earlier tag. Accepted, because the job's own log in Apps Script has it and a second
  press tries again; a reason to revisit is a start that goes missing more than once.
- _Neběží_ shows the time of the trigger's last run too, and says so: _Poslední běh podle plánu_
  in `14d`, „Z běhu podle plánu se naposledy ohlásila …“ in `14e`, and for the digest „Z
  posledního plánovaného běhu chybí hlášení.“ in place of „Dnes se úloha neohlásila.“, which a
  run by hand that day made untrue (copywriter, thread `8huj7wqi`).
- A reason to revisit: Apps Script refuses one-off triggers (its quota, or a project at its
  trigger limit), or a job needs to know at once that it was started, for instance to answer the
  click with its result. Then the `doPost` would run the job in the request.

## Turned down

- **One `SCRIPT_RUN_SECRET` for every job.** One leak would start all five, and each project's
  Script Properties would hold the secret of the others. One pair per job is the `GAS_` convention
  of #1099.
- **Running the job inside the `doPost`.** The click would wait up to six minutes on Apps Script,
  past the app's 15 s timeout, and a timeout would read as a failure while the run went on.
- **Opening the run at the click, in the app.** The run would exist before the job did anything,
  and a `doPost` that never ran its trigger would leave a run open until it went overdue as
  _S chybou_. A request the claim redeems needs no guessed interval and tells _the script did
  not take it_ apart from _the run failed_.
- **Counting a run by hand as a sign of health.** One click would clear _Neběží_ and the banner
  while the trigger stayed dead.
