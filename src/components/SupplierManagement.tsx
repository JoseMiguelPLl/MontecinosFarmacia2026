import React, { useState, useEffect } from "react";
import NavBarRoot from "./NavBarRoot";
import { Trash2, Edit2, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import "./LaboratoryManagement.css";

interface Proveedor {
  id: number;
  nombre: string;
  celular: string;
  estado?: string;
  eliminado?: boolean;
}

interface AlertState {
  show: boolean;
  type: "error" | "success";
  message: string;
}

const SupplierManagement: React.FC = () => {
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [editProveedorId, setEditProveedorId] = useState<number | null>(null);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "success",
    message: "",
  });

  const showAlert = (type: "error" | "success", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3500);
  };

  const fetchProveedores = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Proveedores/ListarProveedoresActivos");
      if (!response.ok) {
        throw new Error("Error al obtener los proveedores");
      }
      const data: Proveedor[] = await response.json();
      setProveedores(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      showAlert("error", "Error al cargar proveedores desde el servidor");
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !celular.trim()) {
      showAlert("error", "Por favor complete todos los campos obligatorios.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/Proveedores/Crear?nombre=${encodeURIComponent(nombre.trim())}&celular=${encodeURIComponent(celular.trim())}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al crear el proveedor");
      }

      const data = await response.json();
      setProveedores((prev) => [...prev, data]);
      setNombre("");
      setCelular("");
      showAlert("success", "Proveedor registrado exitosamente");
      fetchProveedores();
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      showAlert("error", error instanceof Error ? error.message : "Error al crear proveedor");
    }
  };

  const handleEdit = (prov: Proveedor) => {
    setEditProveedorId(prov.id);
    setNombre(prov.nombre);
    setCelular(prov.celular);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editProveedorId === null || !nombre.trim() || !celular.trim()) {
      showAlert("error", "Por favor complete todos los campos.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/Proveedores/Actualizar?id=${editProveedorId}&nombre=${encodeURIComponent(nombre.trim())}&celular=${encodeURIComponent(celular.trim())}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const updated = await response.json();
      setProveedores((prev) =>
        prev.map((prov) => (prov.id === editProveedorId ? { ...prov, ...updated, nombre, celular } : prov))
      );

      setEditProveedorId(null);
      setNombre("");
      setCelular("");
      showAlert("success", "Proveedor actualizado exitosamente");
      fetchProveedores();
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
      showAlert("error", error instanceof Error ? error.message : "Error desconocido");
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar/desactivar este proveedor?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/Proveedores/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProveedores((prev) => prev.filter((p) => p.id !== id));
        showAlert("success", "Proveedor desactivado correctamente");
      } else {
        throw new Error("Error al desactivar el proveedor");
      }
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
      showAlert("error", "Error al eliminar el proveedor");
    }
  };

  // Filtrado por buscador
  const filteredProveedores = proveedores.filter(
    (prov) =>
      !prov.eliminado &&
      (prov.nombre.toLowerCase().includes(search.toLowerCase()) ||
        prov.celular.toLowerCase().includes(search.toLowerCase()))
  );

  // Paginación
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProveedores = filteredProveedores.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage) || 1;

  return (
    <div className="flex h-screen">
      <NavBarRoot />
      <div className="p-4 flex-1 overflow-auto w-1/2">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold">Proveedores</h2>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">
                Gestión de Proveedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alert.show && (
                <Alert type={alert.type} className="mb-4">
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              )}

              <form
                onSubmit={editProveedorId !== null ? handleSaveEdit : handleAgregar}
                className="mb-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nombre del Proveedor / Empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Droguería Inti, Distribuidora..."
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Celular / Teléfono de Contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="celular"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      placeholder="Ej. 77889900"
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="col-span-full flex space-x-2 mt-4">
                    <button
                      style={{ background: "blue" }}
                      type="submit"
                      className="btn btn-primary flex items-center"
                    >
                      {editProveedorId !== null ? "Actualizar" : "Registrar"}
                    </button>
                    <button
                      style={{ background: "blue" }}
                      type="button"
                      className="btn btn-secondary flex items-center"
                      onClick={() => {
                        setNombre("");
                        setCelular("");
                        setEditProveedorId(null);
                      }}
                    >
                      Nuevo
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Mostrar</span>
                  <select
                    className="border rounded p-1"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <span className="text-sm">registros</span>
                </div>

                <div className="search-container">
                  <input
                    type="text"
                    className=""
                    placeholder="Buscar proveedor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    style={{ background: "blue" }}
                    className="search-button"
                    onClick={() => setSearch("")}
                  >
                    <Search size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-auto">
                  <thead className="bg-gray-100">
                    <tr>
                      <th style={{ background: "blue" }} className="p-3 text-left">
                        #
                      </th>
                      <th style={{ background: "blue" }} className="p-3 text-left">
                        Nombre del Proveedor
                      </th>
                      <th style={{ background: "blue" }} className="p-3 text-left">
                        Celular / Teléfono
                      </th>
                      <th style={{ background: "blue" }} className="p-3 text-center">
                        Estado
                      </th>
                      <th style={{ background: "blue" }} className="p-3 text-center">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProveedores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500 font-medium">
                          No se encontraron proveedores registrados.
                        </td>
                      </tr>
                    ) : (
                      paginatedProveedores.map((prov, index) => (
                        <tr key={prov.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-gray-500 font-semibold">{startIndex + index + 1}</td>
                          <td className="p-3 font-medium text-gray-800">{prov.nombre}</td>
                          <td className="p-3 text-gray-700">{prov.celular}</td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              {prov.estado || "Activo"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                style={{ background: "blue" }}
                                onClick={() => handleEdit(prov)}
                                className="btn btn-primary"
                                title="Editar Proveedor"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleEliminar(prov.id)}
                                className="btn btn-danger"
                                title="Desactivar Proveedor"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando registros del {filteredProveedores.length > 0 ? startIndex + 1 : 0} al{" "}
                  {Math.min(endIndex, filteredProveedores.length)} de un total de{" "}
                  {filteredProveedores.length} registros
                </div>
                <div className="pagination-buttons">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <button style={{ background: "blue" }} className="active">
                    {currentPage}
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupplierManagement;
