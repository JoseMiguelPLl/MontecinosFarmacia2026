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

  // --- SEGURIDAD ---
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'view' | 'edit', user: User | null }>({ type: 'view', user: null });
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.usuarioNombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const responseUsers = await fetch('http://localhost:5000/api/Usuarios/ListarUsuariosActivos');
      const dataUsers = await responseUsers.json();
      setUsers(dataUsers);
      setFilteredUsers(dataUsers);

      const responseRoles = await fetch('http://localhost:5000/api/Roles/ListarRoles');
      setRoles(await responseRoles.json());

      const responsePermissions = await fetch('http://localhost:5000/api/Permisos/ListarPermisos');
      setPermissions(await responsePermissions.json());
    } catch (error) {
      showAlert("error", "Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionsChange = (permission: string) => {
    const permissionsMap: { [key: string]: number } = {
      'Configuración': 1, 'Usuarios': 2, 'Clientes': 3, 'Productos': 4,
      'Ventas': 5, 'Historial de Ventas': 6, 'Tipos': 7, 'Presentación': 8, 'Laboratorios': 9,
    };
    const permissionNumber = permissionsMap[permission];
    setSelectedPermissions(prev => prev.includes(permissionNumber) ? prev.filter(p => p !== permissionNumber) : [...prev, permissionNumber]);
  };

  const handlePermissionsClick = async (userId: number) => {
    setSelectedUserId(userId);
    try {
      const response = await fetch(`http://localhost:5000/api/Detalle_Permisos/ListarDetallePermisosActivosUsuario?id=${userId}`);
      const userPermissions = await response.json();
      setSelectedPermissions(userPermissions.map((p: any) => p.idpermiso));
      setShowPermissionsModal(true);
    } catch (error) {
      showAlert('error', 'Error al cargar permisos');
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/Detalle_Permisos/Crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IdUsuario: selectedUserId, Permisos: selectedPermissions })
      });
      if (response.ok) {
        showAlert('success', 'Permisos actualizados exitosamente');
        setShowPermissionsModal(false);
      }
    } catch (error) {
      showAlert('error', 'Error al actualizar');
    }
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

      const response = await fetch(url, { method: editMode ? 'PUT' : 'POST' });
      if (response.ok) {
        showAlert('success', `Usuario ${editMode ? 'modificado' : 'registrado'} exitosamente`);
        fetchUsers();
        handleReset();
      }
    } catch (error) {
      showAlert('error', 'Error en el servidor');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      await fetch(`http://localhost:5000/api/Usuarios/${id}`, { method: 'DELETE' });
      fetchUsers();
    }
  };

  const handleReset = () => {
    setFormData({ id: 0, nombre: '', correo: '', usuarioNombre: '', password: '', estado: 'Activo', idrol: 1, permisos: [] });
    setEditMode(false);
    setVisiblePasswords({});
  };

  const showAlert = (type: "error" | "success", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
  };

  // --- SEGURIDAD ---
  const requestSecurityAccess = (type: 'view' | 'edit', user: User) => {
    setAdminPass(''); 
    setPendingAction({ type, user });
    setShowVerifyModal(true);
  };

  const verifyAdmin = () => {
    if (adminPass === "ADMIN") {
      if (pendingAction.type === 'view' && pendingAction.user) {
        setVisiblePasswords(prev => ({ ...prev, [pendingAction.user!.id]: true }));
      } else if (pendingAction.type === 'edit' && pendingAction.user) {
        setEditMode(true);
        setFormData(pendingAction.user);
      }
      setShowVerifyModal(false);
      setAdminPass('');
    } else {
      setAdminPass('');
      showAlert("error", "Código incorrecto");
    }
  };

  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div className="flex h-screen">
      <NavBarRoot />
      <div className="p-4 flex-1 overflow-auto">
        {/* Cabecera Azul */}
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-4 -ml-4 -mt-4 mb-7 p-8 font-bold">
          <h2 className="text-3xl uppercase">Gestión de Usuarios</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">
              Gestión de Usuarios - Farmacia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alert.show && (
              <Alert className={alert.type === "error" ? "bg-red text-white mb-4" : "bg-green-100 mb-4"}>
                <AlertDescription className="font-bold">{alert.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="mb-8 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Nombre</label>
                  <input type="text" autoComplete="new-name" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ingrese Nombre" className="w-full p-2 border rounded outline-none focus:border-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                  <input type="text" autoComplete="new-email" value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} placeholder="Ingrese Email" className="w-full p-2 border rounded outline-none focus:border-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Usuario</label>
                  <input type="text" autoComplete="new-username" value={formData.usuarioNombre} onChange={(e) => setFormData({ ...formData, usuarioNombre: e.target.value })} placeholder="Ingrese Usuario" className="w-full p-2 border rounded outline-none focus:border-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Contraseña</label>
                  <div className="relative">
                    <input 
                      type={editMode || formData.id === 0 ? "text" : "password"} 
                      autoComplete="new-password"
                      value={formData.password} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                      placeholder={editMode || formData.id === 0 ? "Ingrese Contraseña" : "••••••••"} 
                      readOnly={!editMode && formData.id !== 0}
                      className={`w-full p-2 border rounded outline-none ${!editMode && formData.id !== 0 ? 'bg-gray-200' : 'bg-white'}`} 
                    />
                    {!editMode && formData.id !== 0 && <Lock size={14} className="absolute right-2 top-3 text-gray-400" />}
                  </div>
                </div>
              </div>
              <div className="button-group mt-4 flex gap-2">
                <button style={{ background: 'blue' }} type="submit" className="text-white px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity">
                  {editMode ? "Actualizar" : "Registrar"}
                </button>
                <button style={{ background: 'blue' }} type="button" onClick={handleReset} className="text-white px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity">
                  Nuevo
                </button>
              </div>
            </form>

            <div className="table-controls flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Mostrar</span>
                <select className="border rounded p-1" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span className="text-sm text-gray-600">registros</span>
              </div>
              <div className="search-container flex">
                <input 
                  type="text" 
                  autoComplete="off" 
                  name="user-search-field"
                  placeholder="Buscar por nombre..." 
                  className="p-2 border rounded-l outline-none focus:border-blue w-64" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <button style={{ background: 'blue' }} className="text-white px-3 rounded-r">
                  <Search size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-auto border shadow-sm">
                <thead>
                  <tr className="bg-blue text-white">
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Usuario</th>
                    <th className="p-3 text-left">Password</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-3 text-center font-bold">Cargando usuarios...</td></tr>
                  ) : currentUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">{user.nombre}</td>
                      <td className="p-3">{user.correo}</td>
                      <td className="p-3">{user.usuarioNombre}</td>
                      <td className="p-3 font-mono">
                        <div className="flex items-center gap-2">
                          <span>{visiblePasswords[user.id] ? user.password : "••••••••"}</span>
                          <button type="button" onClick={() => visiblePasswords[user.id] ? setVisiblePasswords(p => ({ ...p, [user.id]: false })) : requestSecurityAccess('view', user)} className="text-blue hover:scale-110 transition-transform">
                            {visiblePasswords[user.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center flex justify-center gap-2">
                        <button style={{ background: 'blue' }} className="text-white p-2 rounded hover:opacity-80" onClick={() => requestSecurityAccess('edit', user)}><Edit2 size={18} /></button>
                        <button className="bg-red text-white p-2 rounded hover:opacity-80" onClick={() => handleDelete(user.id)}><Trash2 size={18} /></button>
                        <button style={{ background: 'blue' }} className="text-white p-2 rounded hover:opacity-80" onClick={() => handlePermissionsClick(user.id)}><FaKey size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal Seguridad */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm border-t-8 border-blue shadow-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue"><Lock /> VALIDACIÓN REQUERIDA</h3>
              <input 
                type="password" 
                autoComplete="off"
                name="admin-verify-code-field"
                placeholder="CÓDIGO ADMIN" 
                className="w-full p-3 border-2 border-blue rounded text-center text-xl font-bold tracking-widest outline-none"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verifyAdmin()}
                autoFocus
              />
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowVerifyModal(false)} className="flex-1 py-2 bg-gray-200 rounded font-bold">CANCELAR</button>
                <button onClick={verifyAdmin} className="flex-1 py-2 bg-blue text-white rounded font-bold shadow-lg">VERIFICAR</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Permisos */}
        {showPermissionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md border-t-8 border-blue">
              <h3 className="text-xl font-bold mb-4 border-b pb-2 text-blue">EDITAR PERMISOS</h3>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto mb-6 pr-2">
                {Object.keys({ 'Configuración': 1, 'Usuarios': 2, 'Clientes': 3, 'Productos': 4, 'Ventas': 5, 'Historial de Ventas': 6, 'Tipos': 7, 'Presentación': 8, 'Laboratorios': 9 }).map(name => (
                  <label key={name} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedPermissions.includes(({ 'Configuración': 1, 'Usuarios': 2, 'Clientes': 3, 'Productos': 4, 'Ventas': 5, 'Historial de Ventas': 6, 'Tipos': 7, 'Presentación': 8, 'Laboratorios': 9 } as any)[name])} 
                      onChange={() => handlePermissionsChange(name)} 
                      className="w-5 h-5 accent-blue" 
                    />
                    <span className="font-medium text-gray-700">{name}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowPermissionsModal(false)} className="px-4 py-2 bg-gray-200 rounded font-bold">CERRAR</button>
                <button onClick={handleUpdatePermissions} className="px-4 py-2 bg-blue text-white rounded font-bold">GUARDAR</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;