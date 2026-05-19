#!/bin/bash
export SSHPASS="***REMOVED***"

sshpass -e ssh -o StrictHostKeyChecking=no root@212.227.90.110 "mkdir -p /root/universomerchan/src/app/api/admin/orders/\[id\]/tracking"

sshpass -e scp -o StrictHostKeyChecking=no src/app/api/admin/orders/\[id\]/route.ts root@212.227.90.110:/root/universomerchan/src/app/api/admin/orders/\[id\]/route.ts
sshpass -e scp -o StrictHostKeyChecking=no src/app/api/admin/orders/\[id\]/tracking/route.ts root@212.227.90.110:/root/universomerchan/src/app/api/admin/orders/\[id\]/tracking/route.ts
sshpass -e scp -o StrictHostKeyChecking=no src/app/admin/orders/\[id\]/page.tsx root@212.227.90.110:/root/universomerchan/src/app/admin/orders/\[id\]/page.tsx

sshpass -e ssh -o StrictHostKeyChecking=no root@212.227.90.110 "cd /root/universomerchan && npm run build && pm2 restart universomerchan"
