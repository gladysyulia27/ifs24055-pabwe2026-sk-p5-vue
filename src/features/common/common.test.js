import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/vue'
import { createMemoryHistory } from 'vue-router'
import { renderWithProviders } from '../../test-utils'
import { putAccessToken } from '../../helpers/apiHelper'
import { createAppRouter, guard, routes } from '../../router'
import App from '../../App.vue'

describe('NotFoundPage (via App)', () => {
  it('rute tidak dikenal menampilkan 404', async () => {
    await renderWithProviders(App, { route: '/tidak/ada' })
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kembali ke Beranda' })).toHaveAttribute('href', '/')
  })
})

describe('router', () => {
  it('mendeklarasikan rute sesuai spesifikasi', () => {
    const top = routes.map((r) => r.path)
    expect(top).toEqual(['/auth', '/', '/:pathMatch(.*)*'])
    expect(routes[0].children.map((r) => r.path)).toEqual(['login', 'register'])
    expect(routes[1].children.map((r) => r.path)).toEqual(['', 'aucations/:aucationId', 'users', 'profile'])
  })

  it('guard: halaman terproteksi tanpa token ke login', () => {
    expect(guard({ meta: { protected: true } })).toBe('/auth/login')
    expect(guard({ meta: {} })).toBe(true)
  })

  it('guard: pengguna login tidak boleh ke halaman auth', () => {
    putAccessToken('tok')
    expect(guard({ meta: { guest: true } })).toBe('/')
    expect(guard({ meta: { protected: true } })).toBe(true)
  })

  it('createAppRouter dengan history bawaan', () => {
    expect(createAppRouter()).toHaveProperty('push')
  })

  it('tanpa token, / diarahkan ke login', async () => {
    const router = createAppRouter(createMemoryHistory())
    router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/auth/login')
  })

  it('lazy loads all routes', async () => {
    const promises = []
    routes.forEach(r => {
      if (r.component && typeof r.component === 'function' && r.component.name !== 'NotFoundPage') promises.push(r.component())
      if (r.children) r.children.forEach(c => {
         if (c.component && typeof c.component === 'function') promises.push(c.component())
      })
    })
    await Promise.all(promises)
    expect(promises.length).toBeGreaterThan(0)
  })
})
