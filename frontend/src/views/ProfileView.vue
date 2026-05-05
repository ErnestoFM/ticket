<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api/axios';

const authStore = useAuthStore();
const isEditing = ref(false);
const processing = ref(false);
const message = ref('');
const error = ref('');

const phone = ref('');

onMounted(() => {
  if (authStore.user) {
    phone.value = authStore.user.phone || '';
  }
});

const startEdit = () => {
  isEditing.value = true;
  message.value = '';
  error.value = '';
};

const cancelEdit = () => {
  isEditing.value = false;
  phone.value = authStore.user.phone || '';
  message.value = '';
  error.value = '';
};

const saveProfile = async () => {
  if (!phone.value || phone.value.length < 10) {
    error.value = 'El número de teléfono debe tener al menos 10 dígitos.';
    return;
  }

  processing.value = true;
  message.value = '';
  error.value = '';

  try {
    const response = await api.put('/api/auth/profile', { phone: phone.value });
    authStore.user = response.data.user; // Actualiza el store
    isEditing.value = false;
    message.value = 'Perfil actualizado exitosamente.';
  } catch (err) {
    error.value = err?.response?.data?.error || 'Error al actualizar el perfil';
  } finally {
    processing.value = false;
  }
};
</script>

<template>
  <section class="page">
    <h2>Mi Perfil</h2>
    
    <div class="profile-card glass-card">
      <div v-if="authStore.user" class="profile-details">
        
        <div class="detail-group">
          <label>Nombre Completo</label>
          <p class="detail-value">
            {{ authStore.user.firstName }} {{ authStore.user.secondName || '' }} 
            {{ authStore.user.lastName }} {{ authStore.user.motherLastName || '' }}
          </p>
        </div>

        <div class="detail-group">
          <label>CURP</label>
          <p class="detail-value curp-value">{{ authStore.user.curp }}</p>
        </div>

        <div class="detail-group">
          <label>Fecha de Nacimiento</label>
          <p class="detail-value">{{ new Date(authStore.user.birthDate).toLocaleDateString() }}</p>
        </div>

        <div class="detail-group">
          <label>Género</label>
          <p class="detail-value">{{ authStore.user.gender === 'H' ? 'Hombre' : 'Mujer' }}</p>
        </div>

        <div class="detail-group">
          <label>Número de Teléfono</label>
          
          <div v-if="!isEditing" class="phone-display">
            <p class="detail-value">{{ authStore.user.phone }}</p>
            <button class="ghost edit-btn" @click="startEdit">Editar</button>
          </div>
          
          <form v-else class="phone-edit-form" @submit.prevent="saveProfile">
            <input 
              v-model="phone" 
              type="tel" 
              placeholder="Número a 10 dígitos"
              maxlength="15"
              required 
            />
            <div class="edit-actions">
              <button type="submit" class="primary" :disabled="processing">Guardar</button>
              <button type="button" class="ghost" @click="cancelEdit" :disabled="processing">Cancelar</button>
            </div>
          </form>
        </div>

        <p v-if="message" class="status success">{{ message }}</p>
        <p v-if="error" class="status error">{{ error }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.glass-card {
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  padding: 2.5rem;
  border-radius: var(--radius-lg);
  max-width: 600px;
  margin: 0 auto;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
}
.detail-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

label {
  font-size: 0.9rem;
  color: #aaa;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.curp-value {
  font-family: monospace;
  letter-spacing: 0.1em;
  color: var(--primary);
}

.phone-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.edit-btn {
  padding: 0.2rem 0.8rem;
  font-size: 0.85rem;
}

.phone-edit-form {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.phone-edit-form input {
  padding: 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-light);
  color: var(--text);
  font-size: 1rem;
  width: 200px;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-actions button {
  padding: 0.6rem 1rem;
}

.status {
  margin-top: 1rem;
  font-weight: 600;
  text-align: center;
}
.success { color: var(--success); }
.error { color: var(--danger); }
</style>
