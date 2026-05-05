<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import LanguageSwitcher from './LanguageSwitcher.vue';

const authStore = useAuthStore();
const router = useRouter();

const isAdmin = computed(() => authStore.user?.role === 'admin');

const logout = async () => {
  await authStore.logout();
  router.push({ name: 'home' });
};
</script>

<template>
  <header class="app-header">
    <div class="logo">{{ $t('common.brand') }}</div>
    <nav class="nav-links">
      <router-link to="/">{{ $t('nav.home') }}</router-link>
      <router-link to="/events">{{ $t('nav.events') }}</router-link>
      <router-link v-if="authStore.isAuthenticated" to="/tickets">{{ $t('nav.tickets') }}</router-link>
      <router-link v-if="isAdmin" to="/admin">{{ $t('nav.admin') }}</router-link>
    </nav>
    <div class="nav-actions">
      <LanguageSwitcher />
      <router-link v-if="!authStore.isAuthenticated" to="/login">{{ $t('nav.login') }}</router-link>
      <router-link v-if="!authStore.isAuthenticated" to="/register">{{ $t('nav.register') }}</router-link>
      <button v-if="authStore.isAuthenticated" class="link-button" type="button" @click="logout">
        {{ $t('nav.logout') }}
      </button>
    </div>
  </header>
</template>
