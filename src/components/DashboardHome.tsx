import React, { useState, useEffect } from "react";
import moment from 'moment';
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { FaFilePdf, FaFileExcel } from "react-icons/fa6";
import logo from "../img/logo1.png";
import {
  Users,
  Users2,
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown,
  TrendingDown,
  Activity,
  Filter,
  List,
  PieChart as PieIcon
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import NavBarRoot from "./NavBarRoot";
import "./DashboardHome.css";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: any;
  }
}

interface Product {
  id: number;
  codigo: string;
  nombre: string;
  vencimiento: string;
  idtipo: number;
  idpresentacion: number;
  precio: number;
  stock: number;
  presentacionNombre?: string;
  laboratorioNombre?: string;
  precio_compra?: number;
  fecha?: string | null;
}

interface Tipo {
  id: number;
  nombre: string;
}

interface Presentaciones {
  id: number;
  nombre: string;
  nombreCorto: string;
}

interface Laboratorio {
  id: number;
  nombre: string;
}

interface Configuracion {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
}

interface ProductoProximoAVencer {
  id: number;
  nombre: string;
  laboratorio: string;
  presentacion: string;
  fechaVencimiento: string;
  diasParaVencer: number;
  estado: 'vencido' | 'urgente' | 'precaucion' | 'proximo';
}

type Trend = 'up' | 'down' | 'neutral';

interface MetricCard {
  id: string;
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend: Trend;
  trendValue: number;
  description: string;
}

interface StatItem {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend: Trend;
  trendValue: number;
  description: string;
}

interface ProductoMasVendido {
  nombre: string;
  totalVendido: number;
  presentacionNombre?: string;
  laboratorioNombre?: string;
}

