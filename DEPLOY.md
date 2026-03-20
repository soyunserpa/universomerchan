# ============================================================
# UNIVERSO MERCHAN — Guía de Despliegue en Servidor Linux
# ============================================================
# Paso a paso para poner en marcha la tienda en tu servidor
# ============================================================

## REQUISITOS DEL SERVIDOR

Antes de empezar, tu servidor Linux necesita:
- Ubuntu 22.04+ o Debian 12+ (recomendado)
- Mínimo 2GB RAM (4GB recomendado con +2000 productos)
- 20GB disco mínimo
- Acceso root o sudo
- Puertos 80, 443 abiertos en el firewall
- Dominio universomerchan.com apuntando al IP del servidor
- Subdominio admin.universomerchan.com apuntando al mismo IP


## PASO 1: Instalar dependencias del sistema

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16

# Redis (para caché de stock/precios)
sudo apt install -y redis-server
sudo systemctl enable redis-server

# Nginx (reverse proxy)
sudo apt install -y nginx certbot python3-certbot-nginx

# Utilidades
sudo apt install -y git curl build-essential
```


## PASO 2: Configurar PostgreSQL

```bash
# Crear usuario y base de datos
sudo -u postgres psql

CREATE USER universo WITH PASSWORD 'TU_CONTRASEÑA_SEGURA';
CREATE DATABASE universomerchan OWNER universo;
GRANT ALL PRIVILEGES ON DATABASE universomerchan TO universo;
\q
```


## PASO 3: Clonar el proyecto

```bash
# Crear directorio
sudo mkdir -p /var/www/universomerchan
sudo chown $USER:$USER /var/www/universomerchan
cd /var/www/universomerchan

# Clonar repo (cuando lo tengamos en GitHub)
git clone https://github.com/tu-usuario/universo-merchan.git .

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
cp .env.example .env
nano .env
# → Rellena TODAS las variables: DATABASE_URL, MIDOCEAN_API_KEY, STRIPE_*, etc.
```


## PASO 4: Inicializar base de datos

```bash
# Ejecutar migraciones
npx drizzle-kit push

# Crear usuario admin inicial
npx ts-node scripts/create-admin.ts
# Te pedirá email y contraseña para el primer admin

# Ejecutar primera sincronización con Midocean (tarda ~5-10 min)
npx ts-node scripts/initial-sync.ts
# Esto descargará: productos, stock, precios, print data, print prices
```


## PASO 5: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/universomerchan
```

Contenido:

```nginx
# TIENDA PÚBLICA — universomerchan.com
server {
    listen 80;
    server_name universomerchan.com www.universomerchan.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Archivos estáticos y uploads
    location /uploads/ {
        alias /var/www/universomerchan/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Caché agresiva para imágenes de Midocean (CDN proxy)
    location /cdn/ {
        proxy_pass https://cdn1.midocean.com/;
        proxy_cache_valid 200 7d;
        expires 7d;
        add_header X-Cache-Status $upstream_cache_status;
    }
}

# PANEL ADMIN — admin.universomerchan.com
# Completamente separado, sin ningún enlace desde la tienda
server {
    listen 80;
    server_name admin.universomerchan.com;

    # Bloquear acceso por IP si quieres (opcional extra seguridad)
    # allow TU_IP;
    # deny all;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/universomerchan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```


## PASO 6: Certificados SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d universomerchan.com -d www.universomerchan.com -d admin.universomerchan.com
# Sigue las instrucciones, elige redirect HTTP → HTTPS
```


## PASO 7: Build y arrancar la aplicación

```bash
cd /var/www/universomerchan

# Build de producción
npm run build

# Arrancar con PM2 (gestor de procesos)
sudo npm install -g pm2

# Tienda pública (puerto 3000)
pm2 start npm --name "universo-tienda" -- run start

# Panel admin (puerto 3001)
pm2 start npm --name "universo-admin" -- run start:admin

# Auto-arranque al reiniciar servidor
pm2 startup
pm2 save
```


## PASO 8: Configurar cron jobs para sincronización

```bash
# Los cron jobs se manejan internamente por la app con node-cron,
# pero como backup, puedes añadir crons del sistema:

crontab -e

# Stock cada 30 minutos
*/30 * * * * cd /var/www/universomerchan && npx ts-node scripts/sync-stock.ts >> /var/log/universo-sync.log 2>&1

