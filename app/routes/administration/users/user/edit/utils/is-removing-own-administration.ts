type Options = {
  isOwnAccount: boolean
  isLoadedAdministrator: boolean
  isAdministratorChecked: boolean
}

/**
 * Whether saving Upravit uživatele takes the signed-in Administrator's own
 * administration away (design 28g): their own account, loaded as
 * Administrátor, with „Spravuje uživatele a autory“ unticked. It is the only
 * role change confirmed by a dialog, since they cannot undo it themselves.
 *
 * @param options.isOwnAccount - The edited account is the signed-in one.
 * @param options.isLoadedAdministrator - The role the form was loaded with
 *   is Administrátor.
 * @param options.isAdministratorChecked - The box is ticked now.
 */
export const isRemovingOwnAdministration = ({
  isOwnAccount,
  isLoadedAdministrator,
  isAdministratorChecked,
}: Options) => isOwnAccount && isLoadedAdministrator && !isAdministratorChecked
