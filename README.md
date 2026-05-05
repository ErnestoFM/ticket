# 🎟️ Ticketmaster Clone MX - Documentación del Proyecto

Bienvenido a la documentación oficial del clon de Ticketmaster. Este documento detalla la arquitectura del sistema, los modelos de base de datos, las rutas de la API (Backend) y el flujo de integraciones (WhatsApp, Redis, etc.).

---

## 🏗️ Arquitectura del Sistema

El sistema está construido bajo una arquitectura Cliente-Servidor moderna y empaquetado en contenedores Docker para un despliegue rápido.

- **Frontend:** Vue 3 (Composition API), Vite, Pinia (Manejo de estados), Vue Router, CSS Modules (Glassmorphism & Diseño Dark Mode).
- **Backend:** Node.js, Express.js.
- **Base de Datos Relacional:** MySQL (Manejado mediante Sequelize ORM).
- **Caché y Temporizadores:** Redis (Para el bloqueo temporal de asientos).
- **Integraciones:** Twilio API (Mensajería por WhatsApp).

---

## 🗄️ Modelos de Base de Datos (Sequelize)

El núcleo del sistema gestiona la relación entre recintos, eventos, asientos y usuarios.

1. **User (Usuario):** Almacena datos de clientes y administradores. Campos clave: `curp` (Único), `phone`, `role` (admin/user).
2. **Venue (Recinto):** Teatros, Cines, Museos. Contiene la distribución de asientos (`totalRows`, `totalCols`).
3. **SeatType (Tipo de Asiento):** VIP, Preferente, General, Palco. Poseen un `multiplier` que afecta el precio base del evento.
4. **Seat (Asiento):** Una butaca física dentro de un recinto.
5. **Event (Evento):** Un evento agendado en un Recinto. Contiene `basePrice`, `maxTicketsPerUser`.
6. **Reservation (Reserva Temporal):** Creada cuando un usuario añade un boleto al carrito. Bloquea el asiento en MySQL y Redis por 5 minutos (evitando colisiones de compras).
7. **Ticket (Boleto Comprado):** Se genera cuando se completa el pago. Guarda el código QR, método de pago y si fue enviado por WhatsApp.

---

## 🚀 Rutas de la API (Endpoints)

Todas las rutas base inician con `http://localhost:3000/api/`

### 👤 Autenticación (`/api/auth`)
*   `POST /register`: Registra un usuario. Genera automáticamente la CURP basada en sus datos (Estado, Fecha nacimiento, Nombre, etc).
*   `POST /login`: Inicia sesión validando la CURP y contraseña. Devuelve un Token JWT (Cookies `access_token` y `refresh_token`).
*   `GET /me`: Obtiene los datos del usuario actual (Requiere Token).
*   `PUT /profile`: Actualiza los datos del usuario actual (Ej. Número de teléfono).
*   `POST /logout`: Cierra la sesión (Limpia las cookies HTTP-Only).

### 🎪 Eventos (`/api/events`)
*   `GET /`: Lista todos los eventos activos (Soporta filtros como `?type=teatro` o búsquedas de texto).
*   `GET /:id`: Detalles completos de un evento en específico (Incluye su Recinto).

### 💺 Asientos y Reservas (`/api/seats`)
*   `GET /event/:eventId`: Devuelve el mapa de asientos de un evento, indicando su estado (`available`, `held`, `sold`).
*   `POST /hold`: El usuario "aparta" un asiento. Se bloquea en Redis con un TTL (Time-To-Live) de 5 minutos.
*   `POST /release`: Libera un asiento apartado manualmente (o si caduca en Redis, se libera automáticamente).

### 💳 Pagos (`/api/payments`)
*   `POST /mock/process`: Recibe la petición de compra. Valida los métodos (Tarjeta mock o PayPal). Convierte las Reservas temporales en boletos reales.

### 🎟️ Boletos (`/api/tickets`)
*   `POST /confirm`: Endpoint interno para asentar la compra de un boleto tras el pago exitoso.
*   `GET /my`: Lista todos los boletos comprados por el usuario activo.
*   `POST /:id/resend-whatsapp`: Genera un Código QR público en base64/JWT y lo envía por la API de Twilio hacia el número de teléfono del usuario.

---

## 📱 Flujos Destacados y Funcionalidades Clave

### 1. Bloqueo Concurrente de Asientos (Anti-Colisiones)
Para evitar que dos usuarios compren la misma butaca al mismo tiempo, al darle clic en el mapa de asientos, el servidor dispara una función en **Redis**. 
Redis funciona en memoria ultrarrápida; establece una llave `seat_hold:<seatId>` que expira a los 5 minutos exactos. Si otro usuario intenta comprarlo, el backend verificará Redis y lo rechazará inmediatamente, garantizando disponibilidad real.

### 2. Generación Inteligente de CURP
En el registro de usuario (`/register`), en lugar de pedir la CURP explícitamente, el backend recibe el Estado, Fecha de Nacimiento, Género y Nombres. Mediante la librería instalada, genera la CURP matemáticamente y la autocompleta en el inicio de sesión gracias a los Query Parameters de Vue Router (`/login?curp=...`).

### 3. Integración de WhatsApp (Twilio Sandbox)
Cuando el usuario entra a "Mis Boletos" y selecciona **Reenviar WhatsApp**, el sistema:
1. Empaqueta el ID del boleto y los datos del asiento.
2. Utiliza una API abierta (`qrserver.com`) para dibujar un código QR escaneable.
3. Formatea el número de teléfono mexicano para añadirle el infame **`+521`** (necesario para el enrutamiento internacional de WhatsApp).
4. Usa Twilio para entregar el mensaje y el código QR directamente al celular.

### 4. Bypass de CORS Dinámico
El backend está configurado en `index.js` para autorizar peticiones provenientes de Dominios Locales (`localhost:5173`) así como de túneles remotos (`*.ngrok-free.dev`). Esto asegura que puedas compartir tu servidor local con clientes externos en tiempo real sin que el navegador bloquee las solicitudes.

---

## 💻 Comandos Útiles de Desarrollo

*   **Levantar el Proyecto:** `docker compose up --build` (Levanta Vue, Node, MySQL y Redis simultáneamente).
*   **Poblar Base de Datos (Seed):** `docker compose exec backend npm run seed` (Genera usuarios de prueba, Recintos, Eventos y Asientos por defecto).
*   **Revisar Logs del Backend:** `docker compose logs backend --tail 50`
*   **Entrar a MySQL:** `docker compose exec mysql mysql -u ticketmaster -pticketmaster_pass ticketmaster`
*   **Compartir a Internet:** `ngrok http 3000` (Para Backend) o `ngrok http 5173` (Para Frontend).
