import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },
  { path: '/events', name: 'events', component: () => import('../views/EventsView.vue') },
  { path: '/events/:id', name: 'event-detail', component: () => import('../views/EventDetailView.vue') },
  { path: '/events/:id/seats', name: 'seat-selection', component: () => import('../views/SeatSelectionView.vue'), meta: { requiresAuth: true } },
  { path: '/checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue'), meta: { requiresAuth: true } },
  { path: '/tickets', name: 'tickets', component: () => import('../views/MyTicketsView.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true } },
  { path: '/about', component: () => import('../views/StaticPageView.vue') },
  { path: '/careers', component: () => import('../views/StaticPageView.vue') },
  { path: '/blog', component: () => import('../views/StaticPageView.vue') },
  { path: '/support', component: () => import('../views/StaticPageView.vue') },
  { path: '/faq', component: () => import('../views/StaticPageView.vue') },
  { path: '/points', component: () => import('../views/StaticPageView.vue') },
  { path: '/terms', component: () => import('../views/StaticPageView.vue') },
  { path: '/privacy', component: () => import('../views/StaticPageView.vue') },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/admin/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/events',
    name: 'admin-events',
    component: () => import('../views/admin/AdminEvents.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/venues',
    name: 'admin-venues',
    component: () => import('../views/admin/AdminVenues.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/admin/AdminUsers.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    component: () => import('../views/admin/AdminReports.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  if (!authStore.initialized) {
    await authStore.fetchMe();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    return { name: 'home' };
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    return { name: 'events' };
  }

  return true;
});

export default router;
