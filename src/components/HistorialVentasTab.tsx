import { useState } from "react";
import HistorialVentasProducto from "./HistorialVentasProducto";
import HistorialVentasCliente from "./HistorialVentasCliente";
import HistorialVentasOrden from "./HistorialVentasOrden";
import NavBarRoot from "./NavBarRoot";

const HistorialVentasTabs = () => {
  const [activeTab, setActiveTab] = useState("producto");

  return (
    <div className="flex h-screen">
      <NavBarRoot />
      <div className="p-4 flex-1 overflow-auto">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold">Historial de Ventas</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-6 mb-4">
   {/* Por Orden */}
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tab"
                value="orden"
                checked={activeTab === "orden"}
                onChange={() => setActiveTab("orden")}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700">Por Orden</span>
            </label>
            {/* Por Producto */}
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tab"
                value="producto"
                checked={activeTab === "producto"}
                onChange={() => setActiveTab("producto")}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700">Por Producto</span>
            </label>

            {/* Por Cliente */}
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tab"
                value="cliente"
                checked={activeTab === "cliente"}
                onChange={() => setActiveTab("cliente")}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700">Por Cliente</span>
            </label>

         

          </div>

          {activeTab === "producto" && <HistorialVentasProducto />}
          {activeTab === "cliente" && <HistorialVentasCliente />}
          {activeTab === "orden" && <HistorialVentasOrden />}
        </div>

      </div>
    </div>
  );
};

export default HistorialVentasTabs;