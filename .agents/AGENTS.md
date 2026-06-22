# Análisis de Impacto y Recorrido del Lead
**SIEMPRE**, antes de dar por finalizada una tarea, de proponer un despliegue a producción o de dar por completado un código, DEBES hacer un análisis profundo del impacto global:
1. **Impacto en el Sistema:** ¿Afecta esto a otras partes del sistema indirectamente? ¿Se rompe alguna variable de estado, dependencia, API o base de datos que no estoy considerando?
2. **Impacto en el Recorrido del Lead:** Analiza psicológicamente y técnicamente el flujo de los clientes (leads). Si esto sale a producción, ¿hay alguna posibilidad técnica de que el cliente experimente un rebote, un cambio de idioma, un error de carrito o una interrupción en su experiencia? NUNCA envíes a producción nada sin verificar que el *Lead Journey* es 100% fluido y coherente.

# Servidor de Producción (SSH y Bloqueos)
Cuando intentes conectar o hacer despliegues al servidor de producción (`212.227.90.110`), ten en cuenta la siguiente configuración de seguridad (fail2ban/firewall):
- El firewall puede bloquear silenciosamente el tráfico ICMP (ping) impidiendo que responda a comandos de prueba de red.
- Si un comando `ping` te da 100% de pérdida de paquetes o timeout, **NO ASUMAS** que tu IP ha sido bloqueada por completo y que estás sin acceso.
- El puerto 22 (SSH) a menudo sigue abierto. Prueba **SIEMPRE** la conexión directa por SSH (`sshpass -p '***REMOVED***' ssh -o StrictHostKeyChecking=no root@212.227.90.110`) antes de darte por vencido o pausar un despliegue.
