// The result of „Vytvořit a pozvat“ (design 28e, p8x1s8gs): Nový uživatel's action
// passes it to the user detail as a one-shot search param.
export const INVITATION_CONFIG = {
  result: {
    failed: 'failed',
    sent: 'sent',
  },
  resultParam: 'invitation',
} as const
