# Ticketmaster MX

Sistema full-stack para venta de boletos con Node.js, Vue 3, MySQL, Redis y pagos (Stripe/PayPal).

## Requisitos

- Docker + Docker Compose (recomendado)
- Node.js 20+ para desarrollo local sin contenedores

## Configuración rápida (Docker)

1. Copia el archivo de entorno:
   ```bash
   cp .env.example .env
   ```
2. Ajusta las variables necesarias (Stripe, PayPal, Twilio).
3. Levanta los servicios:
   ```bash
   docker compose up --build
   ```

Frontend: http://localhost:5173  
Backend: http://localhost:3000

## Desarrollo local

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tests

```bash
cd backend
npm test
npm run test:unit
npm run test:integration
```

## Variables de entorno

Revisa `.env.example` para todas las variables requeridas. Incluye:

- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
- REDIS_HOST, REDIS_PORT
- JWT_SECRET, JWT_REFRESH_SECRET
- TWILIO_* (WhatsApp)
- STRIPE_* (pagos)
- PAYPAL_* (pagos)
- VITE_API_URL, VITE_STRIPE_PUBLIC_KEY, VITE_PAYPAL_CLIENT_ID

## Notas

- Los PDFs de boletos se guardan en `backend/uploads/tickets`.
- La limpieza de apartados en Redis se ejecuta cada 60 segundos.
