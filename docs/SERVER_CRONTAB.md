# Universo Merchan - Configuración de Cronjobs del Servidor

Este archivo documenta los cronjobs obligatorios y su sintaxis exacta que deben alojarse en el servidor Linux (Ubuntu/Debian) que hospeda el proyecto.
La memoria de la app requiere que todos los cronjobs de llamadas a APIs REST externas tengan las comillas siempre correctamente formateadas.

## Acceso al Servidor
Para modificar el crontab del servidor de producción:
`ssh root@212.227.90.110` -> Ejecutar `crontab -e`

## Tareas Programadas (Crontab)

```bash
# =======================================================
# SINCRONIZACIÓN DE PEDIDOS Y STOCK Y MIDOCEAN
# =======================================================
*/15 * * * * cd /var/www/universomerchan && npm run sync:orders >> /var/log/universo-sync.log 2>&1
*/30 * * * * cd /var/www/universomerchan && npm run sync:stock >> /var/log/universo-sync.log 2>&1
0 */6 * * * cd /var/www/universomerchan && npm run sync:full >> /var/log/universo-sync.log 2>&1

# =======================================================
# GENERACIÓN AUTOMÁTICA DE BLOGS CON IA
# =======================================================
# [CRITICAL / MEMORY FIX]: 
# CRÍTICO: La cabecera Authorization DEBE ir siempre envuelta con comillas dobles "". 
# De lo contrario cURL falla porque interpreta la palabra 'Bearer' como el nombre de página a visitar e ignora el resto.
# Funciona a las 09:00 AM Europe/Madrid.
0 9 * * * curl -X POST -H "Authorization: Bearer universomerchancron!123" https://universomerchan.com/api/cron/generate-blog >> /var/log/universomerchan/cron-blog.log 2>&1

# =======================================================
# RECORDATORIOS DE CARRITOS ABANDONADOS Y MOCKUPS
# =======================================================
0 * * * * curl -s https://universomerchan.com/api/cron/check-abandoned-carts > /dev/null 2>&1
0 4 * * * curl -s -X GET https://universomerchan.com/api/cron/clean-mockups -H "Authorization: Bearer merchan_automockup_30_days_v1" >/dev/null 2>&1

# =======================================================
# SISTEMA B2B CAPTACIÓN DE RESEÑAS POST-ENTREGA (+6 DÍAS)
# =======================================================
0 10 * * * curl -X POST -H "Authorization: Bearer universomerchancron!123" https://universomerchan.com/api/cron/request-reviews >> /var/log/universomerchan/cron-reviews.log 2>&1

# =======================================================
# AUTOPURGA DE PRODUCTOS FANTASMAS (MIDOCEAN DESCATALOGADOS)
# =======================================================
0 3 1 * * cd /var/www/universomerchan && npm run sync:cleanup >> /var/log/universo-cleanup.log 2>&1
```

## Prevención contra errores futuros
- Las variables que tienen espacios (ej. encabezados complejos en cURL como `Authorization: Bearer mi-pass`) siempre deben tener delimitadores de comillas.
- Cualquier modificación a los logs por curl (`> /var/log/...`) debe ser supervisada con permisos del OS.
