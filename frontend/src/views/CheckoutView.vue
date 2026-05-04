<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { loadStripe } from '@stripe/stripe-js';
import { loadScript } from '@paypal/paypal-js';
import { useI18n } from 'vue-i18n';
import api from '../api/axios';
import { useCartStore } from '../stores/cart';

const { t } = useI18n();

const cartStore = useCartStore();
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const cardContainer = ref(null);
const stripeInstance = ref(null);
const cardElement = ref(null);
const processing = ref(false);
const message = ref('');

const paypalReady = ref(false);
const paypalInstance = ref(null);

const selectedSeats = computed(() => cartStore.selectedSeats);
const total = computed(() => cartStore.totalPrice);

const setupStripe = async () => {
  if (stripeInstance.value) return;
  if (!stripeKey || !stripePromise) {
    message.value = t('checkout.missingStripeKey');
    return;
  }
  stripeInstance.value = await stripePromise;
  const elements = stripeInstance.value.elements();
  cardElement.value = elements.create('card');
  cardElement.value.mount(cardContainer.value);
};

const handleStripePayment = async () => {
  if (!stripeKey) {
    message.value = t('checkout.missingStripeKey');
    return;
  }
  if (!stripeInstance.value || !cardElement.value) return;
  processing.value = true;
  message.value = '';

  try {
    for (const reservation of selectedSeats.value) {
      const intentRes = await api.post('/api/payments/stripe/create-intent', {
        reservationId: reservation.reservationId,
      });

      const { error, paymentIntent } = await stripeInstance.value.confirmCardPayment(
        intentRes.data.clientSecret,
        { payment_method: { card: cardElement.value } }
      );

      if (error) throw error;

      await api.post('/api/tickets/confirm', {
        reservationId: reservation.reservationId,
        paymentMethod: 'stripe',
        paymentIntentId: paymentIntent.id,
      });

      cartStore.removeSeat(reservation.reservationId);
    }

    message.value = t('checkout.success');
  } catch (err) {
    message.value = err?.response?.data?.error || err.message || t('checkout.error');
  } finally {
    processing.value = false;
  }
};

const ensurePayPal = async () => {
  if (paypalReady.value) return;
  if (!import.meta.env.VITE_PAYPAL_CLIENT_ID) return;
  paypalInstance.value = await loadScript({
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: 'MXN',
    intent: 'capture',
  });
  paypalReady.value = true;
};

const renderPayPalButtons = async () => {
  await ensurePayPal();
  if (!paypalInstance.value) return;

  selectedSeats.value.forEach((reservation) => {
    const containerId = `paypal-button-${reservation.reservationId}`;
    const container = document.getElementById(containerId);
    if (!container || container.dataset.rendered) return;

    paypalInstance.value.Buttons({
      createOrder: async () => {
        const response = await api.post('/api/payments/paypal/create-order', {
          reservationId: reservation.reservationId,
        });
        return response.data.orderId;
      },
      onApprove: async (data) => {
        await api.post('/api/payments/paypal/capture-order', { orderId: data.orderID });
        await api.post('/api/tickets/confirm', {
          reservationId: reservation.reservationId,
          paymentMethod: 'paypal',
          paymentIntentId: data.orderID,
        });
        cartStore.removeSeat(reservation.reservationId);
      },
      onError: (err) => {
        message.value = err.message || t('checkout.paypalError');
      },
    }).render(`#${containerId}`);

    container.dataset.rendered = 'true';
  });
};

onMounted(async () => {
  await setupStripe();
  await renderPayPalButtons();
});

watch(selectedSeats, async () => {
  await renderPayPalButtons();
});
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
        <h3>{{ $t('checkout.payWithCard') }}</h3>
        <div ref="cardContainer" class="card-element"></div>
        <button class="primary" :disabled="processing || !selectedSeats.length" @click="handleStripePayment">
          {{ processing ? $t('checkout.processing') : $t('checkout.confirm') }}
        </button>
        <p v-if="message" class="status">{{ message }}</p>

        <div v-if="selectedSeats.length" class="paypal-section">
          <h3>{{ $t('checkout.payWithPaypal') }}</h3>
          <div
            v-for="item in selectedSeats"
            :key="item.reservationId"
            class="paypal-item"
          >
            <p>{{ item.seat.label }} · {{ item.price.toFixed(2) }}</p>
            <div :id="`paypal-button-${item.reservationId}`"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
