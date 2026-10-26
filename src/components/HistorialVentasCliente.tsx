import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Modal from "./Modal";
import Pagination from "./Pagination";
import logo from "../img/logo1.png";
import { FaRegEye } from "react-icons/fa";

import {
  Trash2,
  Users,
  Users2,
  Package,
  ShoppingCart,
  Search,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Clock,
  Download,
  FileText,
  Filter,
} from "lucide-react";
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: any;
  }
}

interface Venta {
  id: number;
  idcliente: number;
  nombre: string;
  total: number;
  fecha: string;
}

interface Detalle_Ventas {
  id: number;
  cantidad: number;
  descuento: number;
  precio: number;
  total: number;
  eliminado?: boolean;
  idproducto: number;
  idventa: number;
}

interface Client {
  id: number;
  nombre: string;
  ci: string;
  telefono: string;
  direccion: string;
  idseguro?: number | null;
  eliminado?: boolean;
}

interface Seguro {
  id: number;
  nombre: string;
  porcentaje?: number;
  estado?: string;
}

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  vencimiento: string;
  estado?: boolean;
  idpresentacion: number;
  idlaboratorio: number;
  idtipo: number;
  fecha?: string | null;
}
interface Configuracion {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
}
function HistorialVentasCliente() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [search, setSearch] = useState("");
  const [usuario, setUsuario] = useState<Client[]>([]);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [filterSeguro, setFilterSeguro] = useState<string>("");
  const [detalleventa, setDetalleVenta] = useState<Detalle_Ventas[]>([]);
  const [selectedVentaId, setSelectedVentaId] = useState<number | null>(null);
  const [productos, setProducto] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fechaIni, setFechaIni] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    fetch("http://localhost:5000/api/Configuracions/ListarConfiguracionActivos")
      .then((response) => response.json())
      .then((data) => setConfiguracion(data))
      .catch(() => {});

    fetch("http://localhost:5000/api/Seguros/ListarSegurosActivos")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setSeguros(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterSeguro, fechaIni, fechaFin]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseClientes = await fetch(
          "http://localhost:5000/api/Clientes/ListarClientesActivos"
        );
        const dataClientes = await responseClientes.json();
        setUsuario(dataClientes);

        const responseProducto = await fetch(
          "http://localhost:5000/api/Productos/ListarProductosActivos"
        );
        const dataProductos = await responseProducto.json();
        setProducto(dataProductos);

        let url = "http://localhost:5000/api/Ventas/ListarVentasActivos";
        if (fechaIni && fechaFin) {
          url = `http://localhost:5000/api/Ventas/ListarVentasFecha?fechaIni=${fechaIni}&fechafin=${fechaFin}`;
        }

        const responseVentas = await fetch(url);
        const dataVentas = await responseVentas.json();
        setVentas(dataVentas);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, [fechaIni, fechaFin]);

  const handlePdfClick = async (idventa: number) => {
    try {
      const responseDetalleVenta = await fetch(
        `http://localhost:5000/api/Ventas/listarVentaDetalleVenta?idventa=${idventa}`
      );
      const dataDetalleVenta = await responseDetalleVenta.json();
      setDetalleVenta(dataDetalleVenta);
      setSelectedVentaId(idventa);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al obtener los detalles de la venta:", error);
    }
  };

