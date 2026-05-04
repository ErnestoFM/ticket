<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();
const generatedCurp = ref('');
const formError = ref('');

const states = computed(() => ([
  { code: 'AS', name: t('states.AS') },
  { code: 'BC', name: t('states.BC') },
  { code: 'BS', name: t('states.BS') },
  { code: 'CC', name: t('states.CC') },
  { code: 'CL', name: t('states.CL') },
  { code: 'CM', name: t('states.CM') },
  { code: 'CS', name: t('states.CS') },
  { code: 'CH', name: t('states.CH') },
  { code: 'DF', name: t('states.DF') },
  { code: 'DG', name: t('states.DG') },
  { code: 'GT', name: t('states.GT') },
  { code: 'GR', name: t('states.GR') },
  { code: 'HG', name: t('states.HG') },
  { code: 'JC', name: t('states.JC') },
  { code: 'MC', name: t('states.MC') },
  { code: 'MN', name: t('states.MN') },
  { code: 'MS', name: t('states.MS') },
  { code: 'NT', name: t('states.NT') },
  { code: 'NL', name: t('states.NL') },
  { code: 'OC', name: t('states.OC') },
  { code: 'PL', name: t('states.PL') },
  { code: 'QT', name: t('states.QT') },
  { code: 'QR', name: t('states.QR') },
  { code: 'SP', name: t('states.SP') },
  { code: 'SL', name: t('states.SL') },
  { code: 'SR', name: t('states.SR') },
  { code: 'TC', name: t('states.TC') },
  { code: 'TS', name: t('states.TS') },
  { code: 'TL', name: t('states.TL') },
  { code: 'VZ', name: t('states.VZ') },
  { code: 'YN', name: t('states.YN') },
  { code: 'ZS', name: t('states.ZS') }
]));

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
    formError.value = t('auth.passwordMismatch');
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
        <label>{{ $t('auth.birthDate') }}<input v-model="form.birthDate" :placeholder="$t('auth.birthDatePlaceholder')" required /></label>
        <label>{{ $t('auth.birthState') }}
          <select v-model="form.birthState">
            <option v-for="state in states" :key="state.code" :value="state.code">{{ state.name }} ({{ state.code }})</option>
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
        <label>{{ $t('auth.phone') }}<input v-model="form.phone" :placeholder="$t('auth.phonePlaceholder')" required /></label>
      </div>
      <div class="grid-two">
        <label>{{ $t('auth.password') }}<input v-model="form.password" type="password" required /></label>
        <label>{{ $t('auth.confirmPassword') }}<input v-model="form.confirmPassword" type="password" required /></label>
      </div>
      <button class="primary" type="submit">{{ $t('auth.registerButton') }}</button>
      <p v-if="generatedCurp" class="success">{{ $t('auth.curpGenerated', { curp: generatedCurp }) }}</p>
      <p v-if="formError" class="error">{{ formError }}</p>
    </form>
  </section>
</template>
