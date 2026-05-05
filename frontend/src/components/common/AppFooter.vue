<template>
  <footer class="app-footer">
    <div class="footer-grid">
      <div class="footer-col">
        <h3>Ticketmaster MX</h3>
        <p class="muted">La mejor experiencia para vivir tus eventos favoritos en todo el país. Compra tus boletos de forma segura y rápida.</p>
        <div class="social-icons">
          <a href="#" class="social-icon">📘</a>
          <a href="#" class="social-icon">🐦</a>
          <a href="#" class="social-icon">📸</a>
          <a href="#" class="social-icon">▶️</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Conócenos</h4>
        <router-link to="/about">Acerca de nosotros</router-link>
        <router-link to="/careers">Trabaja con nosotros</router-link>
        <router-link to="/blog">Blog corporativo</router-link>
      </div>
      <div class="footer-col">
        <h4>Ayuda</h4>
        <router-link to="/support">Centro de soporte</router-link>
        <router-link to="/faq">Preguntas frecuentes</router-link>
        <router-link to="/points">Puntos de venta</router-link>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <router-link to="/terms">Términos de uso</router-link>
        <router-link to="/privacy">Política de privacidad</router-link>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Ticketmaster MX. Todos los derechos reservados.</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 60px 40px 20px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
.footer-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}
.footer-col h3 {
  font-size: 1.5rem;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
  margin: 0;
}
.footer-col h4 {
  font-size: 1.1rem;
  color: var(--text);
  margin-bottom: 8px;
  margin: 0;
}
.footer-col a {
  color: var(--muted);
  font-weight: 400;
  transition: color 0.2s;
}
.footer-col a:hover {
  color: var(--primary);
}
.social-icons {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}
.social-icon {
  font-size: 1.5rem;
  filter: grayscale(1);
  transition: all 0.3s;
}
.social-icon:hover {
  filter: grayscale(0);
  transform: scale(1.2);
}
.footer-bottom {
  text-align: center;
  border-top: 1px solid var(--border);
  padding-top: 20px;
  color: var(--muted);
  font-size: 0.9rem;
}
@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .footer-col {
    align-items: center;
    text-align: center;
  }
}
</style>
