import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

const Login: React.FC = () => {
    const [correo, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!correo || !password) {
            setError('Por favor, completa todos los campos.');
            return;
        }

        try {
            const urlCliente = `http://localhost:5000/api/Usuarios/Login?correo=${correo}&password=${password}`;
            const urlEmpleado = `http://localhost:5000/api/Usuarios/Login?correo=${correo}&password=${password}`;

            const responseCliente = await fetch(urlCliente, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!responseCliente.ok) {
                const responseEmpleado = await fetch(urlEmpleado, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!responseEmpleado.ok) {
                    const errorData = await responseEmpleado.json();
                    throw new Error(errorData.message || 'Credenciales incorrectas');
                }

                // LÓGICA DE EMPLEADO
                const dataEmpleado = await responseEmpleado.json();
                localStorage.setItem('userId', dataEmpleado.id);
                localStorage.setItem('userName', dataEmpleado.nombre);
                
                setEmail('');
                setPassword('');
                navigate('/home');
            } else {
                // LÓGICA DE CLIENTE
                const dataCliente = await responseCliente.json();
                localStorage.setItem('userId', dataCliente.id);
                localStorage.setItem('userName', dataCliente.nombre);

                setEmail('');
                setPassword('');
                navigate('/home');
            }
        } catch (err) {
            const errorMessage = (err as Error).message || 'Error al iniciar sesión. Verifica tus credenciales.';
            setError(errorMessage);
        }
    };

    return (
        <div 
            className="flex items-center justify-center min-h-screen bg-no-repeat bg-cover bg-center"
            style={{ 
                backgroundImage: "url('/fondo.jpg')",
                fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif" 
            }}
        >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>

            <div className="relative z-10 flex flex-col items-center justify-center backdrop-blur-xl bg-white/10 p-12 rounded-[32px] shadow-2xl border border-white/20 w-full max-w-md mx-4">
                
                <h1 
                    className="text-4xl font-extrabold mb-2 text-center tracking-tight text-white uppercase"
                    style={{ textShadow: '0 4px 12px rgba(33, 28, 115, 0.6)' }}
                >
                    Inicio de Sesión
                </h1>
                <div className="w-12 h-1 bg-[#265FFF] rounded-full mb-10 shadow-[0_0_15px_rgba(38,95,255,0.8)]"></div>

                <form onSubmit={manejarEnvio} className="w-full" autoComplete="off">
                    {/* Trampas para autocompletado */}
                    <input type="text" style={{ display: 'none' }} name="fake-user" />
                    <input type="password" style={{ display: 'none' }} name="fake-password" />

                    {/* Input Usuario */}
              {/* Input Usuario */}
                    <div className="relative mb-6 group">
                        {/* Icono posicionado correctamente y centrado verticalmente */}
  <input
                            type="text"
                            placeholder="Usuario"
                            name="no-autocomplete-user"
                            autoComplete="new-password"
                            value={correo}
                            onChange={(e) => setEmail(e.target.value)}
                            // pl-12 (padding-left) asegura que el texto no toque el icono
                            className="relative w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 outline-none transition-all focus:border-[#265FFF] focus:ring-2 focus:ring-[#265FFF]/20 focus:bg-white/20 z-0"
                        />
                    </div>

                    {/* Input Contraseña */}
                    <div className="relative mb-10 group">
                        {/* Icono posicionado correctamente y centrado verticalmente */}
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-[#265FFF] transition-colors pointer-events-none z-10" />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            name="no-autocomplete-pass"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            // pl-12 (padding-left) asegura que el texto no toque el icono
                            className="relative w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 outline-none transition-all focus:border-[#265FFF] focus:ring-2 focus:ring-[#265FFF]/20 focus:bg-white/20 z-0"
                        />
                    </div>

                    {/* Botón Estilo WelcomeScreen (Azul Sólido #211C73) */}
                    <button 
                        type="submit" 
                        className="w-full py-4 rounded-2xl font-bold text-lg tracking-widest transition-all duration-300 ease-in-out uppercase flex items-center justify-center outline-none focus:ring-2 focus:ring-[#211C73] focus:ring-offset-2 focus:ring-offset-white"
                        style={{ 
                            background: '#211C73',
                            border: 'none',
                            color: '#FFFFFF',
                            boxShadow: '0 8px 20px -5px rgba(33, 28, 115, 0.6)',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#2a248f'; 
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 25px -5px rgba(33, 28, 115, 0.7)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = '#211C73';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 20px -5px rgba(33, 28, 115, 0.6)';
                        }}
                    >
                        Ingresar
                    </button>
                    
                    {error && (
                        <div className="mt-8 p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-center">
                            <p className="text-white text-sm font-semibold">{error}</p>
                        </div>
                    )}
                </form>
            </div>
            
            <p className="absolute bottom-8 text-white/30 text-xs tracking-[4px] uppercase font-light">
                Farmacia Montecinos 2026
            </p>
        </div>
    );
};

export default Login;