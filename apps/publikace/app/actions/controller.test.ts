import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { stylesheetHref } from '../assets.ts'
import { router } from '../router.ts'
import { routes } from '../routes.ts'

describe('home', () => {
  it('answers with the editors-in-chief layout in Czech', async () => {
    let response = await router.fetch(new URL(routes.home.href(), 'http://localhost'))
    let html = await response.text()

    assert.equal(response.status, 200)
    assert.match(response.headers.get('Content-Type') ?? '', /text\/html/)
    assert.match(html, /<html lang="cs">/)
    assert.match(html, /<title>Vydání · Publikace<\/title>/)
    assert.match(html, /<h1[^>]*>Vydání<\/h1>/)
  })

  it('draws the panel with Vydání as the current section', async () => {
    let response = await router.fetch(new URL(routes.home.href(), 'http://localhost'))
    let html = await response.text()

    assert.match(html, /<aside aria-label="Panel aplikace" class="vdm-sidebar">/)
    assert.match(html, /<span class="vdm-sidebar__product">Publikace<\/span>/)
    // Attribute order is the renderer's business, so the link is found first and read after.
    let link = /<a [^>]*>Vydání<\/a>/.exec(html)?.[0] ?? ''
    assert.match(link, /aria-current="page"/)
    assert.match(link, /class="vdm-sidebar__item vdm-sidebar__item--active"/)
    assert.match(link, /href="\/"/)
  })

  it('links the design system stylesheet', async () => {
    let response = await router.fetch(new URL(routes.home.href(), 'http://localhost'))
    let html = await response.text()

    assert.ok(html.includes(`<link rel="stylesheet" href="${stylesheetHref}" />`))
  })
})
