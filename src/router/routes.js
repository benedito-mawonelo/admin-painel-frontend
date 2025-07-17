const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue'),
        meta: { icon: 'dashboard', label: 'Dashboard' }
      },
      {
        path: '/users',
        name: 'users',
        component: () => import('src/pages/UsersPage.vue'),
        meta: { icon: 'analytics', label: 'Relatórios' }
      },

      {
        path: '/workers',
        name: 'workers',
        component: () => import('pages/WorkersPage.vue'),
        meta: { icon: 'people', label: 'Usuários' }
      },
      {
        path: '/payments',
        name: 'payments',
        component: () => import('pages/PaymentsPage.vue'),
        meta: { icon: 'payments', label: 'Pagamentos' }
      }
    ]
  },

  // Always leave this as last one
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
