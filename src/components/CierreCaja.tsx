import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Pagination from "./Pagination";
import {
  DollarSign,
  QrCode,
  Shield,
  TrendingUp,
  Receipt,
  Package,
  Calendar,
  User,
  FileText,
  RefreshCw,
  Download,
} from "lucide-react";
import logo from "../img/logo1.png";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: any;
  }
}

interface DesgloseMetodoPago {
  tipoPago: string;
  cantidadVentas: number;
  total: number;
}

interface DesgloseSeguro {
  seguro: string;
  esSeguro: boolean;
  cantidadVentas: number;
  subtotal: number;
  descuentoTotal: number;
  totalNeto: number;
}

interface VentaCierre {
  ventaId: number;
  fecha: string;
  cliente: string;
  seguro: string;
  tipoPago: string;
  subtotal: number;
  descuentoTotal: number;
  totalVenta: number;
  cantidadItems: number;
}

interface CierreCajaData {
  fechaInicio: string;
  fechaFin: string;
  totalVentas: number;
  totalProductosVendidos: number;
  subtotalBruto: number;
  totalDescuentos: number;
  totalNetoRecaudado: number;
  costoTotalEstimado: number;
  utilidadBrutaEstimada: number;
  desglosePorMetodoPago: DesgloseMetodoPago[];
  desglosePorSeguro: DesgloseSeguro[];
  ventas: VentaCierre[];
}

interface Usuario {
  id: number;
  nombre: string;
  usuarioNombre: string;
}

interface Configuracion {
  nombre: string;
  telefono: string;
  direccion: string;
}

