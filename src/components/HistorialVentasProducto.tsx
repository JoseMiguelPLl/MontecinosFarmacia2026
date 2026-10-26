import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { ShoppingCart, Calendar, Search, FileText, Download, RefreshCw, Eye } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Modal from "./Modal";
import Pagination from "./Pagination";
import logo from "../img/logo1.png";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: any;
  }
}

interface VentaDetalleItem {
  ventaId: number;
  fecha: string;
  cliente: string;
  seguro: string;
  tipoPago: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  total: number;
  tieneDescuento: boolean;
}

interface ReporteProductoItem {
  productoId: number;
  codigo: string;
  nombre: string;
  nombreGenerico: string;
  lote: string;
  vencimiento: string;
  fechaPublicacion?: string | null;
  presentacion: string;
  laboratorio: string;
  precioParticular: number;
  cantidadSinDescuento: number;
  totalSinDescuento: number;
  cantidadConDescuento: number;
  descuentoTotal: number;
  totalConDescuento: number;
  segurosInvolucrados: string[];
  cantidadTotalVendida: number;
  subtotalBruto: number;
  descuentoTotalConsolidado: number;
  totalNetoConsolidado: number;
  ventasDetalle: VentaDetalleItem[];
}

interface Seguro {
  id: number;
  nombre: string;
  porcentaje?: number;
  estado?: string;
}

interface Configuracion {
  nombre: string;
  telefono: string;
  direccion: string;
}

const formatearFecha = (fechaStr: string | null | undefined): string => {
  if (!fechaStr) return "S/D";
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  } catch {
    return fechaStr;
  }
};

