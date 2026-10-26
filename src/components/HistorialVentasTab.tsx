import { useState } from "react";
import HistorialVentasProducto from "./HistorialVentasProducto";
import HistorialVentasCliente from "./HistorialVentasCliente";
import HistorialVentasOrden from "./HistorialVentasOrden";
import CierreCaja from "./CierreCaja";
import NavBarRoot from "./NavBarRoot";

const HistorialVentasTabs = () => {
  const [activeTab, setActiveTab] = useState("orden");

  return (
    <div className="flex h-screen">
      <NavBarRoot />
      <div className="p-4 flex-1 overflow-auto">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold">Historial de Ventas y Cierre de Caja</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-3 mb-6 bg-gray-100 p-2 rounded-xl border border-gray-200">
            {/* Por Orden */}
            <button
              type="button"
              onClick={() => setActiveTab("orden")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                activeTab === "orden"
                  ? "bg-blue text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              📋 Por Orden
            </button>

            {/* Por Producto */}
            <button
              type="button"
              onClick={() => setActiveTab("producto")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                activeTab === "producto"
                  ? "bg-blue text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              💊 Por Producto (Lotes y Seguros)
            </button>

            {/* Por Cliente */}
            <button
              type="button"
              onClick={() => setActiveTab("cliente")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                activeTab === "cliente"
                  ? "bg-blue text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              👤 Por Cliente
            </button>

            {/* Cierre de Caja */}
            <button
              type="button"
              onClick={() => setActiveTab("cierre")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                activeTab === "cierre"
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              💵 Cierre y Arqueo de Caja
            </button>
          </div>

          {activeTab === "orden" && <HistorialVentasOrden />}
          {activeTab === "producto" && <HistorialVentasProducto />}
          {activeTab === "cliente" && <HistorialVentasCliente />}
          {activeTab === "cierre" && <CierreCaja />}
        </div>

      </div>
    </div>
  );
};

export default HistorialVentasTabs;