const CierreCaja: React.FC = () => {
  const hoyStr = new Date().toISOString().split("T")[0];
  const [fechaIni, setFechaIni] = useState(hoyStr);
  const [fechaFin, setFechaFin] = useState(hoyStr);
  const [idUsuario, setIdUsuario] = useState<string>("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([]);
  const [data, setData] = useState<CierreCajaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [fechaIni, fechaFin, idUsuario, data]);

  useEffect(() => {
    fetch("http://localhost:5000/api/Usuarios/ListarUsuariosActivos")
      .then((res) => (res.ok ? res.json() : []))
      .then((u) => setUsuarios(u))
      .catch(() => {});

    fetch("http://localhost:5000/api/Configuracions/ListarConfiguracionActivos")
      .then((res) => (res.ok ? res.json() : []))
      .then((c) => setConfiguracion(c))
      .catch(() => {});
  }, []);

  const fetchCierreCaja = async () => {
    if (!fechaIni || !fechaFin) return;
    setLoading(true);
    setError(null);

    let url = `http://localhost:5000/api/Ventas/CierreCaja?fechaIni=${fechaIni}&fechafin=${fechaFin}`;
    if (idUsuario) {
      url += `&idusuario=${idUsuario}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Error en el servidor al obtener cierre de caja (Código ${res.status})`);
      }
      const json: CierreCajaData = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error al cargar cierre de caja:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCierreCaja();
  }, [fechaIni, fechaFin, idUsuario]);

  // Cálculos de tarjetas
  const totalEfectivo =
    data?.desglosePorMetodoPago?.find((m) => m.tipoPago?.toLowerCase() === "efectivo")?.total ?? 0;

  const totalQR =
    data?.desglosePorMetodoPago?.find((m) => m.tipoPago?.toLowerCase() === "qr")?.total ?? 0;

  const porCobrarSeguros =
    data?.desglosePorSeguro
      ?.filter((s) => s.esSeguro)
      .reduce((acc, s) => acc + s.totalNeto, 0) ?? 0;

  const utilidadEstimada = data?.utilidadBrutaEstimada ?? 0;

  const generarPDFCierre = () => {
    if (!data) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Barra superior
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 20, "F");

      // Logo
      try {
        doc.addImage(logo, "PNG", 14, 5, 18, 10);
      } catch (e) {}

      // Título
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("ACTA DE CIERRE Y ARQUEO DE CAJA", pageWidth / 2, 13, { align: "center" });

      doc.setTextColor(0, 0, 0);

      // Datos Farmacia
      let y = 28;
      configuracion.forEach((c) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(c.nombre, 14, y);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.text(`Dirección: ${c.direccion} | Tel: ${c.telefono}`, 14, y + 5);
        y += 8;
      });

      // Caja Información Cierre
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(pageWidth - 85, 25, 71, 26, 2, 2, "FD");

      const cajeroNombre = idUsuario
        ? usuarios.find((u) => u.id === Number(idUsuario))?.nombre || `Usuario #${idUsuario}`
        : "Todos los Cajeros";

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DE CONCILIACIÓN", pageWidth - 50, 31, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(`Período: ${data.fechaInicio} al ${data.fechaFin}`, pageWidth - 82, 37);
      doc.text(`Cajero: ${cajeroNombre}`.substring(0, 33), pageWidth - 82, 42);
      doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth - 82, 47);

      // Línea divisora
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.5);
      doc.line(14, 55, pageWidth - 14, 55);

      // RESUMEN FINANCIERO PRINCIPAL (Tablita resumen)
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMEN DE FONDOS Y RECAUDACIÓN", 14, 63);

      doc.autoTable({
        head: [
          [
            "Dinero Físico (Efectivo)",
            "Dinero Digital (QR)",
            "Créditos / Seguros",
            "Total Neto",
            "Costo Estimado",
            "Utilidad Bruta",
          ],
        ],
        body: [
          [
            `Bs ${totalEfectivo.toFixed(2)}`,
            `Bs ${totalQR.toFixed(2)}`,
            `Bs ${porCobrarSeguros.toFixed(2)}`,
            `Bs ${data.totalNetoRecaudado.toFixed(2)}`,
            `Bs ${data.costoTotalEstimado.toFixed(2)}`,
            `Bs ${utilidadEstimada.toFixed(2)}`,
          ],
        ],
        startY: 67,
        theme: "grid",
        styles: { fontSize: 8.5, halign: "center", cellPadding: 2.5 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
      });

      let nextY = doc.lastAutoTable.finalY + 8;

      // DESGLOSE POR MÉTODO DE PAGO Y DESGLOSE POR SEGURO
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("1. DESGLOSE POR MÉTODO DE PAGO", 14, nextY);

      const rowsMetodo = (data.desglosePorMetodoPago || []).map((m) => [
        m.tipoPago,
        m.cantidadVentas,
        `Bs ${Number(m.total).toFixed(2)}`,
      ]);

      doc.autoTable({
        head: [["Método de Pago", "Cantidad de Ventas", "Total Recaudado"]],
        body: rowsMetodo,
        startY: nextY + 3,
        theme: "striped",
        styles: { fontSize: 8, halign: "center", cellPadding: 2 },
        headStyles: { fillColor: [71, 85, 105], textColor: 255 },
      });

      nextY = doc.lastAutoTable.finalY + 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("2. DESGLOSE POR SEGURO / CONVENIO", 14, nextY);

      const rowsSeguro = (data.desglosePorSeguro || []).map((s) => [
        s.seguro,
        s.esSeguro ? "Seguro / Convenio" : "Particular",
        s.cantidadVentas,
        `Bs ${Number(s.subtotal).toFixed(2)}`,
        `Bs ${Number(s.descuentoTotal).toFixed(2)}`,
        `Bs ${Number(s.totalNeto).toFixed(2)}`,
      ]);

      doc.autoTable({
        head: [["Seguro / Modalidad", "Tipo", "Ventas", "Subtotal Bruto", "Descuento", "Total Neto"]],
        body: rowsSeguro,
        startY: nextY + 3,
        theme: "striped",
        styles: { fontSize: 8, halign: "center", cellPadding: 2 },
        headStyles: { fillColor: [71, 85, 105], textColor: 255 },
      });

      nextY = doc.lastAutoTable.finalY + 8;

      // DETALLE DE VENTAS
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("3. VENTAS CONCILIADAS DE LA JORNADA", 14, nextY);

      const rowsVentas = (data.ventas || []).map((v) => [
        v.ventaId,
        v.fecha,
        v.cliente,
        v.seguro || "Particular",
        v.tipoPago,
        `Bs ${Number(v.subtotal).toFixed(2)}`,
        `Bs ${Number(v.descuentoTotal).toFixed(2)}`,
        `Bs ${Number(v.totalVenta).toFixed(2)}`,
      ]);

      doc.autoTable({
        head: [["Nº Venta", "Fecha", "Cliente", "Seguro", "Pago", "Subtotal", "Descuento", "Total"]],
        body: rowsVentas,
        startY: nextY + 3,
        theme: "grid",
        styles: { fontSize: 7.5, halign: "center", cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 },
        columnStyles: { 2: { halign: "left" } },
      });

      let finalY = doc.lastAutoTable.finalY + 22;
      if (finalY > pageHeight - 35) {
        doc.addPage();
        finalY = 30;
      }

      // Firmas de conformidad
      doc.setDrawColor(150);
      doc.setLineWidth(0.4);
      doc.line(30, finalY, 85, finalY);
      doc.line(pageWidth - 85, finalY, pageWidth - 30, finalY);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("Firma Cajero(a) / Entrega", 57.5, finalY + 5, { align: "center" });
      doc.text("Firma Administración / Recibe", pageWidth - 57.5, finalY + 5, { align: "center" });

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text("Aclaración:", 30, finalY + 10);
      doc.text("Aclaración:", pageWidth - 85, finalY + 10);

      doc.save(`cierre_caja_${data.fechaInicio}_${data.fechaFin}.pdf`);
    } catch (err) {
      console.error("Error al exportar PDF de cierre de caja:", err);
    }
  };

  const generarExcelCierre = () => {
    if (!data) return;
    try {
      const wb = XLSX.utils.book_new();

      // 1. Resumen General
      const resumenData = [
        { Concepto: "Período Inicio", Valor: data.fechaInicio },
        { Concepto: "Período Fin", Valor: data.fechaFin },
        { Concepto: "Total de Ventas Realizadas", Valor: data.totalVentas },
        { Concepto: "Total de Productos Vendidos", Valor: data.totalProductosVendidos },
        { Concepto: "Subtotal Bruto (Bs)", Valor: Number(data.subtotalBruto).toFixed(2) },
        { Concepto: "Total Descuentos Seguro (Bs)", Valor: Number(data.totalDescuentos).toFixed(2) },
        { Concepto: "Total Neto Recaudado en Caja (Bs)", Valor: Number(data.totalNetoRecaudado).toFixed(2) },
        { Concepto: "Costo de Adquisición Estimado (Bs)", Valor: Number(data.costoTotalEstimado).toFixed(2) },
        { Concepto: "Utilidad Bruta Estimada (Bs)", Valor: Number(data.utilidadBrutaEstimada).toFixed(2) },
      ];
      const wsResumen = XLSX.utils.json_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen General");

      // 2. Desglose Métodos de Pago
      const metodosData = (data.desglosePorMetodoPago || []).map((m) => ({
        "Método de Pago": m.tipoPago,
        "Cantidad de Ventas": m.cantidadVentas,
        "Total Recaudado (Bs)": Number(m.total).toFixed(2),
      }));
      const wsMetodos = XLSX.utils.json_to_sheet(metodosData);
      XLSX.utils.book_append_sheet(wb, wsMetodos, "Métodos de Pago");

      // 3. Desglose Seguros
      const segurosData = (data.desglosePorSeguro || []).map((s) => ({
        "Seguro / Convenio": s.seguro,
        Modalidad: s.esSeguro ? "Seguro / Convenio" : "Particular",
        "Cantidad de Ventas": s.cantidadVentas,
        "Subtotal Bruto (Bs)": Number(s.subtotal).toFixed(2),
        "Descuento Total (Bs)": Number(s.descuentoTotal).toFixed(2),
        "Total Neto (Bs)": Number(s.totalNeto).toFixed(2),
      }));
      const wsSeguros = XLSX.utils.json_to_sheet(segurosData);
      XLSX.utils.book_append_sheet(wb, wsSeguros, "Seguros y Convenios");

      // 4. Ventas Conciliadas
      const ventasData = (data.ventas || []).map((v) => ({
        "Nº Venta": v.ventaId,
        Fecha: v.fecha,
        Cliente: v.cliente,
        Seguro: v.seguro || "Particular",
        "Tipo Pago": v.tipoPago,
        "Ítems": v.cantidadItems,
        "Subtotal (Bs)": Number(v.subtotal).toFixed(2),
        "Descuento (Bs)": Number(v.descuentoTotal).toFixed(2),
        "Total Venta (Bs)": Number(v.totalVenta).toFixed(2),
      }));
      const wsVentas = XLSX.utils.json_to_sheet(ventasData);
      XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas Conciliadas");

      XLSX.writeFile(wb, `cierre_caja_${data.fechaInicio}_${data.fechaFin}.xlsx`);
    } catch (err) {
      console.error("Error al exportar Excel de cierre de caja:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de Filtros */}
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
                Cajero / Usuario
              </label>
              <select
                value={idUsuario}
                onChange={(e) => setIdUsuario(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[180px]"
              >
                <option value="">Todos los cajeros</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.usuarioNombre})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchCierreCaja}
              disabled={loading}
              className="mt-5 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={generarExcelCierre}
              disabled={!data || data.totalVentas === 0}
              style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold shadow-md transition disabled:opacity-50 cursor-pointer hover:opacity-95"
            >
              <Download size={16} />
              <span>Excel</span>
            </button>

            <button
              onClick={generarPDFCierre}
              disabled={!data || data.totalVentas === 0}
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold shadow-md transition disabled:opacity-50 cursor-pointer hover:opacity-95"
            >
              <FileText size={16} />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-gray-500 text-sm">Consultando y conciliando cierre de caja...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Tarjetas Principales de Arqueo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Dinero Físico en Caja */}
            <div className="bg-white p-5 rounded-xl border-l-4 border-green-500 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Efectivo en Caja
                  </p>
                  <h3 className="text-2xl font-extrabold text-green-700 mt-1">
                    Bs {totalEfectivo.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-green-600">
                  <DollarSign size={24} />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Monto en billetes y monedas que el cajero debe entregar físicamente.
              </p>
            </div>

            {/* Dinero Digital (QR) */}
            <div className="bg-white p-5 rounded-xl border-l-4 border-blue-500 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Banco / Transferencias (QR)
                  </p>
                  <h3 className="text-2xl font-extrabold text-blue-700 mt-1">
                    Bs {totalQR.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <QrCode size={24} />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Fondos acreditados directamente en la cuenta bancaria.
              </p>
            </div>

            {/* Por Cobrar a Seguros */}
            <div className="bg-white p-5 rounded-xl border-l-4 border-purple-500 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Por Cobrar a Seguros
                  </p>
                  <h3 className="text-2xl font-extrabold text-purple-700 mt-1">
                    Bs {porCobrarSeguros.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                  <Shield size={24} />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Monto facturado por convenios pendiente de liquidación.
              </p>
            </div>

            {/* Utilidad Bruta Estimada */}
            <div className="bg-white p-5 rounded-xl border-l-4 border-emerald-500 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Utilidad Bruta Estimada
                  </p>
                  <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">
                    Bs {utilidadEstimada.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <TrendingUp size={24} />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Neto: Bs {data.totalNetoRecaudado.toFixed(2)} − Costo: Bs {data.costoTotalEstimado.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Fila de Métricas Secundarias */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-gray-200 text-center">
            <div className="border-r last:border-r-0">
              <p className="text-xs text-gray-500">Tickets / Ventas</p>
              <p className="text-lg font-bold text-gray-800">{data.totalVentas}</p>
            </div>
            <div className="border-r last:border-r-0">
              <p className="text-xs text-gray-500">Productos Vendidos</p>
              <p className="text-lg font-bold text-gray-800">{data.totalProductosVendidos}</p>
            </div>
            <div className="border-r last:border-r-0">
              <p className="text-xs text-gray-500">Subtotal Bruto</p>
              <p className="text-lg font-bold text-gray-800">Bs {data.subtotalBruto.toFixed(2)}</p>
            </div>
            <div className="border-r last:border-r-0">
              <p className="text-xs text-gray-500">Descuentos Otorgados</p>
              <p className="text-lg font-bold text-red-600">-Bs {data.totalDescuentos.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold text-blue-700">Total Neto Recaudado</p>
              <p className="text-lg font-extrabold text-blue-700">Bs {data.totalNetoRecaudado.toFixed(2)}</p>
            </div>
          </div>

          {/* Tablas de Desglose */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desglose por Método de Pago */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Receipt className="text-blue-600" size={18} />
                Desglose por Método de Pago
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Método de Pago</th>
                      <th className="py-2.5 px-3 text-center">Cantidad de Ventas</th>
                      <th className="py-2.5 px-3 text-right">Total Recaudado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.desglosePorMetodoPago?.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-gray-400">
                          Sin transacciones
                        </td>
                      </tr>
                    ) : (
                      data.desglosePorMetodoPago?.map((m, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-semibold text-gray-800 flex items-center gap-2">
                            {m.tipoPago?.toLowerCase() === "efectivo" ? (
                              <DollarSign size={16} className="text-green-600" />
                            ) : (
                              <QrCode size={16} className="text-blue-600" />
                            )}
                            {m.tipoPago}
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-600">
                            {m.cantidadVentas}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                            Bs {Number(m.total).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Desglose por Seguro */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Shield className="text-purple-600" size={18} />
                Desglose por Seguro / Convenio
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Seguro</th>
                      <th className="py-2.5 px-3 text-center">Ventas</th>
                      <th className="py-2.5 px-3 text-right">Descuento</th>
                      <th className="py-2.5 px-3 text-right">Total Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.desglosePorSeguro?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-400">
                          Sin registros
                        </td>
                      </tr>
                    ) : (
                      data.desglosePorSeguro?.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-semibold text-gray-800">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs mr-1.5 font-bold ${
                                s.esSeguro
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {s.seguro}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-600">
                            {s.cantidadVentas}
                          </td>
                          <td className="py-2.5 px-3 text-right text-red-600 font-medium">
                            {s.descuentoTotal > 0 ? `-Bs ${Number(s.descuentoTotal).toFixed(2)}` : "Bs 0.00"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                            Bs {Number(s.totalNeto).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Listado de Ventas de la Caja */}
          {(() => {
            const totalPages =
              Math.ceil((data.ventas?.length || 0) / itemsPerPage) || 1;
            const paginatedVentas = (data.ventas || []).slice(
              (currentPage - 1) * itemsPerPage,
              currentPage * itemsPerPage
            );

            return (
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="text-blue-600" size={18} />
                    Ventas Conciliadas ({data.ventas?.length || 0})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          className="py-2.5 px-3 text-left"
                        >
                          Nº Venta
                        </th>
                        <th
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          className="py-2.5 px-3 text-left"
                        >
                          Fecha
                        </th>
                        <th
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          className="py-2.5 px-3 text-left"
                        >
                          Cliente
                        </th>
                        <th
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          className="py-2.5 px-3 text-left"
                        >
                          Seguro
                        </th>
                        <th
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          className="py-2.5 px-3 text-center"
                        >
                          Tipo Pago
                        </th>
                        <th
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          className="py-2.5 px-3 text-center"
                        >
                          Ítems
                        </th>
                        <th
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          className="py-2.5 px-3 text-right"
                        >
                          Subtotal
                        </th>
                        <th
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          className="py-2.5 px-3 text-right"
                        >
                          Descuento
                        </th>
                        <th
                          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                          className="py-2.5 px-3 text-right"
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedVentas.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="py-6 text-center text-gray-400"
                          >
                            No se registraron ventas en el período seleccionado.
                          </td>
                        </tr>
                      ) : (
                        paginatedVentas.map((v) => (
                          <tr
                            key={v.ventaId}
                            className="hover:bg-gray-50 border-b"
                          >
                            <td className="py-2 px-3 font-semibold text-blue-700">
                              #{v.ventaId}
                            </td>
                            <td className="py-2 px-3 text-gray-600">
                              {v.fecha}
                            </td>
                            <td className="py-2 px-3 font-medium text-gray-800">
                              {v.cliente}
                            </td>
                            <td className="py-2 px-3">
                              {v.seguro && v.seguro !== "Particular" ? (
                                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-semibold border border-purple-200">
                                  {v.seguro}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs italic">
                                  Particular
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                  v.tipoPago === "Efectivo"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {v.tipoPago}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center text-gray-600 font-medium">
                              {v.cantidadItems}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-600">
                              Bs {Number(v.subtotal).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right text-red-600 font-medium">
                              {v.descuentoTotal > 0
                                ? `-Bs ${Number(v.descuentoTotal).toFixed(2)}`
                                : "Bs 0.00"}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-gray-900">
                              Bs {Number(v.totalVenta).toFixed(2)}
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
                  totalItems={data.ventas?.length || 0}
                  itemsPerPage={itemsPerPage}
                  itemName="ventas"
                />
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default CierreCaja;