const HistorialVentasProducto: React.FC = () => {
  const hoy = new Date().toISOString().split("T")[0];
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [fechaIni, setFechaIni] = useState<string>(primerDiaMes);
  const [fechaFin, setFechaFin] = useState<string>(hoy);
  const [idSeguro, setIdSeguro] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [reporte, setReporte] = useState<ReporteProductoItem[]>([]);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal para detalle de ventas del producto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<ReporteProductoItem | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [fechaIni, fechaFin, idSeguro, searchTerm]);

  useEffect(() => {
    fetch("http://localhost:5000/api/Seguros/ListarSegurosActivos")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSeguros(data))
      .catch(() => {});

    fetch("http://localhost:5000/api/Configuracions/ListarConfiguracionActivos")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setConfiguracion(data))
      .catch(() => {});
  }, []);

  const fetchReporte = async () => {
    if (!fechaIni || !fechaFin) return;
    setLoading(true);
    setError(null);

    let url = `http://localhost:5000/api/Ventas/ReporteVentasPorProducto?fechaIni=${fechaIni}&fechafin=${fechaFin}`;
    if (idSeguro !== "") {
      url += `&idseguro=${idSeguro}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Error al obtener reporte por producto (${res.status})`);
      }
      const data: ReporteProductoItem[] = await res.json();
      setReporte(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar reporte de ventas por producto:", err);
      setError(err instanceof Error ? err.message : "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
  }, [fechaIni, fechaFin, idSeguro]);

  // Filtrado local por buscador
  const filteredReporte = reporte.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (p.nombre && p.nombre.toLowerCase().includes(term)) ||
      (p.nombreGenerico && p.nombreGenerico.toLowerCase().includes(term)) ||
      (p.codigo && p.codigo.toLowerCase().includes(term)) ||
      (p.lote && p.lote.toLowerCase().includes(term)) ||
      (p.laboratorio && p.laboratorio.toLowerCase().includes(term))
    );
  });

  // Totales generales
  const totalCantidadVendida = filteredReporte.reduce(
    (acc, p) => acc + (p.cantidadTotalVendida || 0),
    0
  );
  const totalSubtotalBruto = filteredReporte.reduce(
    (acc, p) => acc + (p.subtotalBruto || 0),
    0
  );
  const totalDescuentosConsolidados = filteredReporte.reduce(
    (acc, p) => acc + (p.descuentoTotalConsolidado || 0),
    0
  );
  const totalNetoRecaudado = filteredReporte.reduce(
    (acc, p) => acc + (p.totalNetoConsolidado || 0),
    0
  );

  const handleOpenDetalle = (item: ReporteProductoItem) => {
    setSelectedProducto(item);
    setIsModalOpen(true);
  };

  // --- EXPORTAR A PDF ---
  const generarPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
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
      doc.text("REPORTE DE VENTAS POR PRODUCTO Y SEGURO", pageWidth / 2, 12, {
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
        doc.text(`Dirección: ${item.direccion} | Teléfono: ${item.telefono}`, 14, y + 4);
        y += 7;
      });

      // Caja Información
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(pageWidth - 85, 22, 71, 20, 2, 2, "FD");

      const seguroFiltradoTexto =
        idSeguro === ""
          ? "Todos los clientes"
          : idSeguro === "0"
          ? "Solo Particulares"
          : seguros.find((s) => s.id === Number(idSeguro))?.nombre || `Seguro #${idSeguro}`;

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMACIÓN DE FILTROS", pageWidth - 50, 27, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(`Período: ${fechaIni} al ${fechaFin}`, pageWidth - 82, 32);
      doc.text(`Filtro Seguro: ${seguroFiltradoTexto}`, pageWidth - 82, 36);
      doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth - 82, 40);

      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.4);
      doc.line(14, 45, pageWidth - 14, 45);

      // Tabla Formateada con desglose por producto
      const tableRows: any[] = [];

      filteredReporte.forEach((p, idx) => {
        const bloqueParticular =
          p.cantidadSinDescuento > 0
            ? `Particular: ${p.cantidadSinDescuento} u. × Bs ${Number(p.precioParticular).toFixed(2)} = Bs ${Number(p.totalSinDescuento).toFixed(2)}`
            : "Particular: 0 u. (Bs 0.00)";

        const bloqueSeguro =
          p.cantidadConDescuento > 0
            ? `Seguro [${p.segurosInvolucrados?.join(", ") || "Convenio"}]: ${p.cantidadConDescuento} u. × Bs ${Number(p.precioParticular).toFixed(2)} (Desc: -Bs ${Number(p.descuentoTotal).toFixed(2)}) = Bs ${Number(p.totalConDescuento).toFixed(2)}`
            : "Seguro: 0 u. (Bs 0.00)";

        tableRows.push([
          idx + 1,
          `${p.nombre}\nLote: ${p.lote || "S/D"} | Vence: ${p.vencimiento || "S/D"}`,
          `${p.presentacion || "S/D"}\n${p.laboratorio || "S/D"}`,
          `Bs ${Number(p.precioParticular).toFixed(2)}`,
          bloqueParticular,
          bloqueSeguro,
          `${p.cantidadTotalVendida} u.`,
          p.descuentoTotalConsolidado > 0
            ? `-Bs ${Number(p.descuentoTotalConsolidado).toFixed(2)}`
            : "Bs 0.00",
          `Bs ${Number(p.totalNetoConsolidado).toFixed(2)}`,
        ]);
      });

      doc.autoTable({
        head: [
          [
            "#",
            "Producto / Lote / Vencimiento",
            "Presentación / Laboratorio",
            "P. Normal",
            "Ventas Particulares (Sin Descuento)",
            "Ventas Seguro (Con Descuento)",
            "Cant. Total",
            "Desc. Total",
            "Total Neto",
          ],
        ],
        body: tableRows,
        startY: 48,
        theme: "grid",
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center" },
          1: { halign: "left" },
          2: { halign: "left" },
          3: { halign: "center" },
          4: { halign: "left" },
          5: { halign: "left" },
          6: { halign: "center", fontStyle: "bold" },
          7: { halign: "right", textColor: [185, 28, 28] },
          8: { halign: "right", fontStyle: "bold", textColor: [30, 64, 175] },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      // Total General al pie
      let finalY = doc.lastAutoTable.finalY + 8;
      if (finalY > pageHeight - 25) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(pageWidth - 110, finalY - 4, 96, 16, "F");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total Unidades: ${totalCantidadVendida} u. | Descuentos: -Bs ${totalDescuentosConsolidados.toFixed(2)}`,
        pageWidth - 105,
        finalY + 2
      );
      doc.setFontSize(11);
      doc.text(
        `TOTAL NETO GENERAL: Bs ${totalNetoRecaudado.toFixed(2)}`,
        pageWidth - 105,
        finalY + 8
      );

      doc.save(`reporte_ventas_producto_${fechaIni}_${fechaFin}.pdf`);
    } catch (err) {
      console.error("Error al exportar PDF por producto:", err);
    }
  };

  // --- EXPORTAR A EXCEL (.XLSX) ---
  const generarExcel = () => {
    try {
      const rowsExcel = filteredReporte.map((p, idx) => ({
        "Nº": idx + 1,
        "Código": p.codigo || "S/D",
        "Producto": p.nombre,
        "Nombre Genérico": p.nombreGenerico || "",
        "Presentación": p.presentacion || "",
        "Laboratorio": p.laboratorio || "",
        "Lote": p.lote || "S/D",
        "Vencimiento": p.vencimiento || "S/D",
        "Fecha Registro": formatearFecha(p.fechaPublicacion),
        "Precio Particular": Number(p.precioParticular).toFixed(2),
        "Cant. Particular": p.cantidadSinDescuento,
        "Total Particular (Bs)": Number(p.totalSinDescuento).toFixed(2),
        "Cant. Seguro": p.cantidadConDescuento,
        "Descuento Seguro (Bs)": Number(p.descuentoTotal).toFixed(2),
        "Total Seguro (Bs)": Number(p.totalConDescuento).toFixed(2),
        "Seguros Involucrados": p.segurosInvolucrados?.join(", ") || "Ninguno",
        "Cantidad Total Vendida": p.cantidadTotalVendida,
        "Subtotal Bruto (Bs)": Number(p.subtotalBruto).toFixed(2),
        "Descuento Consolidado (Bs)": Number(p.descuentoTotalConsolidado).toFixed(2),
        "Total Neto Consolidado (Bs)": Number(p.totalNetoConsolidado).toFixed(2),
      }));

      const ws = XLSX.utils.json_to_sheet(rowsExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "VentasPorProducto");

      XLSX.writeFile(wb, `reporte_ventas_producto_${fechaIni}_${fechaFin}.xlsx`);
    } catch (err) {
      console.error("Error al exportar Excel por producto:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de Filtro */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaIni}
                onChange={(e) => setFechaIni(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Filtrar por Seguro
              </label>
              <select
                value={idSeguro}
                onChange={(e) => setIdSeguro(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[170px]"
              >
                <option value="">Todos los clientes / seguros</option>
                <option value="0">Particular (Sin Seguro)</option>
                {seguros.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.porcentaje ? `(${s.porcentaje}%)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchReporte}
              disabled={loading}
              className="mt-5 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={generarExcel}
              disabled={filteredReporte.length === 0}
              style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold shadow-md transition disabled:opacity-50 cursor-pointer hover:opacity-95"
            >
              <Download size={16} />
              <span>Excel</span>
            </button>

            <button
              onClick={generarPDF}
              disabled={filteredReporte.length === 0}
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold shadow-md transition disabled:opacity-50 cursor-pointer hover:opacity-95"
            >
              <FileText size={16} />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Buscador de medicamentos */}
        <div className="mt-3 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar medicamento por nombre, genérico, lote o laboratorio..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {loading && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-gray-500 text-sm">Cargando reporte consolidado por producto...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Tarjetas Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-medium">Medicamentos Distintos</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{filteredReporte.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-medium">Unidades Vendidas</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{totalCantidadVendida} u.</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-medium">Descuentos Seguro</p>
              <p className="text-xl font-bold text-red-600 mt-1">
                -Bs {totalDescuentosConsolidados.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold text-blue-700">Total Neto Recaudado</p>
              <p className="text-xl font-extrabold text-blue-700 mt-1">
                Bs {totalNetoRecaudado.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Tabla de Productos con Bloques Diferenciados */}
          {(() => {
            const totalPages = Math.ceil(filteredReporte.length / itemsPerPage) || 1;
            const paginatedReporte = filteredReporte.slice(
              (currentPage - 1) * itemsPerPage,
              currentPage * itemsPerPage
            );

            return (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="py-3 px-3 text-left">Producto / Detalle</th>
                        <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="py-3 px-3 text-center">Lote / Vencimiento</th>
                        <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="py-3 px-3 text-left">Ventas Particulares (Sin Desc.)</th>
                        <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="py-3 px-3 text-left">Ventas Convenio (Con Desc.)</th>
                        <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="py-3 px-3 text-right">Total Consolidado</th>
                        <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="py-3 px-3 text-center">Detalle</th>
                      </tr>
                    </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedReporte.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No se registraron ventas de productos en este período.
                      </td>
                    </tr>
                  ) : (
                    paginatedReporte.map((p) => (
                      <tr key={p.productoId} className="hover:bg-gray-50">
                        {/* Producto */}
                        <td className="py-3 px-3">
                          <p className="font-bold text-gray-900">{p.nombre}</p>
                          <div className="text-xs text-gray-500 space-x-1">
                            <span>{p.presentacion || "S/D"}</span>
                            <span>•</span>
                            <span className="font-medium text-gray-700">{p.laboratorio || "S/D"}</span>
                          </div>
                          {p.codigo && p.codigo !== "S/D" && (
                            <span className="text-[11px] text-gray-400 font-mono">
                              Cód: {p.codigo}
                            </span>
                          )}
                        </td>

                        {/* Lote / Vencimiento */}
                        <td className="py-3 px-3 text-center text-xs">
                          <p className="font-medium text-gray-800">
                            Lote: <span className="font-bold">{p.lote || "S/D"}</span>
                          </p>
                          <p className="text-gray-500 mt-0.5">
                            Vence: <span className="font-semibold text-blue-700">{p.vencimiento || "S/D"}</span>
                          </p>
                          {p.fechaPublicacion && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Reg: {formatearFecha(p.fechaPublicacion)}
                            </p>
                          )}
                        </td>

                        {/* Ventas Particulares (Sin Descuento) */}
                        <td className="py-3 px-3 text-xs bg-gray-50/50">
                          {p.cantidadSinDescuento > 0 ? (
                            <div>
                              <p className="font-bold text-gray-800">
                                {p.cantidadSinDescuento} u. × Bs {Number(p.precioParticular).toFixed(2)}
                              </p>
                              <p className="text-gray-600 font-semibold mt-0.5">
                                Total: Bs {Number(p.totalSinDescuento).toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">0 u. (Bs 0.00)</span>
                          )}
                        </td>

                        {/* Ventas Seguro (Con Descuento) */}
                        <td className="py-3 px-3 text-xs bg-blue-50/30">
                          {p.cantidadConDescuento > 0 ? (
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-blue-900">
                                  {p.cantidadConDescuento} u.
                                </span>
                                {p.segurosInvolucrados?.map((seg, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[10px] font-bold border border-purple-200"
                                  >
                                    {seg}
                                  </span>
                                ))}
                              </div>
                              <p className="text-red-600 font-semibold mt-0.5">
                                Descuento: -Bs {Number(p.descuentoTotal).toFixed(2)}
                              </p>
                              <p className="font-bold text-gray-900 mt-0.5">
                                Total: Bs {Number(p.totalConDescuento).toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">0 u. (Bs 0.00)</span>
                          )}
                        </td>

                        {/* Total Consolidado */}
                        <td className="py-3 px-3 text-right">
                          <p className="text-base font-extrabold text-blue-700">
                            Bs {Number(p.totalNetoConsolidado).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 font-bold mt-0.5">
                            {p.cantidadTotalVendida} unidades
                          </p>
                          {p.descuentoTotalConsolidado > 0 && (
                            <p className="text-[11px] text-red-600 font-medium">
                              Ahorro: -Bs {Number(p.descuentoTotalConsolidado).toFixed(2)}
                            </p>
                          )}
                        </td>

                        {/* Detalle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleOpenDetalle(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver ventas individuales de este producto"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              totalItems={filteredReporte.length}
              itemsPerPage={itemsPerPage}
              itemName="productos"
            />
          </div>
        );
      })()}
    </>
  )}

      {/* Modal de Detalle de Ventas del Producto */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedProducto && (
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-lg font-bold text-blue-700">
                {selectedProducto.nombre}
              </h3>
              <p className="text-xs text-gray-500">
                Lote: {selectedProducto.lote || "S/D"} • Vencimiento: {selectedProducto.vencimiento || "S/D"} • Laboratorio: {selectedProducto.laboratorio || "S/D"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg text-center text-xs">
              <div>
                <p className="text-gray-500 font-medium">Total Unidades</p>
                <p className="text-base font-bold text-gray-800 mt-0.5">
                  {selectedProducto.cantidadTotalVendida} u.
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Descuentos Seguro</p>
                <p className="text-base font-bold text-red-600 mt-0.5">
                  -Bs {Number(selectedProducto.descuentoTotalConsolidado).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Total Neto</p>
                <p className="text-base font-extrabold text-blue-700 mt-0.5">
                  Bs {Number(selectedProducto.totalNetoConsolidado).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-2 text-left">Nº Venta</th>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-2 text-left">Fecha</th>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-2 text-left">Cliente</th>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-2 text-left">Seguro</th>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-2 text-center">Cant.</th>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-2 text-center">P. Unitario</th>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-2 text-center">Descuento</th>
                    <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedProducto.ventasDetalle?.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 font-semibold text-blue-700">#{v.ventaId}</td>
                      <td className="p-2 text-gray-600">{v.fecha}</td>
                      <td className="p-2 font-medium">{v.cliente}</td>
                      <td className="p-2">
                        {v.seguro && v.seguro !== "Particular" ? (
                          <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {v.seguro}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Particular</span>
                        )}
                      </td>
                      <td className="p-2 text-center font-bold">{v.cantidad}</td>
                      <td className="p-2 text-center">Bs {Number(v.precioUnitario).toFixed(2)}</td>
                      <td className="p-2 text-center text-red-600 font-medium">
                        {v.descuento > 0 ? `-Bs ${Number(v.descuento).toFixed(2)}` : "Bs 0.00"}
                      </td>
                      <td className="p-2 text-right font-bold text-gray-900">
                        Bs {Number(v.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HistorialVentasProducto;
