import type { Params, UIMatch } from 'react-router'

export type Breadcrumb = {
  label: string
  path: string
}

export type BreadcrumbHandle = {
  breadcrumb: (match: UIMatch) => Breadcrumb
}

export interface BreadcrumbMatch<
  TData = unknown,
  TParams extends Params = Params,
> extends UIMatch<TData, BreadcrumbHandle> {
  params: TParams
}

export type BreadcrumbCapableMatch<TData = unknown> = UIMatch<
  TData,
  BreadcrumbHandle
>
