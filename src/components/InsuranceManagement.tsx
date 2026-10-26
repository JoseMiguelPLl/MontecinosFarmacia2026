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

interface Seguro {
  id: number;
  nombre: string;
  estado?: string;
  eliminado?: boolean;
}

interface AlertState {
  show: boolean;
  type: "error" | "success";
  message: string;
}

const InsuranceManagement: React.FC = () => {
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [nombre, setNombre] = useState("");
  const [editSeguroId, setEditSeguroId] = useState<number | null>(null);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "success",
    message: "",
  });

  const showAlert = (type: "error" | "success", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3500);
  };

  const fetchSeguros = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Seguros/ListarSegurosActivos");
      if (!response.ok) {
        throw new Error("Error al obtener los seguros");
      }
      const data: Seguro[] = await response.json();
      setSeguros(data);
    } catch (error) {
      console.error("Error al cargar seguros:", error);
      showAlert("error", "Error al cargar seguros desde el servidor");
    }
  };

  useEffect(() => {
    fetchSeguros();
  }, []);

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      showAlert("error", "Por favor ingrese el nombre del seguro.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/Seguros/Crear?nombre=${encodeURIComponent(nombre.trim())}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al crear el seguro");
      }

      const data = await response.json();
      setSeguros((prev) => [...prev, data]);
      setNombre("");
      showAlert("success", "Seguro registrado exitosamente");
      fetchSeguros();
    } catch (error) {
      console.error("Error al crear seguro:", error);
      showAlert("error", error instanceof Error ? error.message : "Error al crear seguro");
    }
  };

  const handleEdit = (seg: Seguro) => {
    setEditSeguroId(seg.id);
    setNombre(seg.nombre);
  };

  const handleReset = () => {
    setEditSeguroId(null);
    setNombre("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editSeguroId === null || !nombre.trim()) {
      showAlert("error", "Por favor ingrese el nombre del seguro.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/Seguros/Actualizar?id=${editSeguroId}&nombre=${encodeURIComponent(nombre.trim())}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const updated = await response.json();
      setSeguros((prev) =>
        prev.map((seg) => (seg.id === editSeguroId ? { ...seg, ...updated, nombre } : seg))
      );

      setEditSeguroId(null);
      setNombre("");
      showAlert("success", "Seguro actualizado exitosamente");
      fetchSeguros();
    } catch (error) {
      console.error("Error al actualizar seguro:", error);
      showAlert("error", error instanceof Error ? error.message : "Error desconocido");
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar/desactivar este seguro?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/Seguros/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSeguros((prev) => prev.filter((s) => s.id !== id));
        showAlert("success", "Seguro desactivado correctamente");
      } else {
        throw new Error("Error al desactivar el seguro");
      }
    } catch (error) {
      console.error("Error al eliminar seguro:", error);
      showAlert("error", "Error al eliminar el seguro");
    }
  };

  // Filtrado por buscador
  const filteredSeguros = seguros.filter(
    (seg) =>
      !seg.eliminado &&
      seg.nombre.toLowerCase().includes(search.toLowerCase())
  );

  // Paginación
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSeguros = filteredSeguros.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredSeguros.length / itemsPerPage) || 1;

  return (
    <div className="flex h-screen">
      <NavBarRoot />
      <div className="p-4 flex-1 overflow-auto w-1/2">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold">Seguros</h2>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">
                Gestión de Seguros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alert.show && (
                <Alert type={alert.type} className="mb-4">
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              )}

              <form
                onSubmit={editSeguroId !== null ? handleSaveEdit : handleAgregar}
                className="mb-8"
              >
                <div className="grid">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nombre del Seguro
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Caja Nacional de Salud (CNS)"
                      className="border rounded p-2 w-full"
                    />
                  </div>
                  <div className="button-group flex gap-2 mt-4">
                    <button
                      style={{ background: "blue" }}
                      type="submit"
                      className="btn btn-primary"
                    >
                      {editSeguroId !== null ? "Actualizar" : "Registrar"}
                    </button>
                    <button
                      style={{ background: "blue" }}
                      type="button"
                      onClick={handleReset}
                      className="btn btn-success"
                    >
                      Nuevo
                    </button>
                  </div>
                </div>
              </form>

              <div className="table-controls flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Mostrar</span>
                  <select
                    className="border rounded p-1"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <span className="text-sm">registros</span>
                </div>
                <div className="search-container flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Buscar seguro..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border rounded p-2"
                  />
                  <button
                    style={{ background: "blue" }}
                    className="search-button p-2 text-white rounded"
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
                      <th style={{ background: "blue" }} className="p-3 text-left text-white">
                        ID
                      </th>
                      <th style={{ background: "blue" }} className="p-3 text-left text-white">
                        Nombre del Seguro
                      </th>
                      <th style={{ background: "blue" }} className="p-3 text-left text-white">
                        Estado
                      </th>
                      <th style={{ background: "blue" }} className="p-3 text-center text-white">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSeguros.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">
                          No se encontraron seguros registrados
                        </td>
                      </tr>
                    ) : (
                      paginatedSeguros.map((seg) => (
                        <tr key={seg.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold">{seg.id}</td>
                          <td className="p-3">{seg.nombre}</td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800">
                              {seg.estado || "Activo"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="action-buttons flex justify-center gap-2">
                              <button
                                style={{ background: "blue" }}
                                onClick={() => handleEdit(seg)}
                                className="btn btn-primary p-2 text-white rounded"
                                title="Editar seguro"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleEliminar(seg.id)}
                                className="btn btn-danger p-2 text-white rounded bg-red"
                                title="Eliminar seguro"
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

              <div className="pagination flex justify-between items-center mt-4">
                <div className="pagination-info text-sm text-gray-600">
                  Mostrando registros del{" "}
                  {filteredSeguros.length > 0 ? startIndex + 1 : 0} al{" "}
                  {Math.min(endIndex, filteredSeguros.length)} de un total de{" "}
                  {filteredSeguros.length} registros
                </div>
                <div className="pagination-buttons flex gap-1">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-3 py-1 border rounded ${
                        currentPage === index + 1
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InsuranceManagement;
