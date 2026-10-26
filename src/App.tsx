import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Ventas from './components/Ventas';
import NavBarRoot from './components/NavBarRoot';
import Tipos from './components/Tipos';
import ClientManagement from './components/ClientManagement';
import LaboratoryManagement from './components/LaboratoryManagement';
import Configuracion from './components/configuracion';
import ProductManagement from './components/ProductManagement';
import HistorialVentas from './components/HistorialVentas';
import UserManagement from './components/UserManagement';
import DashboardHome from './components/DashboardHome';
import PharmacyUnits from './components/PharmacyUnits';
import WelcomeScreen from './components/WelcomeScreen';
import Presentacion from './components/presentacion';
import HistorialVentasTabs from './components/HistorialVentasTab';
import SupplierManagement from './components/SupplierManagement';

function App() {
  return (
    <>
      <Router>
        <Routes>
        <Route path='/' element={<WelcomeScreen />} />
        <Route path='/login' element={<Login />} />
        <Route path='/home' element={<DashboardHome/>}/>
          <Route path='/nabvar' element={<NavBarRoot/>}/>
          <Route path='/tipos' element={<Tipos/>}/>
          <Route path='/clientes' element={<ClientManagement/>}/>
          <Route path='/laboratorio' element={<LaboratoryManagement/>}/>
          <Route path='/configuracion' element={<Configuracion/>}/>
          <Route path='/producto' element={<ProductManagement/>}/>
          <Route path='/historialVentas' element={<HistorialVentasTabs/>}/>
          <Route path='/usuario' element={<UserManagement/>}/>
          <Route path='/ventas' element={<Ventas/>}/>
          <Route path='/presentacion' element={<PharmacyUnits/>}/>
          <Route path='/proveedor' element={<SupplierManagement/>}/>
          <Route path='/proveedores' element={<SupplierManagement/>}/>
          
        </Routes>
      </Router>
    </>
  )
}

export default App