<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api/axios';
import { useCartStore } from '../stores/cart';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const cartStore = useCartStore();
const router = useRouter();

const processing = ref(false);
const message = ref('');

const paymentMethod = ref('mock'); // 'mock' = Tarjeta, 'paypal' = PayPal
const cardNumber = ref('');
const expirationDate = ref('');
const cvv = ref('');
const paypalEmail = ref('');

const selectedSeats = computed(() => cartStore.selectedSeats);
const total = computed(() => cartStore.totalPrice);

const handleMockPayment = async () => {
  if (paymentMethod.value === 'mock') {
    if (!cardNumber.value || !expirationDate.value || !cvv.value) {
      message.value = 'Por favor completa todos los campos de la tarjeta.';
      return;
    }
  } else if (paymentMethod.value === 'paypal') {
    if (!paypalEmail.value) {
      message.value = 'Por favor ingresa tu correo de PayPal.';
      return;
    }
  }
  
  processing.value = true;
  message.value = '';

  try {
    for (const reservation of selectedSeats.value) {
      // 1. Proceso de cobro mockeado
      const intentRes = await api.post('/api/payments/mock/process', {
        reservationId: reservation.reservationId,
      });

      // 2. Confirmación de ticket en backend
      await api.post('/api/tickets/confirm', {
        reservationId: reservation.reservationId,
        paymentMethod: paymentMethod.value, // Envía 'mock' o 'paypal' a la BD
        paymentIntentId: intentRes.data.paymentIntentId,
      });

      cartStore.removeSeat(reservation.reservationId);
    }

    message.value = t('checkout.success');
    setTimeout(() => {
      router.push('/tickets');
    }, 2000);
  } catch (err) {
    message.value = err?.response?.data?.error || err.message || t('checkout.error');
  } finally {
    processing.value = false;
  }
};
</script>

<template>
  <section class="page">
    <h2>{{ $t('checkout.title') }}</h2>
    <div class="checkout-grid">
      <div>
        <h3>{{ $t('checkout.selectedSeats') }}</h3>
        <ul>
          <li v-for="item in selectedSeats" :key="item.reservationId">
            {{ item.seat.label }} · {{ item.seat.seatType?.name?.toUpperCase() }} · ${{ item.price.toFixed(2) }}
          </li>
        </ul>
        <p class="total-row">{{ $t('checkout.total') }}: ${{ total.toFixed(2) }}</p>
      </div>
      
      <div class="payment-panel glass-card">
        <h3>Método de Pago</h3>
        
        <div class="payment-method-selector">
          <label>
            <input type="radio" value="mock" v-model="paymentMethod" />
            Tarjeta de Crédito / Débito
          </label>
          <label>
            <input type="radio" value="paypal" v-model="paymentMethod" />
            PayPal
          </label>
        </div>

        <form @submit.prevent="handleMockPayment" class="mock-payment-form">
          <!-- Card Payment Fields -->
          <template v-if="paymentMethod === 'mock'">
            <div class="form-group">
              <label>Número de Tarjeta (16 dígitos)</label>
              <input 
                v-model="cardNumber" 
                type="text" 
                maxlength="16" 
                placeholder="1234567812345678" 
                :required="paymentMethod === 'mock'"
                pattern="\d{16}"
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Vencimiento (MM/YY)</label>
                <input 
                  v-model="expirationDate" 
                  type="text" 
                  maxlength="5" 
                  placeholder="12/25" 
                  :required="paymentMethod === 'mock'"
                  pattern="(0[1-9]|1[0-2])\/\d{2}"
                />
              </div>
              
              <div class="form-group">
                <label>CVV</label>
                <input 
                  v-model="cvv" 
                  type="text" 
                  maxlength="4" 
                  placeholder="123" 
                  :required="paymentMethod === 'mock'"
                  pattern="\d{3,4}"
                />
              </div>
            </div>
          </template>

          <!-- PayPal Payment Fields -->
          <template v-if="paymentMethod === 'paypal'">
            <div class="form-group">
              <label>Correo electrónico de PayPal</label>
              <input 
                v-model="paypalEmail" 
                type="email" 
                placeholder="tu@correo.com" 
                :required="paymentMethod === 'paypal'"
              />
            </div>
            <div class="paypal-info">
              <p class="muted">Serás redirigido virtualmente a PayPal. Para esta demostración, la compra se procesará automáticamente.</p>
            </div>
          </template>

          <button type="submit" class="primary" :disabled="processing || !selectedSeats.length">
            {{ processing ? 'Procesando...' : (paymentMethod === 'mock' ? $t('checkout.confirm') : 'Pagar con PayPal') }}
          </button>
        </form>
        
        <p v-if="message" class="status" :class="{ 'error': message !== $t('checkout.success') }">{{ message }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.glass-card {
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  padding: 2rem;
  border-radius: var(--radius-lg);
}
.payment-method-selector {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
  margin-top: 1rem;
}
.payment-method-selector label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  color: var(--text);
}
.payment-method-selector input[type="radio"] {
  accent-color: var(--primary);
  width: 18px;
  height: 18px;
}
.mock-payment-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-row {
  display: flex;
  gap: 1rem;
}
.form-row .form-group {
  flex: 1;
}
input {
  padding: 0.8rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-light);
  color: var(--text);
  font-family: inherit;
}
input:focus {
  outline: 2px solid var(--primary);
  border-color: transparent;
}
.paypal-info {
  background: rgba(0, 112, 186, 0.1);
  border: 1px solid rgba(0, 112, 186, 0.3);
  padding: 1rem;
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
  color: #c2e0ff;
}
.status {
  margin-top: 1rem;
  font-weight: 600;
  text-align: center;
  color: var(--success);
}
.status.error {
  color: var(--danger);
}
</style>
