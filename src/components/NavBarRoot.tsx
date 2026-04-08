import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
// Importaciones corregidas para evitar errores de módulos
import { IoPeopleSharp } from "react-icons/io5"; 
import { IoMdPerson } from "react-icons/io";
import { FcDataConfiguration } from "react-icons/fc";
import { BsMenuButtonWide } from "react-icons/bs";
import { FaProductHunt, FaFlask, FaTags, FaCartPlus } from "react-icons/fa6";
import { MdOutlinePointOfSale } from "react-icons/md";
import icono from '../img/logo1.png';

function NavBarRoot() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setIsAuthenticated(true);
      fetchUserPermissions(userId);
    }
  }, []);

  const fetchUserPermissions = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/Detalle_Permisos/ListarDetallePermisosActivosUsuario?id=${userId}`);
      if (!response.ok) throw new Error('Error al obtener los permisos');
      const data = await response.json();
      setUserPermissions(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const hasPermission = (permissionId) => {
    return userPermissions.some(perm => perm.idpermiso === permissionId && perm.estado === "Activo");
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <div className="flex">
      {/* Mantenemos tu clase 'bg-blue' para no perder el tono original */}
      <nav className="bg-blue text-white h-screen w-56 flex flex-col py-5 shadow-lg">
        
        {/* Logo */}
        <div className="mb-8 flex justify-center px-4">
          <Link to="/home"> 
            <img src={icono} alt="Logo" className="w-32 h-auto" />
          </Link>
        </div>

        {/* Links de navegación */}
        <ul className="flex flex-col gap-5 px-6 flex-grow">
          {hasPermission(2) && (
            <li>
              <Link to="/usuario" className="flex items-center gap-3 transition-all duration-200 hover:text-[#4ade80]">
                <IoMdPerson className="text-lg" /> 
                <span className="text-[15px] font-medium">Usuarios</span>
              </Link>
            </li>
          )}

          {hasPermission(1) && (
            <li>
              <Link to="/configuracion" className="flex items-center gap-3 transition-all duration-200 hover:text-[#4ade80]">
                <FcDataConfiguration className="text-lg" /> 
                <span className="text-[15px] font-medium">Configuración</span>
              </Link>
            </li>
          )}

          {hasPermission(7) && (
            <li>
              <Link to="/tipos" className="flex items-center gap-3 transition-all duration-200 hover:text-[#4ade80]">
                <FaTags className="text-lg" /> 
                <span className="text-[15px] font-medium">Tipos</span>
              </Link>
            </li>
          )}

          {hasPermission(8) && (
            <li>
              <Link to="/presentacion" className="flex items-center gap-3 transition-all duration-200 hover:text-[#4ade80]">
                <BsMenuButtonWide className="text-lg" /> 
                <span className="text-[15px] font-medium">Presentación</span>
              </Link>
            </li>
          )}

          {hasPermission(9) && (
            <li>
              <Link to="/laboratorio" className="flex items-center gap-3 transition-all duration-200 hover:text-[#4ade80]">
                <FaFlask className="text-lg" /> 
                <span className="text-[15px] font-medium">Laboratorio</span>
              </Link>
            </li>
          )}

          {hasPermission(4) && (
            <li>
              <Link to="/producto" className="flex items-center gap-3 transition-all duration-200 hover:text-[#4ade80]">
                <FaProductHunt className="text-lg" /> 
                <span className="text-[15px] font-medium">Producto</span>
              </Link>
            </li>
          )}

          {hasPermission(3) && (
            <li>
              <Link to="/clientes" className="flex items-center gap-3 transition-all duration-200 hover:text-[#4ade80]">
                <IoPeopleSharp className="text-lg" /> 
                <span className="text-[15px] font-medium">Clientes</span>
              </Link>
            </li>
          )}

          {hasPermission(5) && (
            <li>
              <Link to="/ventas" className="flex items-center gap-3 transition-all duration-200 hover:text-[#4ade80]">
                <MdOutlinePointOfSale className="text-lg" /> 
                <span className="text-[15px] font-medium">Ventas</span>
              </Link>
            </li>
          )}

          {hasPermission(6) && (
            <li>
              <Link to="/historialVentas" className="flex items-center gap-3 transition-all duration-200 hover:text-[#4ade80]">
                <FaCartPlus className="text-lg" /> 
                <span className="text-[15px] font-medium">H. Ventas</span>
              </Link>
            </li>
          )}
        </ul>

        {/* Botón de Logout ajustado para no romper el diseño */}
        <div className="px-4 mt-auto border-t border-blue-400 pt-4">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full bg-[#22c55e] hover:bg-red-600 text-white py-2 rounded-md transition-all duration-300 text-sm font-bold shadow-md"
            >
              Cerrar Sesión
            </button>
          ) : (
            <Link
              to="/login"
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white py-2 rounded-md transition-all duration-300 text-sm font-bold block text-center"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}

export default NavBarRoot;