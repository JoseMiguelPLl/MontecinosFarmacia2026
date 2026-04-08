import React, { useState, useEffect } from "react";
import moment from 'moment';
import {
  Users,
  Users2,
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown,
  TrendingDown,
  Activity,
  Filter
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import NavBarRoot from "./NavBarRoot";
import "./DashboardHome.css";

interface Product {
  codigo: string;
  nombre: string;
  vencimiento: string;
  idtipo: number;
  idpresentacion: number;
  precio: number;
  stock: number;
  presentacionNombre?: string;
  laboratorioNombre?: string;
}

interface Tipo {
  id: number;
  nombre: string;
}

interface Presentaciones {
  id: number;
  nombre: string;
}

interface Laboratorio {
  id: number;
  nombre: string;
}

interface ProductoProximoAVencer {
  id: number;
  nombre: string;
  laboratorio: string;
  presentacion: string;
  fechaVencimiento: string;
  diasParaVencer: number;
  estado: string;
}

type Trend = 'up' | 'down' | 'neutral';

interface StatItem {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend: Trend;
  trendValue: number;
  description: string;
}

interface ProductoMasVendido {
  nombre: string;
  totalVendido: number;
  presentacionNombre?: string;
  laboratorioNombre?: string;
}

const DashboardHome: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [usuariosActivos, setUsuariosActivos] = useState(0);
  const [clientes, setClientes] = useState(0);
  const [productos, setProductos] = useState(0);
  const [ventas, setVentas] = useState(0);
  const [tipo, setTipo] = useState<Tipo[]>([]);
  const [presentacion, setPresentacion] = useState<Presentaciones[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [productosConMenorStock, setProductosConMenorStock] = useState<Product[]>([]);
  const [masVendidosData, setMasVendidosData] = useState<ProductoMasVendido[]>([]);
  const [ingresosMensuales, setIngresosMensuales] = useState<{ mes: string; total: number }[]>([]);
  const [productosProximosAVencer, setProductosProximosAVencer] = useState<ProductoProximoAVencer[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoadingIngresos, setIsLoadingIngresos] = useState<boolean>(false);

  // Función para obtener ingresos mensuales por año
  const fetchIngresosMensuales = async (year: number) => {
    setIsLoadingIngresos(true);
    try {
      const response = await fetch(`http://localhost:5000/api/Ventas/SumarTotalesPorMes?anio=${year}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transformar los datos para que coincidan con la estructura esperada
      const transformedData = Object.keys(data).map((mes) => ({
        mes: mes,
        total: data[mes],
      }));

      setIngresosMensuales(transformedData);
    } catch (error) {
      console.error("Error al obtener ingresos mensuales:", error);
      // Puedes mostrar un mensaje de error al usuario si lo deseas
    } finally {
      setIsLoadingIngresos(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener ingresos mensuales del año actual
        await fetchIngresosMensuales(selectedYear);

        // Obtener productos activos
        const responseProductos = await fetch("http://localhost:5000/api/Productos/ListarProductosActivos");
        const dataProductos = await responseProductos.json();
        setProductos(dataProductos.length);

        // Obtener tipos de productos
        const responseTipo = await fetch("http://localhost:5000/api/Tipos/ListarTiposActivos");
        const dataTipo = await responseTipo.json();
        setTipo(dataTipo);

        // Obtener presentaciones
        const responsePresentacion = await fetch("http://localhost:5000/api/Presentaciones");
        const dataPresentacion = await responsePresentacion.json();
        setPresentacion(dataPresentacion);

        // Obtener laboratorios
        const responseLaboratorios = await fetch("http://localhost:5000/api/Laboratorios");
        const dataLaboratorios = await responseLaboratorios.json();
        setLaboratorios(dataLaboratorios);

        // Obtener usuarios activos
        const responseUsuarios = await fetch("http://localhost:5000/api/Usuarios/ListarUsuariosActivos");
        const dataUsuarios = await responseUsuarios.json();
        setUsuariosActivos(dataUsuarios.length);

        // Obtener clientes activos
        const responseClientes = await fetch("http://localhost:5000/api/Clientes/ListarClientesActivos");
        const dataClientes = await responseClientes.json();
        setClientes(dataClientes.length);

        // Obtener ventas activas
        const responseVentas = await fetch("http://localhost:5000/api/Ventas/ListarVentasActivos");
        const dataVentas = await responseVentas.json();
        setVentas(dataVentas.length);

        // Obtener productos con menor stock
        const responseMenorStock = await fetch("http://localhost:5000/api/Productos/listarProductosConMenorStockHome");
        const dataMenorStock = await responseMenorStock.json();
        setProductosConMenorStock(dataMenorStock);

        // Obtener productos más vendidos
        const responseMasVendidos = await fetch("http://localhost:5000/api/Detalle_Ventas/ProductosMasVendidos");
        const dataMasVendidos = await responseMasVendidos.json();
        setMasVendidosData(dataMasVendidos);

        // Obtener productos próximos a vencer
        const responseProximosAVencer = await fetch("http://localhost:5000/api/Productos/ProductosProximosAVencer");
        const dataProximosAVencer = await responseProximosAVencer.json();
        setProductosProximosAVencer(dataProximosAVencer);

      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler para cambiar el año
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    setSelectedYear(year);
    fetchIngresosMensuales(year);
  };

  const stockMinimoData = productosConMenorStock.map((producto) => ({
    name: `${producto.nombre}`,
    value: producto.stock,
    presentacion: producto.presentacionNombre,
    laboratorio: producto.laboratorioNombre
  }));

  const masVendidosChartData = masVendidosData.map((producto) => ({
    name: `${producto.nombre} `,
    value: producto.totalVendido,
    presentacion: producto.presentacionNombre,
    laboratorio: producto.laboratorioNombre
  }));

  // Actualizar el reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear la hora
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const now = moment().format('DD [de] MMMM [de] YYYY');

  // Generar opciones de años (desde 2020 hasta el año actual + 1)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years;
  };

  const yearOptions = generateYearOptions();

  // Estadísticas con datos de tendencia
  const stats: StatItem[] = [
    {
      title: "Usuarios Activos",
      value: usuariosActivos,
      icon: Users,
      color: "blue",
      trend: 'up',
      trendValue: 12,
      description: "Personal autorizado"
    },
    {
      title: "Clientes Registrados",
      value: clientes,
      icon: Users2,
      color: "blue",
      trend: 'up',
      trendValue: 24,
      description: "Clientes frecuentes"
    },
    {
      title: "Productos en Stock",
      value: productos,
      icon: Package,
      color: "blue",
      trend: 'down',
      trendValue: 5,
      description: "Inventario actual"
    },
    {
      title: "Ventas Totales",
      value: ventas,
      icon: ShoppingCart,
      color: "blue",
      trend: 'up',
      trendValue: 42,
      description: "Este mes"
    },
  ];

  // Obtener el nombre del usuario desde localStorage
  const name = localStorage.getItem("userName");

  // Colores para gráficos
  const COLORS = [
    '#F38C14','#F74816' ,'#CBD803', '#C000A5'
  ];

  const renderTrendIcon = (trend: Trend, value: number) => {
    if (trend === 'up') {
      return (
        <div className="flex items-center text-green-500">
          <ArrowUp className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">{value}%</span>
        </div>
      );
    } else if (trend === 'down') {
      return (
        <div className="flex items-center text-red-500">
          <ArrowDown className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">{value}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-gray-500">
        <Activity className="h-4 w-4 mr-1" />
        <span className="text-xs font-medium">0%</span>
      </div>
    );
  };

  // Función para obtener el color según el estado de vencimiento
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Crítico':
        return 'text-red-600 font-bold';
      case 'Advertencia':
        return 'text-yellow-600 font-semibold';
      default:
        return 'text-green-600';
    }
  };

  // Tooltip personalizado para mostrar presentación y laboratorio
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-bold">{payload[0].payload.name}</p>
          <p className="text-sm">Presentación: {payload[0].payload.presentacion}</p>
          <p className="text-sm">Laboratorio: {payload[0].payload.laboratorio}</p>
          <p className="text-sm">
            {payload[0].name === 'value' ? 'Stock: ' : 'Vendidos: '}
            {payload[0].value} unidades
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50/50">
      <NavBarRoot />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Banner de bienvenida premium */}
          <div className="w-full mb-8 bg-blue rounded-2xl p-6 text-white shadow-xl relative overflow-hidden" style={{background:'#265FFF'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    ¡Bienvenido, <span className="text-amber-300">{name}</span>!
                  </h1>
                  <p className="text-blue-100/90 font-medium">
                    Panel de Control Farmacéutico - Resumen General
                  </p>
                </div>
                <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-100/80">Hora actual</p>
                      <p className="text-xl font-semibold">{formatTime(currentTime)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-100/80">
                    <Calendar className="h-4 w-4" />
                    <span>{now}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.title} 
                className={`bg-blue rounded-2xl p-0.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`} 
              >
                <div className="bg-white rounded-xl p-5 h-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-800">{stat.value}</h3>
                      <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    </div>
                    <div className={`bg-blue rounded-lg p-2 text-white shadow-md`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    {renderTrendIcon(stat.trend, stat.trendValue)}
                    <div className="w-3/4 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-blue`}
                        style={{ width: `${Math.min(100, (stat.value / 100) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico de ingresos mensuales premium */}
          <Card className="mb-8 rounded-2xl overflow-hidden border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow" >
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b" style={{background:'#265FFF'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue p-2 rounded-lg" >
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Ingresos Mensuales</CardTitle>
                    <CardDescription className="text-sm">Evolución de ventas por mes</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-white" />
                  <select 
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="bg-white/20 text-black border-none rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                    disabled={isLoadingIngresos}
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year} className="text-gray-800">
                        {year}
                      </option>
                    ))}
                  </select>
                  {isLoadingIngresos && (
                    <div className="ml-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 h-[400px]">
              {isLoadingIngresos ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : ingresosMensuales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ingresosMensuales}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [`${value} Bs`, 'Ingresos']}
                      labelStyle={{ fontWeight: 'bold', color: '#1F2937' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                    <Bar 
                      dataKey="total" 
                      name="Ingresos (Bs)" 
                      fill="#3B82F6" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No hay datos disponibles para el año {selectedYear}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabla de productos próximos a vencer */}
          <Card className="mb-8 rounded-2xl overflow-hidden border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b" style={{background:'#265FFF'}}>
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Productos Próximos a Vencer</CardTitle>
                  <CardDescription className="text-sm">Productos que vencerán en los próximos 30 días</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {productosProximosAVencer.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 text-left text-sm font-medium bg-blue text-gray-700">Nombre</th>
                        <th className="p-3 text-left text-sm font-medium bg-blue text-gray-700">Laboratorio</th>
                        <th className="p-3 text-left text-sm font-medium bg-blue text-gray-700">Presentación</th>
                        <th className="p-3 text-left text-sm font-medium bg-blue text-gray-700">Fecha de Vencimiento</th>
                        <th className="p-3 text-left text-sm font-medium bg-blue text-gray-700">Días Restantes</th>
                        <th className="p-3 text-left text-sm font-medium bg-blue text-gray-700">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosProximosAVencer.map((producto, index) => (
                        <tr key={producto.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-3 text-sm text-gray-700">{producto.nombre}</td>
                          <td className="p-3 text-sm text-gray-700">{producto.laboratorio}</td>
                          <td className="p-3 text-sm text-gray-700">{producto.presentacion}</td>
                          <td className="p-3 text-sm text-gray-700">{moment(producto.fechaVencimiento).format('DD/MM/YYYY')}</td>
                          <td className="p-3 text-sm text-gray-700">{producto.diasParaVencer}</td>
                          <td className={`p-3 text-sm ${getEstadoColor(producto.estado)}`}>
                            {producto.estado}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No hay productos próximos a vencer en los próximos 90 días.</p>
              )}
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" >
            {/* Gráfico de stock mínimo premium */}
            <Card className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow" >
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b" style={{background:'#265FFF'}}>
                <div className="flex items-center gap-3" >
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Stock Mínimo</CardTitle>
                    <CardDescription className="text-sm">Productos con bajo inventario</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockMinimoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stockMinimoData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="#FFF"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={<CustomTooltip />}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend 
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ 
                        paddingTop: '20px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de productos más vendidos premium */}
            <Card className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b" style={{background:'#265FFF'}}>
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Productos Más Vendidos</CardTitle>
                    <CardDescription className="text-sm">Top productos por unidades vendidas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={masVendidosChartData}
                      cx="50%"
                      cy="50%"
                    innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {masVendidosChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[(index + 3) % COLORS.length]} 
                          stroke="#FFF"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={<CustomTooltip />}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend 
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ 
                        paddingTop: '20px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;