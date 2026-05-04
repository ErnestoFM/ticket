<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const generatedCurp = ref('');
const formError = ref('');

const STATES = [
  { code: 'AS', name: 'Aguascalientes' },
  { code: 'BC', name: 'Baja California' },
  { code: 'BS', name: 'Baja California Sur' },
  { code: 'CC', name: 'Campeche' },
  { code: 'CL', name: 'Coahuila' },
  { code: 'CM', name: 'Colima' },
  { code: 'CS', name: 'Chiapas' },
  { code: 'CH', name: 'Chihuahua' },
  { code: 'DF', name: 'Ciudad de México' },
  { code: 'DG', name: 'Durango' },
  { code: 'GT', name: 'Guanajuato' },
  { code: 'GR', name: 'Guerrero' },
  { code: 'HG', name: 'Hidalgo' },
  { code: 'JC', name: 'Jalisco' },
  { code: 'MC', name: 'Estado de México' },
  { code: 'MN', name: 'Michoacán' },
  { code: 'MS', name: 'Morelos' },
  { code: 'NT', name: 'Nayarit' },
  { code: 'NL', name: 'Nuevo León' },
  { code: 'OC', name: 'Oaxaca' },
  { code: 'PL', name: 'Puebla' },
  { code: 'QT', name: 'Querétaro' },
  { code: 'QR', name: 'Quintana Roo' },
  { code: 'SP', name: 'San Luis Potosí' },
  { code: 'SL', name: 'Sinaloa' },
  { code: 'SR', name: 'Sonora' },
  { code: 'TC', name: 'Tabasco' },
  { code: 'TS', name: 'Tamaulipas' },
  { code: 'TL', name: 'Tlaxcala' },
  { code: 'VZ', name: 'Veracruz' },
  { code: 'YN', name: 'Yucatán' },
  { code: 'ZS', name: 'Zacatecas' }
];

const form = reactive({
  firstName: '',
  secondName: '',
  lastName: '',
  motherLastName: '',
  birthDate: '',
  birthState: 'DF',
  gender: 'H',
  phone: '',
  password: '',
  confirmPassword: '',
});

const submit = async () => {
  formError.value = '';
  generatedCurp.value = '';
  if (form.password !== form.confirmPassword) {
    formError.value = 'Las contraseñas no coinciden';
    return;
  }
  try {
    const response = await authStore.register({
      firstName: form.firstName,
      secondName: form.secondName,
      lastName: form.lastName,
      motherLastName: form.motherLastName,
      birthDate: form.birthDate,
      birthState: form.birthState,
      gender: form.gender,
      phone: form.phone,
      password: form.password,
    });
    generatedCurp.value = response.curp;
  } catch (_) {
    formError.value = authStore.error;
  }
};
</script>

<template>
  <section class="auth-card">
    <h2>{{ $t('auth.registerTitle') }}</h2>
    <form class="form" @submit.prevent="submit">
      <div class="grid-two">
        <label>{{ $t('auth.firstName') }}<input v-model="form.firstName" required /></label>
        <label>{{ $t('auth.secondName') }}<input v-model="form.secondName" /></label>
      </div>
      <div class="grid-two">
        <label>{{ $t('auth.lastName') }}<input v-model="form.lastName" required /></label>
        <label>{{ $t('auth.motherLastName') }}<input v-model="form.motherLastName" /></label>
      </div>
      <div class="grid-two">
        <label>{{ $t('auth.birthDate') }}<input v-model="form.birthDate" placeholder="DD/MM/AAAA" required /></label>
        <label>{{ $t('auth.birthState') }}
          <select v-model="form.birthState">
            <option v-for="state in STATES" :key="state.code" :value="state.code">{{ state.name }} ({{ state.code }})</option>
          </select>
        </label>
      </div>
      <div class="grid-two">
        <label>{{ $t('auth.gender') }}
          <select v-model="form.gender">
            <option value="H">H</option>
            <option value="M">M</option>
          </select>
        </label>
        <label>{{ $t('auth.phone') }}<input v-model="form.phone" placeholder="+52XXXXXXXXXX" required /></label>
      </div>
      <div class="grid-two">
        <label>{{ $t('auth.password') }}<input v-model="form.password" type="password" required /></label>
        <label>{{ $t('auth.confirmPassword') }}<input v-model="form.confirmPassword" type="password" required /></label>
      </div>
      <button class="primary" type="submit">{{ $t('auth.registerButton') }}</button>
      <p v-if="generatedCurp" class="success">CURP: {{ generatedCurp }}</p>
      <p v-if="formError" class="error">{{ formError }}</p>
    </form>
  </section>
</template>
