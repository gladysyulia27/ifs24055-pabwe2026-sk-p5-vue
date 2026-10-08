import { createRouter, createWebHistory } from 'vue-router'
import { getAccessToken } from './helpers/apiHelper'
const AuthLayout = () => import('./features/auth/layouts/AuthLayout.vue')
const LoginPage = () => import('./features/auth/pages/LoginPage.vue')
const RegisterPage = () => import('./features/auth/pages/RegisterPage.vue')
const AucationLayout = () => import('./features/aucations/layouts/AucationLayout.vue')
const HomePage = () => import('./features/aucations/pages/HomePage.vue')
const DetailPage = () => import('./features/aucations/pages/DetailPage.vue')
const UsersPage = () => import('./features/users/pages/UsersPage.vue')
const ProfilePage = () => import('./features/users/pages/ProfilePage.vue')
const NotFoundPage = () => import('./features/common/pages/NotFoundPage.vue')

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
