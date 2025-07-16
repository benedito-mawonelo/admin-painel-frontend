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
        path: '/reports',
        name: 'reports',
        component: () => import('pages/ReportsPage.vue'),
        meta: { icon: 'analytics', label: 'Relatórios' }
      },
      {
        path: '/service',
        name: 'service',
        component: () => import('pages/ServicePage.vue'),
        meta: { icon: 'support_agent', label: 'Atendimento' }
      },
      {
        path: '/users',
        name: 'users',
        component: () => import('pages/UsersPage.vue'),
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
