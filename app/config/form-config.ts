export const formConfig = {
  intent: {
    name: "intent",
    value: {
      delete: "delete",
      publish: "publish",
      retract: "retract",
      archive: "archive",
      restore: "restore",
      signOut: "sign-out",
      signInWithBiometric: "sign-in-with-biometric",
    },
  },
  authenticityToken: {
    name: "csrf",
  },
} as const
