# 📌 Registro de Tareas Pendientes (Backlog / Roadmap)

Este documento sirve como registro oficial de aquellas tareas vitales a nivel técnico, legal o estratégico que han sido postpuestas cronológicamente y deben ser revisadas en las fechas indicadas.

---

## 🧾 Fiscalidad y Facturación

- [ ] **[AGOSTO 2026] Actualización VeriFactu (AEAT)**
  - **Contexto:** La normativa "VeriFactu" (Ley Crea y Crece / Antifraude) obliga en España a firmar criptográficamente y enviar un reporte de las facturas en tiempo real a Hacienda para el ecosistema B2B, entrando en rigor en su fase dura a partir del 1 de Julio de 2027 para pequeñas y medianas empresas.
  - **Situación actual:** Stripe está generando las facturas nativas y enviándolas en PDF a través del Checkout sin sello de la AEAT. Esto es perfectamente válido mientras haya margen transitorio.
  - **Plan de acción para este aviso:** 
     1. Revisar si la empresa ha contratado un programa de tipo ERP (Ej: Holded, Factusol, Quipu). Si es así, se desactivará `invoice_creation` en el código de Stripe para que el ERP las haga y firme legalmente.
     2. Si **NO** se tiene ERP y se quiere seguir usando el correo automatizado de Stripe para las facturas, es el momento de instalar la infraestructura dentro del App Marketplace de Stripe (Aplicaciones como **Invopop**, **Quaderno** o **EasyVerifactu**). Ellas se integrarán bajo la mesa y dotarán de cumplimiento legal a las facturas actuales automáticamente.
  - **Prioridad:** Alta (Legalidad Fiscal).
