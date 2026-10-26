import { useEffect, useState } from "react";
import NavBarRoot from "./NavBarRoot";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { motion } from "framer-motion";
import {
  Plus,
  Minus,
  ShoppingCart,
  Calendar,
  Search,
  User,
  Package,
  Clock,
  X,
  AlertCircle,
  CheckCircle,
  UserPlus
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: any;
  }
}

interface Venta {
  id: number;
  total: number;
  fecha: string;
  idusuario: number;
  idcliente: number;
  tipoPago:string;
}

interface Detalle_Ventas {
  id: number;
  cantidad: number;
  descuento: number;
  precio: number;
  total: number;
  idproducto: number;
  idventa: number;
}

interface Clientes {
  id: number;
  nombre: string;
  ci: string;
  telefono: number;
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
  stock: number;
  casilla: number;
  nombre: string;
  descripcion: string;
  precio: number;
  precio_compra?: number;
  concentracion: number;
  eliminado?: boolean;
  idpresentacion: number;
  idlaboratorio: number;
  idtipo: number;
  lote: string;
  nombre_generico: string;
  vencimiento: string;
  fecha?: string | null;
}

interface DetalleCotizacion {
  idproducto: number;
  nombreProducto: string;
  cantidad: number;
  stockDisponible?: number;
  precioCompra: number;
  precioParticular: number;
  precioConvenio: number;
  descuentoUnitario: number;
  descuentoTotal: number;
  subtotal: number;
  total: number;
}

interface CotizacionVenta {
  idcliente: number;
  nombreCliente: string;
  idseguro: number | null;
  nombreSeguro: string;
  porcentajeSeguro: number;
  esSeguro: boolean;
  subtotal: number;
  descuentoTotal: number;
  total: number;
  detalles: DetalleCotizacion[];
}

interface Tipo {
  id: number;
  nombre: string;
}

interface Presentacion {
  id: number;
  nombre: string;
  nombreCorto: string;
}

interface Laboratory {
  id: number;
  laboratorioNombre: string;
}

interface Usuario {
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

// Letras del abecedario para el filtro alfabético
const LETRAS_ALFABETO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'error' | 'success';
}

function Modal({ isOpen, onClose, title, message, type }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <div className={`flex items-center justify-center h-12 w-12 rounded-full ${type === 'error' ? 'bg-red' : 'bg-green-100'} mx-auto mb-4`}>
          {type === 'error' ? (
            <AlertCircle className="h-6 w-6 text-red-600" />
          ) : (
            <CheckCircle className="h-6 w-6 text-green-600" />
          )}
        </div>
        <h3 className="text-lg font-medium text-gray-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{message}</p>
        <div className="flex justify-center">
       <button 
  onClick={onClose}
  className="px-4 py-2 text-sm font-medium rounded-md bg-red hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
>
  Entendido
</button>
        </div>
      </motion.div>
    </div>
  );
}
// Función auxiliar para calcular días restantes y su estilo visual
function obtenerDiasRestantes(fechaVencimientoStr: string) {
  if (!fechaVencimientoStr) return { texto: "N/A", clase: "text-gray-500 font-medium" };

  const hoy = new Date();
  // Resetear horas, minutos y segundos para comparar solo días exactos
  hoy.setHours(0, 0, 0, 0);

  const fechaVence = new Date(fechaVencimientoStr);
  fechaVence.setHours(0, 0, 0, 0);

  // Calcular diferencia en milisegundos y pasarla a días
  const diferenciaTiempo = fechaVence.getTime() - hoy.getTime();
  const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) {
    return { texto: `Vencido hace ${Math.abs(diasRestantes)} d`, clase: "text-red-600 font-bold bg-red-100 px-1.5 py-0.5 rounded" };
  } else if (diasRestantes === 0) {
    return { texto: "Vence HOY", clase: "text-orange-600 font-bold bg-orange-100 px-1.5 py-0.5 rounded animate-pulse" };
  } else if (diasRestantes <= 30) {
    return { texto: `${diasRestantes} d (Próximo)`, clase: "text-yellow-600 font-semibold bg-yellow-100 px-1.5 py-0.5 rounded" };
  } else {
    return { texto: `${diasRestantes} d`, clase: "text-green-600 font-medium" };
  }
}

