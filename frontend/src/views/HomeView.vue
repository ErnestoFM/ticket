<template>
  <div class="home-container">
    <section class="hero-premium">
      <div class="hero-content">
        <h1 class="gradient-text">{{ $t('home.title') }}</h1>
        <p class="hero-subtitle">{{ $t('home.subtitle') }}</p>
        <div class="hero-actions">
          <router-link class="primary btn-glow" to="/events">{{ $t('home.cta') }}</router-link>
        </div>
      </div>
      <div class="hero-graphics">
        <div class="glow-orb orb-1"></div>
        <div class="glow-orb orb-2"></div>
      </div>
    </section>

    <section class="features-premium">
      <div class="features-header">
        <h2 class="gradient-text-alt">{{ $t('home.featuresTitle') }}</h2>
        <div class="header-line"></div>
      </div>
      <div class="feature-cards">
        <div class="glass-card feature-card">
          <div class="icon-wrapper">🏟️</div>
          <h3>{{ $t('home.featureSeats') }}</h3>
          <p class="muted">{{ $t('home.featureSeatsDesc') }}</p>
        </div>
        <div class="glass-card feature-card">
          <div class="icon-wrapper">💳</div>
          <h3>{{ $t('home.featurePayments') }}</h3>
          <p class="muted">{{ $t('home.featurePaymentsDesc') }}</p>
        </div>
        <div class="glass-card feature-card">
          <div class="icon-wrapper">📱</div>
          <h3>{{ $t('home.featureTickets') }}</h3>
          <p class="muted">{{ $t('home.featureTicketsDesc') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.hero-premium {
  position: relative;
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  overflow: hidden;
  border-radius: 32px;
  background: var(--surface-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
}

.gradient-text {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #c084fc 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 40px rgba(192, 132, 252, 0.3);
}

.gradient-text-alt {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--muted);
  margin-bottom: 40px;
  font-weight: 400;
}

.hero-graphics {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: var(--primary);
  top: -100px;
  left: -100px;
  animation: float 10s ease-in-out infinite alternate;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: var(--accent);
  bottom: -50px;
  right: -50px;
  animation: float 8s ease-in-out infinite alternate-reverse;
}

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 50px) scale(1.1); }
}

.btn-glow {
  padding: 16px 40px;
  font-size: 1.2rem;
  box-shadow: 0 0 20px var(--primary-glow);
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-glow:hover {
  box-shadow: 0 0 40px var(--primary-glow);
  transform: translateY(-2px);
}

.features-premium {
  padding: 40px 0;
}

.features-header {
  text-align: center;
  margin-bottom: 50px;
}

.header-line {
  height: 4px;
  width: 60px;
  background: linear-gradient(90deg, #60a5fa, #34d399);
  margin: 16px auto 0;
  border-radius: 4px;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.glass-card {
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 40px 30px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

.glass-card:hover {
  transform: translateY(-10px);
  border-color: var(--border-hover);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
  background: rgba(24, 24, 27, 0.8);
}

.icon-wrapper {
  font-size: 3rem;
  margin-bottom: 24px;
  display: inline-block;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  border: 1px solid var(--border);
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .gradient-text { font-size: 2.5rem; }
  .hero-premium { padding: 40px 20px; min-height: 40vh; }
}
</style>
