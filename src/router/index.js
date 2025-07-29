// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layouts/MainLayout.vue'
import Users from '../pages/UsersPage.vue'
import Login from '../pages/Login.vue'
import Workers from '../pages/WorkersPage.vue'
import Payments from '../pages/PaymentsPage.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', component: () => import('pages/DashboardPage.vue') },
      { path: 'users', component: Users },
      { path: 'workers', component: Workers },
      { path: 'payments', component: Payments }
    ],
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    component: Login,
    meta: { requiresAuth: false }
  },
  // {
  //   path: '/forgot-password',
  //   component: () => import('pages/ForgotPassword.vue'), // Placeholder para futura implementação
  //   meta: { requiresAuth: false }
  // }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('auth_token')
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
