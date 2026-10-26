import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Modal from "./Modal";
import logo  from "../img/logo1.png"
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: any;
  }
}

interface Venta {
  ventaId: number;
  fechaVenta: string;
  cliente: string;
  seguro?: string;
  tipoPago: string;
  subTotal?: number;
  descuentoTotal?: number;
  totalVenta: number;
  detalles: DetalleVenta[];
}

interface DetalleVenta {
  productoId?: number;
  codigo?: string;
  producto: string;
  lote?: string;
  vencimiento?: string;
  fechaPublicacion?: string;
  tieneDescuento?: boolean;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  totalDetalle: number;
}

interface Configuracion {
  nombre: string;
  telefono: string;
  direccion: string;
}

function HistorialVentasOrden() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [fechaIni, setFechaIni] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoPago, setTipoPago] = useState("");
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);

  useEffect(() => {
    fetch(
      "http://localhost:5000/api/Configuracions/ListarConfiguracionActivos",
    )
      .then((res) => res.json())
      .then((data) => setConfiguracion(data));
  }, []);

  useEffect(() => {
    if (!fechaIni || !fechaFin) return;

    let url = `http://localhost:5000/api/Ventas/ListarVentasOrden?fechaIni=${fechaIni}&fechafin=${fechaFin}`;

    if (tipoPago) {
      url += `&tipoPago=${tipoPago}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setVentas(data.ventas || []);
      });
  }, [fechaIni, fechaFin, tipoPago]);

  const totalGeneral = ventas.reduce((sum, v) => sum + v.totalVenta, 0);

const generarPDF = () => {

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // 🔵 Barra superior
  doc.setFillColor(41,128,185);
  doc.rect(0,0,pageWidth,20,"F");

  // 🔵 LOGO
  doc.addImage(logo,"PNG",14,5,18,10);

  // 🔵 Titulo
  doc.setFontSize(16);
  doc.setTextColor(255,255,255);
  doc.setFont("helvetica","bold");
  doc.text("REPORTE DE VENTAS POR ORDEN",pageWidth/2,13,{align:"center"});

  doc.setTextColor(0,0,0);

  // 🏥 DATOS FARMACIA
  let y = 30;

  configuracion.forEach(c => {

    doc.setFontSize(12);
    doc.setFont("helvetica","bold");
    doc.text(c.nombre,14,y);

    doc.setFontSize(9);
    doc.setFont("helvetica","normal");
    doc.text(`Direccion: ${c.direccion}`,14,y+6);
    doc.text(`Telefono: ${c.telefono}`,14,y+11);

  });

  // 📅 CAJA INFORMACION
  doc.setFillColor(245,247,250);
  doc.setDrawColor(200);

  doc.roundedRect(pageWidth-75,28,60,25,3,3,"FD");

  doc.setFontSize(9);
  doc.setFont("helvetica","bold");
  doc.text("INFORMACION",pageWidth-45,34,{align:"center"});

  doc.setFont("helvetica","normal");
  doc.text(`Desde: ${fechaIni}`,pageWidth-70,40);
  doc.text(`Hasta: ${fechaFin}`,pageWidth-70,45);
  doc.text(`Pago: ${tipoPago || "Todos"}`,pageWidth-70,50);

  // Línea separadora
  doc.setDrawColor(41,128,185);
  doc.line(14,60,pageWidth-14,60);

  // TITULO TABLA
  doc.setFontSize(12);
  doc.setFont("helvetica","bold");
  doc.text("DETALLE DE VENTAS POR ORDEN",14,70);

  const rows:any[] = [];

  ventas.forEach(v => {

    const productos = v.detalles
      .map(d => `${d.producto} (x${d.cantidad})${d.lote ? ` [Lt: ${d.lote}]` : ""}`)
      .join("\n");

    const precios = v.detalles
      .map(d => `${Number(d.precioUnitario).toFixed(2)} Bs`)
      .join("\n");

    const descuentos = v.detalles
      .map(d => `${Number(d.descuento || 0).toFixed(2)} Bs`)
      .join("\n");

    const totales = v.detalles
      .map(d => `${Number(d.totalDetalle).toFixed(2)} Bs`)
      .join("\n");

    rows.push([
      v.ventaId,
      v.cliente,
      v.seguro || "Particular",
      v.fechaVenta,
      v.tipoPago,
      productos,
      precios,
      descuentos,
      totales
    ]);

  });

  doc.autoTable({

    head:[[
      "Orden",
      "Cliente",
      "Seguro",
      "Fecha",
      "Pago",
      "Productos",
      "P. Lista",
      "Descuento",
      "Total"
    ]],

    body:rows,
    startY:75,
    theme:"grid",

    styles:{
      fontSize:8,
      cellPadding:2.5
    },

    headStyles:{
      fillColor:[41,128,185],
      textColor:255,
      fontStyle:"bold",
      halign:"center"
    },

    bodyStyles:{
      halign:"center"
    },

    columnStyles:{
      5:{halign:"left"}
    },

    alternateRowStyles:{
      fillColor:[245,247,250]
    }

  });

  // 💰 TOTAL GENERAL
  let finalY = doc.lastAutoTable.finalY + 12;

  // 👇 control si ya no hay espacio
  if (finalY > pageHeight - 30) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFillColor(240,240,240);
  doc.rect(pageWidth-85,finalY-6,70,15,"F");

  doc.setFontSize(11);
  doc.setFont("helvetica","bold");
  doc.text("TOTAL GENERAL:",pageWidth-80,finalY+4);

  doc.setFont("helvetica","normal");
  doc.text(`${totalGeneral.toFixed(2)} Bs`,pageWidth-20,finalY+4,{align:"right"});

  // 📄 PIE DE PAGINA
  doc.setFontSize(8);
  doc.setTextColor(120);

  doc.text(
    "Sistema de Gestion Farmaceutica",
    14,
    pageHeight-10
  );

  doc.text(
    `Generado: ${new Date().toLocaleString()}`,
    pageWidth-14,
    pageHeight-10,
    {align:"right"}
  );

  doc.save(`ventas_${fechaIni}_${fechaFin}.pdf`);

};

  const handleViewDetails = (venta: Venta) => {
    setSelectedVenta(venta);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={fechaIni}
          onChange={(e) => setFechaIni(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={tipoPago}
          onChange={(e) => setTipoPago(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Todos</option>
          <option value="QR">QR</option>
          <option value="Efectivo">Efectivo</option>
        </select>

        <button
          onClick={generarPDF}
          className="bg-blue text-white px-4 py-2 rounded"
        >
          Exportar PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-blue text-white">
            <tr>
              <th className="p-3 bg-blue">Orden</th>
              <th className="p-3 bg-blue">Cliente</th>
              <th className="p-3 bg-blue">Seguro</th>
              <th className="p-3 bg-blue">Fecha</th>
              <th className="p-3 bg-blue">Tipo Pago</th>
              <th className="p-3 bg-blue">Descuento</th>
              <th className="p-3 bg-blue">Total</th>
              <th className="p-3 bg-blue">Detalle</th>
            </tr>
          </thead>

          <tbody>
            {ventas.map((v) => (
              <tr key={v.ventaId} className="border-b hover:bg-gray-50">
                <td className="p-3 font-semibold">{v.ventaId}</td>
                <td className="p-3 font-medium">{v.cliente}</td>
                <td className="p-3">
                  {v.seguro ? (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-semibold border border-blue-200">
                      {v.seguro}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs italic">Particular</span>
                  )}
                </td>
                <td className="p-3">{v.fechaVenta}</td>
                <td className="p-3">{v.tipoPago}</td>
                <td className="p-3 text-green-600 font-semibold">
                  {v.descuentoTotal && v.descuentoTotal > 0
                    ? `-${Number(v.descuentoTotal).toFixed(2)} Bs`
                    : "0.00 Bs"}
                </td>
                <td className="p-3 font-bold text-blue-700">{v.totalVenta.toFixed(2)} Bs</td>

                <td className="p-3">
                  <button
                    onClick={() => handleViewDetails(v)}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 font-bold text-lg text-gray-800">
        Total General: <span className="text-blue-600">{totalGeneral.toFixed(2)} Bs</span>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedVenta && (
          <div>
            <h2 className="text-xl font-bold mb-3 text-blue-700">
              Venta #{selectedVenta.ventaId}
            </h2>

            <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg border mb-4">
              <p><span className="font-semibold text-gray-600">Cliente:</span> {selectedVenta.cliente}</p>
              <p>
                <span className="font-semibold text-gray-600">Seguro:</span>{" "}
                <span className="font-medium text-blue-700">{selectedVenta.seguro || "Particular (Sin Seguro)"}</span>
              </p>
              <p><span className="font-semibold text-gray-600">Fecha:</span> {selectedVenta.fechaVenta}</p>
              <p><span className="font-semibold text-gray-600">Tipo Pago:</span> {selectedVenta.tipoPago}</p>
              {selectedVenta.descuentoTotal && selectedVenta.descuentoTotal > 0 ? (
                <>
                  <p><span className="font-semibold text-gray-600">SubTotal:</span> {(selectedVenta.subTotal || (selectedVenta.totalVenta + selectedVenta.descuentoTotal)).toFixed(2)} Bs</p>
                  <p className="text-green-700 font-semibold"><span>Descuento Seguro:</span> -{Number(selectedVenta.descuentoTotal).toFixed(2)} Bs</p>
                </>
              ) : null}
              <p className="col-span-2 text-base font-bold text-blue-700 border-t pt-2">
                Total Venta: {selectedVenta.totalVenta.toFixed(2)} Bs
              </p>
            </div>

            <table className="min-w-full mt-2 border text-sm">
              <thead className="bg-blue text-white">
                <tr>
                  <th className="p-2 bg-blue text-left">Producto / Lote</th>
                  <th className="p-2 bg-blue text-center">Código</th>
                  <th className="p-2 bg-blue text-center">Cantidad</th>
                  <th className="p-2 bg-blue text-center">Precio U.</th>
                  <th className="p-2 bg-blue text-center">Descuento</th>
                  <th className="p-2 bg-blue text-center">Total</th>
                </tr>
              </thead>

              <tbody>
                {selectedVenta.detalles.map((d, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <p className="font-bold text-gray-800">{d.producto}</p>
                      {(d.lote || d.vencimiento) && (
                        <p className="text-xs text-gray-500">
                          {d.lote ? `Lote: ${d.lote}` : ""} {d.vencimiento ? `• Vence: ${d.vencimiento}` : ""}
                        </p>
                      )}
                    </td>
                    <td className="p-2 text-center text-xs font-mono">{d.codigo || "S/D"}</td>
                    <td className="p-2 text-center font-bold">{d.cantidad}</td>
                    <td className="p-2 text-center">{Number(d.precioUnitario).toFixed(2)} Bs</td>
                    <td className="p-2 text-center text-green-600 font-medium">
                      {d.descuento && d.descuento > 0 ? `-${Number(d.descuento).toFixed(2)} Bs` : "0.00 Bs"}
                    </td>
                    <td className="p-2 text-center font-bold text-blue-700">{Number(d.totalDetalle).toFixed(2)} Bs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default HistorialVentasOrden;
