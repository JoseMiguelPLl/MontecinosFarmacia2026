import React, { useState, useEffect, useRef } from 'react';
import NavBarRoot from './NavBarRoot';
import {
  Box,
  TextField,
  Button,
  Card,
  CardHeader,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';

interface ConfiguracionData {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
}



const Configuracion: React.FC = () => {
  const [formData, setFormData] = useState<ConfiguracionData>({
    id: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
  });
  const [alert, setAlert] = useState<string>('');
  const [alertType, setAlertType] = useState<'info' | 'error' | 'success'>('info');
  const [isEditing, setIsEditing] = useState(false);

  // Referencias para los campos del formulario
  const nombreRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const direccionRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/Configuracions/ListarConfiguracionActivos');
      if (!response.ok) {
        throw new Error('Error al obtener los datos');
      }
      const data: ConfiguracionData[] = await response.json();
      if (data && data.length > 0) {
        setFormData(data[0]);
      } else {
        setAlert('No se encontraron datos');
        setAlertType('info');
      }
    } catch (error) {
      console.error('Error al obtener los datos:', error);
      setAlert('Error al obtener los datos');
      setAlertType('error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Efecto para actualizar los valores de los campos cuando cambia formData
  useEffect(() => {
    if (isEditing) {
      if (nombreRef.current) nombreRef.current.value = formData.nombre;
      if (telefonoRef.current) telefonoRef.current.value = formData.telefono;
      if (emailRef.current) emailRef.current.value = formData.email;
      if (direccionRef.current) direccionRef.current.value = formData.direccion;
    }
  }, [isEditing, formData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const newFormData = {
      id: formData.id,
      nombre: nombreRef.current?.value || '',
      telefono: telefonoRef.current?.value || '',
      email: emailRef.current?.value || '',
      direccion: direccionRef.current?.value || ''
    };

    if (!newFormData.nombre || !newFormData.telefono || !newFormData.email || !newFormData.direccion) {
      setAlert('Todos los campos son obligatorios');
      setAlertType('error');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(newFormData.email)) {
      setAlert('El correo electrónico no es válido');
      setAlertType('error');
      return;
    }

    if (/[^0-9]/.test(newFormData.telefono)) {
      setAlert('El teléfono debe contener solo números');
      setAlertType('error');
      return;
    }

    try {
      const url = new URL('http://localhost:5000/api/Configuracions/Actualizar');
      url.searchParams.append('id', newFormData.id);
      url.searchParams.append('nombre', newFormData.nombre);
      url.searchParams.append('telefono', newFormData.telefono);
      url.searchParams.append('email', newFormData.email);
      url.searchParams.append('direccion', newFormData.direccion);

      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al actualizar los datos');
      }

      setFormData(newFormData);
      setAlert('Datos actualizados correctamente');
      setAlertType('success');
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar los datos:', error);
      setAlert('Error al actualizar los datos');
      setAlertType('error');
    }
  };

  const ViewCard = () => (
    <Card>
      <CardHeader 
        title="Datos de la Empresa"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      />
      <CardContent>
        <List>
          <ListItem>
            <ListItemText 
              primary="Nombre"
              secondary={formData.nombre || 'No especificado'}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Teléfono"
              secondary={formData.telefono || 'No especificado'}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Correo Electrónico"
              secondary={formData.email || 'No especificado'}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Dirección"
              secondary={formData.direccion || 'No especificado'}
            />
          </ListItem>
        </List>
        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setIsEditing(true)}
          >
            Modificar Datos
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const EditCard = () => (
    <Card>
      <CardHeader 
        title="Modificar Datos de la Empresa"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      />
      <CardContent>
        {alert && (
          <Alert 
            severity={alertType} 
            sx={{ mb: 2 }}
            onClose={() => setAlert('')}
          >
            {alert}
          </Alert>
        )}
        
        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ '& .MuiTextField-root': { mb: 2 } }}
          noValidate
        >
          <input
            type="hidden"
            name="id"
            value={formData.id}
          />
          
          <TextField
            fullWidth
            label="Nombre"
            name="nombre"
            inputRef={nombreRef}
            defaultValue={formData.nombre}
            required
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Teléfono"
            name="telefono"
            inputRef={telefonoRef}
            defaultValue={formData.telefono}
            required
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Correo Electrónico"
            name="email"
            type="email"
            inputRef={emailRef}
            defaultValue={formData.email}
            required
            variant="outlined"
          />

          <TextField
            fullWidth
            label="Dirección"
            name="direccion"
            inputRef={direccionRef}
            defaultValue={formData.direccion}
            required
            variant="outlined"
            multiline
            rows={3}
          />

          <Box sx={{ mt: 3, textAlign: 'right', gap: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
            >
              Guardar Cambios
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <NavBarRoot />
      
      <div className="p-4 flex-1 overflow-auto w-1/2">
        <div className="flex flex-col items-center justify-center bg-blue text-white -mr-6 -ml-6 -mt-8 mb-7">
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold">Configuracion</h2>
          </div>
        </div>

        <div className="max-w-xl mx-auto">
          {isEditing ? <EditCard /> : <ViewCard />}
        </div>
      </div>
    </Box>
  );
};

export default Configuracion;