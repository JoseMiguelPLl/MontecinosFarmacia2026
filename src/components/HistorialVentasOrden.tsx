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
  tipoPago: string;
  totalVenta: number;
  detalles: DetalleVenta[];
}

interface DetalleVenta {
  producto: string;
  cantidad: number;
  precioUnitario: number;
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
      .map(d => `${d.producto} (x${d.cantidad})`)
      .join("\n");

    const precios = v.detalles
      .map(d => `${d.precioUnitario} Bs`)
      .join("\n");

    const totales = v.detalles
      .map(d => `${d.totalDetalle} Bs`)
      .join("\n");

    rows.push([
      v.ventaId,
      v.cliente,
      v.fechaVenta,
      v.tipoPago,
      productos,
      precios,
      totales
    ]);

  });

  doc.autoTable({

    head:[[
      "Orden",
      "Cliente",
      "Fecha",
      "Pago",
      "Productos",
      "Precio",
      "Total"
    ]],

    body:rows,
    startY:75,
    theme:"grid",

    styles:{
      fontSize:9,
      cellPadding:3
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
      4:{halign:"left"}
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
              <th className="p-3 bg-blue">Fecha</th>
              <th className="p-3 bg-blue">Tipo Pago</th>
              <th className="p-3 bg-blue">Total</th>
              <th className="p-3 bg-blue">Detalle</th>
            </tr>
          </thead>

          <tbody>
            {ventas.map((v) => (
              <tr key={v.ventaId} className="border-b">
                <td className="p-3">{v.ventaId}</td>
                <td className="p-3">{v.cliente}</td>
                <td className="p-3">{v.fechaVenta}</td>
                <td className="p-3">{v.tipoPago}</td>
                <td className="p-3">{v.totalVenta.toFixed(2)} Bs</td>

                <td className="p-3">
                  <button
                    onClick={() => handleViewDetails(v)}
                    className="text-blue-600"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 font-bold">
        Total General: {totalGeneral.toFixed(2)} Bs
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedVenta && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              Venta #{selectedVenta.ventaId}
            </h2>

            <p>Cliente: {selectedVenta.cliente}</p>
            <p>Tipo Pago: {selectedVenta.tipoPago}</p>

            <table className="min-w-full mt-4 border">
              <thead className="bg-blue text-white">
                <tr>
                  <th className="p-2 bg-blue">Producto</th>
                  <th className="p-2 bg-blue">Cantidad</th>
                  <th className="p-2 bg-blue">Precio</th>
                  <th className="p-2 bg-blue">Total</th>
                </tr>
              </thead>

              <tbody>
                {selectedVenta.detalles.map((d, i) => (
                  <tr key={i}>
                    <td className="p-2">{d.producto}</td>
                    <td className="p-2">{d.cantidad}</td>
                    <td className="p-2">{d.precioUnitario}</td>
                    <td className="p-2">{d.totalDetalle}</td>
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
