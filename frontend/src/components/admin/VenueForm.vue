<script setup>
import { reactive } from 'vue';

const emit = defineEmits(['submit']);

const form = reactive({
  name: '',
  address: '',
  city: '',
  state: '',
  type: 'teatro',
  totalRows: 10,
  totalCols: 10,
  logoUrl: '',
  zoneConfig: [
    { rowStart: 0, rowEnd: 2, seatType: 'general' },
  ],
});

const addZone = () => {
  form.zoneConfig.push({ rowStart: 0, rowEnd: 0, seatType: 'general' });
};

const removeZone = (index) => {
  form.zoneConfig.splice(index, 1);
};

const submit = () => {
  emit('submit', { ...form, zoneConfig: [...form.zoneConfig] });
};
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <label>Nombre
      <input v-model="form.name" required />
    </label>
    <label>Dirección
      <input v-model="form.address" required />
    </label>
    <label>Ciudad
      <input v-model="form.city" required />
    </label>
    <label>Estado
      <input v-model="form.state" required />
    </label>
    <label>Tipo
      <select v-model="form.type">
        <option value="teatro">Teatro</option>
        <option value="cine">Cine</option>
        <option value="museo">Museo</option>
      </select>
    </label>
    <label>Filas
      <input v-model.number="form.totalRows" type="number" min="1" max="100" />
    </label>
    <label>Columnas
      <input v-model.number="form.totalCols" type="number" min="1" max="100" />
    </label>
    <label>Logo URL
      <input v-model="form.logoUrl" type="url" />
    </label>

    <div class="zone-config">
      <h4>Zonas de asientos</h4>
      <div v-for="(zone, index) in form.zoneConfig" :key="index" class="zone-row">
        <input v-model.number="zone.rowStart" type="number" min="0" placeholder="Fila inicio" />
        <input v-model.number="zone.rowEnd" type="number" min="0" placeholder="Fila fin" />
        <select v-model="zone.seatType">
          <option value="general">General</option>
          <option value="preferente">Preferente</option>
          <option value="vip">VIP</option>
          <option value="palco">Palco</option>
        </select>
        <button type="button" class="ghost" @click="removeZone(index)">Quitar</button>
      </div>
      <button type="button" class="ghost" @click="addZone">Agregar zona</button>
    </div>

    <button class="primary" type="submit">Guardar recinto</button>
  </form>
</template>
