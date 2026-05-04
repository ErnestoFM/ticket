<template>
  <section class="hero">
    <div>
      <h1>{{ $t('home.title') }}</h1>
      <p>{{ $t('home.subtitle') }}</p>
      <router-link class="primary" to="/events">{{ $t('home.cta') }}</router-link>
    </div>
  </section>
  <section class="features">
    <h2>{{ $t('home.featuresTitle') }}</h2>
    <div class="feature-grid">
      <div>
        <h3>{{ $t('home.featureSeats') }}</h3>
        <p>{{ $t('home.featureSeatsDesc') }}</p>
      </div>
      <div>
        <h3>{{ $t('home.featurePayments') }}</h3>
        <p>{{ $t('home.featurePaymentsDesc') }}</p>
      </div>
      <div>
        <h3>{{ $t('home.featureTickets') }}</h3>
        <p>{{ $t('home.featureTicketsDesc') }}</p>
      </div>
    </div>
  </section>
</template>
