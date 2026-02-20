import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Auth routes
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guest: true },
    },

    // Public routes (Magic Links)
    {
      path: '/proposal/:token',
      name: 'public-proposal',
      component: () => import('@/views/proposals/PublicProposalView.vue'),
      meta: { public: true },
    },

    // Public vendor registration
    {
      path: '/cadastro-fornecedor',
      name: 'vendor-register',
      component: () => import('@/views/public/VendorRegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/cadastro-fornecedor/sucesso',
      name: 'vendor-register-success',
      component: () => import('@/views/public/VendorRegisterSuccessView.vue'),
      meta: { public: true },
    },

    // App routes (authenticated)
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
        },
        {
          path: 'admin',
          name: 'admin-dashboard',
          component: () => import('@/views/dashboard/AdminDashboardView.vue'),
          meta: { requiresSuperAdmin: true },
        },

        // Organizations (Super Admin only)
        {
          path: 'organizations',
          name: 'organizations',
          component: () => import('@/views/organizations/OrganizationsListView.vue'),
          meta: { requiresSuperAdmin: true },
        },

        // Categories
        {
          path: 'categories',
          name: 'categories',
          component: () => import('@/views/categories/CategoriesListView.vue'),
        },

        // Events
        {
          path: 'events',
          name: 'events',
          component: () => import('@/views/events/EventsListView.vue'),
        },
        {
          path: 'events/create',
          name: 'events-create',
          component: () => import('@/views/events/EventFormView.vue'),
        },
        {
          path: 'events/:id',
          name: 'events-detail',
          component: () => import('@/views/events/EventDetailView.vue'),
        },
        {
          path: 'events/:id/edit',
          name: 'events-edit',
          component: () => import('@/views/events/EventFormView.vue'),
        },

        // Vendors
        {
          path: 'vendors',
          name: 'vendors',
          component: () => import('@/views/vendors/VendorsListView.vue'),
        },
        {
          path: 'vendors/create',
          name: 'vendors-create',
          component: () => import('@/views/vendors/VendorFormView.vue'),
        },
        {
          path: 'vendors/:id',
          name: 'vendors-detail',
          component: () => import('@/views/vendors/VendorDetailView.vue'),
        },
        {
          path: 'vendors/:id/edit',
          name: 'vendors-edit',
          component: () => import('@/views/vendors/VendorFormView.vue'),
        },

        // Quote Requests
        {
          path: 'quotes',
          name: 'quotes',
          component: () => import('@/views/quotes/QuotesListView.vue'),
        },
        {
          path: 'quotes/:id',
          name: 'quotes-detail',
          component: () => import('@/views/quotes/QuoteDetailView.vue'),
        },

        // Proposals
        {
          path: 'proposals',
          name: 'proposals',
          component: () => import('@/views/proposals/ProposalsListView.vue'),
        },
        {
          path: 'proposals/:id',
          name: 'proposals-detail',
          component: () => import('@/views/proposals/ProposalDetailView.vue'),
        },

        // Settings
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/settings/SettingsView.vue'),
        },
      ],
    },

    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Restore session on first load
  if (!authStore.isAuthenticated) {
    authStore.restoreSession()
  }

  const isAuthenticated = authStore.isAuthenticated
  const isSuperAdmin = authStore.isSuperAdmin
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresSuperAdmin = to.matched.some(record => record.meta.requiresSuperAdmin)
  const isGuestOnly = to.matched.some(record => record.meta.guest)
  const isPublic = to.matched.some(record => record.meta.public)

  // Public routes are always accessible
  if (isPublic) {
    return next()
  }

  // Redirect authenticated users away from guest-only pages
  if (isGuestOnly && isAuthenticated) {
    // Redirect super admin to admin dashboard
    if (isSuperAdmin) {
      return next({ name: 'admin-dashboard' })
    }
    return next({ name: 'dashboard' })
  }

  // Redirect unauthenticated users to login
  if (requiresAuth && !isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Block non-super-admin from admin routes
  if (requiresSuperAdmin && !isSuperAdmin) {
    return next({ name: 'dashboard' })
  }

  // Redirect super admin from client dashboard to admin dashboard
  if (to.name === 'dashboard' && isSuperAdmin) {
    return next({ name: 'admin-dashboard' })
  }

  next()
})

export default router
