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

const cardNumber = ref('');
const expirationDate = ref('');
const cvv = ref('');

const selectedSeats = computed(() => cartStore.selectedSeats);
const total = computed(() => cartStore.totalPrice);

const handleMockPayment = async () => {
  if (!cardNumber.value || !expirationDate.value || !cvv.value) {
    message.value = t('checkout.fillAllFields', 'Por favor completa todos los campos.');
    return;
  }
  
  processing.value = true;
  message.value = '';

  try {
    for (const reservation of selectedSeats.value) {
      // 1. Proceso de cobro mockeado
      const intentRes = await api.post('/api/payments/mock/process', {
        reservationId: reservation.reservationId,
        cardNumber: cardNumber.value,
        expirationDate: expirationDate.value,
        cvv: cvv.value,
      });

      // 2. Confirmación de ticket en backend
      await api.post('/api/tickets/confirm', {
        reservationId: reservation.reservationId,
        paymentMethod: 'mock',
        paymentIntentId: intentRes.data.paymentIntentId,
      });

      cartStore.removeSeat(reservation.reservationId);
    }

    message.value = t('checkout.success');
    setTimeout(() => {
      router.push('/my-tickets');
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
      
      <div class="payment-panel">
        <h3>Pago con Tarjeta</h3>
        <form @submit.prevent="handleMockPayment" class="mock-payment-form">
          <div class="form-group">
            <label>Número de Tarjeta (16 dígitos)</label>
            <input 
              v-model="cardNumber" 
              type="text" 
              maxlength="16" 
              placeholder="1234567812345678" 
              required
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
                required
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
                required
                pattern="\d{3,4}"
              />
            </div>
          </div>

          <button type="submit" class="primary" :disabled="processing || !selectedSeats.length">
            {{ processing ? 'Procesando...' : $t('checkout.confirm') }}
          </button>
        </form>
        
        <p v-if="message" class="status">{{ message }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mock-payment-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
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
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
