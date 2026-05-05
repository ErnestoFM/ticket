<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import LanguageSwitcher from './LanguageSwitcher.vue';

const authStore = useAuthStore();
const router = useRouter();

const isAdmin = computed(() => authStore.user?.role === 'admin');
const isDropdownOpen = ref(false);
const isMobileMenuOpen = ref(false);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
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
    <div class="logo" tabindex="0">{{ $t('common.brand') }}</div>
    
    <button 
      class="hamburger" 
      @click="toggleMobileMenu" 
      :aria-expanded="isMobileMenuOpen"
      aria-label="Alternar menú de navegación"
      aria-controls="main-nav"
    >
      ☰
    </button>
    
    <nav id="main-nav" class="nav-links" :class="{ 'mobile-open': isMobileMenuOpen }" aria-label="Navegación principal">
      <router-link to="/" @click="isMobileMenuOpen = false">Inicio</router-link>
      <router-link to="/events" @click="isMobileMenuOpen = false">Todos los Eventos</router-link>
      <router-link to="/events?type=teatro" @click="isMobileMenuOpen = false">Teatro</router-link>
      <router-link to="/events?type=cine" @click="isMobileMenuOpen = false">Cine</router-link>
      <router-link to="/events?type=museo" @click="isMobileMenuOpen = false">Museo</router-link>
      <router-link v-if="isAdmin" to="/admin" @click="isMobileMenuOpen = false">Admin</router-link>
    </nav>

    <div class="nav-actions" :class="{ 'mobile-open': isMobileMenuOpen }">
      <LanguageSwitcher />
      <router-link v-if="!authStore.isAuthenticated" to="/login" @click="isMobileMenuOpen = false">Ingresar</router-link>
      <router-link v-if="!authStore.isAuthenticated" to="/register" @click="isMobileMenuOpen = false">Registro</router-link>
      
      <div v-if="authStore.isAuthenticated" class="user-menu">
        <button 
          class="user-button" 
          @click="toggleDropdown"
          :aria-expanded="isDropdownOpen"
          aria-haspopup="true"
          aria-label="Menú de usuario"
        >
          {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
          <span class="chevron" aria-hidden="true">▼</span>
        </button>
        <div v-show="isDropdownOpen" class="dropdown" role="menu">
          <router-link role="menuitem" to="/profile" @click="isDropdownOpen = false; isMobileMenuOpen = false">Opciones de perfil</router-link>
          <router-link role="menuitem" to="/tickets" @click="isDropdownOpen = false; isMobileMenuOpen = false">Mis boletos</router-link>
          <hr aria-hidden="true" />
          <button role="menuitem" class="logout-button" type="button" @click="logout">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
}
.hamburger {
  display: none;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 1.5rem;
  cursor: pointer;
}

.nav-links a {
  transition: color 0.1s ease-out, transform 0.05s ease-out;
}
.nav-links a:hover, .nav-links a:focus-visible {
  color: var(--primary);
  outline: none;
}
.nav-links a:active {
  transform: scale(0.95);
}

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
  transition: color 0.1s ease-out;
}
.user-button:focus-visible {
  outline: 2px solid var(--primary);
  border-radius: var(--radius-sm);
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
  transition: background-color 0.1s ease-out, color 0.1s ease-out;
}
.dropdown a:focus-visible, .logout-button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}
.dropdown a:hover, .logout-button:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--primary);
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

@media (max-width: 960px) {
  .hamburger {
    display: block;
  }
  .nav-links, .nav-actions {
    display: none;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    padding: 16px 0;
  }
  .nav-links.mobile-open, .nav-actions.mobile-open {
    display: flex;
  }
  .app-header {
    flex-wrap: wrap;
  }
  .dropdown {
    position: static;
    box-shadow: none;
    border: none;
    background: rgba(255, 255, 255, 0.02);
  }
  .user-button {
    justify-content: center;
    width: 100%;
    padding: 12px;
  }
}
</style>
