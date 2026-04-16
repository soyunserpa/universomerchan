# Gestión de Entornos y Variables (.env)

Este documento forma parte de la **Memoria Arquitectónica de Universo Merchan** y establece las reglas inquebrantables sobre cómo se gestionan las contraseñas, secretos y variables de entorno del proyecto.

## Regla de Oro: Separación de Entornos
El archivo `.env` **NUNCA** debe ser igual en el entorno de desarrollo (tu Mac) y en el entorno de Producción (el Servidor VPS).

1. **Entorno Local (`.env` en Mac):**
   - Contiene banderas de desarrollo (`MIDOCEAN_TEST_ENV=true`).
   - Sirve como entorno "caja de arena" (Sandbox). Romper algo aquí no afecta al negocio.
   - Las integraciones a proveedores (Midocean, etc.) apuntan a entornos de *Test* cuando es posible.

2. **Entorno de Producción (`.env` en /var/www/universomerchan/):**
   - Contiene las claves definitivas.
   - Es sagrado y nunca debe modificarse directamente desde código, sino manualmente conectándose por protocolo seguro SSH (`ssh root@212.227.90.110`).
   - Aquí residen los Tokens de Producción (Ej. `LINKEDIN_ACCESS_TOKEN`, Pasarelas de Pago de Verdad).

## Seguridad en Git
El archivo `.env` está expresamente excluido de Git mediante el archivo `.gitignore`. 
Bajo ningún concepto debe forzarse un *commit* de este archivo.
Al desplegar al servidor (mediante `deploy-ssh2.js` u otros métodos), el servidor ignora cualquier variable local y siempre respetará su archivo oculto interno para proteger la plataforma en vivo.

**Mantenimiento:** Cada vez que se añada una nueva función al núcleo del proyecto que requiera credenciales protegidas o URLs privadas, el administrador / IA deberá replicar la variable manualmente en ambos entornos con los valores correspondientes (Prueba y Producción).
