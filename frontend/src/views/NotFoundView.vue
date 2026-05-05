<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/');
};
</script>

<template>
  <section class="page not-found">
    <div class="glass-card error-card">
      <h1 class="glitch" data-text="404">404</h1>
      <h2>Página no encontrada</h2>
      <p class="muted">
        Parece que te has perdido en el recinto. La página que estás buscando no existe o los boletos se agotaron hace mucho tiempo.
      </p>
      <button class="primary action-btn" @click="goHome">
        Volver al Inicio
      </button>
    </div>
  </section>
</template>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.error-card {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 500px;
  width: 100%;
}

.glitch {
  font-size: 6rem;
  font-weight: 800;
  margin: 0;
  color: var(--primary);
  text-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
  position: relative;
}

h2 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: var(--text);
}

.muted {
  color: #aaa;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.action-btn {
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
}
</style>
