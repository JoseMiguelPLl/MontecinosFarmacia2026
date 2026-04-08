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
  CheckCircle
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
  eliminado?: boolean;
}

interface Producto {
  id: number;
  stock: number;
  casilla: number;
  nombre: string;
  descripcion: string;
  precio: number;
  concentracion: number;
  eliminado?: boolean;
  idpresentacion: number;
  idlaboratorio: number;
  idtipo: number;
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
            className={`px-4 py-2 text-sm font-medium rounded-md ${type === 'error' ? 'bg-red hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${type === 'error' ? 'focus:ring-red-500' : 'focus:ring-green-500'}`}
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Ventas() {
  const [usuarios, setUsuarios] = useState<Clientes[]>([]);
  const [producto, setProducto] = useState<Producto[]>([]);
  const [venta, setVenta] = useState<Venta[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([]);
  const [Dventa, setDVenta] = useState<Detalle_Ventas[]>([]);
  const [addVenta, setAddVenta] = useState<Partial<Venta>>({
    fecha: "",
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

  const name = localStorage.getItem("userName");
  
  useEffect(() => {
    const nuevoTotal = selectedProducto.reduce((total, producto) => {
      const cantidad = cantidadProducto[producto.id] || 1;
      return total + cantidad * producto.precio;
    }, 0);
    setTotalGeneral(nuevoTotal);
  }, [selectedProducto, cantidadProducto]);

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

    const queryParams = new URLSearchParams({
      fecha: addVenta.fecha,
      total: totalGeneral.toString(),
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
        const totalProducto = cantidad * producto.precio;

        const queryParamsDetalle = new URLSearchParams({
          cantidad: cantidad.toString(),
          descuento: "0",
          precio: producto.precio.toString(),
          total: totalProducto.toString(),
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

      setVenta([...venta, newVenta]);
      setAddVenta({});
      setSelectedProducto([]);
      setCantidadProducto({});
      setTotalGeneral(0);

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
    doc.text(`Sr(a): ${selectedUser.nombre}`.substring(0, 30), margin, 38);
    doc.text(`CI/NIT: ${selectedUser.ci}`.substring(0, 35), margin, 42);

    doc.text(`FECHA: ${fecha}`, margin, 46);
    doc.text(`${hora}`, margin + 25, 46);

    doc.line(margin, 50, pageWidth - margin, 50);

    // CABECERA TABLA
    doc.text("CANT", margin, 56);
    doc.text("CONCEPTO", margin + 15, 56);
    doc.text("P.U.", margin + 45, 56);
    doc.text("IMP.", margin + 60, 56);

    let yPos = 62;
    let totalGeneral = 0;

    // PRODUCTOS
    selectedProducto.forEach((producto) => {

      const cantidad = cantidadProducto[producto.id] || 1;
      const subtotal = cantidad * producto.precio;
      totalGeneral += subtotal;

      const nombreDividido = doc.splitTextToSize(producto.nombre, 28);

      doc.text(String(cantidad), margin, yPos);
      doc.text(nombreDividido, margin + 15, yPos);
      doc.text(producto.precio.toFixed(2), margin + 45, yPos);
      doc.text(subtotal.toFixed(2), margin + 60, yPos);

      yPos += nombreDividido.length * 5;
    });

    // LINEA ANTES DEL TOTAL
    doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);
    yPos += 10;

    // TOTAL
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);

    doc.text("TOTAL:", margin + 40, yPos);
    doc.text(`${totalGeneral.toFixed(2)} Bs`, margin + 60, yPos);

    doc.setFont(undefined, "normal");
    yPos += 8;

    // VENDEDOR
    doc.setFontSize(8);
    doc.text(`Vendedor: ${name}`, margin, yPos);
    yPos += 7;

    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 10;

    doc.text("GRACIAS POR SU COMPRA.", pageWidth / 2, yPos, { align: "center" });

    doc.save(`recibo_${selectedUser.nombre}_${fecha}.pdf`);

  } catch (error) {
    console.error("Error al generar la factura:", error);
  }
};
      generarPDF();
      
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

  const filteredUsuarios = search
    ? usuarios.filter(
      (usuario) =>
        !usuario.eliminado &&
        usuario.ci.toLowerCase().includes(search.toLowerCase()) ||
        usuario.nombre.toLowerCase().includes(search.toLowerCase())
    )
    : [];

  const filteredProducto = searchProducto
    ? producto.filter(
      (producto) =>
        !producto.eliminado &&
        producto.nombre.toLowerCase().includes(searchProducto.toLowerCase())
    )
    : [];

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
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Selección de Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-blue text-white">
                      <tr>
                        <th className="px-3 py-2 text-left bg-blue font-medium">Nombre</th>
                        <th className="px-3 py-2 text-left bg-blue font-medium">CI</th>
                        <th className="px-3 py-2 text-left bg-blue font-medium">Teléfono</th>
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
                          <td className="px-3 py-2">{usuario.nombre}</td>
                          <td className="px-3 py-2">{usuario.ci}</td>
                          <td className="px-3 py-2">{usuario.telefono}</td>
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
    </div>

    {selectedProducto.length > 0 && (
      <div className="mt-4">
        <h3 className="text-md font-semibold mb-3">Productos Seleccionados</h3>

        <div className="max-h-64 overflow-y-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-2 py-1.5 text-left bg-blue font-medium">Producto</th>
                <th className="px-2 py-1.5 text-center bg-blue font-medium">Precio U.</th>
                <th className="px-2 py-1.5 text-center bg-blue font-medium">Cantidad</th>
                <th className="px-2 py-1.5 text-center bg-blue font-medium">Total</th>
                <th className="px-2 py-1.5 text-center bg-blue font-medium">Quitar</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {selectedProducto.map((producto) => (
                <motion.tr
                  key={producto.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t"
                >
                  <td className="px-2 py-1.5 text-left">{producto.nombre}</td>

                  <td className="px-2 py-1.5 text-center">
                    {producto.precio} Bs
                  </td>

                  <td className="px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          const currentQty =
                            cantidadProducto[producto.id] || 1;

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
                        onChange={(e) =>
                          handleChange(e, producto.id)
                        }
                        className="w-10 px-1 py-0.5 border rounded text-center text-xs"
                      />

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          const currentQty =
                            cantidadProducto[producto.id] || 1;

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
                    {(cantidadProducto[producto.id] || 1) *
                      producto.precio} Bs
                  </td>

                  <td className="px-2 py-1.5 text-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        handleRemoveProducto(producto.id)
                      }
                      className="p-1 rounded-full hover:bg-red bg-red text-white"
                    >
                      <X className="h-3 w-3" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-md font-semibold">
            Total:
          </span>

          <span className="text-lg font-bold text-blue-600">
            {totalGeneral} Bs
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAgregar}
          className="w-full mt-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md text-sm"
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

              <div className="max-h-96 overflow-y-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Producto</th>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Descripción</th>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Lab.</th>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Tipo</th>
                      <th className="px-2 py-1.5 text-left bg-blue font-medium">Present.</th>
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
                          <td className="px-2 py-1.5 text-left max-w-[60px] truncate" title={laboratorioNombre}>
                            {laboratorioNombre}
                          </td>
                          <td className="px-2 py-1.5 text-left max-w-[60px] truncate" title={tipoNombre}>
                            {tipoNombre}
                          </td>
                          <td className="px-2 py-1.5 text-left max-w-[70px] truncate" title={`${producto.concentracion} ${presentacionNombre}`}>
                            {producto.concentracion && `${producto.concentracion} ${presentacionNombre}`}
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