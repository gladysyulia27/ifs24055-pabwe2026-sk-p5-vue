import { createRouter, createWebHistory } from 'vue-router'
import { getAccessToken } from './helpers/apiHelper'
import AuthLayout from './features/auth/layouts/AuthLayout.vue'
import LoginPage from './features/auth/pages/LoginPage.vue'
import RegisterPage from './features/auth/pages/RegisterPage.vue'
import AucationLayout from './features/aucations/layouts/AucationLayout.vue'
import HomePage from './features/aucations/pages/HomePage.vue'
import DetailPage from './features/aucations/pages/DetailPage.vue'
import UsersPage from './features/users/pages/UsersPage.vue'
import ProfilePage from './features/users/pages/ProfilePage.vue'
import NotFoundPage from './features/common/pages/NotFoundPage.vue'

export const routes = [
  {
    path: '/auth',
    component: AuthLayout,
    meta: { guest: true },
    children: [
      { path: 'login', component: LoginPage },
      { path: 'register', component: RegisterPage },
    ],
  },
  {
    path: '/',
    component: AucationLayout,
    meta: { protected: true },
    children: [
      { path: '', component: HomePage },
      { path: 'aucations/:aucationId', component: DetailPage },
      { path: 'users', component: UsersPage },
      { path: 'profile', component: ProfilePage },
    ],
  },
  { path: '/:pathMatch(.*)*', component: NotFoundPage },
]

export function guard(to) {
  const loggedIn = !!getAccessToken()
  if (to.meta.protected && !loggedIn) return '/auth/login'
  if (to.meta.guest && loggedIn) return '/'
  return true
}

export function createAppRouter(history = createWebHistory()) {
  const router = createRouter({ history, routes })
  router.beforeEach(guard)
  return router
}
