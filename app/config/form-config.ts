export const FORM_CONFIG = {
  authenticityToken: {
    name: 'csrf',
  },
  intent: {
    name: 'intent',
    value: {
      archive: 'archive',
      bulkDelete: 'bulk-delete',
      changePublishedAt: 'change-published-at',
      createFilter: 'create-filter',
      delete: 'delete',
      deleteFilter: 'delete-filter',
      overwriteFilter: 'overwrite-filter',
      publish: 'publish',
      regenerateBackupCodes: 'regenerate-backup-codes',
      renameFilter: 'rename-filter',
      restore: 'restore',
      retract: 'retract',
      review: 'review',
      setDefaultFilter: 'set-default-filter',
      signInWithBiometric: 'sign-in-with-biometric',
      signOut: 'sign-out',
      toggleSharedFilter: 'toggle-shared-filter',
      unsetDefaultFilter: 'unset-default-filter',
    },
  },
  redirect: {
    name: 'redirect',
  },
} as const
