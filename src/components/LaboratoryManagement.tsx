import React, { useState, useEffect } from 'react';
import NavBarRoot from './NavBarRoot';
import { Trash2, Edit2, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import './LaboratoryManagement.css';

// Interface for Laboratory object
interface Laboratory {
  id: number;
  laboratorioNombre: string;
  direccion: string;
  eliminado?: boolean;
}

// Interface for Alert state
interface AlertState {
  show: boolean;
  type: "error" | "success";
  message: string;
}

const LaboratoryManagement: React.FC = () => {
  // State declarations at the beginning
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newDireccion, setNewDireccion] = useState("");
  const [editLabId, setEditLabId] = useState<number | null>(null);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "success",
    message: ""
  });

  // Filtered laboratories calculation
  const filteredLaboratories = laboratories.filter(
    (lab) =>
      !lab.eliminado &&
      lab.laboratorioNombre.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLaboratories = filteredLaboratories.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredLaboratories.length / itemsPerPage);

  useEffect(() => {
    fetchLaboratories();
  }, []);

  const fetchLaboratories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Laboratorios/ListarLaboratoriosActivos");
      if (!response.ok) {
        throw new Error("Error al obtener los laboratorios");
      }
      const data: Laboratory[] = await response.json();
      setLaboratories(data);
    } catch (error) {
      console.error("Error al cargar los laboratorios:", error);
      showAlert("error", "Error al cargar los laboratorios");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "nombre") {
      setNewName(value);
    } else if (name === "direccion") {
      setNewDireccion(value);
    }
  };

  const showAlert = (type: "error" | "success", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
  };

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDireccion.trim()) {
      showAlert("error", "Por favor complete todos los campos.");
      return;
    }
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/Laboratorios/Crear?laboratorionombre=${encodeURIComponent(newName)}&direccion=${encodeURIComponent(newDireccion)}`,
        {
          method: "POST",
        }
      );
      
      if (!response.ok) {
        throw new Error("Error al crear laboratorio");
      }
      
      const data = await response.json();
      setLaboratories(prev => [...prev, data]);
      setNewName("");
      setNewDireccion("");
      showAlert("success", "Laboratorio creado exitosamente");
      fetchLaboratories(); // Refrescar la lista
    } catch (error) {
      console.error("Error al crear laboratorio:", error);
      showAlert("error", "Error al crear laboratorio");
    }
  };

  const handleEdit = (lab: Laboratory) => {
    setEditLabId(lab.id);
    setNewName(lab.laboratorioNombre);
    setNewDireccion(lab.direccion);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editLabId === null || !newName.trim() || !newDireccion.trim()) {
      showAlert("error", "Por favor complete todos los campos.");
      return;
    }
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/Laboratorios/Actualizar?id=${editLabId}&laboratorionombre=${encodeURIComponent(newName)}&direccion=${encodeURIComponent(newDireccion)}`,
        {
          method: "PUT",
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }
  
      // Actualizar el estado local directamente
      setLaboratories(prev => prev.map(lab => 
        lab.id === editLabId ? { ...lab, laboratorioNombre: newName, direccion: newDireccion } : lab
      ));
      
      setEditLabId(null);
      setNewName("");
      setNewDireccion("");
      showAlert('success', 'Laboratorio actualizado exitosamente');
    } catch (error) {
      console.error("Error al actualizar:", error);
      showAlert('error', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/Laboratorios/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLaboratories(prev => prev.map(lab => 
          lab.id === id ? { ...lab, eliminado: true } : lab
        ));
        showAlert('success', 'Laboratorio eliminado exitosamente');
      } else {
        throw new Error(`Error al eliminar el laboratorio con ID ${id}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      showAlert('error', error instanceof Error ? error.message : 'Error al eliminar laboratorio');
    }
  };

  return (
    <div className="flex h-screen">
      <NavBarRoot />
      <div className="p-4 flex-1 overflow-auto w-1/2">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold">Laboratorio</h2>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">
                Gestión de Laboratorios/ Distribuidor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alert.show && (
                <Alert type={alert.type} className="mb-4">
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={editLabId !== null ? handleSaveEdit : handleAgregar} className="mb-8">
                <div className="grid">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre del Laboratorio</label>
                    <input
                      type="text"
                      name="nombre"
                      value={newName}
                      onChange={handleInputChange}
                      placeholder="Ingrese Nombre del Laboratorio"
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dirección/Celular</label>
                    <input
                      type="text"
                      name="direccion"
                      value={newDireccion}
                      onChange={handleInputChange}
                      placeholder="Ingrese Dirección"
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="col-span-full flex space-x-2 mt-4">
                    <button 
                      style={{background:'blue'}}
                      type="submit" 
                      className="btn btn-primary flex items-center"
                    >
                      {editLabId !== null ? "Actualizar" : "Registrar"}
                    </button>
                    <button 
                      style={{background:'blue'}} 
                      type="button" 
                      className="btn btn-secondary flex items-center"
                      onClick={() => {
                        setNewName('');
                        setNewDireccion('');
                        setEditLabId(null);
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
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    style={{ background: 'blue' }}
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
                      <th style={{background:'blue'}} className="p-3 text-left">Nombre</th>
                      <th style={{background:'blue'}} className="p-3 text-left">Dirección</th>
                      <th style={{background:'blue'}} className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLaboratories.map((laboratory) => (
                      <tr key={laboratory.id} className="border-b hover:bg-gray-50">
                    
                        <td className="p-3">{laboratory.laboratorioNombre}</td>
                        <td className="p-3">{laboratory.direccion}</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <button 
                              style={{background:'blue'}}
                              onClick={() => handleEdit(laboratory)}
                              className="btn btn-primary"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleEliminar(laboratory.id)}
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

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando registros del {startIndex + 1} al {Math.min(endIndex, filteredLaboratories.length)} 
                  de un total de {filteredLaboratories.length} registros
                </div>
                <div className="pagination-buttons">
                  <button 
                    onClick={() => setCurrentPage(prev => prev - 1)} 
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <button style={{background:'blue'}} className="active">{currentPage}</button>
                  <button 
                    onClick={() => setCurrentPage(prev => prev + 1)} 
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

export default LaboratoryManagement;