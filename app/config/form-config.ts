export const FORM_CONFIG = {
  authenticityToken: {
    name: 'csrf',
  },
  intent: {
    name: 'intent',
    value: {
      archive: 'archive',
      bulkDelete: 'bulk-delete',
      delete: 'delete',
      publish: 'publish',
      regenerateBackupCodes: 'regenerate-backup-codes',
      restore: 'restore',
      retract: 'retract',
      review: 'review',
      signInWithBiometric: 'sign-in-with-biometric',
      signOut: 'sign-out',
    },
  },
  redirect: {
    name: 'redirect',
  },
} as const
