const fs = require('fs');
let code = fs.readFileSync('src/app/admin/orders/[id]/page.tsx', 'utf8');

code = code.replace(
  'import { ChevronLeft, Package, User, MapPin, Euro, AlertTriangle, RefreshCw, Mail, Send, UploadCloud, CheckCircle } from "lucide-react";',
  'import { ChevronLeft, Package, User, MapPin, Euro, AlertTriangle, RefreshCw, Mail, Send, UploadCloud, CheckCircle, ShoppingCart, Eye, Truck, X, Clock, ExternalLink } from "lucide-react";'
);

code = code.replace(
  'const [emailLogs, setEmailLogs] = useState<any[]>([]);',
  'const [emailLogs, setEmailLogs] = useState<any[]>([]);\n  const [timeline, setTimeline] = useState<any[]>([]);\n  \n  const [trackingForm, setTrackingForm] = useState({ forwarder: "", trackingNumber: "", trackingUrl: "" });\n  const [submittingTracking, setSubmittingTracking] = useState(false);'
);

code = code.replace(
  'setEmailLogs(data.emailLogs || []);',
  'setEmailLogs(data.emailLogs || []);\n        setTimeline(data.timeline || []);'
);

code = code.replace(
  'setEmailLogs(newData.emailLogs || []);',
  'setEmailLogs(newData.emailLogs || []);\n        setTimeline(newData.timeline || []);'
);

// We need to insert IconForEvent component
code = code.replace(
  'if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;',
  'if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;\n\n  const IconForEvent = ({ icon }: { icon: string }) => {\n    const map: Record<string, any> = { cart: ShoppingCart, check: CheckCircle, eye: Eye, truck: Truck, x: X, clock: Clock };\n    const Icon = map[icon] || Clock;\n    return <Icon size={14} />;\n  };\n\n  const submitTracking = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!trackingForm.trackingNumber) return alert("El ID de seguimiento es obligatorio");\n    setSubmittingTracking(true);\n    try {\n      const res = await fetch(`/api/admin/orders/${orderNumber}/tracking`, {\n        method: "POST",\n        headers: { "Content-Type": "application/json", ...authHeaders() },\n        body: JSON.stringify(trackingForm)\n      });\n      const data = await res.json();\n      if (data.success) {\n        alert("Seguimiento adjuntado y email enviado al cliente.");\n        // Refresh\n        const newData = await fetch(`/api/admin/orders/${orderNumber}`, { headers: authHeaders() }).then(r => r.json());\n        setOrder(newData.order);\n        setEmailLogs(newData.emailLogs || []);\n        setTimeline(newData.timeline || []);\n        setTrackingForm({ forwarder: "", trackingNumber: "", trackingUrl: "" });\n      } else {\n        alert(data.error || "Error al subir tracking.");\n      }\n    } catch(err) {\n      alert("Error de red");\n    } finally {\n      setSubmittingTracking(false);\n    }\n  };'
);

// Add the Timeline and Form block below the grid
const timelineHtml = `
      {/* Timeline & Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-brand-red font-semibold pb-3 border-b border-surface-100 mb-4">
            <Clock size={18} /> Timeline del Pedido
          </div>
          <div className="space-y-4">
            {timeline.map((event, i) => (
              <div key={i} className="flex gap-3">
                <div className={\`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 \${event.type === "success" ? "bg-green-100 text-green-600" :
                  event.type === "warning" ? "bg-amber-100 text-amber-600" :
                    event.type === "error" ? "bg-red-100 text-red-600" :
                      "bg-surface-100 text-gray-400"
                  }\`}>
                  <IconForEvent icon={event.icon} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{event.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{event.description}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    {new Date(event.timestamp).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-brand-red font-semibold pb-3 border-b border-surface-100 mb-4">
            <Truck size={18} /> Envío y Seguimiento
          </div>
          {order.status === "shipped" || order.trackingNumber ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-semibold text-sm text-green-800">Pedido enviado con {order.forwarder || "Agencia"}</p>
              <p className="text-xs text-green-600 mb-3">Tracking: {order.trackingNumber}</p>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-green-700 transition-colors">
                  Seguir envío <ExternalLink size={12} />
                </a>
              )}
            </div>
          ) : (
            <form onSubmit={submitTracking} className="space-y-3 bg-surface-50 p-4 rounded-xl border border-surface-100">
              <p className="text-xs font-bold text-gray-600 mb-1">Añadir seguimiento manualmente:</p>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500">Agencia / Transportista</label>
                <input required type="text" placeholder="Ej. Correos Express" className="w-full text-sm p-2 border border-surface-200 rounded" value={trackingForm.forwarder} onChange={e => setTrackingForm({...trackingForm, forwarder: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500">Número de Tracking</label>
                <input required type="text" placeholder="Ej. 123456789" className="w-full text-sm p-2 border border-surface-200 rounded" value={trackingForm.trackingNumber} onChange={e => setTrackingForm({...trackingForm, trackingNumber: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500">Enlace de seguimiento (Opcional)</label>
                <input type="url" placeholder="https://..." className="w-full text-sm p-2 border border-surface-200 rounded" value={trackingForm.trackingUrl} onChange={e => setTrackingForm({...trackingForm, trackingUrl: e.target.value})} />
              </div>
              <button disabled={submittingTracking} type="submit" className="w-full bg-brand-red text-white py-2 rounded-lg text-sm font-bold hover:bg-brand-red-dark transition-colors disabled:opacity-50 flex justify-center items-center gap-2 mt-2">
                {submittingTracking ? <RefreshCw size={14} className="animate-spin" /> : <><Send size={14} /> Guardar y Notificar</>}
              </button>
            </form>
          )}
        </div>
      </div>
`;

code = code.replace(
  '      {/* Order Lines */}',
  timelineHtml + '\n      {/* Order Lines */}'
);

fs.writeFileSync('src/app/admin/orders/[id]/page.tsx', code);
console.log("Done patching admin page.");
