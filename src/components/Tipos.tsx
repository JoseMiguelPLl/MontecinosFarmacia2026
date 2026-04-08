import { useEffect, useState } from "react";
import { Trash2, Edit2, Search, Plus, RefreshCw } from "lucide-react";
import NavBarRoot from "./NavBarRoot";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";

interface Tipo {
  id: number;
  nombre: string;
  eliminado?: boolean;
}

interface AlertState {
  show: boolean;
  type: "error" | "success";
  message: string;
}

function Tipos() {
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [editTipoId, setEditTipoId] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTipos = tipos.filter(
    (tipo) =>
      !tipo.eliminado &&
      tipo.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTipos.length / itemsPerPage);
  const paginatedTipos = filteredTipos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "success",
    message: ""
  });

  const showAlert = (type: "error" | "success", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/Tipos/ListarTiposActivos")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener los tipos");
        }
        return response.json();
      })
      .then((data: Tipo[]) => setTipos(data))
      .catch((error) => console.error("Error al cargar tipos:", error));
  }, []);

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showAlert("error", "El nombre del tipo es obligatorio");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/Tipos/Crear?nombre=${encodeURIComponent(newName)}`,
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
        setNewName("");
        showAlert("success", "Tipo agregado exitosamente");
      } else {
        const errorData = await response.json();
        showAlert("error", errorData.message || "Error al agregar el tipo");
      }
    } catch (error) {
      showAlert("error", "Error en la solicitud al servidor");
    }
  };

  const handleEdit = (tipo: Tipo) => {
    setEditTipoId(tipo.id);
    setNewName(tipo.nombre);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editTipoId === null || !newName.trim()) {
      showAlert("error", "El nombre del tipo es obligatorio");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/Tipos/Actualizar?id=${editTipoId}&nombre=${encodeURIComponent(newName)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setTipos((prev) =>
          prev.map((tipo) =>
            tipo.id === editTipoId ? { ...tipo, nombre: newName } : tipo
          )
        );
        setEditTipoId(null);
        setNewName("");
        showAlert("success", "Tipo actualizado exitosamente");
      } else {
        const errorData = await response.json();
        showAlert("error", errorData.message || "Error al actualizar el tipo");
      }
    } catch (error) {
      showAlert("error", "Error en la solicitud al servidor");
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/Tipos/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setTipos((prev) =>
          prev.map((tipo) =>
            tipo.id === id ? { ...tipo, eliminado: true } : tipo
          )
        );
        showAlert("success", "Tipo eliminado exitosamente");
      } else {
        const errorData = await response.json();
        showAlert("error", errorData.message || "Error al eliminar el tipo");
      }
    } catch (error) {
      showAlert("error", "Error en la solicitud al servidor");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCancelEdit = () => {
    setEditTipoId(null);
    setNewName("");
  };

  return (
    <div className="flex h-screen">
      <NavBarRoot />
  
      <div className="p-4 flex-1 overflow-auto w-1/2">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold">Tipos</h2>
          </div>
        </div>
  
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">
              Gestión de Tipos de Medicamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alert.show && (
              <Alert variant={alert.type === "success" ? "default" : "destructive"} className="mb-4">
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}
  
            <form onSubmit={editTipoId ? handleSaveEdit : handleAgregar} className="mb-8">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo Unidades</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ingrese Tipo"
                  />
                </div>
                <div className="flex gap-2">
                  <button style={{background:'Blue'}}
                    type="submit"
                    className="px-4 py-2 bg-blue text-white rounded hover:bg-blue-700"
                  >
                    {editTipoId ? "Actualizar" : "Registrar"}
                  </button>
                  {editTipoId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </form>
  
            <div className="flex justify-between items-center mb-4">
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
              <div className="relative">
                <input
                  type="text"
                  className="pl-8 pr-4 py-2 border rounded"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
  
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue text-white">
                
                    <th className="p-3 text-left bg-blue">Tipo</th>
                    <th className="p-3 text-center bg-blue">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTipos.length > 0 ? (
                    paginatedTipos.map((tipo) => (
                      <tr key={tipo.id} className="border-b hover:bg-gray-50">
                      
                        <td className="p-3">{tipo.nombre}</td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => handleEdit(tipo)}
                            className="p-2 bg-blue text-white rounded hover:bg-yellow-600"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminar(tipo.id)}
                            className="p-2 bg-red text-white rounded hover:bg-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-gray-500">
                        No se encontraron tipos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
  
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Mostrando registros del {(currentPage - 1) * itemsPerPage + 1} al {Math.min(currentPage * itemsPerPage, filteredTipos.length)} de un total de {filteredTipos.length} registros
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border rounded ${currentPage === page ? 'bg-blue-600 text-white' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Tipos;