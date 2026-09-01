import React, { useEffect, useState } from "react";
import { Trash2, Edit2, Search, CheckCircle, AlertCircle, FileSpreadsheet, AlertTriangle, Plus, Clock, X } from "lucide-react";
import NavBarRoot from "./NavBarRoot";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaFilePdf, FaFileExcel } from "react-icons/fa6";
import logo from "../img/logo1.png";
import moment from "moment";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import "./ProductManagement.css";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: any;
  }
}

// Interfaces
interface Product {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  concentracion: number;
  casilla: number;
  vencimiento: string;
  idpresentacion: number;
  idlaboratorio: number;
  idtipo: number;
  eliminado?: boolean;
  precio_compra: number;
  lote: string;
  nombre_generico: string;
}

interface Tipo {
  id: number;
  nombre: string;
  eliminado?: boolean;
}

interface Laboratory {
  id: number;
  laboratorioNombre: string;
  direccion: string;
  eliminado?: boolean;
}

interface Presentacion {
  id: number;
  nombre: string;
  nombreCorto: string;
}

interface Configuracion {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
}

interface AlertState {
  show: boolean;
  type: "error" | "success";
  message: string;
}

// Estado inicial para un producto
const initialProductState: Partial<Product> = {
  codigo: "",
  nombre: "",
  descripcion: "",
  precio: 0,
  stock: 0,
  concentracion: 0,
  casilla: 0,
  vencimiento: "",
  idpresentacion: 0,
  idlaboratorio: 0,
  idtipo: 0,
  precio_compra: 0,
  lote: "",
  nombre_generico: "",
};

// Letras del abecedario para el filtro alfabético
const LETRAS_ALFABETO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

type QuickModalType = "tipo" | "laboratorio" | "presentacion" | null;

