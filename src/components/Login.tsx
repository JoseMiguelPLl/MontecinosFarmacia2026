import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
            const urlEmpleado = `http://localhost:5000/api/Usuarios/Login??correo=${correo}&password=${password}`;

            const responseCliente = await fetch(urlCliente, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!responseCliente.ok) {
                // If the first API fails, try the second API
                const responseEmpleado = await fetch(urlEmpleado, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!responseEmpleado.ok) {
                    const errorData = await responseEmpleado.json();
                    throw new Error(errorData.message || 'Credenciales incorrectas');
                }

                // Parseamos la respuesta
                const dataEmpleado = await responseEmpleado.json();
                console.log(dataEmpleado); // Agrega este log para inspeccionar la respuesta

                // Guardamos los datos del usuario en localStorage
                localStorage.setItem('userId', dataEmpleado.id); // Asegúrate de que 'id' exista en la respuesta
                localStorage.setItem('userName', dataEmpleado.nombre); // Asegúrate de que 'nombre' exista en la respuesta

                // Limpiamos los campos de email y password
                setEmail('');
                setPassword('');

                // Redirigimos a la página principal o home después del login exitoso
                navigate('/home');
            } else {
                // Parseamos la respuesta
                const dataCliente = await responseCliente.json();
                console.log(dataCliente); // Agrega este log para inspeccionar la respuesta

                // Guardamos los datos del usuario en localStorage
                localStorage.setItem('userId', dataCliente.id); // Asegúrate de que 'id' exista en la respuesta
                localStorage.setItem('userName', dataCliente.nombre); // Asegúrate de que 'nombre' exista en la respuesta

                // Limpiamos los campos de email y password
                setEmail('');
                setPassword('');

                // Redirigimos a la página principal o home después del login exitoso
                navigate('/home');
            }
        } catch (err) {
            const errorMessage = (err as Error).message || 'Error al iniciar sesión. Verifica tus credenciales.';
            setError(errorMessage);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundImage: "url('fondo.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="flex flex-col items-center justify-center h-4/5 w-1/3  bg-gray bg-opacity-60 p-24 rounded-lg">
                <h1 className="text-3xl font-bold mb-4 text-white">INICIO DE SESIÓN</h1>
                <form 
  onSubmit={manejarEnvio} 
  className="shadow-md rounded px-8 py-6 w-80 bg-transparent"
  autoComplete="off" // Paso 1: Atributo estándar en el form
>
  {/* Campo trampa oculto: Los navegadores a menudo autocompletan el primer par de inputs que encuentran */}
  <input type="text" style={{ display: 'none' }} name="fake-user" />
  <input type="password" style={{ display: 'none' }} name="fake-password" />

  <input
    type="text"
    placeholder="Usuario"
    name="no-autocomplete-user" // Paso 2: Usar un nombre que no sea 'username', 'email' o 'user'
    autoComplete="new-password" // Paso 3: Este es el truco más efectivo hoy en día
    value={correo}
    onChange={(e) => setEmail(e.target.value)}
    className="border border-gray-300 p-2 mb-4 w-full rounded transition-transform transform focus:scale-105 focus:outline-none"
  />

  <input
    type="password"
    placeholder="Contraseña"
    name="no-autocomplete-pass" // Paso 2: Evitar el nombre 'password'
    autoComplete="new-password" // Paso 3: Obliga al navegador a tratarlo como campo nuevo y no guardado
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="border border-gray-300 p-2 mb-4 w-full rounded transition-transform transform focus:scale-105 focus:outline-none"
  />

  <button 
    style={{ background: 'blue' }} 
    type="submit" 
    className="text-white p-2 rounded hover:opacity-90 w-full transition-colors font-bold"
  >
    Iniciar Sesión
  </button>
  
  {error && <p className="text-white mt-4">{error}</p>}
</form>
            </div>
        </div>
    );
};

export default Login;
