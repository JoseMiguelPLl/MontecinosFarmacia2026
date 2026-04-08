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
import "./ClientManagement.css";

// Define interface for Client
interface Client {
  id: number;
  nombre: string;
  ci: string;
  telefono: string;
  direccion: string;
  eliminado?: boolean;
}

// Define interface for Alert
interface AlertState {
  show: boolean;
  type: "error" | "success"; // Cambiado de string a literales de tipo
  message: string;
}

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [newNombre, setNewNombre] = useState("");
  const [newCI, setNewCI] = useState("");
  const [newTelefono, setNewTelefono] = useState("");
  const [newDireccion, setNewDirreccion] = useState("");
  const [editClient, setEditClient] = useState<number | null>(null);
  const [formData, setFormData] = useState<Client>({
    id: 0,
    nombre: "",
    ci: "",
    telefono: "",

    direccion: "",
  });

  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "success", // Usa un valor válido como predeterminado
    message: ""
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);


  useEffect(() => {
    fetch("http://localhost:5000/api/Clientes/ListarClientesActivos")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener los clientes");
        }
        return response.json();
      })
      .then((data: Client[]) => setClients(data))
      .catch((error) => console.error("Error al cargar los clientes:", error));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const showAlert = (type: "error" | "success", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
  };
  
  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault(); // Agregamos esto para prevenir el comportamiento por defecto del formulario
    
    if (!newNombre.trim() || !newCI.trim() || !newTelefono.trim() || !newDireccion.trim()) {
      showAlert("error", "Todos los campos son obligatorios");
      return;
    }
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/Clientes/Crear?nombre=${newNombre}&ci=${newCI}&telefono=${newTelefono}&direccion=${newDireccion}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
      );

      if (response.ok) {
        const newClient: Client = await response.json();
        setClients((prev) => [...prev, newClient]);
        handleReset(); // Usamos handleReset para limpiar el formulario
        showAlert("success", "Cliente agregado exitosamente");
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
    setEditMode(false);
    setEditClient(null);
  };
  
  const filteredClients = clients.filter(
    (client) =>
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(client.telefono).includes(searchTerm) || // Convierte a cadena antes de usar includes
      client.direccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setEditClient(client.id); // Guardar el ID del cliente que se está editando
    setNewNombre(client.nombre); // Cargar el nombre actual en el campo de edición
    setNewCI(client.ci);
    setNewTelefono(client.telefono);
    setNewDirreccion(client.direccion);
    setEditMode(true); // Activar el modo de edición
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  

  // Función para guardar los cambios en la edición
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNombre.trim() || !newCI.trim() || !newTelefono.trim() || !newDireccion.trim()) {
      showAlert("error", "Todos los campos son obligatorios");
      return;
    }
  
    if (editClient === null) return;
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/Clientes/Actualizar?id=${editClient}&nombre=${newNombre}&ci=${newCI}&telefono=${newTelefono}&direccion=${newDireccion}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.ok) {
        setClients((prev) =>
          prev.map((client) =>
            client.id === editClient
              ? {
                  ...client,
                  nombre: newNombre,
                  ci: newCI,
                  telefono: newTelefono,
                  direccion: newDireccion,
                }
              : client
          )
        );
        handleReset();
        showAlert("success", "Cliente actualizado exitosamente");
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
const totalPages = Math.ceil(filteredClients.length / itemsPerPage);



  return (
    <div className="flex h-screen">
      {/* NavBarRoot ocupa la parte izquierda */}
      <NavBarRoot />

      {/* Contenido principal */}
      <div className="p-4 flex-1 overflow-auto w-1/2">
        {/* Input de búsqueda */}
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8 ">
            <h2 className="text-3xl font-bold"> Gestión de Clientes</h2>
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

<form onSubmit={editClient ? handleSaveEdit : handleAgregar}className="mb-8">
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
    <div className="button-group">
      <button style={{background:'blue'}} type="submit" className="btn btn-primary">
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


              <div className="table-controls">
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
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                      style={{ background: 'blue' }}
                      className="search-button"
                      onClick={() => setSearchTerm("")} // Limpia el buscador
                    >
                      <Search size={18} />
                    </button>
                  </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-auto">
                <thead className="bg-gray-100">
                    <tr>
                 
                    <th style={{background:'blue'}}  className="p-3 text-left">Nombre</th>
                    <th style={{background:'blue'}}  className="p-3 text-left">CI/NIT</th>
                    <th style={{background:'blue'}}  className="p-3 text-left">Teléfono</th>
                    <th style={{background:'blue'}}  className="p-3 text-left">Dirección</th>
                    <th style={{background:'blue'}}  className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                     
                        <td className="p-3">{client.nombre}</td>
                        <td className="p-3">{client.ci}</td>
                        <td className="p-3">{client.telefono}</td>
                        <td className="p-3">{client.direccion}</td>
                        <td className="p-3 text-center">
                          <div className="action-buttons">
                            <button
                             style={{background:'blue'}}  onClick={() => handleEdit(client)}
                              className="btn btn-primary"
                            >
                              <Edit2 size={18} />
                            </button>

                            <button
                              onClick={() => handleEliminar(client.id)}
                              className="btn btn-danger"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <div className="pagination-info">
                  Mostrando registros del 1 al {filteredClients.length} de un
                  total de {filteredClients.length} registros
                </div>
                <div className="pagination">
                <div className="pagination-buttons">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={currentPage === index + 1 ? 'active' : ''}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;