// Componente principal
const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [tipo, setTipos] = useState<Tipo[]>([]);
  const [presentacion, setPresentacion] = useState<Presentacion[]>([]);
  const [laboratorio, setLaboratorio] = useState<Laboratory[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([]);
  const [editProducto, setEditProducto] = useState<Product | null>(null);
  const [formData, setFormData] =
    useState<Partial<Product>>(initialProductState);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "success",
    message: "",
  });

  // --- Estados de filtros combinables ---
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterLaboratorio, setFilterLaboratorio] = useState<string>("");
  const [filterPresentacion, setFilterPresentacion] = useState<string>("");
  const [filterAlfabeto, setFilterAlfabeto] = useState<string>("");
  const [filterVencidos, setFilterVencidos] = useState<boolean>(false);
  const [filterProximosVencer, setFilterProximosVencer] = useState<boolean>(false);

  // --- Estados para creación rápida (Tipo, Laboratorio, Presentación) ---
  const [quickModal, setQuickModal] = useState<QuickModalType>(null);
  const [quickTipoName, setQuickTipoName] = useState("");
  const [quickLabName, setQuickLabName] = useState("");
  const [quickLabDireccion, setQuickLabDireccion] = useState("");
  const [quickPresName, setQuickPresName] = useState("");
  const [quickPresCorto, setQuickPresCorto] = useState("");
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, tiposRes, laboratoriosRes, presentacionRes] =
          await Promise.all([
            fetch(
              "http://localhost:5000/api/Productos/listarProductosConMenorStock",
            ),
            fetch("http://localhost:5000/api/Tipos/ListarTiposActivos"),
            fetch(
              "http://localhost:5000/api/Laboratorios/ListarLaboratoriosActivos",
            ),
            fetch(
              "http://localhost:5000/api/Presentaciones/ListarPresentacionesActivos",
            ),
          ]);

        const [dataProductos, dataTipos, dataLaboratorios, dataPresentacion] =
          await Promise.all([
            productsRes.json(),
            tiposRes.json(),
            laboratoriosRes.json(),
            presentacionRes.json(),
          ]);

        setProducts(dataProductos);
        setTipos(dataTipos);
        setLaboratorio(dataLaboratorios);
        setPresentacion(dataPresentacion);

        try {
          const configRes = await fetch("http://localhost:5000/api/Configuracions/ListarConfiguracionActivos");
          if (configRes.ok) {
            const dataConfig = await configRes.json();
            setConfiguracion(dataConfig);
          }
        } catch (configError) {
          console.error("Error al cargar configuración:", configError);
        }
      } catch (error) {
        showAlert("error", "Error al cargar los datos");
      }
    };

    fetchData();
  }, []);
  
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Sanitización para permitir decimales fluidos
    const sanitizedValue = value.replace(",", ".");

    setFormData((prev: any) => {
      const newState = {
        ...prev,
        [name]: ["precio", "stock", "concentracion", "casilla", "idpresentacion", "idlaboratorio", "idtipo", "precio_compra"].includes(name)
          ? sanitizedValue // Guardamos como texto para permitir el "." mientras se escribe
          : value,
      };

      if (name === "precio_compra") {
        const numValue = sanitizedValue === "" ? 0 : Number(sanitizedValue);
        if (!isNaN(numValue) && numValue !== 0) {
          const sugerenciaVenta = numValue * 1.3;
          newState.precio = sugerenciaVenta.toFixed(2);
        }
      }
      return newState;
    });
  };

  // Manejar edición de producto
  const handleEdit = (product: Product) => {
    setEditProducto(product);
    setFormData(product);
  };

  // Manejar eliminación de producto
  const handleEliminar = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/Productos/${id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setProducts((prev) => prev.filter((product) => product.id !== id));
        showModal("success", "Producto eliminado correctamente");
      } else {
        throw new Error("Error al eliminar el producto");
      }
    } catch (error) {
      showModal("error", "Error al eliminar el producto");
    }
  };

  // Manejar agregar nuevo producto
  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();

    // Solo validamos los selectores que pediste obligatorios
    if (
      !formData.idtipo ||
      !formData.idlaboratorio ||
      !formData.idpresentacion
    ) {
      showModal(
        "error",
        "Por favor seleccione el Tipo, Laboratorio y Presentación",
      );
      return;
    }

    // Preparar datos con S/D o 0 si están vacíos
    const finalData = {
      codigo: formData.codigo || "S/D",
      nombre: formData.nombre || "S/D",
      descripcion: formData.descripcion || "S/D",
      precio: formData.precio || 0,
      stock: formData.stock || 0,
      vencimiento: formData.vencimiento || "2000-01-01",
      idtipo: formData.idtipo,
      idlaboratorio: formData.idlaboratorio,
      concentracion: formData.concentracion || 0,
      casilla: formData.casilla || 0,
      idpresentacion: formData.idpresentacion,
      precio_compra: formData.precio_compra || 0,
      lote: formData.lote || "S/D",
      nombre_generico: formData.nombre_generico || "S/D",
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/Productos/Crear?codigo=${finalData.codigo}&nombre=${finalData.nombre}&descripcion=${finalData.descripcion}&precio=${finalData.precio}&stock=${finalData.stock}&vencimiento=${finalData.vencimiento}&idtipo=${finalData.idtipo}&idlaboratorio=${finalData.idlaboratorio}&concentracion=${finalData.concentracion}&casilla=${finalData.casilla}&idpresentacion=${finalData.idpresentacion}&precio_compra=${finalData.precio_compra}&lote=${finalData.lote}&nombre_generico=${finalData.nombre_generico}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalData),
        },
      );

      if (response.ok) {
        const newProduct = await response.json();
        setProducts([...products, newProduct]);
        showModal("success", "Producto agregado correctamente");
        handleReset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al agregar el producto");
      }
    } catch (error) {
      showModal(
        "error",
        error instanceof Error ? error.message : "Error al agregar el producto",
      );
    }
  };

  // Manejar actualización de producto
  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editProducto?.id) {
      showModal("error", "No hay producto seleccionado para editar");
      return;
    }

    // Preparar valores predeterminados para actualización
    const finalCodigo = formData.codigo || "S/D";
    const finalNombre = formData.nombre || "S/D";
    const finalDescripcion = formData.descripcion || "S/D";
    const finalPrecio = formData.precio?.toString() || "0";
    const finalStock = formData.stock?.toString() || "0";
    const finalConc = formData.concentracion?.toString() || "0";
    const finalCasilla = formData.casilla?.toString() || "0";
    const finalVenc = formData.vencimiento || "2000-01-01";
    const finalLote = formData.lote || "S/D";
    const finalnombre_generico = formData.nombre_generico || "S/D";
    const finalPrecioCompra = formData.precio_compra?.toString() || "0";

    try {
      const params = new URLSearchParams();
      params.append("id", editProducto.id.toString());
      params.append("codigo", finalCodigo);
      params.append("nombre", finalNombre);
      params.append("descripcion", finalDescripcion);
      params.append("precio", finalPrecio);
      params.append("stock", finalStock);
      params.append("concentracion", finalConc);
      params.append("casilla", finalCasilla);
      params.append("vencimiento", finalVenc);
      params.append(
        "idpresentacion",
        formData.idpresentacion?.toString() || "0",
      );
      params.append("idlaboratorio", formData.idlaboratorio?.toString() || "0");
      params.append("idtipo", formData.idtipo?.toString() || "0");
      params.append("precio_compra", finalPrecioCompra);
      params.append("lote", finalLote);
      params.append("nombre_generico", finalnombre_generico);

      const url = `http://localhost:5000/api/Productos/Actualizar?${params.toString()}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el producto");
      }

      const updatedProduct = await response.json();

      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)),
      );

      showModal("success", "Producto actualizado correctamente");
      handleReset();
    } catch (error) {
      showModal(
        "error",
        error instanceof Error
          ? error.message
          : "Error al actualizar el producto",
      );
    }
  };

  // Resetear formulario
  const handleReset = () => {
    setFormData(initialProductState);
    setEditProducto(null);
  };

  // Mostrar alertas
  const showAlert = (type: "error" | "success", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(
      () => setAlert({ show: false, type: "success", message: "" }),
      5000,
    );
  };

  // --- Manejadores para creación rápida (Tipo, Laboratorio, Presentación) ---
  const handleCreateQuickTipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTipoName.trim()) {
      showModal("error", "El nombre del tipo es obligatorio");
      return;
    }
    setIsSubmittingQuick(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/Tipos/Crear?nombre=${encodeURIComponent(quickTipoName.trim())}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const newTipo: Tipo = await response.json();
        setTipos((prev) => [...prev, newTipo]);
        setFormData((prev: any) => ({ ...prev, idtipo: newTipo.id }));
        setQuickTipoName("");
        setQuickModal(null);
        showModal("success", `Tipo "${newTipo.nombre}" creado y seleccionado correctamente`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el tipo");
      }
    } catch (error) {
      showModal("error", error instanceof Error ? error.message : "Error al crear el tipo");
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const handleCreateQuickLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLabName.trim() || !quickLabDireccion.trim()) {
      showModal("error", "Por favor complete el nombre y la dirección del laboratorio");
      return;
    }
    setIsSubmittingQuick(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/Laboratorios/Crear?laboratorionombre=${encodeURIComponent(quickLabName.trim())}&direccion=${encodeURIComponent(quickLabDireccion.trim())}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const newLab: Laboratory = await response.json();
        setLaboratorio((prev) => [...prev, newLab]);
        setFormData((prev: any) => ({ ...prev, idlaboratorio: newLab.id }));
        setQuickLabName("");
        setQuickLabDireccion("");
        setQuickModal(null);
        showModal("success", `Laboratorio "${newLab.laboratorioNombre}" creado y seleccionado correctamente`);
      } else {
        throw new Error("Error al crear laboratorio");
      }
    } catch (error) {
      showModal("error", error instanceof Error ? error.message : "Error al crear el laboratorio");
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const handleCreateQuickPres = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPresName.trim() || !quickPresCorto.trim()) {
      showModal("error", "Por favor complete el nombre y nombre corto de la presentación");
      return;
    }
    setIsSubmittingQuick(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/Presentaciones/Crear?nombre=${encodeURIComponent(quickPresName.trim())}&nombreCorto=${encodeURIComponent(quickPresCorto.trim())}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const newPres: Presentacion = await response.json();
        setPresentacion((prev) => [...prev, newPres]);
        setFormData((prev: any) => ({ ...prev, idpresentacion: newPres.id }));
        setQuickPresName("");
        setQuickPresCorto("");
        setQuickModal(null);
        showModal("success", `Presentación "${newPres.nombre}" creada y seleccionada correctamente`);
      } else {
        throw new Error("Error al crear la presentación");
      }
    } catch (error) {
      showModal("error", error instanceof Error ? error.message : "Error al crear la presentación");
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // --- Limpiar todos los filtros ---
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterTipo("");
    setFilterLaboratorio("");
    setFilterPresentacion("");
    setFilterAlfabeto("");
    setFilterVencidos(false);
    setFilterProximosVencer(false);
    setCurrentPage(1);
  };

  // --- Fecha de hoy para comparar vencimientos ---
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Función para calcular días restantes de vencimiento
  const getDiasParaVencer = (vencimientoStr?: string): number | null => {
    if (!vencimientoStr) return null;
    const fechaVenc = new Date(vencimientoStr);
    if (isNaN(fechaVenc.getTime())) return null;
    return Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Lógica de búsqueda y filtrado (buscador + tipo + laboratorio + presentación + alfabeto + vencidos + próximos a vencer)
  const filteredProductos = products.filter((product) => {
    if (product.eliminado) return false;

    const coincideBusqueda =
      searchTerm.trim() === "" ||
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nombre_generico
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

    const coincideTipo =
      filterTipo === "" || product.idtipo === Number(filterTipo);

    const coincideLaboratorio =
      filterLaboratorio === "" ||
      product.idlaboratorio === Number(filterLaboratorio);

    const coincidePresentacion =
      filterPresentacion === "" ||
      product.idpresentacion === Number(filterPresentacion);

    const coincideAlfabeto =
      filterAlfabeto === "" ||
      product.nombre.toUpperCase().startsWith(filterAlfabeto.toUpperCase());

    const dias = getDiasParaVencer(product.vencimiento);

    // Coincidencia por producto vencido (<= 0 días)
    const coincideVencido = !filterVencidos || (dias !== null && dias <= 0);

    // Coincidencia por producto próximo a vencer (> 0 y <= 30 días)
    const coincideProximoVencer = !filterProximosVencer || (dias !== null && dias > 0 && dias <= 30);

    return (
      coincideBusqueda &&
      coincideTipo &&
      coincideLaboratorio &&
      coincidePresentacion &&
      coincideAlfabeto &&
      coincideVencido &&
      coincideProximoVencer
    );
  });

  // --- Monto total invertido (precio_compra x stock) según el filtro activo ---
  const montoInvertido = filteredProductos.reduce(
    (total, p) => total + (Number(p.precio_compra) || 0) * (Number(p.stock) || 0),
    0,
  );

  // --- Exportar a Excel ---
  const handleExportExcel = () => {
    if (filteredProductos.length === 0) {
      showModal("error", "No hay productos para exportar con el filtro actual");
      return;
    }

    const dataToExport = filteredProductos.map((product) => {
      const tipoNombre =
        tipo.find((tp) => tp.id === product.idtipo)?.nombre || "N/A";
      const labNombre =
        laboratorio.find((lab) => lab.id === product.idlaboratorio)
          ?.laboratorioNombre || "N/A";
      const presNombre =
        presentacion.find((pre) => pre.id === product.idpresentacion)
          ?.nombre || "";
      const presCorto =
        presentacion.find((pre) => pre.id === product.idpresentacion)
          ?.nombreCorto || "";
      const fullPres = `${presNombre} ${product.concentracion || ""} ${presCorto}`.trim();
      const invertido =
        (Number(product.precio_compra) || 0) * (Number(product.stock) || 0);

      const dias = getDiasParaVencer(product.vencimiento);
      let estadoVenc = "Al día";
      if (dias !== null) {
        if (dias <= 0) estadoVenc = `Vencido (${Math.abs(dias)} d)`;
        else if (dias <= 30) estadoVenc = `Próximo (${dias} d)`;
      }

      return {
        Código: product.codigo,
        Lote: product.lote,
        Nombre: product.nombre,
        "Nombre Genérico": product.nombre_generico,
        Descripción: product.descripcion,
        Tipo: tipoNombre,
        Presentación: fullPres || presNombre,
        Laboratorio: labNombre,
        "Precio Compra": Number(product.precio_compra || 0),
        "Precio Venta": Number(product.precio || 0),
        Stock: product.stock,
        Casilla: product.casilla,
        Vencimiento: product.vencimiento ? moment(product.vencimiento).format("DD/MM/YYYY") : "S/D",
        Estado: estadoVenc,
        "Monto Invertido": invertido,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    // Fila de resumen con el monto total invertido y total de productos
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [],
        ["", "", "", "", "", "", "", "", "", "", "", "", "Total Productos:", filteredProductos.length],
        ["", "", "", "", "", "", "", "", "", "", "", "", "Monto Total Invertido:", montoInvertido.toFixed(2)]
      ],
      { origin: -1 },
    );

    const fecha = moment().format("YYYY-MM-DD");
    const sufijo = filterVencidos ? "_vencidos" : filterProximosVencer ? "_proximos_a_vencer" : "";
    XLSX.writeFile(workbook, `productos${sufijo}_${fecha}.xlsx`);
  };

  // --- Exportar a PDF (Diseño idéntico a Historial de Ventas / Dashboard) ---
  const handleExportPDF = () => {
    if (filteredProductos.length === 0) {
      showModal("error", "No hay productos para exportar con el filtro actual");
      return;
    }

    const doc = new jsPDF("landscape");
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
    let tituloReporte = "REPORTE GENERAL DE INVENTARIO DE PRODUCTOS";
    let filtroNombre = "Todos";
    if (filterVencidos) {
      tituloReporte = "REPORTE DE PRODUCTOS VENCIDOS";
      filtroNombre = "Solo Vencidos";
    } else if (filterProximosVencer) {
      tituloReporte = "REPORTE DE PRODUCTOS PRÓXIMOS A VENCER";
      filtroNombre = "Próximos a Vencer (30 días)";
    } else if (filterTipo || filterLaboratorio || filterPresentacion || filterAlfabeto || searchTerm) {
      const filtrosAplicados = [];
      if (filterTipo) {
        const t = tipo.find((tp) => tp.id === Number(filterTipo))?.nombre;
        if (t) filtrosAplicados.push(`Tipo: ${t}`);
      }
      if (filterLaboratorio) {
        const l = laboratorio.find((lab) => lab.id === Number(filterLaboratorio))?.laboratorioNombre;
        if (l) filtrosAplicados.push(`Lab: ${l}`);
      }
      if (filterPresentacion) {
        const p = presentacion.find((pre) => pre.id === Number(filterPresentacion))?.nombre;
        if (p) filtrosAplicados.push(`Pres: ${p}`);
      }
      if (filterAlfabeto) filtrosAplicados.push(`Letra: ${filterAlfabeto}`);
      if (searchTerm) filtrosAplicados.push(`Búsqueda: "${searchTerm}"`);
      filtroNombre = filtrosAplicados.join(" | ");
      tituloReporte = "REPORTE FILTRADO DE PRODUCTOS";
    }

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(tituloReporte, pageWidth / 2, 13, { align: "center" });

    doc.setTextColor(0, 0, 0);

    // 🏥 DATOS DE LA FARMACIA
    let y = 28;
    if (configuracion && configuracion.length > 0) {
      configuracion.forEach((item) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(item.nombre || "FARMACIA", 14, y);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Dirección: ${item.direccion || "Central"}`, 14, y + 5);
        doc.text(`Teléfono: ${item.telefono || "-"}`, 14, y + 9);
      });
    } else {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("FARMACIA", 14, y);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Dirección: Central", 14, y + 5);
      doc.text("Teléfono: -", 14, y + 9);
    }

    // 📅 CAJA DE INFORMACIÓN
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200);
    doc.roundedRect(pageWidth - 95, 26, 81, 20, 3, 3, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN DEL REPORTE", pageWidth - 54, 31, { align: "center" });

    doc.setFont("helvetica", "normal");
    const filtroCortado = filtroNombre.length > 32 ? filtroNombre.substring(0, 29) + "..." : filtroNombre;
    doc.text(`Filtro: ${filtroCortado}`, pageWidth - 90, 37);
    doc.text(`Fecha: ${moment().format("DD/MM/YYYY")}`, pageWidth - 90, 42);

    // Línea separadora
    doc.setDrawColor(41, 128, 185);
    doc.line(14, 49, pageWidth - 14, 49);

    // TITULO TABLA
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DE PRODUCTOS E INVENTARIO", 14, 55);

    const tableColumn = [
      "Cód.",
      "Lote",
      "Producto",
      "N. Genérico",
      "Tipo",
      "Presentación",
      "Laboratorio",
      "P. Compra",
      "P. Venta",
      "Stock",
      "Cas.",
      "Vencimiento",
      "Monto Inv."
    ];

    const tableRows = filteredProductos.map((p) => {
      const tipoNombre = tipo.find((tp) => tp.id === p.idtipo)?.nombre || "N/A";
      const labNombre = laboratorio.find((lab) => lab.id === p.idlaboratorio)?.laboratorioNombre || "N/A";
      const presNombre = presentacion.find((pre) => pre.id === p.idpresentacion)?.nombre || "";
      const presCorto = presentacion.find((pre) => pre.id === p.idpresentacion)?.nombreCorto || "";
      const fullPres = `${presNombre} ${p.concentracion || ""} ${presCorto}`.trim();
      const invertido = (Number(p.precio_compra) || 0) * (Number(p.stock) || 0);

      return [
        p.codigo || "S/D",
        p.lote || "S/D",
        p.nombre || "S/D",
        p.nombre_generico || "S/D",
        tipoNombre,
        fullPres || "N/A",
        labNombre,
        `${Number(p.precio_compra || 0).toFixed(2)} Bs`,
        `${Number(p.precio || 0).toFixed(2)} Bs`,
        p.stock.toString(),
        p.casilla.toString(),
        p.vencimiento ? moment(p.vencimiento).format("DD/MM/YYYY") : "S/D",
        `${invertido.toFixed(2)} Bs`
      ];
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 58,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
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
        2: { halign: "left" },
        3: { halign: "left" },
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    // 💰 RESUMEN TOTAL DE MONTO INVERTIDO Y PRODUCTOS
    let finalY = doc.lastAutoTable.finalY + 8;
    if (finalY > pageHeight - 25) {
      doc.addPage();
      finalY = 15;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 140, finalY - 4, 126, 12, "F");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL PRODUCTOS: ${filteredProductos.length}`, pageWidth - 135, finalY + 4);
    doc.text(`MONTO INVERTIDO: ${montoInvertido.toFixed(2)} Bs`, pageWidth - 18, finalY + 4, { align: "right" });

    // 📄 PIE DE PÁGINA
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Sistema de Gestion Farmaceutica", 14, pageHeight - 8);
    doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth - 14, pageHeight - 8, { align: "right" });

    const fecha = moment().format("YYYY-MM-DD");
    const sufijo = filterVencidos ? "_vencidos" : filterProximosVencer ? "_proximos_a_vencer" : "";
    doc.save(`reporte_productos${sufijo}_${fecha}.pdf`);
  };

  // Lógica de paginación
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredProductos.length,
  );
  const currentProducts = filteredProductos.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // --- AÑADIR ESTO DESPUÉS DE setCurrentPage ---
  const [modalStatus, setModalStatus] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({
    show: false,
    type: "success",
    message: "",
  });

  // Función para disparar el modal
  const showModal = (type: "success" | "error", message: string) => {
    setModalStatus({ show: true, type, message });
  };

  return (
    <div className="flex h-screen relative">
      <NavBarRoot />

      {/* --- MODAL DE NOTIFICACIONES / ALERTAS --- */}
      {modalStatus.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-t-8 border-blue animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              {modalStatus.type === "success" ? (
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              ) : (
                <div className="bg-red-100 p-4 rounded-full mb-4">
                  <AlertCircle className="w-12 h-12 text-red-600" />
                </div>
              )}
              <h3
                className={`text-2xl font-bold mb-2 ${modalStatus.type === "success" ? "text-green-700" : "text-red-700"}`}
              >
                {modalStatus.type === "success" ? "¡Excelente!" : "Atención"}
              </h3>
              <p className="text-gray-600 font-medium mb-6">
                {modalStatus.message}
              </p>
              <button
                onClick={() => setModalStatus({ ...modalStatus, show: false })}
                className="w-full bg-blue text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
              >
                ENTENDIDO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CREACIÓN RÁPIDA (Tipo, Laboratorio, Presentación) --- */}
      {quickModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-t-8 border-blue-600 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-800">
                {quickModal === "tipo" && "Agregar Nuevo Tipo"}
                {quickModal === "laboratorio" && "Agregar Nuevo Laboratorio"}
                {quickModal === "presentacion" && "Agregar Nueva Presentación"}
              </h3>
              <button
                type="button"
                onClick={() => setQuickModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {quickModal === "tipo" && (
              <form onSubmit={handleCreateQuickTipo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Tipo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickTipoName}
                    onChange={(e) => setQuickTipoName(e.target.value)}
                    placeholder="Ej. Comprimidos, Jarabe, Suspensión..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickModal(null)}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuick}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium disabled:opacity-50"
                  >
                    {isSubmittingQuick ? "Guardando..." : "Guardar y Seleccionar"}
                  </button>
                </div>
              </form>
            )}

            {quickModal === "laboratorio" && (
              <form onSubmit={handleCreateQuickLab} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Laboratorio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickLabName}
                    onChange={(e) => setQuickLabName(e.target.value)}
                    placeholder="Ej. Laboratorios Bagó, Pfizer..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickLabDireccion}
                    onChange={(e) => setQuickLabDireccion(e.target.value)}
                    placeholder="Ej. Av. América #123"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickModal(null)}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuick}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium disabled:opacity-50"
                  >
                    {isSubmittingQuick ? "Guardando..." : "Guardar y Seleccionar"}
                  </button>
                </div>
              </form>
            )}

            {quickModal === "presentacion" && (
              <form onSubmit={handleCreateQuickPres} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Presentación <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickPresName}
                    onChange={(e) => setQuickPresName(e.target.value)}
                    placeholder="Ej. Caja, Frasco, Blister..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Corto / Abreviatura <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickPresCorto}
                    onChange={(e) => setQuickPresCorto(e.target.value)}
                    placeholder="Ej. cja, fco, bls..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickModal(null)}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuick}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium disabled:opacity-50"
                  >
                    {isSubmittingQuick ? "Guardando..." : "Guardar y Seleccionar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="p-4 flex-1 overflow-auto">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <h2 className="text-3xl font-bold py-8">Productos</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            {alert.show && (
              <Alert type={alert.type} className="mb-4">
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

          <form
  onSubmit={editProducto ? handleActualizar : handleAgregar}
  className="product-form"
>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {/* Código de Barras */}
    <div className="form-group space-y-2">
      <label className="block text-sm font-medium text-black text-center">
        Código de Barras
      </label>
      <input
        type="text"
        name="codigo"
        value={formData.codigo || ""}
        onChange={handleInputChange}
        className="form-input"
        placeholder="Ingrese código de barras"
      />
    </div>

    {/* Nombre del Producto */}
    <div className="form-group space-y-2">
      <label className="block text-sm font-medium text-black text-center">
        Producto (Comercial)
      </label>
      <input
        type="text"
        name="nombre"
        value={formData.nombre || ""}
        onChange={handleInputChange}
        className="form-input"
        placeholder="Ingrese nombre comercial"
      />
    </div>

    {/* NUEVO: Nombre Genérico */}
    <div className="form-group space-y-2">
      <label className="block text-sm font-medium text-black text-center">
        Nombre Genérico
      </label>
      <input
        type="text"
        name="nombre_generico"
        value={formData.nombre_generico || ""}
        onChange={handleInputChange}
        className="form-input"
        placeholder="Ingrese nombre genérico"
      />
    </div>

    {/* Descripción */}
    <div className="form-group space-y-2">
      <label className="block text-sm font-medium text-black text-center">
        Descripción
      </label>
      <textarea
        name="descripcion"
        value={formData.descripcion || ""}
        onChange={handleInputChange}
        className="form-input h-32 resize-none"
        placeholder="Ingrese descripción"
      />
    </div>

    {/* Tipo - OBLIGATORIO CON CREACIÓN RÁPIDA */}
    <div className="form-group space-y-2">
      <div className="w-full flex items-center justify-between px-1">
        <label className="text-sm font-medium text-black">
          Tipo <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setQuickModal("tipo")}
          className="text-xs text-white px-2 py-0.5 rounded flex items-center gap-1 shadow-sm transition hover:opacity-90 cursor-pointer"
          style={{ background: "#2563eb", color: "#ffffff" }}
          title="Agregar nuevo tipo"
        >
          <Plus size={12} /> Nuevo
        </button>
      </div>
      <select
        name="idtipo"
        value={formData.idtipo || ""}
        onChange={handleInputChange}
        className="block w-full px-3 py-2 mt-1 border rounded shadow-sm focus:ring-blue focus:border-blue"
        required
      >
        <option value="">Seleccione un Tipo</option>
        {tipo.map((tp) => (
          <option key={tp.id} value={tp.id}>
            {tp.nombre}
          </option>
        ))}
      </select>
    </div>

    {/* Concentración */}
    <div className="form-group space-y-1">
      <label className="block text-sm font-medium text-black text-center">
        Concentración
      </label>
      <input
        type="text"
        name="concentracion"
        value={formData.concentracion || 0}
        onChange={handleInputChange}
        className="form-input2"
        placeholder="N"
      />
    </div>

    {/* Presentación - OBLIGATORIO CON CREACIÓN RÁPIDA */}
    <div className="form-group space-y-2">
      <div className="w-full flex items-center justify-between px-1">
        <label className="text-sm font-medium text-black">
          Presentación <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setQuickModal("presentacion")}
          className="text-xs text-white px-2 py-0.5 rounded flex items-center gap-1 shadow-sm transition hover:opacity-90 cursor-pointer"
          style={{ background: "#2563eb", color: "#ffffff" }}
          title="Agregar nueva presentación"
        >
          <Plus size={12} /> Nueva
        </button>
      </div>
      <select
        name="idpresentacion"
        value={formData.idpresentacion || ""}
        onChange={handleInputChange}
        className="block w-full px-3 py-2 mt-1 border rounded shadow-sm focus:ring-blue focus:border-blue"
        required
      >
        <option value="">Seleccione una presentación</option>
        {presentacion.map((tp) => (
          <option key={tp.id} value={tp.id}>
            {tp.nombre}
          </option>
        ))}
      </select>
    </div>

    {/* Laboratorio - OBLIGATORIO CON CREACIÓN RÁPIDA */}
    <div className="form-group space-y-2">
      <div className="w-full flex items-center justify-between px-1">
        <label className="text-sm font-medium text-black">
          Laboratorio <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setQuickModal("laboratorio")}
          className="text-xs text-white px-2 py-0.5 rounded flex items-center gap-1 shadow-sm transition hover:opacity-90 cursor-pointer"
          style={{ background: "#2563eb", color: "#ffffff" }}
          title="Agregar nuevo laboratorio"
        >
          <Plus size={12} /> Nuevo
        </button>
      </div>
      <select
        name="idlaboratorio"
        value={formData.idlaboratorio || ""}
        onChange={handleInputChange}
        className="block w-full px-3 py-2 mt-1 border rounded shadow-sm focus:ring-blue focus:border-blue"
        required
      >
        <option value="">Seleccione Laboratorio</option>
        {laboratorio.map((tp) => (
          <option key={tp.id} value={tp.id}>
            {tp.laboratorioNombre}
          </option>
        ))}
      </select>
    </div>

    {/* Precio Compra - CORREGIDO PARA DECIMALES */}
    <div className="form-group space-y-2">
      <label className="block text-sm font-medium text-black text-center">
        Precio Compra
      </label>
      <input
        type="text"
        name="precio_compra"
        value={formData.precio_compra} 
        onChange={handleInputChange}
        className="form-input"
        placeholder="0.00"
      />
    </div>

    {/* Precio Venta - CORREGIDO PARA DECIMALES */}
    <div className="form-group space-y-2">
      <label className="block text-sm font-medium text-black text-center">
        Precio Venta
      </label>
      <input
        type="text"
        name="precio"
        value={formData.precio} 
        onChange={handleInputChange}
        className="form-input"
        placeholder="0.00"
      />
    </div>

    {/* Stock */}
    <div className="form-group space-y-2">
      <label className="block text-sm font-medium text-black text-center">
        Stock
      </label>
      <input
        type="text"
        name="stock"
        value={formData.stock || 0}
        onChange={handleInputChange}
        className="form-input"
        placeholder="Ingrese stock"
      />
    </div>

    {/* Lote */}
    <div className="form-group space-y-2">
      <label className="block text-sm font-medium text-black text-center">
        Lote
      </label>
      <input
        type="text"
        name="lote"
        value={formData.lote || ""}
        onChange={handleInputChange}
        className="form-input"
        placeholder="Ingrese lote"
      />
    </div>

    {/* Casilla */}
    <div className="form-group space-y-1">
      <label className="block text-sm font-medium text-black text-center">
        Casilla
      </label>
      <input
        type="text"
        name="casilla"
        value={formData.casilla || 0}
        onChange={handleInputChange}
        className="form-input2"
        placeholder="N"
      />
    </div>

    {/* Fecha de Vencimiento */}
    <div className="form-group space-y-2">
      <label className="block text-sm font-medium text-black text-center">
        Fecha de Vencimiento
      </label>
      <input
        type="date"
        name="vencimiento"
        value={formData.vencimiento || ""}
        onChange={handleInputChange}
        className="form-input"
      />
    </div>

    {/* Botones */}
    <div className="form-group flex flex-col space-y-4 mt-8 text-center col-span-full">
      <button
        type="submit"
        className="btn-primary"
        style={{ background: "blue" }}
      >
        {editProducto ? "Actualizar Producto" : "Registrar Producto"}
      </button>
      <button
        type="button"
        onClick={handleReset}
        className="btn-primary"
        style={{ background: "blue" }}
      >
        Nuevo
      </button>
    </div>
  </div>
</form>
            {/* Tabla de Productos */}
            <div className="overflow-x-auto mt-8">
              <div className="search-container flex mb-4">
                <input
                  type="text"
                  className=""
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Resetear a la primera página al buscar
                  }}
                />
                <button
                  style={{ background: "blue" }}
                  className="search-button text-white px-4 rounded-r hover:bg-blue-600 transition"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                >
                  <Search size={18} />
                </button>
              </div>

              {/* --- NUEVO: Filtros combinables (Tipo, Laboratorio, Presentación, Alfabético, Vencidos) --- */}
              <div className="filters-container flex flex-wrap gap-3 items-end mb-4">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1">
                    Tipo
                  </label>
                  <select
                    value={filterTipo}
                    onChange={(e) => {
                      setFilterTipo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1 text-sm focus:ring-blue focus:border-blue"
                  >
                    <option value="">Todos</option>
                    {tipo.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1">
                    Laboratorio
                  </label>
                  <select
                    value={filterLaboratorio}
                    onChange={(e) => {
                      setFilterLaboratorio(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1 text-sm focus:ring-blue focus:border-blue"
                  >
                    <option value="">Todos</option>
                    {laboratorio.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.laboratorioNombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1">
                    Presentación
                  </label>
                  <select
                    value={filterPresentacion}
                    onChange={(e) => {
                      setFilterPresentacion(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1 text-sm focus:ring-blue focus:border-blue"
                  >
                    <option value="">Todas</option>
                    {presentacion.map((pre) => (
                      <option key={pre.id} value={pre.id}>
                        {pre.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-1 text-sm rounded border text-gray-700 hover:bg-gray-100 transition"
                >
                  Limpiar filtros
                </button>

                {/* --- Botón Productos Vencidos --- */}
                <button
                  type="button"
                  onClick={() => {
                    setFilterVencidos((prev) => !prev);
                    setFilterProximosVencer(false);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded border font-medium transition ${
                    filterVencidos
                      ? "text-white border-red-700 shadow"
                      : "text-red-700 border-red-300 hover:bg-red-50"
                  }`}
                  style={filterVencidos ? { background: "#b91c1c", color: "#ffffff" } : {}}
                >
                  <AlertTriangle size={14} />
                  {filterVencidos ? "Viendo Vencidos" : "Productos Vencidos"}
                </button>

                {/* --- Botón Próximos a Vencer --- */}
                <button
                  type="button"
                  onClick={() => {
                    setFilterProximosVencer((prev) => !prev);
                    setFilterVencidos(false);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded border font-medium transition ${
                    filterProximosVencer
                      ? "text-gray-900 border-amber-500 shadow font-bold"
                      : "text-amber-800 border-amber-300 hover:bg-amber-50"
                  }`}
                  style={filterProximosVencer ? { background: "#fbbf24", color: "#111827" } : {}}
                >
                  <Clock size={14} />
                  {filterProximosVencer ? "Viendo Próximos a Vencer" : "Próximos a Vencer (30 días)"}
                </button>

                {/* --- Botones de Exportación (PDF y Excel) --- */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-1 text-sm rounded border font-semibold text-white hover:opacity-90 shadow transition cursor-pointer"
                    style={{ background: "#dc2626", color: "#ffffff" }}
                    title="Exportar listado actual a PDF"
                  >
                    <FaFilePdf size={14} />
                    Exportar PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3 py-1 text-sm rounded border font-semibold text-white hover:opacity-90 shadow transition cursor-pointer"
                    style={{ background: "#15803d", color: "#ffffff" }}
                    title="Exportar listado actual a Excel"
                  >
                    <FaFileExcel size={14} />
                    Exportar Excel
                  </button>
                </div>
              </div>

              {/* --- Botones rápidos A-Z para filtro alfabético --- */}
              <div className="alphabet-quick-filter flex flex-wrap gap-1 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setFilterAlfabeto("");
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 text-xs rounded border ${
                    filterAlfabeto === ""
                      ? "bg-blue text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  style={filterAlfabeto === "" ? { background: "blue" } : {}}
                >
                  Todas
                </button>
                {LETRAS_ALFABETO.map((letra) => (
                  <button
                    key={letra}
                    type="button"
                    onClick={() => {
                      setFilterAlfabeto(letra);
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-1 text-xs rounded border ${
                      filterAlfabeto === letra
                        ? "text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={filterAlfabeto === letra ? { background: "blue" } : {}}
                  >
                    {letra}
                  </button>
                ))}
              </div>

              {/* --- Tarjeta con el Monto Invertido según el filtro activo --- */}
              <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
                <div className="text-sm text-gray-600">
                  {filterVencidos && (
                    <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                      <AlertTriangle size={14} /> Mostrando solo productos vencidos
                    </span>
                  )}
                  {filterProximosVencer && (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                      <Clock size={14} /> Mostrando productos próximos a vencer (30 días)
                    </span>
                  )}
                </div>
                <div
                  className="px-4 py-2 rounded-lg border text-sm font-bold"
                  style={{ background: "#eff6ff", borderColor: "blue", color: "blue" }}
                >
                  Monto Invertido (según filtro actual): {" "}
                  {montoInvertido.toLocaleString("es-BO", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} Bs
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs table-fixed">
                  {" "}
                  {/* table-fixed es clave para que no crezca */}
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-left w-[8%]"
                      >
                        Cód.
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-left w-[8%]"
                      >
                        Lote
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-left w-[12%]"
                      >
                        Nombre
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-left w-[12%]"
                      >
                        N.Generico
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-left w-[15%]"
                      >
                        Descripción
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-left w-[8%]"
                      >
                        Tipo
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-left w-[12%]"
                      >
                        Present.
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-left w-[12%]"
                      >
                        Lab.
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-center w-[7%]"
                      >
                        P. Compra
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-center w-[7%]"
                      >
                        Precio
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-center w-[6%]"
                      >
                        Stock
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-center w-[5%]"
                      >
                        Cas.
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-center w-[8%]"
                      >
                        Venc.
                      </th>
                      <th
                        style={{ background: "blue" }}
                        className="px-2 py-2 text-center w-[10%]"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProductos.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-4">
                          No hay resultados
                        </td>
                      </tr>
                    ) : (
                      currentProducts.map((product) => {
                        const tipoNombre =
                          tipo.find((tp) => tp.id === product.idtipo)?.nombre ||
                          "N/A";
                        const labNombre =
                          laboratorio.find(
                            (lab) => lab.id === product.idlaboratorio,
                          )?.laboratorioNombre || "N/A";
                        const presNombre =
                          presentacion.find(
                            (pre) => pre.id === product.idpresentacion,
                          )?.nombre || "";
                        const presCorto =
                          presentacion.find(
                            (pre) => pre.id === product.idpresentacion,
                          )?.nombreCorto || "";
                        const fullPres = `${presNombre} ${product.concentracion || ""} ${presCorto}`;

                        // Saber si este producto en particular está vencido o próximo a vencer
                        const diasRestantes = getDiasParaVencer(product.vencimiento);
                        const estaVencido = diasRestantes !== null && diasRestantes <= 0;
                        const estaProximo = diasRestantes !== null && diasRestantes > 0 && diasRestantes <= 30;

                        return (
                          <tr
                            key={product.id}
                            className={`hover:bg-gray-50 transition-colors ${
                              estaVencido ? "bg-red-50" : estaProximo ? "bg-amber-50" : ""
                            }`}
                          >
                            {/* Celda Nombre con Tooltip */}
                            <td className="px-2 py-1.5 border-r relative group">
                              <span className="truncate block cursor-help">
                                {product.codigo}
                              </span>
                              <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                                {product.codigo}
                              </div>
                            </td>
                            {/* Celda Nombre con Tooltip */}
                            <td className="px-2 py-1.5 border-r relative group">
                              <span className="truncate block cursor-help">
                                {product.lote}
                              </span>
                              <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                                {product.lote}
                              </div>
                            </td>

                            {/* Celda Nombre con Tooltip */}
                            <td className="px-2 py-1.5 border-r relative group">
                              <span className="truncate block cursor-help">
                                {product.nombre}
                              </span>
                              <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                                {product.nombre}
                              </div>
                            </td>
                            {/* Celda Nombre con Tooltip */}
                            <td className="px-2 py-1.5 border-r relative group">
                              <span className="truncate block cursor-help">
                                {product.nombre_generico}
                              </span>
                              <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                                {product.nombre_generico}
                              </div>
                            </td>
                            {/* Celda Descripción con Tooltip */}
                            <td className="px-2 py-1.5 border-r relative group">
                              <span className="truncate block cursor-help">
                                {product.descripcion}
                              </span>
                              <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-64 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                                {product.descripcion}
                              </div>
                            </td>
                            <td className="px-2 py-1.5 border-r relative group">
                              <span className="truncate block cursor-help">
                                {tipoNombre}
                              </span>
                              <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-32 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                                {tipoNombre}
                              </div>
                            </td>

                            {/* Celda Presentación con Tooltip */}
                            <td className="px-2 py-1.5 border-r relative group">
                              <span className="truncate block cursor-help">
                                {fullPres}
                              </span>
                              <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                                {fullPres}
                              </div>
                            </td>

                            {/* Celda Laboratorio con Tooltip */}
                            <td className="px-2 py-1.5 border-r relative group">
                              <span className="truncate block cursor-help">
                                {labNombre}
                              </span>
                              <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                                {labNombre}
                              </div>
                            </td>

                            <td className="px-2 py-1.5 text-center border-r font-semibold text-green-700">
                              {product.precio_compra.toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 text-center border-r font-semibold text-blue-700">
                              {product.precio.toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 text-center border-r">
                              {product.stock}
                            </td>
                            <td className="px-2 py-1.5 text-center border-r">
                              {product.casilla}
                            </td>
                            <td
                              className={`px-2 py-1.5 text-center border-r text-[10px] ${
                                estaVencido
                                  ? "text-red-700 font-bold"
                                  : estaProximo
                                  ? "text-amber-700 font-bold"
                                  : ""
                              }`}
                            >
                              {product.vencimiento ? moment(product.vencimiento).format("DD/MM/YYYY") : "S/D"}
                              {estaVencido && <span className="block text-[9px] text-red-600 font-semibold">(Vencido)</span>}
                              {estaProximo && <span className="block text-[9px] text-amber-700 font-semibold">({diasRestantes} d)</span>}
                            </td>

                            <td className="px-2 py-1.5 flex gap-1 justify-center items-center">
                              <button
                                style={{ background: "blue" }}
                                className="p-1 rounded text-white hover:scale-110 transition-transform"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="p-1 rounded text-white bg-red hover:scale-110 transition-transform"
                                onClick={() => handleEliminar(product.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {filteredProductos.length > 0 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando registros del {startIndex + 1} al{" "}
                  {Math.min(endIndex, filteredProductos.length)}
                  de un total de {filteredProductos.length} registros
                </div>
                <div className="pagination-buttons flex gap-2">
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <button
                    style={{ background: "blue" }}
                    className="px-3 py-1 rounded text-white"
                  >
                    {currentPage}
                  </button>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductManagement;
