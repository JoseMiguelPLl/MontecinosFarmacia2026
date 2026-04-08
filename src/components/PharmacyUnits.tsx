import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import NavBarRoot from "./NavBarRoot";
import './PharmacyUnits.css';

interface Unit {
  id: number;
  nombre: string;
  nombreCorto: string;
  eliminado?: boolean;
}

interface AlertState {
  show: boolean;
  type: "error" | "success";
  message: string;
}

const PharmacyUnits: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState<Unit>({
    id: 0,
    nombre: '',
    nombreCorto: ''
  });

  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "success",
    message: ""
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch units from backend
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/Presentaciones/ListarPresentacionesActivos');
        if (!response.ok) {
          throw new Error('Error al obtener las unidades');
        }
        const data = await response.json();
        setUnits(data);
      } catch (error) {
        console.error('Error al cargar unidades:', error);
        showAlert('error', 'Error al cargar las unidades');
      }
    };

    fetchUnits();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const showAlert = (type: "error" | "success", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.nombreCorto) {
      showAlert('error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      if (editMode) {
        // Update existing unit
        const response = await fetch(
          `http://localhost:5000/api/Presentaciones/Actualizar?id=${formData.id}&nombre=${formData.nombre}&nombreCorto=${formData.nombreCorto}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const updatedUnits = units.map(unit =>
            unit.id === formData.id ? formData : unit
          );
          setUnits(updatedUnits);
          showAlert('success', 'Unidad modificada exitosamente');
        } else {
          throw new Error('Error al actualizar la unidad');
        }
      } else {
        // Create new unit
        const response = await fetch(
          `http://localhost:5000/api/Presentaciones/Crear?nombre=${formData.nombre}&nombreCorto=${formData.nombreCorto}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const newUnit = await response.json();
          setUnits([...units, newUnit]);
          showAlert('success', 'Unidad registrada exitosamente');
        } else {
          throw new Error('Error al crear la unidad');
        }
      }

      handleReset();
    } catch (error) {
      console.error('Error:', error);
      showAlert('error', 'Ocurrió un error al procesar la solicitud');
    }
  };

  const handleEdit = (unit: Unit) => {
    setFormData(unit);
    setEditMode(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta unidad?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/Presentaciones/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setUnits(units.filter(unit => unit.id !== id));
          showAlert('success', 'Unidad eliminada exitosamente');
        } else {
          throw new Error('Error al eliminar la unidad');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlert('error', 'Ocurrió un error al eliminar la unidad');
      }
    }
  };

  const handleReset = () => {
    setFormData({
      id: 0,
      nombre: '',
      nombreCorto: ''
    });
    setEditMode(false);
  };

  const filteredUnits = units.filter(unit =>
    !unit.eliminado &&
    (unit.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.nombreCorto.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUnits = filteredUnits.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);

  return (
    <div className="flex h-screen">
      {/* NavBar */}
      <NavBarRoot />
      
      {/* Main Content */}
      <div className="p-4 flex-1 overflow-auto w-1/2">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold">Unidades de Medidas</h2>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">
              Gestión de Presentaciones de Medicamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alert.show && (
              <Alert type={alert.type} className="mb-4">
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="mb-8">
              <div className="grid">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ingrese Nombre"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre Corto</label>
                  <input
                    type="text"
                    name="nombreCorto"
                    value={formData.nombreCorto}
                    onChange={handleInputChange}
                    placeholder="Ingrese Nombre Corto"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="button-group flex gap-2 mt-4">
                  <button 
                    style={{background:'blue'}} 
                    type="submit" 
                    className="text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition"
                  >
                    {editMode ? "Actualizar" : "Registrar"}
                  </button>
                  <button 
                    style={{background:'blue'}} 
                    type="button" 
                    onClick={handleReset} 
                    className="text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition"
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
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span className="text-sm">registros</span>
              </div>
              <div className="search-container flex">
                <input
                  type="text"
                  className=""
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  style={{ background: 'blue' }}
                  className="search-button text-white px-3 rounded-r hover:bg-blue-600 transition"
                  onClick={() => setSearchTerm("")}
                >
                  <Search size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-auto">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th style={{background:'blue'}} className="p-3 text-left">Nombre</th>
                    <th style={{background:'blue'}} className="p-3 text-left">Nombre Corto</th>
                    <th style={{background:'blue'}} className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUnits.length > 0 ? (
                    currentUnits.map((unit) => (
                      <tr key={unit.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{unit.nombre}</td>
                        <td className="p-3">{unit.nombreCorto}</td>
                        <td className="p-3 text-center">
                          <button 
                            style={{background:'blue'}}
                            className="text-white px-3 py-1 rounded shadow hover:bg-blue-600 transition mr-2" 
                            onClick={() => handleEdit(unit)}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            className="bg-red text-white px-3 py-1 rounded shadow hover:bg-red-600 transition" 
                            onClick={() => handleDelete(unit.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-3 text-center">No se encontraron unidades</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination flex justify-between items-center mt-4">
              <div className="pagination-info text-sm">
                Mostrando registros del {startIndex + 1} al {Math.min(endIndex, filteredUnits.length)} de un total de {filteredUnits.length} registros
              </div>
              <div className="pagination-buttons flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => prev - 1)} 
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <button 
                  style={{background:'blue'}} 
                  className="text-white px-3 py-1 rounded shadow"
                >
                  {currentPage}
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => prev + 1)} 
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
};

export default PharmacyUnits;