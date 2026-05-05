<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  curp: '',
  password: '',
});

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
        <input v-model="form.password" type="password" required />
      </label>
      <button class="primary" type="submit">{{ $t('auth.loginButton') }}</button>
      <p v-if="authStore.error" class="error">{{ authStore.error }}</p>
    </form>
  </section>
</template>
