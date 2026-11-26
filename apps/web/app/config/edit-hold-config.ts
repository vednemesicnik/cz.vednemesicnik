// The edit hold (design 07g, log 0019): the editor renews it about every
// 30 s, and without a signal it expires after about 2 minutes.
export const EDIT_HOLD_CONFIG = {
  durationMilliseconds: 2 * 60 * 1000,
  // The editor's own last save: it takes the hold back only over that (24i).
  expectedUpdatedAtName: 'expectedUpdatedAt',
  // A page going away (maybe a reload) ends an empty draft's hold without
  // deleting the draft; the sweep takes it once expired.
  keepEmptyName: 'keepEmpty',
  // The last save of a page going away also ends the hold (log 0022).
  releaseHoldName: 'releaseHold',
  renewIntervalMilliseconds: 30 * 1000,
  // The editor's tab (24g), one per page load.
  tabIdName: 'editTabId',
} as const
