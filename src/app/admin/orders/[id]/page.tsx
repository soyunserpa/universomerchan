"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Package, User, MapPin, Euro, AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminOrderDetailPage() {
  const { authHeaders, logout } = useAdminAuth();
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [orderLines, setOrderLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forcingStatus, setForcingStatus] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${orderNumber}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
           setError(data.error);
           setLoading(false);
           return;
        }
        setOrder(data.order);
        setOrderLines(data.orderLines);
        setLoading(false);
      })
      .catch(err => {
        setError("Error loading order");
        setLoading(false);
      });
  }, [orderNumber]);

  if (loading) return <div className="p-8 flex justify-center"><RefreshCw className="animate-spin text-gray-300" /></div>;
  if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="font-display font-extrabold text-2xl">Pedido {order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Fecha: {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold border ${
          order.status === 'paid' ? 'bg-green-50 border-green-200 text-green-700' :
          order.status === 'pending_payment' ? 'bg-amber-50 border-amber-200 text-amber-700' :
          'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          {order.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="bg-white border border-surface-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-brand-red font-semibold pb-3 border-b border-surface-100">
            <User size={18} /> Cliente
          </div>
          <div>
            <p className="font-bold">{order.user?.firstName} {order.user?.lastName}</p>
            <p className="text-sm text-gray-600">{order.user?.email}</p>
            {order.user?.companyName && <p className="text-sm text-gray-600">Empresa: {order.user.companyName}</p>}
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white border border-surface-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-brand-red font-semibold pb-3 border-b border-surface-100">
            <MapPin size={18} /> Envío
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-bold">{order.shippingName}</p>
            {order.shippingCompany && <p>{order.shippingCompany}</p>}
            <p>{order.shippingStreet}</p>
            <p>{order.shippingPostalCode} {order.shippingCity}</p>
            <p>{order.shippingCountry}</p>
            <p className="pt-2">Tlf: {order.shippingPhone}</p>
          </div>
        </div>

        {/* Financial Info */}
        <div className="bg-white border border-surface-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-brand-red font-semibold pb-3 border-b border-surface-100">
            <Euro size={18} /> Finanzas
          </div>
          <div className="text-sm text-gray-700 space-y-2">
            <div className="flex justify-between"><span>Subtotal Prod:</span> <span>{order.subtotalProduct}€</span></div>
            <div className="flex justify-between"><span>Subtotal Print:</span> <span>{order.subtotalPrint}€</span></div>
            <div className="flex justify-between"><span>Envío:</span> <span>{order.shippingCost}€</span></div>
            {order.discountApplied && parseFloat(order.discountApplied) > 0 && (
              <div className="flex justify-between text-green-600"><span>Descuento:</span> <span>-{order.discountApplied}€</span></div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t border-surface-100 text-lg">
              <span>TOTAL:</span> <span>{order.totalPrice}€</span>
            </div>
            {order.stripeSessionId && <div className="text-[10px] text-gray-400 truncate pt-2">Stripe: {order.stripeSessionId}</div>}
            {order.midoceanOrderNumber && <div className="text-[10px] text-gray-400 truncate">MO: {order.midoceanOrderNumber}</div>}
          </div>
        </div>
      </div>

      {/* Order Lines */}
      <div className="bg-white border border-surface-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex items-center gap-2 font-semibold text-gray-800">
          <Package size={18} /> Productos ({orderLines.length} líneas)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 text-gray-500 font-semibold text-xs uppercase tracking-wider text-left border-b border-surface-100">
              <tr>
                <th className="px-5 py-3">Ref</th>
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3">Variante</th>
                <th className="px-5 py-3">Cant</th>
                <th className="px-5 py-3">Total L.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {orderLines.map((line: any) => (
                <tr key={line.id} className="hover:bg-surface-50">
                  <td className="px-5 py-3 font-mono text-xs">{line.sku}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold">{line.productName}</p>
                    {line.printConfig && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded font-bold tracking-wide">
                        CON MARCAJE
                      </span>
                    )}
                    {(line.mockupUrl || line.artworkUrl) && (
                      <div className="mt-2 flex gap-2">
                        {line.mockupUrl && (
                          <a href={line.mockupUrl} target="_blank" rel="noreferrer" className="block shrink-0 relative w-12 h-12 border border-surface-200 rounded overflow-hidden hover:opacity-80 transition-opacity" title="Ver Mockup">
                            <img src={line.mockupUrl} className="object-cover w-full h-full" alt="Mockup" />
                          </a>
                        )}
                        {line.artworkUrl && (
                          <a href={line.artworkUrl} target="_blank" rel="noreferrer" className="block shrink-0 relative w-12 h-12 border border-surface-200 rounded overflow-hidden bg-gray-50 hover:opacity-80 transition-opacity" title="Ver Logo">
                            <img src={line.artworkUrl} className="object-contain w-full h-full p-1" alt="Logo Original" />
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">
                    {line.colorDescription} {line.size && `| Talla: ${line.size}`}
                  </td>
                  <td className="px-5 py-3 font-bold">{line.quantity}</td>
                  <td className="px-5 py-3 font-semibold text-brand-red">{line.lineTotal}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
