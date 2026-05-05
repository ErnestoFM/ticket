<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import LanguageSwitcher from './LanguageSwitcher.vue';

const authStore = useAuthStore();
const router = useRouter();

const isAdmin = computed(() => authStore.user?.role === 'admin');
const isDropdownOpen = ref(false);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = (e) => {
  if (!e.target.closest('.user-menu')) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
});

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
      
      <div v-if="authStore.isAuthenticated" class="user-menu">
        <button class="user-button" @click="toggleDropdown">
          {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
          <span class="chevron">▼</span>
        </button>
        <div v-if="isDropdownOpen" class="dropdown">
          <router-link to="/profile" @click="isDropdownOpen = false">Opciones de perfil</router-link>
          <router-link to="/tickets" @click="isDropdownOpen = false">Mis boletos</router-link>
          <hr />
          <button class="logout-button" type="button" @click="logout">
            {{ $t('nav.logout') }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.user-menu {
  position: relative;
}
.user-button {
  background: transparent;
  border: none;
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  font-size: 1rem;
}
.chevron {
  font-size: 0.8rem;
}
.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  min-width: 200px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  z-index: 100;
  overflow: hidden;
}
.dropdown a, .logout-button {
  padding: 12px 16px;
  text-align: left;
  color: var(--text);
  font-weight: 500;
  font-family: inherit;
  font-size: 0.95rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.dropdown a:hover, .logout-button:hover {
  background: rgba(255, 255, 255, 0.05);
}
.dropdown hr {
  margin: 0;
  border: none;
  border-top: 1px solid var(--border);
}
.logout-button {
  color: var(--danger);
  width: 100%;
}
</style>
