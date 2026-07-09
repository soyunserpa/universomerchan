# 🔐 Runbook Fase 0 — Contención de seguridad (Universo Merchan)

> **Objetivo:** neutralizar las credenciales filtradas y cerrar los vectores de acceso.
> **Regla de oro:** NO avances a un paso hasta pasar la PUERTA de verificación del anterior.
> Todos los comandos del servidor se ejecutan tras entrar con `ssh root@212.227.90.110`.
> Las contraseñas nuevas las generas tú y las guardas en tu gestor (1Password/Bitwarden…).
> **Lo que de verdad neutraliza la filtración es ROTAR (pasos 2, 4, 5, 7).** Una vez rotadas,
> los valores que había en el historial de git quedan muertos. La purga del historial (paso 8) es higiene.

---

## Paso 1 — Acceso por clave SSH (PRIMERO; es la red de seguridad de todo lo demás)

**En el Mac:**
```bash
# 1a. Generar una clave dedicada (sin passphrase, para permitir el deploy automatizado)
ssh-keygen -t ed25519 -f ~/.ssh/universomerchan_deploy -N '' -C "universomerchan-deploy"

# 1b. Instalar la clave pública en el servidor (usa la contraseña actual una última vez)
ssh-copy-id -i ~/.ssh/universomerchan_deploy.pub -o StrictHostKeyChecking=no root@212.227.90.110
```

**🚪 PUERTA 1 — verifica el login por clave SIN contraseña (en una terminal NUEVA):**
```bash
ssh -i ~/.ssh/universomerchan_deploy -o PasswordAuthentication=no root@212.227.90.110 'echo OK; hostname'
```
Debe imprimir `OK`. **Si NO funciona, PARA aquí** — no toques la contraseña ni la config SSH hasta que la clave entre.

---

## Paso 2 — Rotar la contraseña de root
Solo después de pasar la Puerta 1. En el servidor (entrado por clave):
```bash
passwd
```
Introduce una contraseña nueva y fuerte, guárdala en tu gestor. Esto invalida la filtrada.

---

## Paso 3 — Desactivar el login SSH por contraseña (mata el vector de la contraseña filtrada)
**Deja tu sesión SSH actual ABIERTA** como red de seguridad. En el servidor:
```bash
# Editar el archivo que manda (verificado en la auditoría):
nano /etc/ssh/sshd_config.d/50-cloud-init.conf
#   PasswordAuthentication no
#   PermitRootLogin prohibit-password
sshd -t                 # comprueba que la config es válida (no debe dar error)
systemctl reload ssh    # reload (NO restart): no corta las sesiones abiertas
```

**🚪 PUERTA 3 — en una terminal NUEVA:** confirma que la clave sigue entrando y que la contraseña YA no entra:
```bash
ssh -i ~/.ssh/universomerchan_deploy root@212.227.90.110 'echo CLAVE_OK'      # debe entrar
ssh -o PubkeyAuthentication=no root@212.227.90.110 'echo NO_DEBERIA'          # debe RECHAZAR
```
Solo cierra la sesión de seguridad cuando lo confirmes.

---

## Paso 4 — Rotar la contraseña de PostgreSQL (breve reinicio de la app)
En el servidor. Mira primero el usuario real en el `.env` (`grep DATABASE_URL /var/www/universomerchan/.env`):
```bash
sudo -u postgres psql -c "ALTER USER <usuario_db> WITH PASSWORD 'NUEVA_PW_FUERTE';"
nano /var/www/universomerchan/.env      # actualiza la contraseña dentro de DATABASE_URL
pm2 restart universo-tienda             # DATABASE_URL es runtime -> NO hace falta build
```
**🚪 PUERTA 4:** abre https://universomerchan.com y una ficha de producto; deben cargar.
Rollback si algo falla: vuelve a poner la contraseña anterior con otro `ALTER USER` y restaura el `.env`.

---

## Paso 5 — Rotar los secretos de cron / webhook
```bash
openssl rand -hex 24        # genera el nuevo CRON_SECRET
nano /var/www/universomerchan/.env      # CRON_SECRET=<nuevo>   (y N8N_SECRET si se usa)
pm2 restart universo-tienda
```
Poner el valor en `.env` ya hace efectivo el secreto nuevo (el código lo lee por encima del fallback).
Luego actualiza las líneas del crontab que mandan el Bearer (paso 6).

---

## Paso 6 — Limpiar el crontab
```bash
crontab -l > /root/crontab.backup.$(date +%F)   # respaldo antes de tocar
crontab -e
```
- **Borra** la línea zombi: `* * * * * /var/www/universomerchan/auto_deploy.sh ...`
- **Borra UNA** de las dos líneas duplicadas `check-abandoned-carts`.
- En la que quede, **añade la cabecera** con el nuevo secreto (ahora no tiene ninguna, por eso los emails de recuperación no salían):
  `0 * * * * curl -s -H "Authorization: Bearer <nuevo_CRON_SECRET>" https://universomerchan.com/api/cron/check-abandoned-carts >/dev/null 2>&1`
- Actualiza también el Bearer de `generate-blog` y `quote-reminders` al nuevo secreto.

---

## Paso 7 — Sacar los secretos del árbol de trabajo (local, en el Mac)
- `deploy.sh`: quitar la línea `export SSHPASS=...` y pasar `ssh`/`scp` a usar la clave (`-i ~/.ssh/universomerchan_deploy`). **Claude puede hacer esta edición local por ti.**
- `.claude/settings.json`: quitar la regla `allow` que contiene la contraseña.
- **LinkedIn (lo haces tú, es tu cuenta):** revoca/rota `LINKEDIN_ACCESS_TOKEN` en el LinkedIn Developer Portal, actualiza el `.env` del servidor y `pm2 restart`.

---

## Paso 8 — Purgar el historial de git (higiene; el repo ya es privado y con 0 clones)
Como ya rotaste todo en los pasos anteriores, los valores del historial ya están muertos. Aun así, para dejarlo limpio:
```bash
brew install git-filter-repo
# crea replacements.txt con:  literal:<viejo_secreto>==>ELIMINADO   (una línea por secreto)
git filter-repo --replace-text replacements.txt
rm replacements.txt
git push --force origin --all
```
(Requiere que el remoto `origin` esté configurado y que aceptes reescribir la historia.)

---

## Paso 9 — Backup offsite automático (cierra el hueco "backups solo en el disco del servidor")
Ya tienes una copia manual en el Mac. Para automatizar: añade al final de `/root/universo-backup.sh` un `rclone`/`rsync`
a un destino externo (Backblaze B2, S3 u otro servidor), o una descarga programada al Mac. Verifica una restauración al menos una vez.

---

### Orden de prioridad si no hay tiempo para todo de una vez
1) Paso 1 (clave) → 2 (root pw) → 3 (desactivar password SSH): cierra el acceso al servidor. **Lo más urgente.**
2) Paso 4 (DB) + 5/6 (cron) + 7 (LinkedIn): mata las credenciales de servicio filtradas.
3) Paso 8 (historial) + 9 (backup offsite): higiene y resiliencia.