function Ventas() {
  const [usuarios, setUsuarios] = useState<Clientes[]>([]);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [filterClienteSeguro, setFilterClienteSeguro] = useState("");
  
const hoy = new Date().toISOString().split("T")[0];
  const [producto, setProducto] = useState<Producto[]>([]);
  const [venta, setVenta] = useState<Venta[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([]);
  const [Dventa, setDVenta] = useState<Detalle_Ventas[]>([]);
  const [addVenta, setAddVenta] = useState<Partial<Venta>>({
    fecha: hoy,
    total: 0,
    idusuario: 0,
    idcliente: 0,
    tipoPago:""
  });
  const [tipo, setTipos] = useState<Tipo[]>([]);
  const [presentacion, setPresentacion] = useState<Presentacion[]>([]);
  const [laboratorio, setLaboratorio] = useState<Laboratory[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [search, setSearch] = useState("");
  const [searchProducto, setSearchProducto] = useState("");

  // --- NUEVO: estados de filtros combinables para Productos Disponibles ---
  const [filterTipo, setFilterTipo] = useState("");
  const [filterLaboratorio, setFilterLaboratorio] = useState("");
  const [filterPresentacion, setFilterPresentacion] = useState("");
  const [filterAlfabeto, setFilterAlfabeto] = useState("");
  const [selectedUser, setSelectedUser] = useState<Clientes | null>(null);
  const [selectedProducto, setSelectedProducto] = useState<Producto[]>([]);
  const [cantidadProducto, setCantidadProducto] = useState<{
    [key: number]: number;
  }>({});
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error" as "error" | "success"
  });

  // --- NUEVO: estado para el formulario de "Agregar Cliente" en línea ---
  const [showAddCliente, setShowAddCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({
    nombre: "",
    ci: "",
    telefono: "",
    direccion: "",
    idseguro: "",
  });
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [cotizacion, setCotizacion] = useState<CotizacionVenta | null>(null);

  const name = localStorage.getItem("userName");
  
  // --- COTIZACIÓN Y CÁLCULO DE PRECIOS (PARTICULAR VS SEGURO) ---
  useEffect(() => {
    if (selectedProducto.length === 0) {
      setCotizacion(null);
      setTotalGeneral(0);
      return;
    }

    // 1. Cálculo local inmediato (feedback en tiempo real sin latencia)
    const clienteSeguro = selectedUser?.idseguro
      ? seguros.find((s) => s.id === selectedUser.idseguro)
      : null;
    const esSeguro = Boolean(clienteSeguro);
    const porcentajeSeguro = Number(clienteSeguro?.porcentaje ?? 25);

    let subtotalAcum = 0;
    let descuentoTotalAcum = 0;
    let totalAcum = 0;

    const detallesCalculados: DetalleCotizacion[] = selectedProducto.map((p) => {
      const cant = cantidadProducto[p.id] || 1;
      const precioParticular = Number(p.precio) || 0;
      const precioCompra = Number(p.precio_compra) > 0 ? Number(p.precio_compra) : precioParticular / 1.3;

      if (esSeguro) {
        // Precio Convenio Unitario: Math.Round(producto.precio_compra * (1 + (porcentaje / 100)), 2)
        const precioConvenio = Math.round(precioCompra * (1 + (porcentajeSeguro / 100)) * 100) / 100;
        const descuentoUnitario = Math.max(0, Math.round((precioParticular - precioConvenio) * 100) / 100);
        const descuentoTotal = Math.round(descuentoUnitario * cant * 100) / 100;
        const subtotal = Math.round(precioParticular * cant * 100) / 100;
        const total = Math.round(precioConvenio * cant * 100) / 100;

        subtotalAcum += subtotal;
        descuentoTotalAcum += descuentoTotal;
        totalAcum += total;

        return {
          idproducto: p.id,
          nombreProducto: p.nombre,
          cantidad: cant,
          stockDisponible: p.stock,
          precioCompra,
          precioParticular,
          precioConvenio,
          descuentoUnitario,
          descuentoTotal,
          subtotal,
          total,
        };
      } else {
        const subtotal = Math.round(precioParticular * cant * 100) / 100;
        subtotalAcum += subtotal;
        totalAcum += subtotal;

        return {
          idproducto: p.id,
          nombreProducto: p.nombre,
          cantidad: cant,
          stockDisponible: p.stock,
          precioCompra,
          precioParticular,
          precioConvenio: precioParticular,
          descuentoUnitario: 0,
          descuentoTotal: 0,
          subtotal,
          total: subtotal,
        };
      }
    });

    const cotizacionLocal: CotizacionVenta = {
      idcliente: selectedUser ? selectedUser.id : 0,
      nombreCliente: selectedUser ? selectedUser.nombre : "Particular",
      idseguro: selectedUser?.idseguro ?? null,
      nombreSeguro: clienteSeguro?.nombre || (esSeguro ? "Seguro" : "Particular"),
      porcentajeSeguro: esSeguro ? porcentajeSeguro : 0,
      esSeguro,
      subtotal: subtotalAcum,
      descuentoTotal: descuentoTotalAcum,
      total: totalAcum,
      detalles: detallesCalculados,
    };

    setCotizacion(cotizacionLocal);
    setTotalGeneral(cotizacionLocal.total);

    // 2. Consulta al backend (POST /api/Ventas/CalcularVenta) para sincronización exacta
    if (selectedUser && selectedUser.id) {
      const itemsPayload = selectedProducto.map((p) => ({
        idproducto: p.id,
        cantidad: cantidadProducto[p.id] || 1,
      }));

      fetch("http://localhost:5000/api/Ventas/CalcularVenta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idcliente: selectedUser.id,
          items: itemsPayload,
        }),
      })
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data: CotizacionVenta | null) => {
          if (data && data.detalles && Array.isArray(data.detalles)) {
            setCotizacion(data);
            setTotalGeneral(data.total);
          }
        })
        .catch((err) => {
          console.error("Error al cotizar venta en el backend:", err);
        });
    }
  }, [selectedProducto, cantidadProducto, selectedUser, seguros]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseProductos = await fetch(
          "http://localhost:5000/api/Productos/ListarProductosActivos"
        );
        const dataProductos = await responseProductos.json();
        setProducto(dataProductos);

        const responseVentas = await fetch(
          "http://localhost:5000/api/Ventas/ListarVentasActivos"
        );
        const dataVentas = await responseVentas.json();
        setVenta(dataVentas);

        const responseUsuario = await fetch(
          "http://localhost:5000/api/Clientes/ListarClientesActivos"
        );
        const dataUsuarios = await responseUsuario.json();
        setUsuarios(dataUsuarios);

        const responseDVenta = await fetch(
          "http://localhost:5000/api/Detalle_Ventas/ListarDetalleVentasActivos"
        );
        const dataDventa = await responseDVenta.json();
        setDVenta(dataDventa);
      } catch (error) {
        console.error("Error fetching data:", error);
      }

      const responseTipos = await fetch(
        "http://localhost:5000/api/Tipos/ListarTiposActivos"
      );
      const dataTipos = await responseTipos.json();
      setTipos(dataTipos);

      const responseLaboratorios = await fetch(
        "http://localhost:5000/api/Laboratorios/ListarLaboratoriosActivos"
      );
      const dataLaboratorios = await responseLaboratorios.json();
      setLaboratorio(dataLaboratorios);

      const responsePresentacion = await fetch(
        "http://localhost:5000/api/Presentaciones/ListarPresentacionesActivos"
      );
      const dataPresentacion = await responsePresentacion.json();
      setPresentacion(dataPresentacion);

      try {
        const responseSeguros = await fetch(
          "http://localhost:5000/api/Seguros/ListarSegurosActivos"
        );
        if (responseSeguros.ok) {
          const dataSeguros = await responseSeguros.json();
          setSeguros(dataSeguros);
        }
      } catch (err) {
        console.error("Error al obtener seguros en ventas:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/Configuracions/ListarConfiguracionActivos')
      .then(response => response.json())
      .then(data => setConfiguracion(data))
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    productoId: number
  ) => {
    const value = parseInt(event.target.value, 10);
    if (isNaN(value) || value < 0) return;
    
    // Verificar stock disponible
    const productoSeleccionado = producto.find(p => p.id === productoId);
    if (productoSeleccionado && value > productoSeleccionado.stock) {
      setModal({
        isOpen: true,
        title: "Stock Insuficiente",
        message: `No hay suficiente stock disponible. Solo quedan ${productoSeleccionado.stock} unidades.`,
        type: "error"
      });
      return;
    }
    
    setCantidadProducto((prev) => ({
      ...prev,
      [productoId]: value,
    }));
  };

  const calcularTotal = () => {
    return selectedProducto.reduce((acumulado, producto) => {
      const cantidad = cantidadProducto[producto.id] || 1;
      return acumulado + cantidad * producto.precio;
    }, 0);
  };

  // --- NUEVO: manejar cambios del formulario de nuevo cliente ---
  const handleNewClienteChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewCliente((prev) => ({ ...prev, [name]: value }));
  };

  // --- NUEVO: crear cliente desde el mismo formulario de Ventas ---
  const handleAgregarCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreFinal = newCliente.nombre.trim() || "S/D";
    const ciFinal = newCliente.ci.trim() || "S/D";
    const telefonoFinal = newCliente.telefono.trim() || "S/D";
    const direccionFinal = newCliente.direccion.trim() || "S/D";

    setGuardandoCliente(true);

    try {
      let url = `http://localhost:5000/api/Clientes/Crear?nombre=${encodeURIComponent(
        nombreFinal
      )}&ci=${encodeURIComponent(ciFinal)}&telefono=${encodeURIComponent(
        telefonoFinal
      )}&direccion=${encodeURIComponent(direccionFinal)}`;

      if (newCliente.idseguro) {
        url += `&idseguro=${newCliente.idseguro}`;
      }

      const response = await fetch(url, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Error al crear el cliente.");
      }

      const nuevoCliente = await response.json();

      // Agregar el nuevo cliente a la lista local
      setUsuarios((prev) => [...prev, nuevoCliente]);

      // Seleccionarlo automáticamente como cliente de la venta actual
      setSelectedUser(nuevoCliente);

      // Limpiar el formulario y cerrarlo
      setNewCliente({ nombre: "", ci: "", telefono: "", direccion: "", idseguro: "" });
      setShowAddCliente(false);

      setModal({
        isOpen: true,
        title: "Cliente Agregado",
        message: `El cliente "${nuevoCliente.nombre}" se registró y fue seleccionado para la venta.`,
        type: "success",
      });
    } catch (error) {
      console.error("Error al crear el cliente:", error);
      setModal({
        isOpen: true,
        title: "Error",
        message: "Ha ocurrido un error al registrar el cliente. Por favor, intente nuevamente.",
        type: "error",
      });
    } finally {
      setGuardandoCliente(false);
    }
  };

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!addVenta.fecha) {
      setModal({
        isOpen: true,
        title: "Fecha Requerida",
        message: "Debe seleccionar una fecha para la venta.",
        type: "error"
      });
      return;
    }

    if (selectedProducto.length === 0) {
      setModal({
        isOpen: true,
        title: "Productos Requeridos",
        message: "Debe seleccionar al menos un producto para realizar la venta.",
        type: "error"
      });
      return;
    }

    if (!selectedUser || !selectedUser.id) {
      setModal({
        isOpen: true,
        title: "Cliente Requerido",
        message: "Debe seleccionar un cliente para realizar la venta.",
        type: "error"
      });
      return;
    }

    const iduser = localStorage.getItem("userId");
    const currentCotizacion = cotizacion;
    const totalVentaFinal = currentCotizacion ? currentCotizacion.total : totalGeneral;

    const queryParams = new URLSearchParams({
      fecha: addVenta.fecha,
      total: totalVentaFinal.toFixed(2),
      idusuario: iduser ? iduser : "0",
      idcliente: selectedUser.id.toString(),
      tipoPago: addVenta.tipoPago || "Efectivo"
    }).toString();

    try {
      const responseVenta = await fetch(
        `http://localhost:5000/api/Ventas/Crear?${queryParams}`,
        {
          method: "POST",
        }
      );

      if (!responseVenta.ok) {
        throw new Error("Error al crear la venta.");
      }

      const newVenta = await responseVenta.json();
      const idventa = newVenta.id;

      for (const producto of selectedProducto) {
        const cantidad = cantidadProducto[producto.id] || 1;
        const detItem = currentCotizacion?.detalles?.find((d) => d.idproducto === producto.id);
        const descuentoItem = detItem ? detItem.descuentoTotal : 0;
        const precioParticular = detItem ? detItem.precioParticular : producto.precio;
        const totalDetalle = detItem ? detItem.total : (cantidad * producto.precio);

        const queryParamsDetalle = new URLSearchParams({
          cantidad: cantidad.toString(),
          descuento: descuentoItem.toFixed(2),
          precio: precioParticular.toFixed(2),
          total: totalDetalle.toFixed(2),
          idproducto: producto.id.toString(),
          idventa: idventa.toString(),
        }).toString();

        const responseDetalle = await fetch(
          `http://localhost:5000/api/Detalle_Ventas/Crear?${queryParamsDetalle}`,
          {
            method: "POST",
          }
        );

        if (!responseDetalle.ok) {
          throw new Error("Error al crear el detalle de la venta.");
        }
      }

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

          // ENCABEZADO
          doc.setFontSize(12);
          doc.setFont(undefined, "bold");

          configuracion.forEach((item) => {
            doc.text(item.nombre, pageWidth / 2, 15, { align: "center" });

            doc.setFontSize(8);
            doc.setFont(undefined, "normal");

            doc.text(`Direccion: ${item.direccion}`, margin, 20);
            doc.text(`Cel: ${item.telefono}`, margin, 24);
          });

          doc.setFontSize(8);

          // NUMERO RECIBO
          doc.text(`Recibo Nro: ${Math.floor(Math.random() * 1000000000)}`, margin, 30);

          doc.setDrawColor(0);
          doc.setLineWidth(0.2);
          doc.line(margin, 33, pageWidth - margin, 33);

          const now = new Date();
          const fecha = now.toLocaleDateString();
          const hora = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });

          // CLIENTE
          let currentY = 38;
          doc.text(`Sr(a): ${selectedUser.nombre}`.substring(0, 30), margin, currentY);
          currentY += 4;
          doc.text(`CI/NIT: ${selectedUser.ci}`.substring(0, 35), margin, currentY);
          currentY += 4;

          if (currentCotizacion?.esSeguro) {
            doc.setFont(undefined, "bold");
            doc.text(`SEGURO: ${currentCotizacion.nombreSeguro} (${currentCotizacion.porcentajeSeguro}%)`.substring(0, 35), margin, currentY);
            doc.setFont(undefined, "normal");
            currentY += 4;
          }

          doc.text(`FECHA: ${fecha}`, margin, currentY);
          doc.text(`${hora}`, margin + 25, currentY);
          currentY += 4;

          doc.line(margin, currentY, pageWidth - margin, currentY);
          currentY += 5;

          // CABECERA TABLA
          doc.setFont(undefined, "bold");
          doc.text("CANT", margin, currentY);
          doc.text("CONCEPTO", margin + 12, currentY);
          doc.text("P.U.", margin + 45, currentY);
          doc.text("IMP.", margin + 58, currentY);
          doc.setFont(undefined, "normal");

          let yPos = currentY + 6;

          // PRODUCTOS
          selectedProducto.forEach((producto) => {
            const cantidad = cantidadProducto[producto.id] || 1;
            const det = currentCotizacion?.detalles?.find((d) => d.idproducto === producto.id);
            const pu = currentCotizacion?.esSeguro && det ? det.precioConvenio : producto.precio;
            const imp = currentCotizacion?.esSeguro && det ? det.total : cantidad * producto.precio;

            const nombreDividido = doc.splitTextToSize(producto.nombre, 28);

            doc.text(String(cantidad), margin, yPos);
            doc.text(nombreDividido, margin + 12, yPos);
            doc.text(pu.toFixed(2), margin + 45, yPos);
            doc.text(imp.toFixed(2), margin + 58, yPos);

            yPos += Math.max(nombreDividido.length * 4.5, 5);
          });

          // LINEA ANTES DEL TOTAL
          doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
          yPos += 7;

          if (currentCotizacion?.esSeguro) {
            doc.setFontSize(8);
            doc.text("SUBTOTAL:", margin + 22, yPos);
            doc.text(`${currentCotizacion.subtotal.toFixed(2)} Bs`, pageWidth - margin, yPos, { align: "right" });
            yPos += 5;

            doc.text(`DESC. SEGURO:`, margin + 22, yPos);
            doc.text(`-${currentCotizacion.descuentoTotal.toFixed(2)} Bs`, pageWidth - margin, yPos, { align: "right" });
            yPos += 5;
          }

          // TOTAL
          doc.setFont(undefined, "bold");
          doc.setFontSize(10);

          doc.text("TOTAL:", margin + 22, yPos);
          doc.text(`${totalVentaFinal.toFixed(2)} Bs`, pageWidth - margin, yPos, { align: "right" });

          doc.setFont(undefined, "normal");
          yPos += 8;

          // VENDEDOR
          doc.setFontSize(8);
          doc.text(`Vendedor: ${name}`, margin, yPos);
          yPos += 6;

          doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);
          yPos += 8;

          doc.text("GRACIAS POR SU COMPRA.", pageWidth / 2, yPos, { align: "center" });

          doc.save(`recibo_${selectedUser.nombre}_${fecha}.pdf`);

        } catch (error) {
          console.error("Error al generar la factura:", error);
        }
      };

      generarPDF();

      setVenta([...venta, newVenta]);
      setAddVenta({});
      setSelectedProducto([]);
      setCantidadProducto({});
      setCotizacion(null);
      setTotalGeneral(0);
      
      // Mostrar modal de éxito
      setModal({
        isOpen: true,
        title: "Venta Realizada",
        message: "La venta se ha registrado correctamente y el PDF se ha generado.",
        type: "success"
      });
    } catch (error) {
      console.error("Error en la solicitud:", error);
      setModal({
        isOpen: true,
        title: "Error",
        message: "Ha ocurrido un error al procesar la venta. Por favor, intente nuevamente.",
        type: "error"
      });
    }
  };

  const handleSelectProducto = (producto: Producto) => {
    // Verificar si ya está seleccionado
    if (selectedProducto.some((p) => p.id === producto.id)) {
      setSelectedProducto((prevSelected) => prevSelected.filter((p) => p.id !== producto.id));
      setCantidadProducto((prev) => {
        const newCantidadProducto = { ...prev };
        delete newCantidadProducto[producto.id];
        return newCantidadProducto;
      });
    } else {
      // Verificar stock antes de agregar
      if (producto.stock < 1) {
        setModal({
          isOpen: true,
          title: "Sin Stock",
          message: "Este producto no tiene stock disponible.",
          type: "error"
        });
        return;
      }
      
      // Al agregar producto, establecer cantidad por defecto a 1
      setCantidadProducto((prev) => ({
        ...prev,
        [producto.id]: 1,
      }));
      setSelectedProducto((prevSelected) => [...prevSelected, producto]);
    }
  };

  // Función para quitar producto específico de la factura
  const handleRemoveProducto = (productoId: number) => {
    setSelectedProducto((prev) => prev.filter((p) => p.id !== productoId));
    setCantidadProducto((prev) => {
      const newCantidadProducto = { ...prev };
      delete newCantidadProducto[productoId];
      return newCantidadProducto;
    });
  };

  const filteredUsuarios = (search.trim() || filterClienteSeguro)
    ? usuarios.filter((usuario) => {
        if (usuario.eliminado) return false;
        const matchesSearch =
          !search.trim() ||
          (usuario.ci && String(usuario.ci).toLowerCase().includes(search.toLowerCase())) ||
          (usuario.nombre && usuario.nombre.toLowerCase().includes(search.toLowerCase()));

        const matchesSeguro =
          filterClienteSeguro === ""
            ? true
            : filterClienteSeguro === "sin_seguro"
            ? !usuario.idseguro
            : usuario.idseguro === Number(filterClienteSeguro);

        return matchesSearch && matchesSeguro;
      })
    : [];

  // --- NUEVO: limpiar filtros de Productos Disponibles ---
  const handleClearFiltrosProducto = () => {
    setSearchProducto("");
    setFilterTipo("");
    setFilterLaboratorio("");
    setFilterPresentacion("");
    setFilterAlfabeto("");
  };

  // Filtrado de productos (buscador + tipo + laboratorio + presentación + alfabeto, todos combinables)
  const filteredProducto = producto
    .filter((producto) => {
      if (producto.eliminado) return false;

      const coincideBusqueda =
        searchProducto.trim() === "" ||
        producto.nombre.toLowerCase().includes(searchProducto.toLowerCase()) ||
        producto.lote.toLowerCase().includes(searchProducto.toLowerCase()) ||
        producto.nombre_generico
          .toLowerCase()
          .includes(searchProducto.toLowerCase()) ||
        producto.descripcion.toLowerCase().includes(searchProducto.toLowerCase());

      const coincideTipo =
        filterTipo === "" || producto.idtipo === Number(filterTipo);

      const coincideLaboratorio =
        filterLaboratorio === "" ||
        producto.idlaboratorio === Number(filterLaboratorio);

      const coincidePresentacion =
        filterPresentacion === "" ||
        producto.idpresentacion === Number(filterPresentacion);

      const coincideAlfabeto =
        filterAlfabeto === "" ||
        producto.nombre.toUpperCase().startsWith(filterAlfabeto.toUpperCase());

      return (
        coincideBusqueda &&
        coincideTipo &&
        coincideLaboratorio &&
        coincidePresentacion &&
        coincideAlfabeto
      );
    })
    // --- NUEVO: orden alfabético real (A-Z) por nombre, respetando la Ñ y acentos del español ---
    .sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
    );

  return (
    <div className="flex h-screen bg-gray-50">
      <NavBarRoot />

      <div className="flex-1 overflow-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div
            style={{ background: "blue" }}
            className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 mb-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">
                Sistema de Ventas
              </h2>
              <div className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                <span className="text-xl font-semibold">
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search and Client Selection Section */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Selección de Cliente
                  </span>
                  {/* --- NUEVO: botón para mostrar/ocultar el formulario de nuevo cliente --- */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddCliente((prev) => !prev)}
                    className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 text-xs rounded-lg hover:from-green-600 hover:to-green-700 transition-colors shadow-sm"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {showAddCliente ? "Cancelar" : "Nuevo Cliente"}
                  </motion.button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* --- NUEVO: formulario en línea para crear cliente --- */}
                {showAddCliente && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    onSubmit={handleAgregarCliente}
                    className="mb-4 p-3 bg-gray-50 rounded-lg border space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Nombre
                        </label>
                        <input
                          type="text"
                          name="nombre"
                          value={newCliente.nombre}
                          onChange={handleNewClienteChange}
                          placeholder="Nombre del cliente"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          CI/NIT
                        </label>
                        <input
                          type="text"
                          name="ci"
                          value={newCliente.ci}
                          onChange={handleNewClienteChange}
                          placeholder="Carnet de identidad"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="text"
                          name="telefono"
                          value={newCliente.telefono}
                          onChange={handleNewClienteChange}
                          placeholder="Número de teléfono"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Dirección
                        </label>
                        <input
                          type="text"
                          name="direccion"
                          value={newCliente.direccion}
                          onChange={handleNewClienteChange}
                          placeholder="Dirección"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Seguro Médico (Opcional)
                        </label>
                        <select
                          name="idseguro"
                          value={newCliente.idseguro}
                          onChange={handleNewClienteChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                        >
                          <option value="">Particular (Sin Seguro)</option>
                          {seguros.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                   
                    <motion.button
                      type="submit"
                      disabled={guardandoCliente}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md text-sm disabled:opacity-60"
                    >
                      {guardandoCliente ? "Guardando..." : "Guardar Cliente"}
                    </motion.button>
                  </motion.form>
                )}

                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Buscar cliente (Nombre o CI)..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-3 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <select
                    value={filterClienteSeguro}
                    onChange={(e) => setFilterClienteSeguro(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 text-gray-700 min-w-[150px]"
                  >
                    <option value="">Todos los seguros</option>
                    <option value="sin_seguro">Particular (Sin seguro)</option>
                    {seguros.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-blue text-white">
                      <tr>
                        <th className="px-3 py-2 text-left bg-blue font-medium">Nombre</th>
                        <th className="px-3 py-2 text-left bg-blue font-medium">CI</th>
                        <th className="px-3 py-2 text-left bg-blue font-medium">Teléfono</th>
                        <th className="px-3 py-2 text-left bg-blue font-medium">Seguro</th>
                        <th className="px-3 py-2 text-center bg-blue font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsuarios.map((usuario) => (
                        <motion.tr
                          key={usuario.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                          className="border-t"
                        >
                          <td className="px-3 py-2 font-medium">{usuario.nombre}</td>
                          <td className="px-3 py-2">{usuario.ci}</td>
                          <td className="px-3 py-2">{usuario.telefono}</td>
                          <td className="px-3 py-2">
                            {usuario.idseguro ? (
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium border border-blue-200">
                                {seguros.find((s) => s.id === usuario.idseguro)?.nombre || `Seguro #${usuario.idseguro}`}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">Particular</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedUser(usuario)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 text-xs rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors shadow-sm"
                            >
                              Seleccionar
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Section */}
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShoppingCart className="h-5 w-5" />
                      Factura
                    </CardTitle>
                  </CardHeader><CardContent className="pt-0">
  <div className="space-y-4">
    
    <div className="flex items-center gap-4">
      <Calendar className="h-5 w-5 text-gray-500" />
      <input
        type="date"
        value={addVenta.fecha || ""}
        onChange={(e) =>
          setAddVenta({ ...addVenta, fecha: e.target.value })
        }
        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>

    {/* NUEVO SELECT TIPO PAGO */}
    <div className="flex items-center gap-4">
      <span className="text-gray-500 font-medium">Tipo de Pago:</span>

      <select
        value={addVenta.tipoPago || ""}
        onChange={(e) =>
          setAddVenta({ ...addVenta, tipoPago: e.target.value })
        }
        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
      >
        <option value="">Seleccionar</option>
        <option value="QR">QR</option>
        <option value="Efectivo">Efectivo</option>
      </select>
    </div>

    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 font-medium">Cliente:</span>
        <p>{selectedUser.nombre} CI/NIT: {selectedUser.ci}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 font-medium">Teléfono:</span>
        <p>{selectedUser.telefono}</p>
      </div>
      {selectedUser.idseguro && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">Seguro:</span>
          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {cotizacion?.nombreSeguro || seguros.find((s) => s.id === selectedUser.idseguro)?.nombre || `Seguro #${selectedUser.idseguro}`}
            {cotizacion?.porcentajeSeguro ? ` (${cotizacion.porcentajeSeguro}%)` : ""}
          </span>
        </div>
      )}
    </div>

    {selectedProducto.length > 0 && (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-semibold">Productos Seleccionados</h3>
          {cotizacion?.esSeguro && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold border border-green-200">
              Convenio {cotizacion.nombreSeguro} ({cotizacion.porcentajeSeguro}%)
            </span>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-2 py-1.5 text-left bg-blue font-medium">Producto</th>
                {cotizacion?.esSeguro ? (
                  <>
                    <th className="px-2 py-1.5 text-center bg-blue font-medium">P. Normal</th>
                    <th className="px-2 py-1.5 text-center bg-blue font-medium">P. Seguro</th>
                  </>
                ) : (
                  <th className="px-2 py-1.5 text-center bg-blue font-medium">Precio U.</th>
                )}
                <th className="px-2 py-1.5 text-center bg-blue font-medium">Cantidad</th>
                <th className="px-2 py-1.5 text-center bg-blue font-medium">Total</th>
                <th className="px-2 py-1.5 text-center bg-blue font-medium">Quitar</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {selectedProducto.map((producto) => {
                const det = cotizacion?.detalles?.find((d) => d.idproducto === producto.id);
                const cant = cantidadProducto[producto.id] || 1;

                return (
                  <motion.tr
                    key={producto.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t"
                  >
                    <td className="px-2 py-1.5 text-left font-medium">{producto.nombre}</td>

                    {cotizacion?.esSeguro ? (
                      <>
                        <td className="px-2 py-1.5 text-center">
                          <span className="line-through text-gray-400 text-xs">
                            {(det ? det.precioParticular : producto.precio).toFixed(2)} Bs
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className="font-bold text-green-700 text-xs">
                            {(det ? det.precioConvenio : producto.precio).toFixed(2)} Bs
                          </span>
                        </td>
                      </>
                    ) : (
                      <td className="px-2 py-1.5 text-center">
                        {Number(producto.precio).toFixed(2)} Bs
                      </td>
                    )}

                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const currentQty = cantidadProducto[producto.id] || 1;
                            if (currentQty > 1) {
                              handleChange(
                                {
                                  target: {
                                    value: (currentQty - 1).toString(),
                                  },
                                } as any,
                                producto.id
                              );
                            }
                          }}
                          className="p-1 rounded-full hover:bg-red-100 bg-red-50 text-red-600"
                        >
                          <Minus className="h-3 w-3" />
                        </motion.button>

                        <input
                          type="number"
                          value={cantidadProducto[producto.id] || 1}
                          onChange={(e) => handleChange(e, producto.id)}
                          className="w-10 px-1 py-0.5 border rounded text-center text-xs"
                        />

                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const currentQty = cantidadProducto[producto.id] || 1;
                            handleChange(
                              {
                                target: {
                                  value: (currentQty + 1).toString(),
                                },
                              } as any,
                              producto.id
                            );
                          }}
                          className="p-1 rounded-full hover:bg-green-100 bg-green-50 text-green-600"
                        >
                          <Plus className="h-3 w-3" />
                        </motion.button>
                      </div>
                    </td>

                    <td className="px-2 py-1.5 text-center">
                      {cotizacion?.esSeguro && det ? (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-blue-700">
                            {det.total.toFixed(2)} Bs
                          </span>
                          <span className="text-[10px] text-green-600 font-semibold">
                            Desc: -{det.descuentoTotal.toFixed(2)} Bs
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold">
                          {(cant * Number(producto.precio)).toFixed(2)} Bs
                        </span>
                      )}
                    </td>

                    <td className="px-2 py-1.5 text-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveProducto(producto.id)}
                        className="p-1 rounded-full hover:bg-red bg-red text-white"
                      >
                        <X className="h-3 w-3" />
                      </motion.button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {cotizacion?.esSeguro ? (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal (Precio Particular):</span>
              <span className="font-medium">{cotizacion.subtotal.toFixed(2)} Bs</span>
            </div>
            <div className="flex justify-between text-green-700 font-semibold">
              <span>Descuento Seguro ({cotizacion.nombreSeguro} {cotizacion.porcentajeSeguro}%):</span>
              <span>-{cotizacion.descuentoTotal.toFixed(2)} Bs</span>
            </div>
            <div className="border-t border-blue-200 pt-1.5 flex justify-between items-center">
              <span className="text-base font-bold text-gray-800">Total a Pagar:</span>
              <span className="text-xl font-extrabold text-blue-700">
                {cotizacion.total.toFixed(2)} Bs
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-md font-semibold">
              Total:
            </span>
            <span className="text-lg font-bold text-blue-600">
              {totalGeneral.toFixed(2)} Bs
            </span>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAgregar}
          className="w-full mt-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md text-sm font-semibold"
        >
          Guardar Venta
        </motion.button>

      </div>
    )}
  </div>
</CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Products Section */}
          <Card className="mt-6 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Productos Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchProducto}
                  onChange={(e) => setSearchProducto(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* --- NUEVO: Filtros combinables (Tipo, Laboratorio, Presentación, Alfabético) --- */}
              <div className="flex flex-wrap gap-3 items-end mb-3">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 mb-1">
                    Tipo
                  </label>
                  <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
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
                    onChange={(e) => setFilterLaboratorio(e.target.value)}
                    className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
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
                    onChange={(e) => setFilterPresentacion(e.target.value)}
                    className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
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
                  onClick={handleClearFiltrosProducto}
                  className="px-3 py-1 text-sm rounded border text-gray-700 hover:bg-gray-100 transition"
                >
                  Limpiar filtros
                </button>
              </div>

              {/* --- NUEVO: Botones rápidos A-Z para filtro alfabético --- */}
              <div className="flex flex-wrap gap-1 mb-4">
                <button
                  type="button"
                  onClick={() => setFilterAlfabeto("")}
                  className="px-2 py-1 text-xs rounded border text-gray-700 hover:bg-gray-100"
                  style={filterAlfabeto === "" ? { background: "blue", color: "white" } : {}}
                >
                  Todas
                </button>
                {LETRAS_ALFABETO.map((letra) => (
                  <button
                    key={letra}
                    type="button"
                    onClick={() => setFilterAlfabeto(letra)}
                    className="px-2 py-1 text-xs rounded border text-gray-700 hover:bg-gray-100"
                    style={filterAlfabeto === letra ? { background: "blue", color: "white" } : {}}
                  >
                    {letra}
                  </button>
                ))}
              </div>

              <div className="max-h-96 overflow-y-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Producto</th>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Descripción</th>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Lab.</th>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Tipo</th>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Present.</th>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Vencimiento</th>
                      <th className="px-2 py-1.5 text-center bg-blue font-medium">Stock</th>
                      <th className="px-2 py-1.5 text-center bg-blue font-medium">Casilla</th>
                      <th className="px-2 py-1.5 text-center bg-blue font-medium">Precio</th>
                      <th className="px-2 py-1.5 text-center bg-blue font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducto.map((producto) => {
                      const laboratorioNombre =
                        laboratorio.find(
                          (lab) => lab.id === producto.idlaboratorio
                        )?.laboratorioNombre || "N/A";
                      const tipoNombre =
                        presentacion.find((t) => t.id === producto.idpresentacion)?.nombre ||
                        "N/A";
                      const presentacionNombre =
                        presentacion.find(
                          (pres) => pres.id === producto.idpresentacion
                        )?.nombreCorto || "N/A";

                      return (
                        <motion.tr
                          key={producto.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                          className="border-t"
                        >
                          <td className="px-2 py-1.5 text-left font-medium">{producto.nombre}</td>
                          <td className="px-2 py-1.5 text-left max-w-[120px]">
                            <div className="group relative">
                              <span className="truncate block">{producto.descripcion}</span>
                              <div className="absolute invisible group-hover:visible z-10 bottom-full left-0 mb-2 w-64 p-2 bg-white border border-gray-200 rounded shadow-lg text-xs">
                                {producto.descripcion}
                              </div>
                            </div>
                          </td>
                           <td className="px-2 py-1.5 text-left max-w-[120px]">
                            <div className="group relative">
                              <span className="truncate block">{laboratorioNombre}</span>
                              <div className="absolute invisible group-hover:visible z-10 bottom-full left-0 mb-2 w-64 p-2 bg-white border border-gray-200 rounded shadow-lg text-xs">
                                {laboratorioNombre}
                              </div>
                            </div>
                          </td>

                            <td className="px-2 py-1.5 text-left max-w-[120px]">
                            <div className="group relative">
                              <span className="truncate block">{tipoNombre}</span>
                              <div className="absolute invisible group-hover:visible z-10 bottom-full left-0 mb-2 w-64 p-2 bg-white border border-gray-200 rounded shadow-lg text-xs">
                                {tipoNombre}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-left max-w-[70px] truncate" title={`${producto.concentracion} ${presentacionNombre}`}>
                            {producto.concentracion && `${producto.concentracion} ${presentacionNombre}`}
                          </td>
                          <td className="px-2 py-1.5 text-center whitespace-nowrap">
      {(() => {
        const infoVence = obtenerDiasRestantes(producto.vencimiento);
        return <span className={infoVence.clase}>{infoVence.texto}</span>;
      })()}
    </td>
                          <td className="px-2 py-1.5 text-center">{producto.stock}</td>
                          <td className="px-2 py-1.5 text-center">{producto.casilla}</td>
                          <td className="px-2 py-1.5 text-center">{producto.precio} Bs</td>
                          <td className="px-2 py-1.5 text-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSelectProducto(producto)}
                              disabled={producto.stock < 1}
                              className={`px-2 py-1 rounded-lg transition-colors shadow-sm text-xs ${selectedProducto.some(p => p.id === producto.id)
                                ? "bg-red hover:bg-red text-white"
                                : producto.stock < 1
                                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                  : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700"
                                }`}
                            >
                              {selectedProducto.some(p => p.id === producto.id) ? "Quitar" : producto.stock < 1 ? "Sin Stock" : "Seleccionar"}
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de notificación */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}

export default Ventas;
