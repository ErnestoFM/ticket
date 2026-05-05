<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const title = computed(() => {
  const titles = {
    '/about': 'Acerca de nosotros',
    '/careers': 'Trabaja con nosotros',
    '/blog': 'Blog Corporativo',
    '/support': 'Centro de soporte',
    '/faq': 'Preguntas Frecuentes',
    '/points': 'Puntos de venta',
    '/terms': 'Términos de uso',
    '/privacy': 'Política de privacidad'
  };
  return titles[route.path] || 'Página de información';
});
</script>

<template>
  <div class="static-container">
    <div class="static-header">
      <h1 class="gradient-text">{{ title }}</h1>
    </div>
    <div class="static-content glass-card">
      <p class="muted">
        Esta es una página de información estática demostrativa para <strong>{{ title }}</strong>. 
        En un entorno de producción real, este espacio contendría el texto legal, la historia corporativa o el contenido de soporte correspondiente.
      </p>
      <br/>
      <p class="muted">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </div>
  </div>
</template>

<style scoped>
.static-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 60vh;
}
.static-header {
  text-align: center;
  margin-bottom: 40px;
}
.gradient-text {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #c084fc 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.glass-card {
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  padding: 40px;
  border-radius: var(--radius-lg);
  line-height: 1.8;
  font-size: 1.1rem;
}
</style>
