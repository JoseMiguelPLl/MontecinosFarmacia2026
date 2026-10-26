import React, { useState, useEffect } from "react";
import { Trash2, Edit2, Search, Plus, RefreshCw } from "lucide-react";
import NavBarRoot from "./NavBarRoot";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import Pagination from "./Pagination";
import "./ClientManagement.css";

// Define interface for Client
interface Client {
  id: number;
  nombre: string;
  ci: string | number;
  telefono: string | number;
  direccion: string;
  estado?: string;
  idseguro?: number | null;
  eliminado?: boolean;
}

// Define interface for Seguro
interface Seguro {
  id: number;
  nombre: string;
  porcentaje?: number;
  estado?: string;
  eliminado?: boolean;
}

// Define interface for Alert
interface AlertState {
  show: boolean;
  type: "error" | "success";
  message: string;
}

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [newNombre, setNewNombre] = useState("");
  const [newCI, setNewCI] = useState("");
  const [newTelefono, setNewTelefono] = useState("");
  const [newDireccion, setNewDirreccion] = useState("");
  const [newIdSeguro, setNewIdSeguro] = useState<string>("");
  const [editClient, setEditClient] = useState<number | null>(null);
  const [filterSeguro, setFilterSeguro] = useState<string>("");

  // Estado para creación rápida de Seguro
  const [showQuickSeguro, setShowQuickSeguro] = useState<boolean>(false);
  const [quickSeguroNombre, setQuickSeguroNombre] = useState<string>("");
  const [quickSeguroPorcentaje, setQuickSeguroPorcentaje] = useState<number | string>(25);
  const [isSubmittingQuickSeguro, setIsSubmittingQuickSeguro] = useState<boolean>(false);

  const [formData, setFormData] = useState<Client>({
    id: 0,
    nombre: "",
    ci: "",
    telefono: "",
    direccion: "",
  });

  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "success",
    message: ""
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchClients = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Clientes/ListarClientesActivos");
      if (!response.ok) {
        throw new Error("Error al obtener los clientes");
      }
      const data: Client[] = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error al cargar los clientes:", error);
    }
  };

  const fetchSeguros = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Seguros/ListarSegurosActivos");
      if (response.ok) {
        const data: Seguro[] = await response.json();
        setSeguros(data);
      }
    } catch (error) {
      console.error("Error al cargar seguros:", error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchSeguros();
  }, []);

  const showAlert = (type: "error" | "success", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
  };
  
  // Creación rápida de Seguro
  const handleCreateQuickSeguro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSeguroNombre.trim()) {
      showAlert("error", "Por favor ingrese el nombre del seguro.");
      return;
    }
    const numPorcentaje = Number(quickSeguroPorcentaje) || 25;
    setIsSubmittingQuickSeguro(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/Seguros/Crear?nombre=${encodeURIComponent(quickSeguroNombre.trim())}&porcentaje=${encodeURIComponent(numPorcentaje)}`,
        { method: "POST" }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Error al crear el seguro");
      }
      const newSeg: Seguro = await response.json();
      setSeguros((prev) => [...prev, newSeg]);
      setNewIdSeguro(newSeg.id.toString());
      setQuickSeguroNombre("");
      setQuickSeguroPorcentaje(25);
      setShowQuickSeguro(false);
      showAlert("success", `Seguro "${newSeg.nombre}" (${newSeg.porcentaje ?? numPorcentaje}%) creado y seleccionado`);
    } catch (error) {
      console.error("Error al crear seguro rápido:", error);
      showAlert("error", error instanceof Error ? error.message : "Error al crear seguro");
    } finally {
      setIsSubmittingQuickSeguro(false);
    }
  };

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanNombre = String(newNombre ?? "").trim();
    const cleanCI = String(newCI ?? "").trim();
    const cleanTelefono = String(newTelefono ?? "").trim();
    const cleanDireccion = String(newDireccion ?? "").trim();

    if (!cleanNombre || !cleanCI || !cleanTelefono || !cleanDireccion) {
      showAlert("error", "Todos los campos principales son obligatorios");
      return;
    }
  
    try {
      let url = `http://localhost:5000/api/Clientes/Crear?nombre=${encodeURIComponent(cleanNombre)}&ci=${encodeURIComponent(cleanCI)}&telefono=${encodeURIComponent(cleanTelefono)}&direccion=${encodeURIComponent(cleanDireccion)}`;
      if (newIdSeguro) {
        url += `&idseguro=${newIdSeguro}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const newClient: Client = await response.json();
        setClients((prev) => [...prev, newClient]);
        handleReset();
        showAlert("success", "Cliente agregado exitosamente");
        fetchClients();
      } else {
        showAlert("error", `Error al agregar el cliente: ${response.statusText}`);
      }
    } catch (error) {
      showAlert("error", "Error en la solicitud al servidor");
    }
  };

  const handleReset = () => {
    setFormData({
      id: 0,
      nombre: "",
      ci: "",
      telefono: "",
      direccion: "",
    });
    setNewNombre("");
    setNewCI("");
    setNewTelefono("");
    setNewDirreccion("");
    setNewIdSeguro("");
    setEditMode(false);
    setEditClient(null);
  };
  
  const filteredClients = clients.filter((client) => {
    if (client.eliminado) return false;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      client.nombre.toLowerCase().includes(term) ||
      String(client.telefono).includes(term) ||
      String(client.ci).toLowerCase().includes(term) ||
      client.direccion.toLowerCase().includes(term);

    const matchesSeguro =
      filterSeguro === ""
        ? true
        : filterSeguro === "sin_seguro"
        ? !client.idseguro
        : client.idseguro === Number(filterSeguro);

    return matchesSearch && matchesSeguro;
  });

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/Clientes/${id}`,
          {
            method: "DELETE",
          }
        );
  
        if (response.ok) {
          setClients((prev) => prev.filter((client) => client.id !== id));
          showAlert("success", "Cliente eliminado exitosamente");
        } else {
          showAlert("error", `Error al eliminar el cliente: ${response.statusText}`);
        }
      } catch (error) {
        showAlert("error", "Error en la solicitud al servidor");
      }
    }
  };

  const handleEdit = (client: Client) => {
    setEditClient(client.id);
    setNewNombre(String(client.nombre ?? ""));
    setNewCI(String(client.ci ?? ""));
    setNewTelefono(String(client.telefono ?? ""));
    setNewDirreccion(String(client.direccion ?? ""));
    setNewIdSeguro(client.idseguro ? client.idseguro.toString() : "");
    setEditMode(true);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Función para guardar los cambios en la edición
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanNombre = String(newNombre ?? "").trim();
    const cleanCI = String(newCI ?? "").trim();
    const cleanTelefono = String(newTelefono ?? "").trim();
    const cleanDireccion = String(newDireccion ?? "").trim();

    if (!cleanNombre || !cleanCI || !cleanTelefono || !cleanDireccion) {
      showAlert("error", "Todos los campos principales son obligatorios");
      return;
    }
  
    if (editClient === null) return;
  
    try {
      // Backend: Si adquiere seguro enviar &idseguro=X, si ya no tiene enviar &idseguro=0
      const idSeguroParam = newIdSeguro ? newIdSeguro : 0;
      const url = `http://localhost:5000/api/Clientes/Actualizar?id=${editClient}&nombre=${encodeURIComponent(cleanNombre)}&ci=${encodeURIComponent(cleanCI)}&telefono=${encodeURIComponent(cleanTelefono)}&direccion=${encodeURIComponent(cleanDireccion)}&idseguro=${idSeguroParam}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (response.ok) {
        const updatedClient = await response.json().catch(() => null);
        setClients((prev) =>
          prev.map((client) =>
            client.id === editClient
              ? {
                  ...client,
                  nombre: cleanNombre,
                  ci: cleanCI,
                  telefono: cleanTelefono,
                  direccion: cleanDireccion,
                  idseguro: newIdSeguro ? Number(newIdSeguro) : null,
                  ...(updatedClient || {}),
                }
              : client
          )
        );
        handleReset();
        showAlert("success", "Cliente actualizado exitosamente");
        fetchClients();
      } else {
        showAlert("error", `Error al actualizar el cliente: ${response.statusText}`);
      }
    } catch (error) {
      showAlert("error", "Error en la solicitud al servidor");
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;

  return (
    <div className="flex h-screen">
      {/* NavBarRoot ocupa la parte izquierda */}
      <NavBarRoot />

      {/* Contenido principal */}
      <div className="p-4 flex-1 overflow-auto w-1/2">
        {/* Encabezado azul */}
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold">Gestión de Clientes</h2>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">
                Gestión de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alert.show && (
                <Alert type={alert.type} className="mb-4">
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={editClient !== null ? handleSaveEdit : handleAgregar} className="mb-8">
                <div className="grid">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      type="text"
                      name="nombre"
                      value={newNombre}
                      onChange={(e) => setNewNombre(e.target.value)}
                      placeholder="Ingrese Nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CI/NIT</label>
                    <input
                      type="text"
                      name="ci"
                      value={newCI}
                      onChange={(e) => setNewCI(e.target.value)}
                      placeholder="Ingrese CI/NIT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <input
                      type="text"
                      name="telefono"
                      value={newTelefono}
                      onChange={(e) => setNewTelefono(e.target.value)}
                      placeholder="Ingrese Teléfono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dirección</label>
                    <input
                      type="text"
                      name="direccion"
                      value={newDireccion}
                      onChange={(e) => setNewDirreccion(e.target.value)}
                      placeholder="Ingrese Dirección"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium">Seguro Médico (Opcional)</label>
                      <button
                        type="button"
                        onClick={() => setShowQuickSeguro(true)}
                        className="text-xs text-white px-2 py-0.5 rounded flex items-center gap-1 shadow-sm transition hover:opacity-90 cursor-pointer"
                        style={{ background: "#2563eb", color: "#ffffff" }}
                      >
                        <Plus size={12} />
                        Nuevo Seguro
                      </button>
                    </div>
                    <select
                      value={newIdSeguro}
                      onChange={(e) => setNewIdSeguro(e.target.value)}
                      className="border rounded p-2 w-full bg-white text-sm"
                    >
                      <option value="">Particular (Sin Seguro)</option>
                      {seguros.map((seg) => (
                        <option key={seg.id} value={seg.id}>
                          {seg.nombre} {seg.porcentaje !== undefined ? `(${Number(seg.porcentaje).toFixed(0)}%)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="button-group">
                    <button style={{ background: 'blue' }} type="submit" className="btn btn-primary">
                      {editMode ? "Actualizar" : "Registrar"}
                    </button>
                    <button
                      style={{ background: 'blue' }}
                      type="button"
                      onClick={handleReset}
                      className="btn btn-success"
                    >
                      Nuevo
                    </button>
                  </div>
                </div>
              </form>

              <div className="table-controls flex flex-wrap gap-4 items-center justify-between mb-4">
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

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Filtrar Seguro:</span>
                  <select
                    className="border rounded p-1.5 text-sm bg-white"
                    value={filterSeguro}
                    onChange={(e) => {
                      setFilterSeguro(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Todos los clientes</option>
                    <option value="sin_seguro">Particular (Sin Seguro)</option>
                    {seguros.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <button
                    style={{ background: 'blue' }}
                    className="search-button"
                    onClick={() => setSearchTerm("")}
                  >
                    <Search size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-auto">
                  <thead className="bg-gray-100">
                    <tr>
                      <th style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="p-3 text-left">Nombre</th>
                      <th style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="p-3 text-left">CI/NIT</th>
                      <th style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="p-3 text-left">Teléfono</th>
                      <th style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="p-3 text-left">Dirección</th>
                      <th style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="p-3 text-left">Seguro</th>
                      <th style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          No se encontraron clientes registrados con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((client) => {
                        const seguroEncontrado = seguros.find((s) => s.id === client.idseguro);
                        return (
                          <tr key={client.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{client.nombre}</td>
                            <td className="p-3">{client.ci}</td>
                            <td className="p-3">{client.telefono}</td>
                            <td className="p-3">{client.direccion}</td>
                            <td className="p-3">
                              {client.idseguro ? (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                                  {seguroEncontrado
                                    ? `${seguroEncontrado.nombre}${seguroEncontrado.porcentaje !== undefined ? ` (${Number(seguroEncontrado.porcentaje).toFixed(0)}%)` : ""}`
                                    : `Seguro #${client.idseguro}`}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs italic">
                                  Particular
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="action-buttons flex justify-center gap-2">
                                <button
                                  style={{ background: 'blue' }}
                                  onClick={() => handleEdit(client)}
                                  className="btn btn-primary"
                                  title="Editar cliente"
                                >
                                  <Edit2 size={18} />
                                </button>

                                <button
                                  onClick={() => handleEliminar(client.id)}
                                  className="btn btn-danger"
                                  title="Eliminar cliente"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredClients.length}
                itemsPerPage={itemsPerPage}
                itemName="clientes"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- MODAL DE CREACIÓN RÁPIDA DE SEGURO --- */}
      {showQuickSeguro && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-t-8 border-blue-600 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-800">
                Agregar Nuevo Seguro
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickSeguro(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuickSeguro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Seguro <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickSeguroNombre}
                  onChange={(e) => setQuickSeguroNombre(e.target.value)}
                  placeholder="Ej. BANCA, COSML, PANBOL..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de Cobertura / Ganancia (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quickSeguroPorcentaje}
                  onChange={(e) => setQuickSeguroPorcentaje(e.target.value)}
                  placeholder="Ej. 25.00"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <span className="text-xs text-gray-500 mt-1 block">
                  Porcentaje aplicado al costo del producto para convenio.
                </span>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickSeguro(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickSeguro}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium disabled:opacity-50"
                  style={{ background: "#2563eb", color: "#ffffff" }}
                >
                  {isSubmittingQuickSeguro ? "Guardando..." : "Guardar y Seleccionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
