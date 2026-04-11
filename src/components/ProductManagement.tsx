import React, { useEffect, useState } from "react";
import { Trash2, Edit2, Search } from "lucide-react";
import NavBarRoot from "./NavBarRoot";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import "./ProductManagement.css";

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
  lote: string
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

interface AlertState {
  show: boolean;
  type: "error" | "success";
  message: string;
}

// Estado inicial para un producto
const initialProductState: Partial<Product> = {
  codigo: '',
  nombre: '',
  descripcion: '',
  precio: 0,
  stock: 0,
  concentracion: 0,
  casilla: 0,
  vencimiento: '',
  idpresentacion: 0,
  idlaboratorio: 0,
  idtipo: 0,
  precio_compra: 0,
  lote: ''
};

// Componente principal
const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [tipo, setTipos] = useState<Tipo[]>([]);
  const [presentacion, setPresentacion] = useState<Presentacion[]>([]);
  const [laboratorio, setLaboratorio] = useState<Laboratory[]>([]);
  const [editProducto, setEditProducto] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>(initialProductState);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "success",
    message: ""
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, tiposRes, laboratoriosRes, presentacionRes] = await Promise.all([
          fetch("http://localhost:5000/api/Productos/listarProductosConMenorStock"),
          fetch("http://localhost:5000/api/Tipos/ListarTiposActivos"),
          fetch("http://localhost:5000/api/Laboratorios/ListarLaboratoriosActivos"),
          fetch("http://localhost:5000/api/Presentaciones/ListarPresentacionesActivos")
        ]);

        const [dataProductos, dataTipos, dataLaboratorios, dataPresentacion] = await Promise.all([
          productsRes.json(),
          tiposRes.json(),
          laboratoriosRes.json(),
          presentacionRes.json()
        ]);

        setProducts(dataProductos);
        setTipos(dataTipos);
        setLaboratorio(dataLaboratorios);
        setPresentacion(dataPresentacion);
      } catch (error) {
        showAlert("error", "Error al cargar los datos");
      }
    };

    fetchData();
  }, []);

  // Manejar cambios en los inputs del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: ['precio', 'stock', 'concentracion', 'casilla', 'idpresentacion', 'idlaboratorio', 'idtipo', 'precio_compra'].includes(name)
        ? value === '' ? 0 : Number(value)
        : value
    }));
  };

  // Manejar edición de producto
  const handleEdit = (product: Product) => {
    setEditProducto(product);
    setFormData(product);
  };

  // Manejar eliminación de producto
  const handleEliminar = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/Productos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(prev => prev.filter(product => product.id !== id));
        showAlert('success', 'Producto eliminado correctamente');
      } else {
        throw new Error('Error al eliminar el producto');
      }
    } catch (error) {
      showAlert("error", "Error al eliminar el producto");
    }
  };

  // Manejar agregar nuevo producto
  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();

    // Solo validamos los selectores que pediste obligatorios
    if (!formData.idtipo || !formData.idlaboratorio || !formData.idpresentacion) {
      showAlert("error", "Por favor seleccione el Tipo, Laboratorio y Presentación");
      return;
    }

    // Preparar datos con S/D o 0 si están vacíos
    const finalData = {
      codigo: formData.codigo || 'S/D',
      nombre: formData.nombre || 'S/D',
      descripcion: formData.descripcion || 'S/D',
      precio: formData.precio || 0,
      stock: formData.stock || 0,
      vencimiento: formData.vencimiento || '2000-01-01',
      idtipo: formData.idtipo,
      idlaboratorio: formData.idlaboratorio,
      concentracion: formData.concentracion || 0,
      casilla: formData.casilla || 0,
      idpresentacion: formData.idpresentacion,
      precio_compra: formData.precio_comp_ra || 0,
      lote: formData.lote || 'S/D'
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/Productos/Crear?codigo=${finalData.codigo}&nombre=${finalData.nombre}&descripcion=${finalData.descripcion}&precio=${finalData.precio}&stock=${finalData.stock}&vencimiento=${finalData.vencimiento}&idtipo=${finalData.idtipo}&idlaboratorio=${finalData.idlaboratorio}&concentracion=${finalData.concentracion}&casilla=${finalData.casilla}&idpresentacion=${finalData.idpresentacion}&precio_compra=${finalData.precio_compra}&lote=${finalData.lote}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalData),
        }
      );

      if (response.ok) {
        const newProduct = await response.json();
        setProducts([...products, newProduct]);
        showAlert('success', 'Producto agregado correctamente');
        handleReset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al agregar el producto');
      }
    } catch (error) {
      showAlert("error", error instanceof Error ? error.message : "Error al agregar el producto");
    }
  };

  // Manejar actualización de producto
  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editProducto?.id) {
      showAlert("error", "No hay producto seleccionado para editar");
      return;
    }

    // Preparar valores predeterminados para actualización
    const finalCodigo = formData.codigo || 'S/D';
    const finalNombre = formData.nombre || 'S/D';
    const finalDescripcion = formData.descripcion || 'S/D';
    const finalPrecio = formData.precio?.toString() || '0';
    const finalStock = formData.stock?.toString() || '0';
    const finalConc = formData.concentracion?.toString() || '0';
    const finalCasilla = formData.casilla?.toString() || '0';
    const finalVenc = formData.vencimiento || '2000-01-01';
    const finalLote = formData.lote || 'S/D';
    const finalPrecioCompra = formData.precio_compra?.toString() || '0';

    try {
      const params = new URLSearchParams();
      params.append('id', editProducto.id.toString());
      params.append('codigo', finalCodigo);
      params.append('nombre', finalNombre);
      params.append('descripcion', finalDescripcion);
      params.append('precio', finalPrecio);
      params.append('stock', finalStock);
      params.append('concentracion', finalConc);
      params.append('casilla', finalCasilla);
      params.append('vencimiento', finalVenc);
      params.append('idpresentacion', formData.idpresentacion?.toString() || '0');
      params.append('idlaboratorio', formData.idlaboratorio?.toString() || '0');
      params.append('idtipo', formData.idtipo?.toString() || '0');
      params.append('precio_compra', finalPrecioCompra);
      params.append('lote', finalLote);

      const url = `http://localhost:5000/api/Productos/Actualizar?${params.toString()}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el producto');
      }

      const updatedProduct = await response.json();

      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

      showAlert('success', 'Producto actualizado correctamente');
      handleReset();
    } catch (error) {
      showAlert('error', error instanceof Error ? error.message : 'Error al actualizar el producto');
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
    setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 5000);
  };

  // Lógica de búsqueda y filtrado
  const filteredProductos = products.filter(product =>
    !product.eliminado &&
    (product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Lógica de paginación
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProductos.length);
  const currentProducts = filteredProductos.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="flex h-screen">
      <NavBarRoot />
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

            <form onSubmit={editProducto ? handleActualizar : handleAgregar} className="product-form">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Código de Barras */}
                <div className="form-group space-y-2">
                  <label className="block text-sm font-medium text-black text-center">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Ingrese código de barras"
                  />
                </div>

                {/* Nombre del Producto */}
                <div className="form-group space-y-2">
                  <label className="block text-sm font-medium text-black text-center">
                    Producto
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Ingrese nombre del Producto"
                  />
                </div>

                {/* Descripción */}
                <div className="form-group space-y-2">
                  <label className="block text-sm font-medium text-black text-center">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion || ''}
                    onChange={handleInputChange}
                    className="form-input h-32 resize-none"
                    placeholder="Ingrese descripción"
                  />
                </div>

                {/* Tipo - OBLIGATORIO */}
                <div className="form-group space-y-2">
                  <label className="block text-sm font-medium text-black text-center">
                    Tipo
                  </label>
                  <select
                    name="idtipo"
                    value={formData.idtipo || ''}
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

                {/* Presentación - OBLIGATORIO */}
                <div className="form-group space-y-2">
                  <label className="block text-sm font-medium text-black text-center">
                    Presentación
                  </label>
                  <select
                    name="idpresentacion"
                    value={formData.idpresentacion || ''}
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

                {/* Laboratorio - OBLIGATORIO */}
                <div className="form-group space-y-2">
                  <label className="block text-sm font-medium text-black text-center">
                    Laboratorio
                  </label>
                  <select
                    name="idlaboratorio"
                    value={formData.idlaboratorio || ''}
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

                {/* Precio Compra */}
                <div className="form-group space-y-2">
                  <label className="block text-sm font-medium text-black text-center">
                    Precio Compra
                  </label>
                  <input
                    type="text"
                    name="precio_compra"
                    value={formData.precio_compra || 0}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Ingrese precio compra"
                  />
                </div>

                {/* Precio Venta (REUBICADO DESPUÉS DE COMPRA) */}
                <div className="form-group space-y-2">
                  <label className="block text-sm font-medium text-black text-center">
                    Precio Venta
                  </label>
                  <input
                    type="text"
                    name="precio"
                    value={formData.precio || 0}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Ingrese precio venta"
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
                    value={formData.lote || ''}
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
                    value={formData.vencimiento || ''}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                {/* Botones */}
                <div className="form-group flex flex-col space-y-4 mt-8 text-center col-span-full">
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ background: 'blue' }}
                  >
                    {editProducto ? "Actualizar Producto" : "Registrar Producto"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-primary"
                    style={{ background: 'blue' }}
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
                  style={{ background: 'blue' }}
                  className="search-button text-white px-4 rounded-r hover:bg-blue-600 transition"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                >
                  <Search size={18} />
                </button>
              </div>
              
             <div className="rounded-lg border overflow-hidden">
  <table className="w-full text-xs table-fixed"> {/* table-fixed es clave para que no crezca */}
    <thead className="bg-gray-800 text-white">
      <tr>
        <th style={{background:'blue'}} className="px-2 py-2 text-left w-[8%]">Cód.</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-left w-[8%]">Lote</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-left w-[12%]">Nombre</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-left w-[15%]">Descripción</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-left w-[8%]">Tipo</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-left w-[12%]">Present.</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-left w-[12%]">Lab.</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-center w-[7%]">P. Compra</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-center w-[7%]">Precio</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-center w-[6%]">Stock</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-center w-[5%]">Cas.</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-center w-[8%]">Venc.</th>
        <th style={{background:'blue'}} className="px-2 py-2 text-center w-[10%]">Acciones</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {filteredProductos.length === 0 ? (
        <tr>
          <td colSpan={12} className="text-center py-4">No hay resultados</td>
        </tr>
      ) : (
        currentProducts.map((product) => {
          const tipoNombre = tipo.find((tp) => tp.id === product.idtipo)?.nombre || "N/A";
          const labNombre = laboratorio.find((lab) => lab.id === product.idlaboratorio)?.laboratorioNombre || "N/A";
          const presNombre = presentacion.find((pre) => pre.id === product.idpresentacion)?.nombre || "";
          const presCorto = presentacion.find((pre) => pre.id === product.idpresentacion)?.nombreCorto || "";
          const fullPres = `${presNombre} ${product.concentracion || ''} ${presCorto}`;

          return (
            <tr key={product.id} className="hover:bg-gray-50 transition-colors"> 
             {/* Celda Nombre con Tooltip */}
              <td className="px-2 py-1.5 border-r relative group">
                <span className="truncate block cursor-help">{product.codigo}</span>
                <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                  {product.codigo}
                </div>
              </td>
                {/* Celda Nombre con Tooltip */}
              <td className="px-2 py-1.5 border-r relative group">
                <span className="truncate block cursor-help">{product.lote}</span>
                <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                  {product.lote}
                </div>
              </td>
              
              {/* Celda Nombre con Tooltip */}
              <td className="px-2 py-1.5 border-r relative group">
                <span className="truncate block cursor-help">{product.nombre}</span>
                <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                  {product.nombre}
                </div>
              </td>

              {/* Celda Descripción con Tooltip */}
              <td className="px-2 py-1.5 border-r relative group">
                <span className="truncate block cursor-help">{product.descripcion}</span>
                <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-64 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                  {product.descripcion}
                </div>
              </td>
<td className="px-2 py-1.5 border-r relative group">
  <span className="truncate block cursor-help">{tipoNombre}</span>
  <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-32 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
    {tipoNombre}
  </div>
</td>

              {/* Celda Presentación con Tooltip */}
              <td className="px-2 py-1.5 border-r relative group">
                <span className="truncate block cursor-help">{fullPres}</span>
                <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                  {fullPres}
                </div>
              </td>

              {/* Celda Laboratorio con Tooltip */}
              <td className="px-2 py-1.5 border-r relative group">
                <span className="truncate block cursor-help">{labNombre}</span>
                <div className="absolute invisible group-hover:visible z-50 bottom-full left-0 mb-1 w-48 p-2 bg-black text-white rounded shadow-xl text-[10px] leading-tight">
                  {labNombre}
                </div>
              </td>

              <td className="px-2 py-1.5 text-center border-r font-semibold text-green-700">{product.precio_compra.toFixed(2)}</td>
              <td className="px-2 py-1.5 text-center border-r font-semibold text-blue-700">{product.precio.toFixed(2)}</td>
              <td className="px-2 py-1.5 text-center border-r">{product.stock}</td>
              <td className="px-2 py-1.5 text-center border-r">{product.casilla}</td>
              <td className="px-2 py-1.5 text-center border-r text-[10px]">{product.vencimiento}</td>
              
              <td className="px-2 py-1.5 flex gap-1 justify-center items-center">
                <button 
                  style={{background:'blue'}}  
                  className="p-1 rounded text-white hover:scale-110 transition-transform" 
                  onClick={() => handleEdit(product)}
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  className="p-1 rounded text-white bg-red hover:scale-110 transition-transform" 
                  onClick={() => handleEliminar(product.id)}
                >
                  <Trash2 size={14}/>
                </button>
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div></div>

            {/* Paginación */}
            {filteredProductos.length > 0 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando registros del {startIndex + 1} al {Math.min(endIndex, filteredProductos.length)} 
                  de un total de {filteredProductos.length} registros
                </div>
                <div className="pagination-buttons flex gap-2">
                  <button 
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <button 
                    style={{background:'blue'}} 
                    className="px-3 py-1 rounded text-white"
                  >
                    {currentPage}
                  </button>
                  <button 
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
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