const DashboardHome: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [usuariosActivos, setUsuariosActivos] = useState(0);
  const [clientes, setClientes] = useState(0);
  const [productos, setProductos] = useState(0);
  const [ventas, setVentas] = useState(0);
  const [tipo, setTipo] = useState<Tipo[]>([]);
  const [presentacion, setPresentacion] = useState<Presentaciones[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([]);
  const [productosConMenorStock, setProductosConMenorStock] = useState<Product[]>([]);
  const [masVendidosData, setMasVendidosData] = useState<ProductoMasVendido[]>([]);
  const [ingresosMensuales, setIngresosMensuales] = useState<{ mes: string; total: number }[]>([]);
  const [productosProximosAVencer, setProductosProximosAVencer] = useState<ProductoProximoAVencer[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoadingIngresos, setIsLoadingIngresos] = useState<boolean>(false);

  // Estados nuevos para la paginación y filtros de la tabla de vencimientos
  const [filtroVencimiento, setFiltroVencimiento] = useState<'todos' | 'vencidos' | 'proximos'>('todos');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Estados para alternar vista Gráfico / Lista en Stock Mínimo y Más Vendidos
  const [vistaStockMinimo, setVistaStockMinimo] = useState<'grafico' | 'lista'>('grafico');
  const [vistaMasVendidos, setVistaMasVendidos] = useState<'grafico' | 'lista'>('grafico');

  // Función para obtener ingresos mensuales por año
  const fetchIngresosMensuales = async (year: number) => {
    setIsLoadingIngresos(true);
    try {
      const response = await fetch(`http://localhost:5000/api/Ventas/SumarTotalesPorMes?anio=${year}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transformar los datos para que coincidan con la estructura esperada
      const transformedData = Object.keys(data).map((mes) => ({
        mes: mes,
        total: data[mes],
      }));

      setIngresosMensuales(transformedData);
    } catch (error) {
      console.error("Error al obtener ingresos mensuales:", error);
    } finally {
      setIsLoadingIngresos(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener ingresos mensuales del año actual
        await fetchIngresosMensuales(selectedYear);

        // Obtener productos activos
        const responseProductos = await fetch("http://localhost:5000/api/Productos/ListarProductosActivos");
        const dataProductos = await responseProductos.json();
        setProductos(dataProductos.length);

        // Obtener tipos de productos
        const responseTipo = await fetch("http://localhost:5000/api/Tipos/ListarTiposActivos");
        const dataTipo = await responseTipo.json();
        setTipo(dataTipo);

        // Obtener presentaciones
        const responsePresentacion = await fetch("http://localhost:5000/api/Presentaciones");
        const dataPresentacion = await responsePresentacion.json();
        setPresentacion(dataPresentacion);

        // Obtener laboratorios
        const responseLaboratorios = await fetch("http://localhost:5000/api/Laboratorios");
        const dataLaboratorios = await responseLaboratorios.json();
        setLaboratorios(dataLaboratorios);

        // Obtener usuarios activos
        const responseUsuarios = await fetch("http://localhost:5000/api/Usuarios/ListarUsuariosActivos");
        const dataUsuarios = await responseUsuarios.json();
        setUsuariosActivos(dataUsuarios.length);

        // Obtener clientes activos
        const responseClientes = await fetch("http://localhost:5000/api/Clientes/ListarClientesActivos");
        const dataClientes = await responseClientes.json();
        setClientes(dataClientes.length);

        // Obtener ventas activas
        const responseVentas = await fetch("http://localhost:5000/api/Ventas/ListarVentasActivos");
        const dataVentas = await responseVentas.json();
        setVentas(dataVentas.length);

        // Obtener productos con menor stock
        const responseMenorStock = await fetch("http://localhost:5000/api/Productos/listarProductosConMenorStockHome");
        const dataMenorStock = await responseMenorStock.json();
        setProductosConMenorStock(dataMenorStock);

        // Obtener productos más vendidos
        const responseMasVendidos = await fetch("http://localhost:5000/api/Detalle_Ventas/ProductosMasVendidos");
        const dataMasVendidos = await responseMasVendidos.json();
        setMasVendidosData(dataMasVendidos);

        // Obtener productos próximos a vencer
        const responseProximosAVencer = await fetch("http://localhost:5000/api/Productos/ProductosProximosAVencer");
        const dataProximosAVencer = await responseProximosAVencer.json();
        setProductosProximosAVencer(dataProximosAVencer);

        // Obtener configuración de la farmacia
        try {
          const responseConfig = await fetch("http://localhost:5000/api/Configuracions/ListarConfiguracionActivos");
          if (responseConfig.ok) {
            const dataConfig = await responseConfig.json();
            setConfiguracion(dataConfig);
          }
        } catch (configError) {
          console.error("Error al obtener configuración:", configError);
        }

      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler para cambiar el año
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    setSelectedYear(year);
    fetchIngresosMensuales(year);
  };

  const stockMinimoData = productosConMenorStock.slice(0, 8).map((producto) => ({
    name: `${producto.nombre}`,
    value: producto.stock,
    presentacion: producto.presentacionNombre,
    laboratorio: producto.laboratorioNombre
  }));

  const masVendidosChartData = masVendidosData.slice(0, 8).map((producto) => ({
    name: `${producto.nombre}`,
    value: producto.totalVendido,
    presentacion: producto.presentacionNombre,
    laboratorio: producto.laboratorioNombre
  }));

  // Actualizar el reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear la hora
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const now = moment().format('DD [de] MMMM [de] YYYY');

  // Generar opciones de años (desde 2020 hasta el año actual + 1)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years;
  };

  const yearOptions = generateYearOptions();

  // Estadísticas con datos de tendencia
  const stats: StatItem[] = [
    {
      title: "Usuarios Activos",
      value: usuariosActivos,
      icon: Users,
      color: "blue",
      trend: 'up',
      trendValue: 12,
      description: "Personal autorizado"
    },
    {
      title: "Clientes Registrados",
      value: clientes,
      icon: Users2,
      color: "blue",
      trend: 'up',
      trendValue: 24,
      description: "Clientes frecuentes"
    },
    {
      title: "Productos en Stock",
      value: productos,
      icon: Package,
      color: "blue",
      trend: 'down',
      trendValue: 5,
      description: "Inventario actual"
    },
    {
      title: "Ventas Totales",
      value: ventas,
      icon: ShoppingCart,
      color: "blue",
      trend: 'up',
      trendValue: 42,
      description: "Este mes"
    },
  ];

  // Obtener el nombre del usuario desde localStorage
  const name = localStorage.getItem("userName");

  // Colores para gráficos
  const COLORS = [
    '#F38C14','#F74816' ,'#CBD803', '#C000A5'
  ];

  const renderTrendIcon = (trend: Trend, value: number) => {
    if (trend === 'up') {
      return (
        <div className="flex items-center text-green-500">
          <ArrowUp className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">{value}%</span>
        </div>
      );
    } else if (trend === 'down') {
      return (
        <div className="flex items-center text-red-500">
          <ArrowDown className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">{value}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-gray-500">
        <Activity className="h-4 w-4 mr-1" />
        <span className="text-xs font-medium">0%</span>
      </div>
    );
  };

  // Función para obtener el color según el estado de vencimiento
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Crítico':
        return 'text-red-600 font-bold';
      case 'Advertencia':
        return 'text-yellow-600 font-semibold';
      default:
        return 'text-green-600';
    }
  };

  // Tooltip personalizado para mostrar presentación y laboratorio
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-bold">{payload[0].payload.name}</p>
          <p className="text-sm">Presentación: {payload[0].payload.presentacion}</p>
          <p className="text-sm">Laboratorio: {payload[0].payload.laboratorio}</p>
          <p className="text-sm">
            {payload[0].name === 'value' ? 'Stock: ' : 'Vendidos: '}
            {payload[0].value} unidades
          </p>
        </div>
      );
    }
    return null;
  };

  // LÓGICA DE FILTRADO Y PAGINACIÓN PARA PRODUCTOS PRÓXIMOS A VENCER
  const productosFiltrados = productosProximosAVencer.filter((producto) => {
    if (filtroVencimiento === 'vencidos') {
      return producto.diasParaVencer <= 0;
    }
    if (filtroVencimiento === 'proximos') {
      return producto.diasParaVencer > 0;
    }
    return true; // 'todos'
  });

  const totalPages = Math.ceil(productosFiltrados.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProductos = productosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (nuevoFiltro: 'todos' | 'vencidos' | 'proximos') => {
    setFiltroVencimiento(nuevoFiltro);
    setCurrentPage(1); // Resetear a la primera página al cambiar filtro
  };

  // Función para exportar a PDF con el diseño del Historial de Ventas
  const generarPDF = () => {
    if (productosFiltrados.length === 0) {
      alert("No hay productos para exportar en el listado seleccionado.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 🔵 Barra superior azul
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 20, "F");

    // 🔵 LOGO
    try {
      doc.addImage(logo, "PNG", 14, 5, 18, 10);
    } catch (e) {
      console.error("Error al cargar logo:", e);
    }

    // 🔵 Título del Reporte según el filtro seleccionado
    let tituloReporte = "REPORTE DE PRODUCTOS PRÓXIMOS A VENCER";
    let filtroNombre = "Todos";
    if (filtroVencimiento === "vencidos") {
      tituloReporte = "REPORTE DE PRODUCTOS VENCIDOS";
      filtroNombre = "Solo Vencidos";
    } else if (filtroVencimiento === "proximos") {
      tituloReporte = "REPORTE DE PRODUCTOS PRÓXIMOS A VENCER";
      filtroNombre = "Próximos a Vencer";
    } else {
      tituloReporte = "REPORTE GENERAL DE VENCIMIENTO DE PRODUCTOS";
      filtroNombre = "Ver Todos";
    }

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(tituloReporte, pageWidth / 2, 13, {
      align: "center",
    });

    doc.setTextColor(0, 0, 0);

    // 🏥 DATOS DE LA FARMACIA
    let y = 30;

    if (configuracion && configuracion.length > 0) {
      configuracion.forEach((item) => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(item.nombre || "FARMACIA", 14, y);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Dirección: ${item.direccion || "Central"}`, 14, y + 6);
        doc.text(`Teléfono: ${item.telefono || "-"}`, 14, y + 11);
      });
    } else {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("FARMACIA", 14, y);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Dirección: Central", 14, y + 6);
      doc.text("Teléfono: -", 14, y + 11);
    }

    // 📅 CAJA DE INFORMACIÓN
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200);
    doc.roundedRect(pageWidth - 75, 28, 60, 22, 3, 3, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN", pageWidth - 45, 34, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.text(`Filtro: ${filtroNombre}`, pageWidth - 70, 40);
    doc.text(`Fecha: ${moment().format("DD/MM/YYYY")}`, pageWidth - 70, 45);

    // Línea separadora
    doc.setDrawColor(41, 128, 185);
    doc.line(14, 55, pageWidth - 14, 55);

    // TITULO TABLA
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DE MEDICAMENTOS Y VENCIMIENTOS", 14, 65);

    const tableColumn = [
      "#",
      "Producto",
      "Laboratorio",
      "Presentación",
      "F. Vencimiento",
      "Días Restantes",
      "Estado",
    ];

    const tableRows = productosFiltrados.map((p, index) => [
      index + 1,
      p.nombre,
      p.laboratorio,
      p.presentacion,
      moment(p.fechaVencimiento).format("DD/MM/YYYY"),
      p.diasParaVencer <= 0 ? `Vencido (${Math.abs(p.diasParaVencer)})` : `${p.diasParaVencer} días`,
      p.estado,
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
        1: { halign: "left" },
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    // 💰 RESUMEN TOTAL DE ITEMS
    let finalY = doc.lastAutoTable.finalY + 12;

    // Verificar si hay espacio en la página
    if (finalY > pageHeight - 30) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 85, finalY - 6, 70, 15, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PRODUCTOS:", pageWidth - 80, finalY + 4);

    doc.setFont("helvetica", "normal");
    doc.text(
      `${productosFiltrados.length}`,
      pageWidth - 20,
      finalY + 4,
      { align: "right" }
    );

    // 📄 PIE DE PÁGINA
    doc.setFontSize(8);
    doc.setTextColor(120);

    doc.text("Sistema de Gestion Farmaceutica", 14, pageHeight - 10);

    doc.text(
      `Generado: ${new Date().toLocaleString()}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: "right" }
    );

    const fechaStr = moment().format("YYYY-MM-DD");
    doc.save(`reporte_vencimientos_${filtroVencimiento}_${fechaStr}.pdf`);
  };

  // Función para exportar a Excel
  const exportarExcel = () => {
    if (productosFiltrados.length === 0) {
      alert("No hay productos para exportar en el listado seleccionado.");
      return;
    }

    const dataToExport = productosFiltrados.map((producto, index) => ({
      "N°": index + 1,
      "Producto": producto.nombre,
      "Laboratorio": producto.laboratorio,
      "Presentación": producto.presentacion,
      "Fecha de Vencimiento": moment(producto.fechaVencimiento).format("DD/MM/YYYY"),
      "Días Restantes": producto.diasParaVencer <= 0 ? `Vencido (${Math.abs(producto.diasParaVencer)})` : producto.diasParaVencer,
      "Estado": producto.estado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vencimientos");

    const fechaStr = moment().format("YYYY-MM-DD");
    XLSX.writeFile(workbook, `reporte_vencimientos_${filtroVencimiento}_${fechaStr}.xlsx`);
  };

  // Formatear fecha para visualización considerando que puede ser null
  const formatearFecha = (fechaIso?: string | null): string => {
    if (!fechaIso) return "Sin registro";
    const fecha = new Date(fechaIso);
    if (isNaN(fecha.getTime())) return "Sin registro";
    return fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Función para exportar Stock Mínimo a PDF
  const generarPDFStockMinimo = () => {
    if (productosConMenorStock.length === 0) {
      alert("No hay productos con stock mínimo para exportar.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 🔵 Barra superior azul
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 20, "F");

    // 🔵 LOGO
    try {
      doc.addImage(logo, "PNG", 14, 5, 18, 10);
    } catch (e) {
      console.error("Error al cargar logo:", e);
    }

    // 🔵 Título del Reporte
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE PRODUCTOS CON STOCK MÍNIMO", pageWidth / 2, 13, {
      align: "center",
    });

    doc.setTextColor(0, 0, 0);

    // 🏥 DATOS DE LA FARMACIA
    let y = 30;
    if (configuracion && configuracion.length > 0) {
      configuracion.forEach((item) => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(item.nombre || "FARMACIA", 14, y);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Dirección: ${item.direccion || "Central"}`, 14, y + 6);
        doc.text(`Teléfono: ${item.telefono || "-"}`, 14, y + 11);
      });
    } else {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("FARMACIA", 14, y);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Dirección: Central", 14, y + 6);
      doc.text("Teléfono: -", 14, y + 11);
    }

    // 📅 CAJA DE INFORMACIÓN
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200);
    doc.roundedRect(pageWidth - 75, 28, 60, 22, 3, 3, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN", pageWidth - 45, 34, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.text(`Alerta: Bajo Stock`, pageWidth - 70, 40);
    doc.text(`Fecha: ${moment().format("DD/MM/YYYY")}`, pageWidth - 70, 45);

    // Línea separadora
    doc.setDrawColor(41, 128, 185);
    doc.line(14, 55, pageWidth - 14, 55);

    // TITULO TABLA
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PRODUCTOS CON BAJO INVENTARIO", 14, 65);

    const tableColumn = [
      "#",
      "Producto",
      "Laboratorio",
      "Presentación",
      "Stock Actual",
      "P. Venta",
      "F. Vencimiento",
      "Fecha Reg.",
    ];

    const tableRows = productosConMenorStock.map((p, index) => [
      index + 1,
      p.nombre,
      p.laboratorioNombre || "N/A",
      p.presentacionNombre || "N/A",
      p.stock.toString(),
      `${Number(p.precio || 0).toFixed(2)} Bs`,
      p.vencimiento ? moment(p.vencimiento).format("DD/MM/YYYY") : "S/D",
      formatearFecha(p.fecha),
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
        1: { halign: "left" },
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    // 💰 RESUMEN TOTAL
    let finalY = doc.lastAutoTable.finalY + 12;
    if (finalY > pageHeight - 30) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 85, finalY - 6, 70, 15, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PRODUCTOS:", pageWidth - 80, finalY + 4);

    doc.setFont("helvetica", "normal");
    doc.text(
      `${productosConMenorStock.length}`,
      pageWidth - 20,
      finalY + 4,
      { align: "right" }
    );

    // 📄 PIE DE PÁGINA
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Sistema de Gestion Farmaceutica", 14, pageHeight - 10);
    doc.text(
      `Generado: ${new Date().toLocaleString()}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: "right" }
    );

    const fechaPdf = moment().format("YYYY-MM-DD");
    doc.save(`reporte_stock_minimo_${fechaPdf}.pdf`);
  };

  // Función para exportar Productos Más Vendidos a PDF
  const generarPDFMasVendidos = () => {
    if (masVendidosData.length === 0) {
      alert("No hay datos de productos más vendidos para exportar.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 🔵 Barra superior azul
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 20, "F");

    // 🔵 LOGO
    try {
      doc.addImage(logo, "PNG", 14, 5, 18, 10);
    } catch (e) {
      console.error("Error al cargar logo:", e);
    }

    // 🔵 Título del Reporte
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE PRODUCTOS MÁS VENDIDOS", pageWidth / 2, 13, {
      align: "center",
    });

    doc.setTextColor(0, 0, 0);

    // 🏥 DATOS DE LA FARMACIA
    let y = 30;
    if (configuracion && configuracion.length > 0) {
      configuracion.forEach((item) => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(item.nombre || "FARMACIA", 14, y);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Dirección: ${item.direccion || "Central"}`, 14, y + 6);
        doc.text(`Teléfono: ${item.telefono || "-"}`, 14, y + 11);
      });
    } else {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("FARMACIA", 14, y);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Dirección: Central", 14, y + 6);
      doc.text("Teléfono: -", 14, y + 11);
    }

    // 📅 CAJA DE INFORMACIÓN
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200);
    doc.roundedRect(pageWidth - 75, 28, 60, 22, 3, 3, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN", pageWidth - 45, 34, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.text(`Ranking: Top Ventas`, pageWidth - 70, 40);
    doc.text(`Fecha: ${moment().format("DD/MM/YYYY")}`, pageWidth - 70, 45);

    // Línea separadora
    doc.setDrawColor(41, 128, 185);
    doc.line(14, 55, pageWidth - 14, 55);

    // TITULO TABLA
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RANKING DE PRODUCTOS POR UNIDADES VENDIDAS", 14, 65);

    const tableColumn = [
      "Top",
      "Producto",
      "Laboratorio",
      "Presentación",
      "Unidades Vendidas",
    ];

    const totalUnidadesVendidas = masVendidosData.reduce((sum, item) => sum + (Number(item.totalVendido) || 0), 0);

    const tableRows = masVendidosData.map((p, index) => [
      `#${index + 1}`,
      p.nombre,
      p.laboratorioNombre || "N/A",
      p.presentacionNombre || "N/A",
      `${p.totalVendido} unidades`,
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
        1: { halign: "left" },
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    // 💰 RESUMEN TOTAL
    let finalY = doc.lastAutoTable.finalY + 12;
    if (finalY > pageHeight - 30) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 95, finalY - 6, 80, 15, "F");

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL UNIDADES:", pageWidth - 90, finalY + 4);

    doc.setFont("helvetica", "normal");
    doc.text(
      `${totalUnidadesVendidas} unid.`,
      pageWidth - 20,
      finalY + 4,
      { align: "right" }
    );

    // 📄 PIE DE PÁGINA
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Sistema de Gestion Farmaceutica", 14, pageHeight - 10);
    doc.text(
      `Generado: ${new Date().toLocaleString()}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: "right" }
    );

    const fechaPdf = moment().format("YYYY-MM-DD");
    doc.save(`reporte_mas_vendidos_${fechaPdf}.pdf`);
  };

  return (
    <div className="flex h-screen bg-gray-50/50">
      <NavBarRoot />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Banner de bienvenida premium */}
          <div className="w-full mb-8 bg-blue rounded-2xl p-6 text-white shadow-xl relative overflow-hidden" style={{background:'#265FFF'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    ¡Bienvenido, <span className="text-amber-300">{name}</span>!
                  </h1>
                  <p className="text-blue-100/90 font-medium">
                    Panel de Control Farmacéutico - Resumen General
                  </p>
                </div>
                <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-100/80">Hora actual</p>
                      <p className="text-xl font-semibold">{formatTime(currentTime)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-100/80">
                    <Calendar className="h-4 w-4" />
                    <span>{now}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.title} 
                className={`bg-blue rounded-2xl p-0.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`} 
              >
                <div className="bg-white rounded-xl p-5 h-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-800">{stat.value}</h3>
                      <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    </div>
                    <div className={`bg-blue rounded-lg p-2 text-white shadow-md`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    {renderTrendIcon(stat.trend, stat.trendValue)}
                    <div className="w-3/4 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-blue`}
                        style={{ width: `${Math.min(100, (stat.value / 100) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico de ingresos mensuales premium */}
          <Card className="mb-8 rounded-2xl overflow-hidden border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow" >
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b" style={{background:'#265FFF'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue p-2 rounded-lg" >
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Ingresos Mensuales</CardTitle>
                    <CardDescription className="text-sm">Evolución de ventas por mes</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-white" />
                  <select 
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="bg-white/20 text-black border-none rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                    disabled={isLoadingIngresos}
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year} className="text-gray-800">
                        {year}
                      </option>
                    ))}
                  </select>
                  {isLoadingIngresos && (
                    <div className="ml-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 h-[400px]">
              {isLoadingIngresos ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : ingresosMensuales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ingresosMensuales}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [`${value} Bs`, 'Ingresos']}
                      labelStyle={{ fontWeight: 'bold', color: '#1F2937' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                    <Bar 
                      dataKey="total" 
                      name="Ingresos (Bs)" 
                      fill="#3B82F6" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No hay datos disponibles para el año {selectedYear}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabla de productos próximos a vencer */}
          <Card className="mb-8 rounded-2xl overflow-hidden border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b" style={{background:'#265FFF'}}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Productos Próximos a Vencer</CardTitle>
                    <CardDescription className="text-sm text-blue-100">Monitoreo de estado de caducidad del inventario</CardDescription>
                  </div>
                </div>
                {/* Botones de Filtro y Exportación */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {/* Filtros */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange('todos')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border border-white/20 ${
                        filtroVencimiento === 'todos' 
                          ? 'bg-amber-400 text-gray-900 shadow' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Ver Todos
                    </button>
                    <button
                      onClick={() => handleFilterChange('vencidos')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border border-white/20 ${
                        filtroVencimiento === 'vencidos' 
                          ? 'bg-amber-400 text-gray-900 shadow' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Solo Vencidos
                    </button>
                    <button
                      onClick={() => handleFilterChange('proximos')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border border-white/20 ${
                        filtroVencimiento === 'proximos' 
                          ? 'bg-amber-400 text-gray-900 shadow' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Próximos a Vencer
                    </button>
                  </div>

                  {/* Separador visual en desktop */}
                  <div className="h-6 w-px bg-white/30 hidden sm:block"></div>

                  {/* Botones de Exportar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={generarPDF}
                      title="Exportar listado actual a PDF"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                      className="btn-export-pdf flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white hover:bg-red-700 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <FaFilePdf className="text-sm text-white" />
                      <span>Exportar PDF</span>
                    </button>
                    <button
                      onClick={exportarExcel}
                      title="Exportar listado actual a Excel"
                      style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                      className="btn-export-excel flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white hover:bg-emerald-700 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <FaFileExcel className="text-sm text-white" />
                      <span>Exportar Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {currentProductos.length > 0 ? (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 text-left text-sm font-semibold">Nombre</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 text-left text-sm font-semibold">Laboratorio</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 text-left text-sm font-semibold">Presentación</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 text-left text-sm font-semibold">Fecha de Vencimiento</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 text-left text-sm font-semibold">Días Restantes</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 text-left text-sm font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProductos.map((producto, index) => (
                          <tr key={producto.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-3 text-sm text-gray-700">{producto.nombre}</td>
                            <td className="p-3 text-sm text-gray-700">{producto.laboratorio}</td>
                            <td className="p-3 text-sm text-gray-700">{producto.presentacion}</td>
                            <td className="p-3 text-sm text-gray-700">{moment(producto.fechaVencimiento).format('DD/MM/YYYY')}</td>
                            <td className="p-3 text-sm text-gray-700">
                              {producto.diasParaVencer <= 0 ? (
                                <span className="text-red-600 font-bold">Vencido ({Math.abs(producto.diasParaVencer)})</span>
                              ) : (
                                producto.diasParaVencer
                              )}
                            </td>
                            <td className={`p-3 text-sm ${getEstadoColor(producto.estado)}`}>
                              {producto.estado}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Botones de paginación (Siguiente / Anterior) */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 border-t pt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando productos <span className="font-semibold">{indexOfFirstItem + 1}</span> al <span className="font-semibold">{Math.min(indexOfLastItem, productosFiltrados.length)}</span> de <span className="font-semibold">{productosFiltrados.length}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No se encontraron productos con el filtro seleccionado.</p>
              )}
            </CardContent>
          </Card>

          {/* Gráficos / Listas - En filas separadas (no en la misma fila) */}
          <div className="flex flex-col space-y-8 mt-8">
            {/* 1. Tarjeta de Stock Mínimo (Fila completa) */}
            <Card className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow w-full">
              <CardHeader className="border-b text-white" style={{ background: '#265FFF' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-white">Stock Mínimo</CardTitle>
                      <CardDescription className="text-sm text-blue-100">Productos con bajo inventario</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Switch Gráfico / Lista */}
                    <div className="flex items-center bg-white/20 p-1 rounded-lg border border-white/20">
                      <button
                        type="button"
                        onClick={() => setVistaStockMinimo('grafico')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                          vistaStockMinimo === 'grafico'
                            ? 'bg-white shadow'
                            : 'text-white hover:bg-white/10'
                        }`}
                        style={vistaStockMinimo === 'grafico' ? { background: '#ffffff', color: '#2563eb' } : { color: '#ffffff' }}
                        title="Ver en gráfico"
                      >
                        <PieIcon className="w-4 h-4" />
                        <span>Gráfico</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVistaStockMinimo('lista')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                          vistaStockMinimo === 'lista'
                            ? 'bg-white shadow'
                            : 'text-white hover:bg-white/10'
                        }`}
                        style={vistaStockMinimo === 'lista' ? { background: '#ffffff', color: '#2563eb' } : { color: '#ffffff' }}
                        title="Ver en lista"
                      >
                        <List className="w-4 h-4" />
                        <span>Lista</span>
                      </button>
                    </div>

                    {/* Botón Exportar PDF */}
                    <button
                      type="button"
                      onClick={generarPDFStockMinimo}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow hover:opacity-90 transition cursor-pointer"
                      style={{ background: "#dc2626", color: "#ffffff" }}
                      title="Exportar Stock Mínimo a PDF"
                    >
                      <FaFilePdf size={14} />
                      <span>Exportar PDF</span>
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 min-h-[420px]">
                {vistaStockMinimo === 'grafico' ? (
                  stockMinimoData.length === 0 ? (
                    <div className="flex items-center justify-center h-[360px] text-gray-500 font-medium">
                      No hay datos de productos con bajo stock para graficar.
                    </div>
                  ) : (
                    <div className="w-full h-[380px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={380}>
                        <PieChart>
                          <Pie
                            data={stockMinimoData}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name.length > 15 ? name.substring(0, 15) + '…' : name} (${value})`}
                            labelLine={true}
                          >
                            {stockMinimoData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                stroke="#FFF"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={<CustomTooltip />}
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              borderRadius: '0.5rem',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              fontSize: '12px',
                            }}
                          />
                          <Legend 
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ 
                              paddingTop: '20px',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )
                ) : (
                  <div className="max-h-[380px] overflow-y-auto rounded-lg border border-gray-200">
                    <table className="w-full border-collapse text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr className="text-left">
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold w-12 text-center">#</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold">Producto</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold">Laboratorio</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold">Presentación</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold text-center">Stock Actual</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold text-center">P. Venta</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold text-center">Vencimiento</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold text-center">Fecha Reg.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {productosConMenorStock.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-gray-500 font-medium">
                              No hay productos con bajo inventario.
                            </td>
                          </tr>
                        ) : (
                          productosConMenorStock.map((p, idx) => (
                            <tr key={p.id || idx} className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                              <td className="p-3 text-center text-gray-500 font-semibold">{idx + 1}</td>
                              <td className="p-3 font-medium text-gray-800">{p.nombre}</td>
                              <td className="p-3 text-gray-600">{p.laboratorioNombre || "N/A"}</td>
                              <td className="p-3 text-gray-600">{p.presentacionNombre || "N/A"}</td>
                              <td className="p-3 text-center font-bold text-red-600">
                                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                                  {p.stock} unidades.
                                </span>
                              </td>
                              <td className="p-3 text-center text-gray-700 font-semibold">
                                {Number(p.precio || 0).toFixed(2)} Bs
                              </td>
                              <td className="p-3 text-center text-gray-600">
                                {p.vencimiento ? moment(p.vencimiento).format("DD/MM/YYYY") : "S/D"}
                              </td>
                              <td className="p-3 text-center text-gray-600 text-[11px] whitespace-nowrap">
                                {formatearFecha(p.fecha)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Tarjeta de Productos Más Vendidos (Fila completa) */}
            <Card className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow w-full">
              <CardHeader className="border-b text-white" style={{ background: '#265FFF' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-white">Productos Más Vendidos</CardTitle>
                      <CardDescription className="text-sm text-blue-100">Top productos por unidades vendidas</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Switch Gráfico / Lista */}
                    <div className="flex items-center bg-white/20 p-1 rounded-lg border border-white/20">
                      <button
                        type="button"
                        onClick={() => setVistaMasVendidos('grafico')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                          vistaMasVendidos === 'grafico'
                            ? 'bg-white shadow'
                            : 'text-white hover:bg-white/10'
                        }`}
                        style={vistaMasVendidos === 'grafico' ? { background: '#ffffff', color: '#2563eb' } : { color: '#ffffff' }}
                        title="Ver en gráfico"
                      >
                        <PieIcon className="w-4 h-4" />
                        <span>Gráfico</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVistaMasVendidos('lista')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                          vistaMasVendidos === 'lista'
                            ? 'bg-white shadow'
                            : 'text-white hover:bg-white/10'
                        }`}
                        style={vistaMasVendidos === 'lista' ? { background: '#ffffff', color: '#2563eb' } : { color: '#ffffff' }}
                        title="Ver en lista"
                      >
                        <List className="w-4 h-4" />
                        <span>Lista</span>
                      </button>
                    </div>

                    {/* Botón Exportar PDF */}
                    <button
                      type="button"
                      onClick={generarPDFMasVendidos}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow hover:opacity-90 transition cursor-pointer"
                      style={{ background: "#dc2626", color: "#ffffff" }}
                      title="Exportar Más Vendidos a PDF"
                    >
                      <FaFilePdf size={14} />
                      <span>Exportar PDF</span>
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 min-h-[420px]">
                {vistaMasVendidos === 'grafico' ? (
                  masVendidosChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-[360px] text-gray-500 font-medium">
                      No hay datos de ventas para graficar.
                    </div>
                  ) : (
                    <div className="w-full h-[380px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={380}>
                        <PieChart>
                          <Pie
                            data={masVendidosChartData}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name.length > 15 ? name.substring(0, 15) + '…' : name} (${value} u.)`}
                            labelLine={true}
                          >
                            {masVendidosChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[(index + 3) % COLORS.length]} 
                                stroke="#FFF"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={<CustomTooltip />}
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              borderRadius: '0.5rem',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              fontSize: '12px',
                            }}
                          />
                          <Legend 
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ 
                              paddingTop: '20px',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )
                ) : (
                  <div className="max-h-[380px] overflow-y-auto rounded-lg border border-gray-200">
                    <table className="w-full border-collapse text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr className="text-left">
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold w-16 text-center">Top</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold">Producto</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold">Laboratorio</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold">Presentación</th>
                          <th style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="p-3 font-bold text-center">Unidades Vendidas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {masVendidosData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-500 font-medium">
                              No hay datos de productos más vendidos.
                            </td>
                          </tr>
                        ) : (
                          masVendidosData.map((p, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                                  idx === 0
                                    ? "bg-amber-400 text-amber-900 shadow-sm"
                                    : idx === 1
                                    ? "bg-gray-300 text-gray-800"
                                    : idx === 2
                                    ? "bg-amber-700/30 text-amber-950"
                                    : "bg-gray-100 text-gray-700"
                                }`}>
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-gray-800">{p.nombre}</td>
                              <td className="p-3 text-gray-600">{p.laboratorioNombre || "N/A"}</td>
                              <td className="p-3 text-gray-600">{p.presentacionNombre || "N/A"}</td>
                              <td className="p-3 text-center font-bold text-emerald-600">
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                  {p.totalVendido} unidades.
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;