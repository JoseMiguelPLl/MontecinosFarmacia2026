import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Trash2 } from "react-feather";
import { motion } from "framer-motion";
import { ShoppingCart, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaRegEye } from "react-icons/fa";
import Modal from "./Modal";
import logo from "../img/logo1.png";
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: any;
  }
}
interface Laboratorio {
  id: number;
  laboratorioNombre: string;
}

interface Venta {
  ventaId: number;
  fechaVenta: string;
  totalVenta: number;
  detalles: DetalleVenta[];
}

interface DetalleVenta {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  totalDetalle: number;
}

interface Producto {
  id: number;
  nombre: string;
  stock: number;
  idlaboratorio: number;
}
interface Configuracion {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
}
function HistorialVentasProducto() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [fechaIni, setFechaIni] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const getLaboratorioNombre = (idlaboratorio: number) => {
    const lab = laboratorios.find((l) => l.id === idlaboratorio);
    return lab ? lab.laboratorioNombre : "Sin laboratorio";
  };
  const calcularTotalGeneral = () => {
    return getProductosVendidos().reduce(
      (total, producto) => total + producto.total,
      0,
    );
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/Laboratorios/ListarLaboratoriosActivos")
      .then((res) => res.json())
      .then((data) => setLaboratorios(data))
      .catch((err) => console.error("Error laboratorios:", err));
  }, []);
  useEffect(() => {
    fetch(
      "http://localhost:5000/api/Configuracions/ListarConfiguracionActivos",
    )
      .then((response) => response.json())
      .then((data) => setConfiguracion(data));
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseProductos = await fetch(
          "http://localhost:5000/api/Productos/ListarProductosActivos",
        );
        const dataProductos = await responseProductos.json();
        setProductos(dataProductos);

        let url = "http://localhost:5000/api/Ventas/ListarVentasActivos";
        if (fechaIni && fechaFin) {
          url = `http://localhost:5000/api/Ventas/ListarVentasFecha?fechaIni=${fechaIni}&fechafin=${fechaFin}`;
        }

        const responseVentas = await fetch(url);
        const dataVentas = await responseVentas.json();
        setVentas(dataVentas.ventas || []);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, [fechaIni, fechaFin]);

  const getProductosVendidos = () => {
    const productosVendidos: Record<
      number,
      {
        nombre: string;
        laboratorio: string;
        cantidad: number;
        precioUnitario: number;
        total: number;
        stock: number;
      }
    > = {};

    ventas?.forEach((venta) => {
      venta.detalles?.forEach((detalle) => {
        const productoId = detalle.productoId;
        const producto = productos.find((p) => p.id === productoId);
        const laboratorioNombre = producto
          ? getLaboratorioNombre(producto.idlaboratorio)
          : "Sin laboratorio";

        productosVendidos[productoId] = {
          nombre: producto ? producto.nombre : "Desconocido",
          laboratorio: laboratorioNombre,
          cantidad: 0,
          precioUnitario: detalle.precioUnitario,
          total: 0,
          stock: producto ? producto.stock : 0,
        };

        productosVendidos[productoId].cantidad += detalle.cantidad;
        productosVendidos[productoId].total += detalle.totalDetalle;
      });
    });

    return Object.values(productosVendidos);
  };

  const handleViewDetails = (venta: Venta) => {
    setSelectedVenta(venta);
    setIsModalOpen(true);
  };
  const generarPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 🔵 Barra superior
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 20, "F");

    // 🔵 LOGO

    doc.addImage(logo, "PNG", 14, 5, 18, 10);

    // 🔵 Titulo
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE VENTAS POR PRODUCTO", pageWidth / 2, 13, {
      align: "center",
    });

    doc.setTextColor(0, 0, 0);

    // 🏥 DATOS FARMACIA
    let y = 30;

    configuracion.forEach((item) => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(item.nombre, 14, y);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Direccion: ${item.direccion}`, 14, y + 6);
      doc.text(`Telefono: ${item.telefono}`, 14, y + 11);
    });

    // 📅 CAJA DE INFORMACION
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200);

    doc.roundedRect(pageWidth - 75, 28, 60, 22, 3, 3, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACION", pageWidth - 45, 34, { align: "center" });

    doc.setFont("helvetica", "normal");

    doc.text(`Desde: ${fechaIni}`, pageWidth - 70, 40);
    doc.text(`Hasta: ${fechaFin}`, pageWidth - 70, 45);

    // Línea separadora
    doc.setDrawColor(41, 128, 185);
    doc.line(14, 55, pageWidth - 14, 55);

    // TITULO TABLA
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DE MEDICAMENTOS VENDIDOS", 14, 65);

    const tableColumn = [
      "Producto",
      "Laboratorio",
      "Cantidad",
      "Precio",
      "Stock",
      "Total",
    ];

    const productosVendidos = getProductosVendidos();

    const tableRows = productosVendidos.map((p) => [
      p.nombre,
      p.laboratorio,
      p.cantidad,
      `Bs ${p.precioUnitario.toFixed(2)}`,
      p.stock,
      `Bs ${p.total.toFixed(2)}`,
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: "grid",

      styles: {
        fontSize: 9,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },

      bodyStyles: {
        halign: "center",
      },

      columnStyles: {
        0: { halign: "left" },
      },

      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    // 💰 TOTAL GENERAL

    let finalY = doc.lastAutoTable.finalY + 12;

    // 👇 VERIFICAR SI HAY ESPACIO EN LA PÁGINA
    if (finalY > pageHeight - 30) {
      doc.addPage();
      finalY = 20; // posición inicial en la nueva página
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 85, finalY - 6, 70, 15, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL GENERAL:", pageWidth - 80, finalY + 4);

    doc.setFont("helvetica", "normal");
    doc.text(
      `${calcularTotalGeneral().toFixed(2)} Bs`,
      pageWidth - 20,
      finalY + 4,
      { align: "right" },
    );

    // 📄 PIE DE PAGINA
    doc.setFontSize(8);
    doc.setTextColor(120);

    doc.text("Sistema de Gestion Farmaceutica", 14, pageHeight - 10);

    doc.text(
      `Generado: ${new Date().toLocaleString()}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: "right" },
    );

    doc.save(`reporte_ventas_${fechaIni}_${fechaFin}.pdf`);
  };

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={fechaIni}
          onChange={(e) => setFechaIni(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
        <button
          onClick={generarPDF}
          className="bg-blue text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-md"
        >
          Exportar a PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead className="bg-blue-500 text-white uppercase text-sm">
            <tr>
              <th className="px-6 py-3 bg-blue text-left">Producto</th>
              <th className="px-6 py-3 bg-blue text-left">Laboratorio</th>
              <th className="px-6 py-3 bg-blue text-left">Cantidad</th>
              <th className="px-6 py-3 bg-blue text-left">Stock Actual</th>
              <th className="px-6 py-3 bg-blue text-left">Precio Unitario</th>
              <th className="px-6 py-3 bg-blue text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {getProductosVendidos().map((producto, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3">{producto.nombre}</td>
                <td className="p-3">{producto.laboratorio}</td>
                <td className="p-3">{producto.cantidad}</td>
                <td className="p-3">{producto.stock}</td>
                <td className="p-3">{producto.precioUnitario.toFixed(2)} Bs</td>
                <td className="p-3">{producto.total.toFixed(2)} Bs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <label className="text-lg font-bold">
          Total General: {calcularTotalGeneral().toFixed(2)} Bs
        </label>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4 w-full max-w-4xl"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-bold text-blue-600">
                Detalles de la Venta
              </h3>
            </div>

            {selectedVenta && (
              <>
                <div className="mb-6">
                  <p className="text-gray-700">
                    <span className="font-bold">Fecha:</span>{" "}
                    {selectedVenta.fechaVenta}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-bold">Total Venta:</span>{" "}
                    {selectedVenta.totalVenta.toFixed(2)} Bs
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border rounded shadow">
                    <thead className="bg-blue text-white uppercase text-sm">
                      <tr>
                        <th className="px-6 py-3 bg-blue text-left">
                          Producto
                        </th>
                        <th className="px-6 py-3 bg-blue  text-left">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 bg-blue text-left">
                          Precio Unit.
                        </th>
                        <th className="px-6 py-3 bg-blue text-left">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVenta.detalles?.map((detalle, index) => {
                        const producto = productos.find(
                          (p) => p.id === detalle.productoId,
                        );
                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              {producto ? producto.nombre : "Desconocido"}
                            </td>
                            <td className="p-3">{detalle.cantidad}</td>
                            <td className="p-3">
                              {detalle.precioUnitario.toFixed(2)} Bs
                            </td>
                            <td className="p-3">
                              {detalle.totalDetalle.toFixed(2)} Bs
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => generarPDF(selectedVenta)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                  >
                    Generar PDF
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </Modal>
    </div>
  );
}

export default HistorialVentasProducto;
