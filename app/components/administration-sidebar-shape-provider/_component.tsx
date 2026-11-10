import { createContext, type ReactNode, useContext } from 'react'

type AdministrationSidebarShape = 'column' | 'full-screen'

const Context = createContext<AdministrationSidebarShape>('column')

type Props = {
  children: ReactNode
  shape: AdministrationSidebarShape
}

/**
 * Tells the sidebar's parts which root they stand in, so the full-screen
 * menu's rows are 44 px for touch (tbi5qpq9). Rendered by
 * `ColumnAdministrationSidebar` and `FullScreenAdministrationSidebar`.
 *
 * @param props.shape - The root's shape
 * @returns The provider around the root's content
 */
export const AdministrationSidebarShapeProvider = ({
  children,
  shape,
}: Props) => {
  return <Context.Provider value={shape}>{children}</Context.Provider>
}

/**
 * The shape of the sidebar a part stands in; `column` outside one.
 *
 * @returns `column` or `full-screen`
 */
export const useAdministrationSidebarShape = () => useContext(Context)
