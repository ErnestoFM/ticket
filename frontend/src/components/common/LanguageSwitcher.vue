<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const setLocale = (event) => {
  locale.value = event.target.value;
};
</script>

<template>
  <select class="lang-switcher" :value="locale" @change="setLocale">
    <option value="es">ES</option>
    <option value="en">EN</option>
  </select>
</template>
