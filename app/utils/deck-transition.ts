// Controls the donate-flow deck view transition (defined in app/styles/global.css).
// The deck descends from the top by default. Suppress it before an in-place
// re-render (a server validation error) so it doesn't replay like a full
// navigation, and enable it again before a real navigation. The flag lives on
// the document root so the html[data-deck-transition="off"] rules can read it;
// must be set synchronously before navigation so it is in place at snapshot time.
export const setDeckTransition = (enabled: boolean) => {
  if (enabled) {
    delete document.documentElement.dataset.deckTransition
  } else {
    document.documentElement.dataset.deckTransition = 'off'
  }
}
