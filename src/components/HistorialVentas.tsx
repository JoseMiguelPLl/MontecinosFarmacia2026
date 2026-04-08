import { useEffect, useState } from "react";
import NavBarRoot from "./NavBarRoot";
import { Edit2, Trash2 } from 'react-feather';
import { FaFilePdf } from "react-icons/fa6";
import Modal from "./Modal"; // Importar el componente Modal
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingCart, Calendar, Search, User, Package, Clock } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaRegEye } from "react-icons/fa";

declare module 'jspdf' {
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
  id: number,
  cantidad: number,
  descuento: number,
  precio: number,
  total: number,
  eliminado?: boolean,
  idproducto: number,
  idventa: number
}

interface Client {
  id: number;
  nombre: string;
  ci: string;
  telefono: string;
  direccion: string;
  eliminado?: boolean;
}

interface Producto {
  id: number,
  codigo: string,
  nombre:string,
  descripcion: string,
  precio: number,
  stock: number,
  vencimiento: string,
  estado?: boolean,
  idpresentacion: number,
  idlaboratorio: number,
  idtipo: number
}

function HistorialVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [search, setSearch] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [usuario, setUsuario] = useState<Client[]>([]);
  const [detalleventa, setDetalleVenta] = useState<Detalle_Ventas[]>([]);
  const [selectedVentaId, setSelectedVentaId] = useState<number | null>(null);
  const [productos, setProducto] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseClientes = await fetch(
          "http://localhost:5000/api/Clientes/ListarClientesActivos"
        );
        const dataClientes = await responseClientes.json();
        setUsuario(dataClientes);

        const responseProducto = await fetch(
          "http://localhost:5000/api/Productos/ListarProductosActivos");
        const dataProductos = await responseProducto.json();
        setProducto(dataProductos);

        const responseVentas = await fetch(
          "http://localhost:5000/api/Ventas/ListarVentasActivos"
        );
        const dataVentas = await responseVentas.json();
        setVentas(dataVentas);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, []);

  const handlePdfClick = async (idventa: number) => {
    try {
      const responseDetalleVenta = await fetch(
        `http://localhost:5000/api/Ventas/listarVentaDetalleVenta?idventa=${idventa}`
      );
      const dataDetalleVenta = await responseDetalleVenta.json();
      setDetalleVenta(dataDetalleVenta);
      setSelectedVentaId(idventa);
      setIsModalOpen(true); // Abrir el modal
    } catch (error) {
      console.error("Error al obtener los detalles de la venta:", error);
    }
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Agregar un fondo de color suave en la parte superior
    doc.setFillColor(235, 247, 255);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Título principal
    doc.setFontSize(24);
    doc.setTextColor(44, 62, 80);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURA DE VENTA", pageWidth / 2, 20, { align: "center" });

    // Información de la farmacia (encabezado)
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(52, 73, 94);
    doc.text("FARMACIA MEDICITY S.A.", 14, 35);
    doc.setFontSize(10);
    doc.text("Dirección: Av. Principal #452", 14, 42);
    doc.text("Tel: (951) 456-7890", 14, 48);

    // Línea divisoria
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(14, 52, pageWidth - 14, 52);

    // Información del cliente y la venta
    const selectedVenta = ventas.find((v) => v.id === selectedVentaId);
    const selectedUser = usuario.find((u) => u.id === selectedVenta?.idcliente);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN DEL CLIENTE", 14, 62);

    doc.setFont("helvetica", "normal");
    doc.text(`Cliente: ${selectedUser?.nombre} CI/NIT: ${selectedUser?.ci}`, 14, 70);
    doc.text(`Teléfono: ${selectedUser?.telefono}`, 14, 76);
    doc.text(`Fecha: ${new Date(selectedVenta?.fecha || '').toLocaleDateString()}`, pageWidth - 60, 70);
    doc.text(`No. Proforma: ${Math.floor(Math.random() * 10000)}`, pageWidth - 60, 76);

    // Tabla de productos
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DE PRODUCTOS", 14, 90);

    const tableColumn = [
      "Descripción",
      "Precio Unit.",
      "Cantidad",
      "Subtotal"
    ];

    const tableRows = detalleventa.map((detalle) => {
      const producto = productos.find((p) => p.id === detalle.idproducto);
      return [
        producto ? producto.nombre : "Producto no encontrado",
        `Bs${detalle.precio.toFixed(2)}`,
        detalle.cantidad,
        `Bs${detalle.total.toFixed(2)}`
      ];
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 95,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left' }
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });

    // Total
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 80, finalY + 10, pageWidth - 14, finalY + 10);

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", pageWidth - 80, finalY + 18);
    doc.text(`${selectedVenta?.total.toFixed(2)} Bs`, pageWidth - 25, finalY + 18, { align: 'right' });

    // Pie de página
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text("Esta proforma es válida por 7 días.", 14, pageHeight - 20);
    doc.text(`Generado el ${new Date().toLocaleString()}`, pageWidth - 14, pageHeight - 20, { align: 'right' });

    // Guardar el PDF
    doc.save("proforma_venta.pdf");
  };

  const filteredVentas = ventas.filter((venta) => {
    const cliente = usuario.find((user) => user.id === venta.idcliente);
    const clienteNombre = cliente
      ? `${cliente.nombre} ${cliente.ci}`.toLowerCase()
      : "";
    return (
      clienteNombre.includes(search.toLowerCase()) ||
      venta.fecha.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleEdit = (venta: Venta) => {
    console.log("Editar venta", venta);
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta venta?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/Ventas/${id}`, {
          method: 'DELETE'
        });
  
        if (response.ok) {
          // Eliminación exitosa
          console.log('success', 'Venta eliminada exitosamente');
  
          // Actualizar el estado de ventas para reflejar el cambio
          setVentas((prevVentas) => prevVentas.filter((venta) => venta.id !== id));
        } else {
          // Manejar errores de la API
          const errorData = await response.json();
          console.log('error', 'Error al eliminar la venta:', errorData.message || 'Error desconocido');
        }
      } catch (error) {
        // Manejar errores de red o del servidor
        console.log('error', 'Error en la solicitud al servidor:', error);
      }
    }
  };

  return (
    <div className="flex h-screen">
      <NavBarRoot />
      <div className="p-4 flex-1 overflow-auto w-1/2">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8 ">
            <h2 className="text-3xl font-bold">Historial Ventas</h2>
          </div>
        </div>
        <div className="p-6">
          <input
            type="text"
            placeholder="Buscar Cliente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded"
          />
                    <input
            type="date"
            placeholder="Buscar Cliente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded"
          />
                        <input
            type="date"
            placeholder="Buscar Cliente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded"
          />
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded shadow">
              <thead className="bg-blue text-white uppercase text-sm">
                <tr>
                  <th style={{ background: 'blue' }} className="px-6 py-3 text-left">Cliente</th>
                  <th style={{ background: 'blue' }} className="px-6 py-3 text-left">Total</th>
                  <th style={{ background: 'blue' }} className="px-6 py-3 text-left">Fecha</th>
                  <th style={{ background: 'blue' }} className="px-6 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredVentas.map((venta) => {
                  const cliente = usuario.find((user) => user.id === venta.idcliente);
                  return (
                    <tr key={venta.id} className="border-b hover:bg-gray-50">
                     
                      <td className="p-3">{cliente ? `${cliente.nombre}` : "Desconocido"}</td>
                       <td className="p-3">{cliente ? `${cliente.ci}` : "Desconocido"}</td>
                      <td className="p-3">{venta.total}</td>
                      <td className="p-3">{venta.fecha}</td>
                      <td className="p-3 text-center">
                        <button
                          style={{ background: 'blue' }}
                          className="btn btn-warning"
                          onClick={() => handlePdfClick(venta.id)}
                        >
                         <FaRegEye />
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(venta.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 w-full max-w-4xl"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg">
              {/* Encabezado del modal */}
              <div className="flex items-center gap-2 mb-6">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-bold text-blue-600">Detalles de la Venta</h3>
              </div>

              {/* Fecha de la venta */}
              <div className="flex items-center gap-4 mb-6">
                <Calendar className="h-5 w-5 text-gray-500" />
                <input
                  type="date"
                  value={ventas.find((v) => v.id === selectedVentaId)?.fecha || ""}
                  readOnly
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-100"
                />
              </div>

              {/* Información del cliente */}
              {usuario.length > 0 && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                  <div>
                    <span className="text-sm text-gray-500">Cliente:</span>
                    <p className="font-medium">
                      {usuario.find((u) => u.id === ventas.find((v) => v.id === selectedVentaId)?.idcliente)?.nombre || "Desconocido"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">CI/NIT:</span>
                    <p className="font-medium">
                      {usuario.find((u) => u.id === ventas.find((v) => v.id === selectedVentaId)?.idcliente)?.ci || "Desconocido"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Teléfono:</span>
                    <p className="font-medium">
                      {usuario.find((u) => u.id === ventas.find((v) => v.id === selectedVentaId)?.idcliente)?.telefono || "Desconocido"}
                    </p>
                  </div>
                </div>
              )}

              {/* Tabla de productos */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded shadow">
                  <thead className="bg-blue text-white uppercase text-sm">
                    <tr>
                      <th className="px-6 py-3 text-left text-black">Producto</th>
                      <th className="px-6 py-3 text-left text-black">Cantidad</th>
                      <th className="px-6 py-3 text-left text-black">Precio</th>
                      <th className="px-6 py-3 text-left text-black">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleventa.map((detalle) => {
                      const producto = productos.find((p) => p.id === detalle.idproducto);
                      return (
                        <motion.tr
                          key={detalle.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3">{producto ? producto.nombre : "Producto no encontrado"}</td>

                          <td className="p-3">{detalle.cantidad}</td>
                          <td className="p-3">{detalle.precio} Bs</td>
                          <td className="p-3">{detalle.total} Bs</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total de la venta */}
              <div className="mt-4 flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  {ventas.find((v) => v.id === selectedVentaId)?.total || 0} Bs
                </span>
              </div>

              {/* Botón de PDF */}
              <div className="mt-4 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generarPDF}
                  className="bg-blue text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md"
                >
                  Generar PDF
                </motion.button>
              </div>
            </div>
          </motion.div>
        </Modal>
      </div>
    </div>
  );
}

export default HistorialVentas;