# Productos, precios y print data cada 6 horas
0 */6 * * * cd /var/www/universomerchan && npx ts-node scripts/sync-full.ts >> /var/log/universo-sync.log 2>&1

# Estado de pedidos activos cada 15 minutos
*/15 * * * * cd /var/www/universomerchan && npx ts-node scripts/sync-orders.ts >> /var/log/universo-sync.log 2>&1
```


## PASO 9: Configurar Stripe

1. Ve a https://dashboard.stripe.com
2. En Developers > API Keys, copia las claves al .env:
   - STRIPE_SECRET_KEY = sk_test_... (o sk_live_... en producción)
   - STRIPE_PUBLISHABLE_KEY = pk_test_... (o pk_live_...)

3. En Settings > Payment Methods, activa:
   - Cards (Visa, Mastercard, Amex) — incluye Apple Pay y Google Pay
   - SEPA Direct Debit — transferencia bancaria EU (popular en B2B)
   - Link — checkout rápido para clientes recurrentes

4. APPLE PAY — Verificar dominio:
   - Ve a Settings > Payment Methods > Apple Pay > Add new domain
   - Escribe: universomerchan.com
   - Descarga el archivo de verificación
   - Colócalo en tu servidor:
     ```bash
     sudo mkdir -p /var/www/universomerchan/public/.well-known
     # Copia el archivo descargado ahí:
     sudo cp apple-developer-merchantid-domain-association \
       /var/www/universomerchan/public/.well-known/
     ```
   - Añade esta location al Nginx de la tienda:
     ```nginx
     location /.well-known/ {
         alias /var/www/universomerchan/public/.well-known/;
     }
     ```
   - Haz `sudo nginx -t && sudo systemctl reload nginx`
   - Vuelve a Stripe y haz clic en "Verify"
   - Una vez verificado, Apple Pay aparecerá automáticamente en
     Safari/iOS cuando los clientes paguen

5. GOOGLE PAY — No necesita configuración extra.
   Aparece automáticamente en Chrome/Android.

6. En Developers > Webhooks:
   - Añade endpoint: https://universomerchan.com/api/webhooks/stripe
   - Eventos a escuchar: 
     - checkout.session.completed
     - payment_intent.succeeded
     - payment_intent.payment_failed
   - Copia el webhook secret al .env (STRIPE_WEBHOOK_SECRET)

7. MODO TEST vs PRODUCCIÓN:
   - Empieza con claves sk_test_/pk_test_ para probar
   - Cuando todo funcione, cambia a sk_live_/pk_live_ en .env
   - Recuerda crear un nuevo webhook con la URL de producción


## PASO 10: Migrar DNS (cuando todo esté listo)

1. En tu proveedor de DNS (donde tengas universomerchan.com):
   - A record: universomerchan.com → IP de tu servidor
   - A record: admin.universomerchan.com → IP de tu servidor
   - A record: www.universomerchan.com → IP de tu servidor
   
2. Si tienes WordPress activo en universomerchan.com:
   - Haz backup completo primero
   - Opción A: Mueve WordPress a blog.universomerchan.com
   - Opción B: Desactívalo (la nueva web reemplaza todo)


## VERIFICACIÓN POST-DESPLIEGUE

```bash
# Verificar que todo funciona:
curl -s https://universomerchan.com | head -5       # Tienda
curl -s https://admin.universomerchan.com | head -5  # Admin
curl -s https://universomerchan.com/api/health       # API health check

# Verificar sincronización:
pm2 logs universo-tienda --lines 50

# Verificar PostgreSQL:
sudo -u postgres psql -d universomerchan -c "SELECT COUNT(*) FROM products;"
sudo -u postgres psql -d universomerchan -c "SELECT COUNT(*) FROM stock;"

# Verificar Redis:
redis-cli ping  # Debe responder PONG
```


## MANTENIMIENTO

```bash
# Ver logs en tiempo real
pm2 logs

# Reiniciar aplicación
pm2 restart universo-tienda
pm2 restart universo-admin

# Actualizar código
cd /var/www/universomerchan
git pull
npm install
npm run build
pm2 restart all

# Backup de base de datos (automatizar con cron)
pg_dump -U universo universomerchan > /backups/universo-$(date +%Y%m%d).sql
```


## SEGURIDAD EXTRA (RECOMENDADO)

```bash
# Firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Fail2ban (protección contra fuerza bruta)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban

# Restringir acceso al admin por IP (en nginx config)
# Descomenta las líneas allow/deny en el server block de admin
```