const generarPDF = () => {
  try {

    const doc = new jsPDF({
      unit: "mm",
      format: [80, 197]
    });

    const margin = 5;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica");
    doc.setTextColor(0, 0, 0);

    // DATOS DE FARMACIA
    configuracion.forEach((item) => {

      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(item.nombre, pageWidth / 2, 12, { align: "center" });

      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.text(`Direccion: ${item.direccion}`, pageWidth / 2, 16, { align: "center" });
      doc.text(`Cel: ${item.telefono}`, pageWidth / 2, 20, { align: "center" });

    });

    // NUMERO RECIBO
    doc.setFontSize(8);
    doc.text(`Recibo Nro: ${Math.floor(Math.random() * 1000000000)}`, margin, 26);

    doc.setLineWidth(0.2);
    doc.line(margin, 29, pageWidth - margin, 29);

    // FECHA
    const now = new Date();
    const fecha = now.toLocaleDateString();
    const hora = now.toLocaleTimeString();

    const selectedVenta = ventas.find(v => v.id === selectedVentaId);
    const selectedUser = usuario.find(u => u.id === selectedVenta?.idcliente);

    doc.text(`Sr(a): ${selectedUser?.nombre ?? ""}`, margin, 34);
    doc.text(`CI/NIT: ${selectedUser?.ci ?? ""}`, margin, 38);

    doc.text(`Fecha: ${fecha}`, margin, 42);
    doc.text(`${hora}`, margin + 25, 42);

    doc.line(margin, 47, pageWidth - margin, 47);

    // ENCABEZADO TABLA
    doc.setFont(undefined, "bold");

    doc.text("CANT", margin, 56);
    doc.text("PRODUCTO", margin + 15, 56);
    doc.text("P.U.", margin + 45, 56);
    doc.text("IMP.", margin + 60, 56);

    doc.setFont(undefined, "normal");

    let yPos = 63;

    // PRODUCTOS
    detalleventa.forEach((detalle) => {

      const producto = productos.find(p => p.id === detalle.idproducto);
      const nombreProducto = producto ? producto.nombre : "Producto no encontrado";

      // dividir texto largo
      const lineasProducto = doc.splitTextToSize(nombreProducto, 28);

      // primera linea
      doc.text(detalle.cantidad.toString(), margin, yPos);
      doc.text(detalle.precio.toFixed(2), margin + 45, yPos);
      doc.text(detalle.total.toFixed(2), margin + 60, yPos);

      // imprimir nombre en varias lineas
      lineasProducto.forEach((linea, index) => {
        doc.text(linea, margin + 15, yPos + (index * 5));
      });

      // aumentar espacio según cantidad de lineas
      yPos += lineasProducto.length * 5 + 2;

    });

    // LINEA TOTAL
    doc.line(margin, yPos + 4, pageWidth - margin, yPos + 4);

    yPos += 10;

    // TOTAL
    doc.setFont(undefined, "bold");
    doc.text("TOTAL:", margin + 45, yPos);
    doc.text(`${selectedVenta?.total.toFixed(2)} Bs`, margin + 60, yPos);
    doc.setFont(undefined, "normal");

    yPos += 8;

    // VENDEDOR
    doc.text(`Vendedor: ${name}`, margin, yPos);

    yPos += 6;

    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 8;

    // MENSAJE
    doc.setFontSize(8);
    doc.text("GRACIAS POR SU COMPRA", pageWidth / 2, yPos, { align: "center" });

    yPos += 5;

    doc.text("Conserve su recibo", pageWidth / 2, yPos, { align: "center" });

    // GUARDAR
    doc.save(
      `factura_${selectedUser?.nombre}_${selectedUser?.ci}_${now.toISOString().split("T")[0]}.pdf`
    );

  } catch (error) {

    console.error("Error al generar la factura:", error);

  }
};

  const filteredVentas = ventas.filter((venta) => {
    const cliente = usuario.find((user) => user.id === venta.idcliente);
    const clienteNombre = cliente
      ? `${cliente.nombre} ${cliente.ci} ${cliente.telefono || ""}`.toLowerCase()
      : "";
    const matchSearch =
      !search ||
      clienteNombre.includes(search.toLowerCase()) ||
      (venta.fecha || "").toLowerCase().includes(search.toLowerCase()) ||
      String(venta.id).includes(search);

    if (!matchSearch) return false;

    if (!filterSeguro) return true;
    if (filterSeguro === "sin_seguro") {
      return !cliente?.idseguro || cliente?.idseguro === 0;
    }
    return String(cliente?.idseguro) === String(filterSeguro);
  });

  const totalGeneral = filteredVentas.reduce(
    (sum, v) => sum + (Number(v.total) || 0),
    0
  );
  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage) || 1;
  const paginatedVentas = filteredVentas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generarExcelClientes = () => {
    try {
      const rowsExcel = filteredVentas.map((v, idx) => {
        const cliente = usuario.find((u) => u.id === v.idcliente);
        const seguroObj = cliente?.idseguro
          ? seguros.find((s) => s.id === cliente.idseguro)
          : null;
        const seguroNombre = seguroObj
          ? `${seguroObj.nombre}${seguroObj.porcentaje !== undefined ? ` (${seguroObj.porcentaje}%)` : ""}`
          : "Particular";

        return {
          "Nº": idx + 1,
          "Nº Venta": v.id,
          "Cliente": cliente ? cliente.nombre : "Desconocido",
          "CI/NIT": cliente ? cliente.ci : "S/D",
          "Teléfono": cliente ? cliente.telefono : "S/D",
          "Seguro": seguroNombre,
          "Fecha": v.fecha,
          "Total Venta (Bs)": Number(v.total).toFixed(2),
        };
      });

      const ws = XLSX.utils.json_to_sheet(rowsExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "VentasPorCliente");
      XLSX.writeFile(
        wb,
        `reporte_ventas_cliente_${fechaIni || "todas"}_${fechaFin || "todas"}.xlsx`
      );
    } catch (err) {
      console.error("Error al exportar Excel por cliente:", err);
    }
  };

  const generarPDFReporteClientes = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Barra superior
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 18, "F");

      // Logo
      try {
        doc.addImage(logo, "PNG", 14, 4, 18, 10);
      } catch (e) {}

      // Título
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("REPORTE DE VENTAS POR CLIENTE", pageWidth / 2, 12, {
        align: "center",
      });

      doc.setTextColor(0, 0, 0);

      // Datos Farmacia
      let y = 26;
      configuracion.forEach((item) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(item.nombre, 14, y);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Dirección: ${item.direccion} | Teléfono: ${item.telefono}`,
          14,
          y + 4
        );
        y += 7;
      });

      // Caja Información
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(pageWidth - 85, 22, 71, 20, 2, 2, "FD");

      const seguroFiltradoTexto =
        filterSeguro === ""
          ? "Todos los clientes"
          : filterSeguro === "sin_seguro"
          ? "Solo Particulares"
          : seguros.find((s) => String(s.id) === String(filterSeguro))?.nombre ||
            `Seguro #${filterSeguro}`;

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMACIÓN DE FILTROS", pageWidth - 50, 27, {
        align: "center",
      });
      doc.setFont("helvetica", "normal");
      doc.text(
        `Período: ${fechaIni || "Todos"} al ${fechaFin || "Todos"}`,
        pageWidth - 82,
        32
      );
      doc.text(`Filtro Seguro: ${seguroFiltradoTexto}`, pageWidth - 82, 36);
      doc.text(`Total Registros: ${filteredVentas.length}`, pageWidth - 82, 40);

      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.4);
      doc.line(14, 45, pageWidth - 14, 45);

      const tableRows = filteredVentas.map((v, idx) => {
        const cliente = usuario.find((u) => u.id === v.idcliente);
        const seguroObj = cliente?.idseguro
          ? seguros.find((s) => s.id === cliente.idseguro)
          : null;
        const seguroNombre = seguroObj
          ? `${seguroObj.nombre}${seguroObj.porcentaje !== undefined ? ` (${seguroObj.porcentaje}%)` : ""}`
          : "Particular";

        return [
          idx + 1,
          `#${v.id}`,
          cliente ? cliente.nombre : "Desconocido",
          cliente ? cliente.ci : "S/D",
          seguroNombre,
          v.fecha,
          `Bs ${Number(v.total).toFixed(2)}`,
        ];
      });

      doc.autoTable({
        head: [["#", "Nº Venta", "Cliente", "CI/NIT", "Seguro", "Fecha", "Total"]],
        body: tableRows,
        startY: 48,
        theme: "striped",
        styles: { fontSize: 8.5, halign: "center", cellPadding: 2.5 },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          2: { halign: "left" },
          6: { halign: "right", fontStyle: "bold" },
        },
      });

      let finalY = doc.lastAutoTable.finalY + 10;
      if (finalY > pageHeight - 20) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(pageWidth - 85, finalY - 4, 71, 12, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        `TOTAL GENERAL: Bs ${totalGeneral.toFixed(2)}`,
        pageWidth - 82,
        finalY + 4
      );

      doc.save(
        `reporte_ventas_cliente_${fechaIni || "todas"}_${fechaFin || "todas"}.pdf`
      );
    } catch (err) {
      console.error("Error al exportar PDF por cliente:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Está seguro de eliminar esta venta?")) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/Ventas/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setVentas((prevVentas) =>
            prevVentas.filter((venta) => venta.id !== id)
          );
        } else {
          const errorData = await response.json();
          console.error("Error al eliminar la venta:", errorData.message);
        }
      } catch (error) {
        console.error("Error en la solicitud al servidor:", error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles de Filtros y Exportación */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={fechaIni}
                onChange={(e) => setFechaIni(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Filtrar por Seguro
              </label>
              <select
                value={filterSeguro}
                onChange={(e) => setFilterSeguro(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[180px]"
              >
                <option value="">Todos los clientes / seguros</option>
                <option value="sin_seguro">Particular (Sin Seguro)</option>
                {seguros.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.porcentaje !== undefined ? `(${s.porcentaje}%)` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={generarExcelClientes}
              disabled={filteredVentas.length === 0}
              style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold shadow-md transition disabled:opacity-50 cursor-pointer hover:opacity-95"
            >
              <Download size={16} />
              <span>Excel</span>
            </button>

            <button
              onClick={generarPDFReporteClientes}
              disabled={filteredVentas.length === 0}
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold shadow-md transition disabled:opacity-50 cursor-pointer hover:opacity-95"
            >
              <FileText size={16} />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Buscador de clientes */}
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="Buscar por cliente, CI/NIT o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full bg-white border-collapse">
          <thead>
            <tr>
              <th
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                className="p-3 text-left"
              >
                Nº Venta
              </th>
              <th
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                className="p-3 text-left"
              >
                Cliente
              </th>
              <th
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                className="p-3 text-left"
              >
                CI/NIT
              </th>
              <th
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                className="p-3 text-left"
              >
                Seguro
              </th>
              <th
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                className="p-3 text-left"
              >
                Fecha
              </th>
              <th
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                className="p-3 text-right"
              >
                Total
              </th>
              <th
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                className="p-3 text-center"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedVentas.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No se encontraron ventas para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginatedVentas.map((venta) => {
                const cliente = usuario.find(
                  (user) => user.id === venta.idcliente
                );
                const seguroObj = cliente?.idseguro
                  ? seguros.find((s) => s.id === cliente.idseguro)
                  : null;

                return (
                  <tr key={venta.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold text-blue-700">
                      #{venta.id}
                    </td>
                    <td className="p-3 font-medium text-gray-800">
                      {cliente ? cliente.nombre : "Desconocido"}
                    </td>
                    <td className="p-3 text-gray-600">
                      {cliente ? cliente.ci : "Desconocido"}
                    </td>
                    <td className="p-3">
                      {cliente?.idseguro ? (
                        <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">
                          {seguroObj
                            ? `${seguroObj.nombre}${seguroObj.porcentaje !== undefined ? ` (${seguroObj.porcentaje}%)` : ""}`
                            : `Seguro #${cliente.idseguro}`}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Particular
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">{venta.fecha}</td>
                    <td className="p-3 text-right font-bold text-blue-700">
                      Bs {Number(venta.total).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          className="p-1.5 rounded-lg shadow hover:opacity-90 transition cursor-pointer"
                          onClick={() => handlePdfClick(venta.id)}
                          title="Ver detalle del recibo"
                        >
                          <FaRegEye size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg bg-red-600 text-white shadow hover:bg-red-700 transition cursor-pointer"
                          onClick={() => handleDelete(venta.id)}
                          title="Eliminar venta"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={filteredVentas.length}
          itemsPerPage={itemsPerPage}
          itemName="ventas"
        />
      </div>

      <div className="mt-2 font-bold text-lg text-gray-800">
        Total General Acumulado:{" "}
        <span className="text-blue-600">Bs {totalGeneral.toFixed(2)}</span>
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

            <div className="flex items-center gap-4 mb-6">
              <Calendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={
                  ventas.find((v) => v.id === selectedVentaId)?.fecha || ""
                }
                readOnly
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-100"
              />
            </div>

            {usuario.length > 0 && (
              <div className="flex gap-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                  <span className="text-sm text-gray-500">Cliente:</span>
                  <p className="font-medium">
                    {usuario.find(
                      (u) =>
                        u.id ===
                        ventas.find((v) => v.id === selectedVentaId)
                          ?.idcliente
                    )?.nombre || "Desconocido"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">CI/NIT:</span>
                  <p className="font-medium">
                    {usuario.find(
                      (u) =>
                        u.id ===
                        ventas.find((v) => v.id === selectedVentaId)
                          ?.idcliente
                    )?.ci || "Desconocido"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Teléfono:</span>
                  <p className="font-medium">
                    {usuario.find(
                      (u) =>
                        u.id ===
                        ventas.find((v) => v.id === selectedVentaId)
                          ?.idcliente
                    )?.telefono || "Desconocido"}
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded shadow">
                <thead>
                  <tr>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="px-6 py-3 text-left">
                      Producto
                    </th>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="px-6 py-3 text-left">
                      Cantidad
                    </th>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="px-6 py-3 text-left">Precio</th>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="px-6 py-3 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleventa.map((detalle) => {
                    const producto = productos.find(
                      (p) => p.id === detalle.idproducto
                    );
                    return (
                      <motion.tr
                        key={detalle.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          {producto
                            ? producto.nombre
                            : "Producto no encontrado"}
                        </td>
                        <td className="p-3">{detalle.cantidad}</td>
                        <td className="p-3">{detalle.precio} Bs</td>
                        <td className="p-3">{detalle.total} Bs</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-xl font-bold text-blue-600">
                {ventas.find((v) => v.id === selectedVentaId)?.total || 0} Bs
              </span>
            </div>

            <div className="mt-4 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generarPDF}
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                className="px-4 py-2 rounded-lg font-semibold transition-colors shadow-md cursor-pointer"
              >
                Imprimir Recibo PDF
              </motion.button>
            </div>
          </div>
        </motion.div>
      </Modal>
    </div>
  );
}

export default HistorialVentasCliente;