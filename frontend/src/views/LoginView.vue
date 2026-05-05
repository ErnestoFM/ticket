<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  curp: '',
  password: '',
});

const showPassword = ref(false);
const togglePassword = () => showPassword.value = !showPassword.value;

const submit = async () => {
  try {
    await authStore.login(form);
    router.push({ name: 'events' });
  } catch (_) {}
};
</script>

<template>
  <section class="auth-card">
    <h2>{{ $t('auth.loginTitle') }}</h2>
    <form class="form" @submit.prevent="submit">
      <label>
        {{ $t('auth.curp') }}
        <input v-model="form.curp" required maxlength="18" />
      </label>
      <label>
        {{ $t('auth.password') }}
        <div class="password-input">
          <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required />
          <button type="button" @click="togglePassword" class="toggle-btn">
            {{ showPassword ? 'Ocultar' : 'Ver' }}
          </button>
        </div>
      </label>
      <button class="primary" type="submit">{{ $t('auth.loginButton') }}</button>
      <p v-if="authStore.error" class="error">{{ authStore.error }}</p>
    </form>
  </section>
</template>

<style scoped>
.password-input {
  position: relative;
  display: flex;
  align-items: center;
}
.password-input input {
  width: 100%;
  padding-right: 70px;
}
.toggle-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
}
</style>
