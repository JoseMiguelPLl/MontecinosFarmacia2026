import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Search, Plus, RefreshCw, Eye, EyeOff, Lock, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import './UserManagement.css';
import 'font-awesome/css/font-awesome.min.css';
import { FaKey } from 'react-icons/fa';
import NavBarRoot from "./NavBarRoot";

interface User {
  id: number;
  nombre: string;
  correo: string;
  usuarioNombre: string;
  password: string;
  estado: string;
  idrol: number;
  permisos: string[];
}

interface Role {
  idRol: number;
  nombre: string;
  estado: string;
}

interface Permission {
  idPermiso: number;
  nombre: string;
  descripcion: string;
  estado: string;
}

interface AlertState {
  show: boolean;
  type: "error" | "success";
  message: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState<User>({
    id: 0,
    nombre: '',
    correo: '',
    usuarioNombre: '',
    password: '',
    estado: 'Activo',
    idrol: 1,
    permisos: []
  });
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "success",
    message: ""
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // --- NUEVOS ESTADOS DE SEGURIDAD ---
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'view' | 'edit', user: User | null }>({ type: 'view', user: null });
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const responseUsers = await fetch('http://localhost:5000/api/Usuarios/ListarUsuariosActivos');
        if (!responseUsers.ok) throw new Error(`HTTP error! status: ${responseUsers.status}`);
        const dataUsers = await responseUsers.json();
        if (!Array.isArray(dataUsers)) throw new Error('Los datos recibidos no tienen el formato esperado');
        setUsers(dataUsers);
        setFilteredUsers(dataUsers);

        const responseRoles = await fetch('http://localhost:5000/api/Roles/ListarRoles');
        const dataRoles = await responseRoles.json();
        setRoles(dataRoles);

        const responsePermissions = await fetch('http://localhost:5000/api/Permisos/ListarPermisos');
        const dataPermissions = await responsePermissions.json();
        setPermissions(dataPermissions);
      } catch (error) {
        showAlert("error", "Error en la solicitud al servidor");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.usuarioNombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, users]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const permissionsMap: { [key: string]: number } = {
    'Configuración': 1,
    'Usuarios': 2,
    'Clientes': 3,
    'Productos': 4,
    'Ventas': 5,
    'Historial de Ventas': 6,
    'Tipos': 7,
    'Presentación': 8,
    'Laboratorios': 9,
  };

  const handlePermissionsChange = (permission: string) => {
    const permissionNumber = permissionsMap[permission];
    setSelectedPermissions(prevState => {
      if (prevState.includes(permissionNumber)) {
        return prevState.filter(p => p !== permissionNumber);
      } else {
        return [...prevState, permissionNumber];
      }
    });
  };

  const handlePermissionsClick = async (userId: number) => {
    setSelectedUserId(userId);
    try {
      const response = await fetch(`http://localhost:5000/api/Detalle_Permisos/ListarDetallePermisosActivosUsuario?id=${userId}`);
      if (!response.ok) throw new Error('Error al obtener los permisos del usuario');
      const userPermissions = await response.json();
      const permissionIds = userPermissions.map((permission: any) => permission.idpermiso);
      setSelectedPermissions(permissionIds);
      setShowPermissionsModal(true);
    } catch (error) {
      showAlert('error', 'Error al cargar los permisos del usuario');
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      const requestBody = { IdUsuario: selectedUserId, Permisos: selectedPermissions };
      const response = await fetch(`http://localhost:5000/api/Detalle_Permisos/Crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (response.ok) {
        showAlert('success', 'Permisos actualizados exitosamente');
        setShowPermissionsModal(false);
      } else {
        showAlert('error', 'Error al actualizar los permisos');
      }
    } catch (error) {
      showAlert('error', 'Error en la solicitud al servidor');
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/Usuarios/ListarUsuariosActivos');
      if (!response.ok) throw new Error('Error al obtener los usuarios');
      const data: User[] = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      showAlert('error', 'Error al cargar los usuarios');
    }
  };

  const showAlert = (type: "error" | "success", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.nombre || !formData.correo || !formData.usuarioNombre || !formData.password) {
      showAlert('error', 'Todos los campos son obligatorios');
      return;
    }
    try {
      const url = editMode
        ? `http://localhost:5000/api/Usuarios/Actualizar?id=${formData.id}&nombre=${formData.nombre}&correo=${formData.correo}&usuarioNombre=${formData.usuarioNombre}&password=${formData.password}&estado=${formData.estado}&idrol=${formData.idrol}`
        : `http://localhost:5000/api/Usuarios/Crear?nombre=${formData.nombre}&correo=${formData.correo}&usuarioNombre=${formData.usuarioNombre}&password=${formData.password}&estado=${formData.estado}&idrol=${formData.idrol}`;

      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showAlert('success', `Usuario ${editMode ? 'modificado' : 'registrado'} exitosamente`);
        fetchUsers();
        handleReset();
      } else {
        showAlert('error', `Error al ${editMode ? 'modificar' : 'registrar'} el usuario`);
      }
    } catch (error) {
      showAlert('error', 'Error en la solicitud al servidor');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/Usuarios/${id}`, { method: 'DELETE' });
        if (response.ok) {
          showAlert('success', 'Usuario eliminado exitosamente');
          fetchUsers();
        } else {
          showAlert('error', 'Error al eliminar el usuario');
        }
      } catch (error) {
        showAlert('error', 'Error en la solicitud al servidor');
      }
    }
  };

  const handleReset = () => {
    setFormData({
      id: 0, nombre: '', correo: '', usuarioNombre: '', password: '', estado: 'Activo', idrol: 1, permisos: []
    });
    setEditMode(false);
    setVisiblePasswords({});
  };

  // --- LÓGICA DE SEGURIDAD PARA CONTRASEÑAS ---
  const requestSecurityAccess = (type: 'view' | 'edit', user: User) => {
    setPendingAction({ type, user });
    setAdminPass('');
    setShowVerifyModal(true);
  };

  const verifyAdmin = () => {
    // AQUÍ VALIDACIÓN DE ADMIN (Puedes cambiar "admin123" por una variable o lógica de API)
    if (adminPass === "admin123") {
      if (pendingAction.type === 'view' && pendingAction.user) {
        setVisiblePasswords(prev => ({ ...prev, [pendingAction.user!.id]: true }));
      } else if (pendingAction.type === 'edit' && pendingAction.user) {
        setEditMode(true);
        setFormData(pendingAction.user);
      }
      setShowVerifyModal(false);
      showAlert("success", "Acceso concedido");
    } else {
      showAlert("error", "Contraseña de administrador incorrecta");
    }
  };

  return (
    <div className="flex h-screen">
      <NavBarRoot />
      <div className="p-4 flex-1 overflow-auto w-1/2">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold">Usuarios</h2>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">
              Gestión de Usuarios - Farmacia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alert.show && (
              <Alert type={alert.type} className="mb-4">
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ingrese Nombre"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="text"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="Ingrese Email"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Usuario</label>
                  <input
                    type="text"
                    value={formData.usuarioNombre}
                    onChange={(e) => setFormData({ ...formData, usuarioNombre: e.target.value })}
                    placeholder="Ingrese Usuario"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contraseña</label>
                  <input
                    type={editMode ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editMode ? "Nueva contraseña" : "••••••••"}
                    readOnly={!editMode}
                    className={`w-full p-2 border rounded ${!editMode ? 'bg-gray-100 italic' : 'bg-white font-bold'}`}
                  />
                </div>
              </div>
              <div className="button-group mt-4 flex gap-2">
                <button style={{ background: 'blue' }} type="submit" className="btn btn-primary text-white px-4 py-2 rounded">
                  {editMode ? "Actualizar" : "Registrar"}
                </button>
                <button style={{ background: 'blue' }} type="button" onClick={handleReset} className="btn btn-success text-white px-4 py-2 rounded">
                  Nuevo
                </button>
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
                  placeholder="Buscar por nombre, email o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="p-2 border rounded-l"
                />
                <button
                  style={{ background: 'blue' }}
                  className="search-button text-white px-3 rounded-r flex items-center"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-auto">
                <thead className="bg-blue-800 text-white">
                  <tr>
                    <th style={{ background: 'blue' }} className="p-3 text-left">Nombre</th>
                    <th style={{ background: 'blue' }} className="p-3 text-left">Email</th>
                    <th style={{ background: 'blue' }} className="p-3 text-left">Usuario</th>
                    <th style={{ background: 'blue' }} className="p-3 text-left">Contraseña</th>
                    <th style={{ background: 'blue' }} className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-3 text-center">Cargando usuarios...</td></tr>
                  ) : currentUsers.length === 0 ? (
                    <tr><td colSpan={5} className="p-3 text-center">No se encontraron registros</td></tr>
                  ) : (
                    currentUsers.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{user.nombre}</td>
                        <td className="p-3">{user.correo}</td>
                        <td className="p-3">{user.usuarioNombre}</td>
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-2">
                            <span>{visiblePasswords[user.id] ? user.password : "••••••••"}</span>
                            <button
                              type="button"
                              onClick={() => visiblePasswords[user.id] ? setVisiblePasswords(p => ({ ...p, [user.id]: false })) : requestSecurityAccess('view', user)}
                              className="text-gray-500 hover:text-blue-600"
                            >
                              {visiblePasswords[user.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-center flex justify-center gap-2">
                          <button
                            style={{ background: 'blue' }}
                            className="btn btn-warning text-white p-2 rounded"
                            onClick={() => requestSecurityAccess('edit', user)}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className="btn btn-danger bg-red-600 text-white p-2 rounded"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            className="text-lg font-bold bg-blue text-white p-2 rounded"
                            onClick={() => handlePermissionsClick(user.id)}
                          >
                            <FaKey size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination flex justify-between items-center mt-4">
              <div className="pagination-info text-sm">
                Mostrando registros del {(currentPage - 1) * itemsPerPage + 1} al {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
              </div>
              <div className="pagination-buttons flex items-center">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
                <span className="mx-2">Página {currentPage} de {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Siguiente</button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- MODAL DE SEGURIDAD PARA ADMINISTRADOR --- */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4 text-blue-700 font-bold border-b pb-2">
                <Lock size={20} />
                <span>Validación de Seguridad</span>
              </div>
              <p className="text-sm text-gray-600 mb-4 italic">
                Requiere contraseña de administrador para {pendingAction.type === 'view' ? 'ver la contraseña' : 'editar al usuario'}.
              </p>
              <input
                type="password"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center"
                placeholder="Password Administrador"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && verifyAdmin()}
              />
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowVerifyModal(false)} className="flex-1 py-2 bg-gray-200 rounded font-bold">Cancelar</button>
                <button onClick={verifyAdmin} className="flex-1 py-2 bg-blue-600 text-white rounded font-bold shadow-lg hover:bg-blue-700">Verificar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PERMISOS */}
        {showPermissionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Editar Permisos</h3>
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {Object.entries(permissionsMap).map(([permissionName, permissionId]) => (
                  <div key={permissionId} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`permission-${permissionId}`}
                      checked={selectedPermissions.includes(permissionId)}
                      onChange={() => handlePermissionsChange(permissionName)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor={`permission-${permissionId}`} className="ml-3 text-gray-700">{permissionName}</label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowPermissionsModal(false)} className="px-4 py-2 bg-red text-white rounded">Cancelar</button>
                <button onClick={handleUpdatePermissions} className="px-4 py-2 bg-blue text-white rounded">Guardar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;