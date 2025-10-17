import React, { useState, useEffect } from 'react';
import { Calendar, Users, Stethoscope, Bed, Activity, Clock, Search, Plus, X, User, LogOut, Home, FileText, Phone } from 'lucide-react';


const API_URL = 'http://localhost:8000/api';

const HospitalManagementSystem = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [historias, setHistorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [pacienteHistorias, setPacienteHistorias] = useState([]);
  const [pacienteCitas, setPacienteCitas] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [selectedHabitacion, setSelectedHabitacion] = useState(null);
  const [pacientesHabitacion, setPacientesHabitacion] = useState([]);

  // AGREGAR DESPUÉS DE LOS ESTADOS EXISTENTES
  const [misDoctorData, setMisDoctorData] = useState(null);
  const [misCitasHoy, setMisCitasHoy] = useState([]);
  const [citaEnConsulta, setCitaEnConsulta] = useState(null);
  const [nuevaHistoria, setNuevaHistoria] = useState({
    sintomas: '',
    diagnostico: '',
    tratamiento: '',
    examenes_solicitados: '',
    notas_adicionales: ''
  });
  const [prescripciones, setPrescripciones] = useState([]);
  const [nuevaPrescripcion, setNuevaPrescripcion] = useState({
    medicamento_id: '',
    dosis: '',
    frecuencia: '',
    duracion: '',
    instrucciones: ''
  });
  const [medicamentosDisponibles, setMedicamentosDisponibles] = useState([]);
  const [showFormConsulta, setShowFormConsulta] = useState(false);
  const [showFormPrescripcion, setShowFormPrescripcion] = useState(false);
  const [alertaMedicamento, setAlertaMedicamento] = useState(null);
  const [hospitalizacionesActivas, setHospitalizacionesActivas] = useState([]);

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  const [newPaciente, setNewPaciente] = useState({
    nombre: '', apellidos: '', fecha_nacimiento: '', genero: 'M',
    tipo_sangre: 'O+', telefono: '', direccion: '', numero_historia: ''
  });

  const [newCita, setNewCita] = useState({
    paciente: '', doctor: '', fecha_hora: '', motivo: ''
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      fetchDashboardStats(storedToken);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      if (!response.ok) {
        alert('Credenciales incorrectas');
        return;
      }
      
      const data = await response.json();
      
      if (data.access) {
        setToken(data.access);
        localStorage.setItem('token', data.access);
        
        // Obtener información del usuario autenticado
        try {
          const userResponse = await fetch(`${API_URL}/auth/user/`, {
            headers: { 'Authorization': `Bearer ${data.access}` }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('Usuario autenticado:', userData); // Para debug
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            fetchDashboardStats(data.access);
          } else {
            console.error('Error al obtener datos del usuario');
            alert('Error al obtener información del usuario');
          }
        } catch (userError) {
          console.error('Error al obtener usuario:', userError);
          alert('Error de conexión con el servidor');
        }
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error al iniciar sesión. Verifica tus credenciales.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const fetchDashboardStats = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/dashboard/estadisticas/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  };

  const cambiarEstadoCita = async (citaId, nuevoEstado) => {
  try {
    const response = await fetch(`${API_URL}/citas/${citaId}/cambiar_estado/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (response.ok) {
      alert('Estado actualizado');
      fetchMisCitasHoy();
      fetchCitas();
    } else {
      alert('Error al actualizar el estado');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al actualizar el estado');
  }
};

  
  const fetchPacienteDetalle = async (pacienteId) => {
  try {
    // Obtener datos del paciente
    const pacienteResponse = await fetch(`${API_URL}/pacientes/${pacienteId}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!pacienteResponse.ok) {
      console.error('Error paciente:', pacienteResponse.status, pacienteResponse.statusText);
      throw new Error(`Error ${pacienteResponse.status}: ${pacienteResponse.statusText}`);
    }
    
    const pacienteData = await pacienteResponse.json();
    setSelectedPaciente(pacienteData);

    // Obtener historias clínicas del paciente
    const historiasResponse = await fetch(`${API_URL}/pacientes/${pacienteId}/historia_clinica/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const historiasData = await historiasResponse.json();
    setPacienteHistorias(historiasData);

    // Obtener citas del paciente
    const citasResponse = await fetch(`${API_URL}/pacientes/${pacienteId}/citas/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const citasData = await citasResponse.json();
      setPacienteCitas(citasData);

      // Cambiar vista al perfil
      setActiveView('perfil-paciente');
    } catch (error) {
      console.error('Error detallado:', error);
      alert('Error al cargar los datos: ' + error.message);
    }
  };


const fetchPacientesHabitacion = async (habitacionId) => {
  console.log('🔍 INICIO - Habitación ID:', habitacionId);
  console.log('🔑 Token existe:', !!token);
  
  try {
    const url = `${API_URL}/habitaciones/${habitacionId}/pacientes/`;
    console.log('📡 URL completa:', url);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response OK:', response.ok);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Datos recibidos:', data);
    console.log('📊 Cantidad de pacientes:', data.length);
    
    const pacientesArray = Array.isArray(data) ? data : [];
    console.log('🔄 Actualizando estado con:', pacientesArray);
    setPacientesHabitacion(pacientesArray);
  } catch (error) {
    console.error('❌ ERROR COMPLETO:', error);
    alert(`Error al cargar pacientes: ${error.message}`);
    setPacientesHabitacion([]);
  }
};

  const fetchPacientes = async () => {
    try {
      const response = await fetch(`${API_URL}/pacientes/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPacientes(data.results || data);
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
    }
  };

  const fetchCitas = async () => {
    try {
      const response = await fetch(`${API_URL}/citas/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCitas(data.results || data);
    } catch (error) {
      console.error('Error al obtener citas:', error);
    }
  };

  const fetchDoctores = async () => {
    try {
      const response = await fetch(`${API_URL}/doctores/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDoctores(data.results || data);
    } catch (error) {
      console.error('Error al obtener doctores:', error);
    }
  };

  const fetchHabitaciones = async () => {
    try {
      const response = await fetch(`${API_URL}/habitaciones/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setHabitaciones(data.results || data);
    } catch (error) {
      console.error('Error al obtener habitaciones:', error);
    }
  };

  const fetchHistoriasClinicas = async () => {
    try {
      const response = await fetch(`${API_URL}/historias-clinicas/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setHistorias(data.results || data);
    } catch (error) {
      console.error('Error al obtener historias clínicas:', error);
    }
  };

  const fetchMisDatos = async () => {
    //Obtener datos del doctor/enfermero
    try {
      if (user.rol === 'doctor') {
        const response = await fetch(`${API_URL}/doctores/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const doctores = data.results || data;
        const miDoctor = doctores.find(d => d.usuario_info?.username === user.username);
        if (miDoctor) {
          setMisDoctorData(miDoctor);
        }
      }
    } catch (error) {
      console.error('Error al obtener datos del doctor:', error);
    }
  };

  const fetchMisCitasHoy = async () => {
    //Obtener mis citas de hoy (solo doctores)
    if (user.rol !== 'doctor') return;
    
    try {
      const response = await fetch(`${API_URL}/citas/mis_citas/?fecha=${new Date().toISOString().split('T')[0]}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMisCitasHoy(data);
    } catch (error) {
      console.error('Error al obtener mis citas:', error);
    }
  };

  const fetchMedicamentos = async () => {
    //Obtener medicamentos disponibles
    try {
      const response = await fetch(`${API_URL}/medicamentos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMedicamentosDisponibles(data.results || data);
    } catch (error) {
      console.error('Error al obtener medicamentos:', error);
    }
  };

  const verificarAlergias = async (medicamentoId) => {
    //Verificar si hay alergias al medicamento
    if (!citaEnConsulta || !medicamentoId) return;
    
    try {
      const response = await fetch(`${API_URL}/prescripciones/crear_con_alerta/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          historia_clinica_id: citaEnConsulta.historia_id,
          medicamento_id: medicamentoId
        })
      });
      const data = await response.json();
      setAlertaMedicamento(data);
    } catch (error) {
      console.error('Error al verificar alergias:', error);
    }
  };

  const iniciarConsulta = async (cita) => {
    //Iniciar una consulta con un paciente"
    try {
      // Cambiar estado de cita a "en_curso"
      await fetch(`${API_URL}/citas/${cita.id}/cambiar_estado/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'en_curso' })
      });

      // Obtener historias del paciente para crear una nueva
      const response = await fetch(`${API_URL}/pacientes/${cita.paciente_info.id}/historia_clinica/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historias = await response.json();
      
      setCitaEnConsulta({
        ...cita,
        historia_id: null, // Se creará al guardar
        historias_previas: historias
      });
      setShowFormConsulta(true);
      setActiveView('consulta');
    } catch (error) {
      console.error('Error al iniciar consulta:', error);
      alert('Error al iniciar consulta');
    }
  };

  const guardarHistoriaClinica = async () => {
    //Guardar nueva historia clínica
    if (!citaEnConsulta || !nuevaHistoria.diagnostico || !nuevaHistoria.sintomas) {
      alert('Por favor completa diagnóstico y síntomas');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/historias-clinicas/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paciente: citaEnConsulta.paciente_info.id,
          doctor: misDoctorData.id,
          cita: citaEnConsulta.id,
          diagnostico: nuevaHistoria.diagnostico,
          sintomas: nuevaHistoria.sintomas,
          tratamiento: nuevaHistoria.tratamiento,
          examenes_solicitados: nuevaHistoria.examenes_solicitados,
          notas_adicionales: nuevaHistoria.notas_adicionales
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCitaEnConsulta({ ...citaEnConsulta, historia_id: data.id });
        alert('Historia clínica guardada');
        setNuevaHistoria({
          sintomas: '',
          diagnostico: '',
          tratamiento: '',
          examenes_solicitados: '',
          notas_adicionales: ''
        });
      }
    } catch (error) {
      console.error('Error al guardar historia:', error);
      alert('Error al guardar historia clínica');
    }
  };

  const guardarPrescripcion = async () => {
    //Guardar prescripción de medicamento
    if (!citaEnConsulta?.historia_id || !nuevaPrescripcion.medicamento_id) {
      alert('Por favor selecciona un medicamento');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/prescripciones/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          historia_clinica: citaEnConsulta.historia_id,
          medicamento: nuevaPrescripcion.medicamento_id,
          dosis: nuevaPrescripcion.dosis,
          frecuencia: nuevaPrescripcion.frecuencia,
          duracion: nuevaPrescripcion.duracion,
          instrucciones: nuevaPrescripcion.instrucciones
        })
      });

      if (response.ok) {
        alert('Medicamento recetado');
        setNuevaPrescripcion({
          medicamento_id: '',
          dosis: '',
          frecuencia: '',
          duracion: '',
          instrucciones: ''
        });
        setAlertaMedicamento(null);
        // Recargar prescripciones
        fetchMedicamentos();
      }
    } catch (error) {
      console.error('Error al guardar prescripción:', error);
      alert('Error al recetar medicamento');
    }
  };

  const completarConsulta = async () => {
    //Completar consulta y cambiar estado de cita
    try {
      await fetch(`${API_URL}/citas/${citaEnConsulta.id}/cambiar_estado/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'completada' })
      });

      alert('Consulta completada');
      setCitaEnConsulta(null);
      setShowFormConsulta(false);
      setShowFormPrescripcion(false);
      fetchMisCitasHoy();
      setActiveView('dashboard');
    } catch (error) {
      console.error('Error al completar consulta:', error);
      alert('Error al completar consulta');
    }
  };
/*
  const fetchPacienteDetalle = async (pacienteId) => {
    try {
      // Obtener datos del paciente
      const pacienteResponse = await fetch(`${API_URL}/pacientes/${pacienteId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pacienteData = await pacienteResponse.json();
      setSelectedPaciente(pacienteData);

      // Obtener historias clínicas del paciente
      const historiasResponse = await fetch(`${API_URL}/pacientes/${pacienteId}/historia_clinica/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historiasData = await historiasResponse.json();
      setPacienteHistorias(historiasData);

      // Obtener citas del paciente
      const citasResponse = await fetch(`${API_URL}/pacientes/${pacienteId}/citas/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const citasData = await citasResponse.json();
      setPacienteCitas(citasData);

      // Cambiar vista al perfil
      setActiveView('perfil-paciente');
    } catch (error) {
      console.error('Error al obtener detalles del paciente:', error);
      alert('Error al cargar los detalles del paciente');
    }
  };
*/
  const volverALista = () => {
    setSelectedPaciente(null);
    setPacienteHistorias([]);
    setPacienteCitas([]);
    setActiveView('pacientes');
    setActiveTab('info');
  };

  const handleCreatePaciente = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/pacientes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPaciente)
      });
      
      if (response.ok) {
        setShowModal(false);
        fetchPacientes();
        alert('Paciente creado exitosamente');
        setNewPaciente({
          nombre: '', apellidos: '', fecha_nacimiento: '', genero: 'M',
          tipo_sangre: 'O+', telefono: '', direccion: '', numero_historia: ''
        });
      } else {
        alert('Error al crear paciente');
      }
    } catch (error) {
      console.error('Error al crear paciente:', error);
      alert('Error al crear paciente');
    }
  };

  const handleCreateCita = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/citas/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCita)
      });
      
      if (response.ok) {
        setShowModal(false);
        fetchCitas();
        alert('Cita creada exitosamente');
        setNewCita({ paciente: '', doctor: '', fecha_hora: '', motivo: '' });
      } else {
        alert('Error al crear cita');
      }
    } catch (error) {
      console.error('Error al crear cita:', error);
      alert('Error al crear cita');
    }
  };

  useEffect(() => {
    if (token) {
      if (activeView === 'pacientes') fetchPacientes();
      if (activeView === 'citas') fetchCitas();
      if (activeView === 'doctores') fetchDoctores();
      if (activeView === 'habitaciones') fetchHabitaciones();
      if (activeView === 'historias') fetchHistoriasClinicas();
    }
  }, [activeView, token]);

  // Cargar datos iniciales del doctor y sus citas
  useEffect(() => {
    if (token && user && (user.rol === 'doctor' || user.rol === 'enfermero')) {
      fetchMisDatos();
      if (user.rol === 'doctor') {
        fetchMisCitasHoy();
      }
      fetchMedicamentos();
    }
  }, [token, user]);
  // Cargar pacientes de la habitación seleccionada
  useEffect(() => {
  console.log('🔄 useEffect disparado');
  console.log('📌 Token:', !!token);
  console.log('🏥 Habitación seleccionada:', selectedHabitacion);
  console.log('👁️ Vista activa:', activeView);
  
  if (token && selectedHabitacion && activeView === 'detalle-habitacion') {
    console.log('✅ Todas las condiciones cumplidas, fetching...');
    fetchPacientesHabitacion(selectedHabitacion.id);
  } else {
    console.log('❌ Condiciones NO cumplidas');
    if (!token) console.log('   - Falta token');
    if (!selectedHabitacion) console.log('   - Falta habitación seleccionada');
    if (activeView !== 'detalle-habitacion') console.log('   - Vista incorrecta:', activeView);
  }
}, [selectedHabitacion, activeView, token]);

  // Función para verificar permisos
  const canAccess = (feature) => {
    if (!user) return false;
    
    const permissions = {
      'pacientes': ['admin', 'doctor', 'enfermero', 'recepcionista'],
      'citas': ['admin', 'doctor', 'enfermero', 'recepcionista', 'paciente'],
      'doctores': ['admin', 'doctor', 'enfermero', 'recepcionista'],
      'habitaciones': ['admin', 'doctor', 'enfermero'],
      'historias': ['admin', 'doctor', 'enfermero', 'paciente'],
      'crear_paciente': ['admin', 'doctor', 'recepcionista'],
      'crear_cita': ['admin', 'doctor', 'recepcionista'],
    };
    
    return permissions[feature]?.includes(user.rol) || false;
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Hospital Medac</h1>
            <p className="text-gray-600 mt-2">Gestión Interna</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingrese su usuario"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingrese su contraseña"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p className="font-semibold mb-2">Usuarios de prueba:</p>
            <p>• Admin: admin / Medac123</p>
            <p>• Medico: garcia / Medac123</p>
            <p>• Paciente: juan / Medac123</p>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value || 0}</p>
        </div>
        <div className={`${color} p-4 rounded-full`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
  const renderDashboard = () => {
    const isPaciente = user?.rol === 'paciente';
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {isPaciente ? 'Mi Panel Personal' : 'Panel de Control'}
          </h2>
          <div className="bg-blue-100 px-4 py-2 rounded-lg">
            <span className="text-blue-800 font-semibold text-sm">
              Rol: {user?.rol?.toUpperCase()}
            </span>
          </div>
        </div>
        
        {isPaciente ? (
          // Dashboard para Pacientes
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                icon={Calendar} 
                title="Mis Citas Pendientes" 
                value={stats.mis_citas_pendientes} 
                color="bg-blue-500"
              />
              <StatCard 
                icon={Calendar} 
                title="Total de Citas" 
                value={stats.total_citas} 
                color="bg-green-500"
              />
              <StatCard 
                icon={FileText} 
                title="Historias Clínicas" 
                value={stats.historias_clinicas} 
                color="bg-purple-500"
              />
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Acceso Rápido</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveView('citas')}
                  className="w-full bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center text-left transition-colors"
                >
                  <Calendar className="text-blue-600 mr-3" size={20} />
                  <div>
                    <span className="font-medium text-gray-800 block">Mis Citas</span>
                    <span className="text-xs text-gray-600">Ver y gestionar mis citas médicas</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveView('historias')}
                  className="w-full bg-purple-50 hover:bg-purple-100 p-4 rounded-lg flex items-center text-left transition-colors"
                >
                  <FileText className="text-purple-600 mr-3" size={20} />
                  <div>
                    <span className="font-medium text-gray-800 block">Mi Historial Médico</span>
                    <span className="text-xs text-gray-600">Consultar mis historias clínicas</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Información Personal</h3>
              <p className="text-blue-100 text-sm">
                Bienvenido a tu portal de paciente. Aquí puedes consultar tus citas, ver tu historial médico y estar al día con tu salud.
              </p>
            </div>
          </div>
        ) : (
          // Dashboard para Personal Médico/Admin
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                icon={Users} 
                title="Total Pacientes" 
                value={stats.total_pacientes} 
                color="bg-blue-500"
              />
              <StatCard 
                icon={Calendar} 
                title="Citas Hoy" 
                value={stats.citas_hoy} 
                color="bg-green-500"
              />
              <StatCard 
                icon={Bed} 
                title="Hospitalizaciones" 
                value={stats.hospitalizaciones_activas} 
                color="bg-purple-500"
              />
              <StatCard 
                icon={Clock} 
                title="Habitaciones Libres" 
                value={stats.habitaciones_disponibles} 
                color="bg-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Acceso Rápido</h3>
                <div className="space-y-3">
                  {canAccess('pacientes') && (
                    <button 
                      onClick={() => setActiveView('pacientes')}
                      className="w-full bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center text-left transition-colors"
                    >
                      <Users className="text-blue-600 mr-3" size={20} />
                      <span className="font-medium text-gray-800">Gestionar Pacientes</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setActiveView('citas')}
                    className="w-full bg-green-50 hover:bg-green-100 p-4 rounded-lg flex items-center text-left transition-colors"
                  >
                    <Calendar className="text-green-600 mr-3" size={20} />
                    <span className="font-medium text-gray-800">Ver Citas</span>
                  </button>
                  {canAccess('doctores') && (
                    <button 
                      onClick={() => setActiveView('doctores')}
                      className="w-full bg-purple-50 hover:bg-purple-100 p-4 rounded-lg flex items-center text-left transition-colors"
                    >
                      <Stethoscope className="text-purple-600 mr-3" size={20} />
                      <span className="font-medium text-gray-800">Doctores</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Estadísticas</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Citas Pendientes</span>
                    <span className="font-bold text-lg text-blue-600">{stats.citas_pendientes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Ocupación</span>
                    <span className="font-bold text-lg text-green-600">
                      {stats.hospitalizaciones_activas && stats.habitaciones_disponibles 
                        ? Math.round((stats.hospitalizaciones_activas / (stats.hospitalizaciones_activas + stats.habitaciones_disponibles)) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPacientes = () => {
    if (!canAccess('pacientes')) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <X className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold text-red-800 mb-2">Acceso Denegado</h3>
          <p className="text-red-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Pacientes</h2>
          {canAccess('crear_paciente') && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Nuevo Paciente
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 mb-4">
            <Search className="text-gray-400 mr-2" size={20} />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">N° Historia</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo Sangre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.filter(p => 
                  p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.numero_historia.includes(searchTerm)
                ).map((paciente) => (
                  <tr key={paciente.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{paciente.numero_historia}</td>
                    <td className="px-4 py-3 text-sm font-medium">{paciente.nombre} {paciente.apellidos}</td>
                    <td className="px-4 py-3 text-sm">{paciente.tipo_sangre}</td>
                    <td className="px-4 py-3 text-sm">{paciente.telefono}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        paciente.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {paciente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => fetchPacienteDetalle(paciente.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center"
                      >
                        <User size={14} className="mr-1" />
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Nuevo Paciente</h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} className="text-gray-600 hover:text-gray-800" />
                </button>
              </div>
              
              <form onSubmit={handleCreatePaciente} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={newPaciente.nombre}
                      onChange={(e) => setNewPaciente({...newPaciente, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                    <input
                      type="text"
                      value={newPaciente.apellidos}
                      onChange={(e) => setNewPaciente({...newPaciente, apellidos: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                    <input
                      type="date"
                      value={newPaciente.fecha_nacimiento}
                      onChange={(e) => setNewPaciente({...newPaciente, fecha_nacimiento: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                    <select
                      value={newPaciente.genero}
                      onChange={(e) => setNewPaciente({...newPaciente, genero: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sangre</label>
                    <select
                      value={newPaciente.tipo_sangre}
                      onChange={(e) => setNewPaciente({...newPaciente, tipo_sangre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={newPaciente.telefono}
                      onChange={(e) => setNewPaciente({...newPaciente, telefono: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° Historia Clínica</label>
                  <input
                    type="text"
                    value={newPaciente.numero_historia}
                    onChange={(e) => setNewPaciente({...newPaciente, numero_historia: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <textarea
                    value={newPaciente.direccion}
                    onChange={(e) => setNewPaciente({...newPaciente, direccion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Crear Paciente
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPerfilPaciente = () => {
    if (!selectedPaciente) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">Cargando información del paciente...</p>
        </div>
      );
    }

    const calcularEdad = (fechaNacimiento) => {
      const hoy = new Date();
      const nacimiento = new Date(fechaNacimiento);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    };

    return (
      <div className="space-y-6">
        {/* Cabecera con botón de regreso */}
        <div className="flex items-center justify-between">
          <button
            onClick={volverALista}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a la lista
          </button>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            selectedPaciente.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {selectedPaciente.activo ? 'Paciente Activo' : 'Paciente Inactivo'}
          </span>
        </div>

        {/* Tarjeta de información principal */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-white bg-opacity-20 p-6 rounded-full">
                <User size={48} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {selectedPaciente.nombre} {selectedPaciente.apellidos}
                </h1>
                <div className="space-y-1 text-blue-100">
                  <p className="flex items-center">
                    <span className="font-semibold mr-2">N° Historia:</span>
                    {selectedPaciente.numero_historia}
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold mr-2">Edad:</span>
                    {calcularEdad(selectedPaciente.fecha_nacimiento)} años
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold mr-2">Fecha de Nacimiento:</span>
                    {new Date(selectedPaciente.fecha_nacimiento).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg mb-2">
                <p className="text-sm text-blue-100">Tipo de Sangre</p>
                <p className="text-2xl font-bold">{selectedPaciente.tipo_sangre}</p>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                <p className="text-sm text-blue-100">Género</p>
                <p className="text-lg font-semibold">
                  {selectedPaciente.genero === 'M' ? 'Masculino' : 'Femenino'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 p-4">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <User size={18} className="mr-2" />
                  Información Personal
                </div>
              </button>
              <button
                onClick={() => setActiveTab('historias')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'historias'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <FileText size={18} className="mr-2" />
                  Historial Médico ({pacienteHistorias.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('citas')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'citas'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <Calendar size={18} className="mr-2" />
                  Citas ({pacienteCitas.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('alergias')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'alergias'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <Activity size={18} className="mr-2" />
                  Alergias y Observaciones
                </div>
              </button>
            </nav>
          </div>

          {/* Contenido de las pestañas */}
          <div className="p-6">
            {/* Pestaña: Información Personal */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Datos de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Teléfono</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedPaciente.telefono}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedPaciente.email || 'No registrado'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Dirección</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedPaciente.direccion}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Seguro Médico</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedPaciente.seguro_medico || 'Sin seguro registrado'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Fecha de Registro</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(selectedPaciente.fecha_registro).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>

                {/* Tarjetas de información adicional */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                    <Calendar className="text-blue-600 mx-auto mb-2" size={32} />
                    <p className="text-sm text-blue-600 font-medium">Total de Citas</p>
                    <p className="text-3xl font-bold text-blue-700">{pacienteCitas.length}</p>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
                    <FileText className="text-purple-600 mx-auto mb-2" size={32} />
                    <p className="text-sm text-purple-600 font-medium">Historias Clínicas</p>
                    <p className="text-3xl font-bold text-purple-700">{pacienteHistorias.length}</p>
                  </div>
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                    <Activity className="text-green-600 mx-auto mb-2" size={32} />
                    <p className="text-sm text-green-600 font-medium">Estado</p>
                    <p className="text-xl font-bold text-green-700">
                      {selectedPaciente.activo ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pestaña: Historial Médico */}
            {activeTab === 'historias' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Historial de Consultas</h3>
                {pacienteHistorias.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <FileText className="text-gray-400 mx-auto mb-4" size={48} />
                    <p className="text-gray-600">No hay historias clínicas registradas</p>
                  </div>
                ) : (
                  pacienteHistorias.map((historia) => (
                    <div key={historia.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            {new Date(historia.fecha).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm font-medium text-gray-700 mt-1">
                            Atendido por: {historia.doctor_info?.nombre_completo || 'Doctor'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                          <p className="text-xs font-semibold text-red-700 mb-1">DIAGNÓSTICO</p>
                          <p className="text-sm text-gray-800">{historia.diagnostico}</p>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                          <p className="text-xs font-semibold text-yellow-700 mb-1">SÍNTOMAS</p>
                          <p className="text-sm text-gray-800">{historia.sintomas}</p>
                        </div>

                        <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                          <p className="text-xs font-semibold text-green-700 mb-1">TRATAMIENTO</p>
                          <p className="text-sm text-gray-800">{historia.tratamiento}</p>
                        </div>

                        {historia.examenes_solicitados && (
                          <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                            <p className="text-xs font-semibold text-purple-700 mb-1">EXÁMENES SOLICITADOS</p>
                            <p className="text-sm text-gray-800">{historia.examenes_solicitados}</p>
                          </div>
                        )}

                        {historia.notas_adicionales && (
                          <div className="bg-gray-50 border-l-4 border-gray-400 p-3 rounded">
                            <p className="text-xs font-semibold text-gray-700 mb-1">NOTAS ADICIONALES</p>
                            <p className="text-sm text-gray-800">{historia.notas_adicionales}</p>
                          </div>
                        )}

                        {historia.prescripciones && historia.prescripciones.length > 0 && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                            <p className="text-xs font-semibold text-blue-700 mb-2">MEDICACIÓN PRESCRITA</p>
                            <div className="space-y-2">
                              {historia.prescripciones.map((presc, idx) => (
                                <div key={idx} className="bg-white p-2 rounded text-sm">
                                  <p className="font-semibold text-gray-800">
                                    {presc.medicamento_info?.nombre || 'Medicamento'}
                                  </p>
                                  <p className="text-gray-600 text-xs">
                                    Dosis: {presc.dosis} - Frecuencia: {presc.frecuencia} - Duración: {presc.duracion}
                                  </p>
                                  {presc.instrucciones && (
                                    <p className="text-gray-600 text-xs mt-1">
                                      Instrucciones: {presc.instrucciones}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Pestaña: Citas */}
            {activeTab === 'citas' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Historial de Citas</h3>
                {pacienteCitas.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <Calendar className="text-gray-400 mx-auto mb-4" size={48} />
                    <p className="text-gray-600">No hay citas registradas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pacienteCitas.map((cita) => (
                      <div key={cita.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <Calendar className="text-blue-600 mr-2" size={20} />
                            <span className="text-sm font-semibold text-gray-700">
                              {new Date(cita.fecha_hora).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            cita.estado === 'programada' ? 'bg-blue-100 text-blue-800' :
                            cita.estado === 'completada' ? 'bg-green-100 text-green-800' :
                            cita.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cita.estado}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="flex items-center">
                            <Stethoscope className="mr-2" size={16} />
                            <span className="font-medium">
                              {cita.doctor_info ? cita.doctor_info.nombre_completo : 'Doctor'}
                            </span>
                          </p>
                          <p className="flex items-center">
                            <Clock className="mr-2" size={16} />
                            {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Motivo:</span> {cita.motivo}
                          </p>
                        </div>

                        {cita.observaciones && (
                          <div className="mt-2 bg-gray-50 p-2 rounded">
                            <p className="text-xs text-gray-600">
                              <span className="font-semibold">Observaciones:</span> {cita.observaciones}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pestaña: Alergias y Observaciones */}
            {activeTab === 'alergias' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Información Médica Importante</h3>
                
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="bg-red-500 p-2 rounded-full mr-3">
                      <Activity className="text-white" size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-red-800">Alergias</h4>
                  </div>
                  {selectedPaciente.alergias ? (
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-line">{selectedPaciente.alergias}</p>
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-lg text-center">
                      <p className="text-gray-500">No se han registrado alergias</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-blue-800 mb-3">Tipo de Sangre</h4>
                    <div className="bg-white p-4 rounded-lg text-center">
                      <p className="text-4xl font-bold text-blue-600">{selectedPaciente.tipo_sangre}</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-purple-800 mb-3">Seguro Médico</h4>
                    <div className="bg-white p-4 rounded-lg text-center">
                      <p className="text-lg font-semibold text-purple-700">
                        {selectedPaciente.seguro_medico || 'Sin seguro registrado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información de contacto de emergencia */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-orange-800 mb-3">Contacto de Emergencia</h4>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">Teléfono:</span> {selectedPaciente.telefono}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Dirección:</span> {selectedPaciente.direccion}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCitas = () => {
    const isMedicoView = user?.rol === 'doctor' || user?.rol === 'enfermero';

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {isMedicoView && user?.rol === 'doctor' ? 'Mis Citas' : 'Citas Médicas'}
          </h2>
          {user?.rol === 'doctor' && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Nueva Cita
            </button>
          )}
        </div>

        {citas.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <Calendar className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay citas registradas</h3>
            <p className="text-gray-600">
              {user?.rol === 'doctor' 
                ? 'No tienes citas programadas.' 
                : 'No hay citas en el sistema.'}
            </p>
          </div>
        ) : (
          <div className={`grid ${isMedicoView ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-4`}>
            {citas.map((cita) => (
              <div 
                key={cita.id} 
                className={`bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all cursor-pointer border-2 ${
                  cita.estado === 'programada' ? 'border-blue-200 hover:border-blue-400' :
                  cita.estado === 'en_curso' ? 'border-yellow-200 hover:border-yellow-400' :
                  cita.estado === 'completada' ? 'border-green-200 hover:border-green-400' :
                  'border-red-200 hover:border-red-400'
                }`}
                onClick={() => {
                  if (user?.rol === 'doctor') {
                    setCitaEnConsulta(cita);
                    setActiveView('consulta');
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <Calendar className="text-blue-600 mr-2" size={20} />
                    <div>
                      <span className="text-sm font-semibold text-gray-700 block">
                        {new Date(cita.fecha_hora).toLocaleDateString('es-ES', { 
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span className="text-lg font-bold text-gray-800">
                        {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    cita.estado === 'programada' ? 'bg-blue-100 text-blue-800' :
                    cita.estado === 'en_curso' ? 'bg-yellow-100 text-yellow-800' :
                    cita.estado === 'completada' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {cita.estado}
                  </span>
                </div>
                
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800">
                    {cita.paciente_info.nombre} {cita.paciente_info.apellidos}
                  </h4>
                  <p className="text-xs text-gray-600">N° Historia: {cita.paciente_info.numero_historia}</p>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p className="flex items-center">
                    <Activity className="mr-2" size={16} />
                    Sangre: {cita.paciente_info.tipo_sangre}
                  </p>
                  <p className="flex items-center">
                    <Phone className="mr-2" size={16} />
                    {cita.paciente_info.telefono}
                  </p>
                </div>

                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-4 line-clamp-2">
                  <span className="font-semibold">Motivo:</span> {cita.motivo}
                </p>

                {user?.rol === 'doctor' && cita.estado === 'programada' && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstadoCita(cita.id, 'en_curso');
                      }}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold py-2 rounded transition-colors"
                    >
                      Iniciar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstadoCita(cita.id, 'cancelada');
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                
                {user?.rol === 'doctor' && cita.estado === 'en_curso' && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstadoCita(cita.id, 'completada');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded transition-colors"
                    >
                      Completar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstadoCita(cita.id, 'cancelada');
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {user?.rol === 'doctor' && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                    <p className="text-xs text-blue-600 font-semibold">Haz clic para ver detalles completos</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && canAccess('crear_cita') && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Nueva Cita</h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} className="text-gray-600 hover:text-gray-800" />
                </button>
              </div>
              
              <form onSubmit={handleCreateCita} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente ID</label>
                  <input
                    type="number"
                    value={newCita.paciente}
                    onChange={(e) => setNewCita({...newCita, paciente: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor ID</label>
                  <input
                    type="number"
                    value={newCita.doctor}
                    onChange={(e) => setNewCita({...newCita, doctor: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    value={newCita.fecha_hora}
                    onChange={(e) => setNewCita({...newCita, fecha_hora: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                  <textarea
                    value={newCita.motivo}
                    onChange={(e) => setNewCita({...newCita, motivo: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Crear Cita
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };
  const renderDoctores = () => {
    if (!canAccess('doctores')) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <X className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold text-red-800 mb-2">Acceso Denegado</h3>
          <p className="text-red-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      );
    }
    if (doctores.length === 0) {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Doctores</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <Stethoscope className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay doctores registrados</h3>
            <p className="text-gray-600">Aún no hay doctores en el sistema.</p>
          </div>
        </div>
      );
    }


    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Doctores</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctores.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Stethoscope className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{doctor.nombre_completo}</h3>
                  <p className="text-sm text-gray-600">{doctor.especialidad}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Licencia:</strong> {doctor.licencia_medica}</p>
                <p><strong>Departamento:</strong> {doctor.departamento_info?.nombre || 'N/A'}</p>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  doctor.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {doctor.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHabitaciones = () => {
    if (!canAccess('habitaciones')) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <X className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold text-red-800 mb-2">Acceso Denegado</h3>
          <p className="text-red-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      );
    }

    if (habitaciones.length === 0) {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Habitaciones</h2>
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Bed className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-600">No hay habitaciones disponibles</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Habitaciones</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habitaciones.map((habitacion) => {
            const capacidad = {
              'individual': 1,
              'doble': 2,
              'triple': 3,
              'uci': 1,
              'emergencia': 1,
            }[habitacion.tipo] || 1;
            
            const ocupadas = habitacion.ocupadas || 0;
            const disponible = ocupadas < capacidad;
            const sobrecapacidad = ocupadas > capacidad; // ⬅️ AÑADIDO

            return (
              <div 
                key={habitacion.id}
                onClick={() => {
                  setSelectedHabitacion(habitacion);
                  setActiveView('detalle-habitacion');
                }}
                className={`rounded-xl shadow-md p-5 cursor-pointer transition-all hover:shadow-lg ${
                  sobrecapacidad  // ⬅️ AÑADIDO
                    ? 'bg-orange-50 border-2 border-orange-500 hover:border-orange-700' 
                    : disponible 
                      ? 'bg-green-50 border-2 border-green-300 hover:border-green-500' 
                      : 'bg-red-50 border-2 border-red-300 hover:border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Bed className={
                      sobrecapacidad ? 'text-orange-600' :  // ⬅️ AÑADIDO
                      disponible ? 'text-green-600' : 'text-red-600'
                    } size={28} />
                    <div className="ml-3">
                      <p className="font-bold text-gray-800">Hab. {habitacion.numero}</p>
                      <p className="text-xs text-gray-600 capitalize">{habitacion.tipo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${sobrecapacidad ? 'text-orange-600' : 'text-gray-800'}`}>  {/* ⬅️ MODIFICADO */}
                      {ocupadas}/{capacidad}
                    </p>
                    <p className="text-xs font-semibold text-gray-600">camas</p>
                  </div>
                </div>

                <div className="mb-3 pb-3 border-b border-gray-300">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Piso:</span> {habitacion.piso}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Depto:</span> {habitacion.departamento_info?.nombre || 'N/A'}
                  </p>
                </div>

                {sobrecapacidad ? (  // ⬅️ AÑADIDO BLOQUE COMPLETO
                  <div className="px-3 py-1 rounded-full text-xs font-semibold inline-block bg-orange-200 text-orange-900">
                    ⚠️ Sobrecapacidad ({ocupadas}/{capacidad})
                  </div>
                ) : (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                    disponible 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {disponible ? '✓ Disponible' : 'Llena'}
                  </div>
                )}

                <p className="text-xs text-gray-600 mt-3 italic">Haz clic para ver detalles</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const renderDetalleHabitacion = () => {
  console.log('🎨 RENDER - pacientesHabitacion:', pacientesHabitacion);
  console.log('🎨 RENDER - selectedHabitacion:', selectedHabitacion);
  
  if (!selectedHabitacion) {
    console.log('⚠️ No hay habitación seleccionada');
    return null;
  }

  const capacidad = {
    'individual': 1,
    'doble': 2,
    'triple': 3,
    'uci': 1,
    'emergencia': 1,
  }[selectedHabitacion.tipo] || 1;

  console.log('📋 Capacidad:', capacidad);
  console.log('📋 Pacientes en estado:', pacientesHabitacion);
  console.log('📋 Longitud array:', pacientesHabitacion?.length);

  return (
    <div className="space-y-6">
      <button
        onClick={() => setActiveView('habitaciones')}
        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a Habitaciones
      </button>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Habitación {selectedHabitacion.numero}</h1>
            <p className="text-blue-100 capitalize">Tipo: {selectedHabitacion.tipo}</p>
          </div>
          <div className="text-right bg-white bg-opacity-20 px-6 py-4 rounded-lg">
            <p className="text-3xl font-bold">{pacientesHabitacion.length}/{capacidad}</p>
            <p className="text-blue-100 text-sm">Pacientes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600">Piso</p>
          <p className="text-2xl font-bold text-gray-800">{selectedHabitacion.piso}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-600">Departamento</p>
          <p className="text-lg font-bold text-gray-800">{selectedHabitacion.departamento_info?.nombre}</p>
        </div>
      </div>

      {!pacientesHabitacion || pacientesHabitacion.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Bed className="text-gray-400 mx-auto mb-4" size={48} />
          <p className="text-gray-600">No hay pacientes en esta habitación</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Pacientes Hospitalizados</h2>
          {pacientesHabitacion.map((item, index) => { 
            console.log(`👤 Renderizando paciente ${index}:`, item); 
            return ( 
              <div key={item.id || index} className="bg-white rounded-xl shadow-md p-6">  
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {item.paciente?.nombre || 'Sin nombre'} {item.paciente?.apellidos || ''}  
                    </h3>
                    <p className="text-sm text-gray-600">Nº Historia: {item.paciente?.numero_historia || 'N/A'}</p> 
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{item.hospitalizacion?.dias || 0}</p> 
                    <p className="text-xs text-gray-600">días hospitalizados</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b">
                  <div>
                    <p className="text-xs text-gray-600">Tipo de Sangre</p>
                    <p className="font-bold text-gray-800">{item.paciente?.tipo_sangre || 'N/A'}</p> 
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Teléfono</p>
                    <p className="font-bold text-gray-800">{item.paciente?.telefono || 'N/A'}</p>  
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Doctor</p>
                    <p className="font-bold text-gray-800">{item.doctor?.nombre || 'N/A'}</p>  
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Especialidad</p>
                    <p className="font-bold text-gray-800">{item.doctor?.especialidad || 'N/A'}</p> 
                  </div>
                </div>

                {item.paciente?.alergias && ( 
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
                    <p className="text-xs font-bold text-red-700 mb-1">⚠️ ALERGIAS</p>
                    <p className="text-sm text-red-800 font-semibold">{item.paciente.alergias}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                    <p className="text-xs font-bold text-blue-700 mb-1">MOTIVO DE HOSPITALIZACIÓN</p>
                    <p className="text-sm text-gray-800">{item.hospitalizacion?.motivo || 'No especificado'}</p> 
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                    <p className="text-xs font-bold text-green-700 mb-1">DIAGNÓSTICO</p>
                    <p className="text-sm text-gray-800">{item.hospitalizacion?.diagnostico || 'No especificado'}</p>  
                  </div>

                  {item.ultima_consulta && (
                    <>
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                        <p className="text-xs font-bold text-yellow-700 mb-1">TRATAMIENTO</p>
                        <p className="text-sm text-gray-800">{item.ultima_consulta.tratamiento}</p>
                      </div>

                      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                        <p className="text-xs font-bold text-purple-700 mb-1">SÍNTOMAS ACTUALES</p>
                        <p className="text-sm text-gray-800">{item.ultima_consulta.sintomas}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

  const renderHistoriasClinicas = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {user?.rol === 'paciente' ? 'Mi Historial Médico' : 'Historias Clínicas'}
        </h2>
        
        {historias.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <FileText className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay historias clínicas</h3>
            <p className="text-gray-600">
              {user?.rol === 'paciente' 
                ? 'Aún no tienes historias clínicas registradas.' 
                : 'No hay historias clínicas en el sistema.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {historias.map((historia) => (
              <div key={historia.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {historia.paciente_info ? `${historia.paciente_info.nombre} ${historia.paciente_info.apellidos}` : 'Paciente'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(historia.fecha).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Atendido por:</p>
                    <p className="font-semibold text-gray-800">
                      {historia.doctor_info?.nombre_completo || 'Doctor'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Diagnóstico:</h4>
                    <p className="text-gray-600 bg-blue-50 p-3 rounded-lg">{historia.diagnostico}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Síntomas:</h4>
                    <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg">{historia.sintomas}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Tratamiento:</h4>
                    <p className="text-gray-600 bg-green-50 p-3 rounded-lg">{historia.tratamiento}</p>
                  </div>

                  {historia.examenes_solicitados && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Exámenes Solicitados:</h4>
                      <p className="text-gray-600 bg-purple-50 p-3 rounded-lg">{historia.examenes_solicitados}</p>
                    </div>
                  )}

                  {historia.notas_adicionales && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Notas Adicionales:</h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{historia.notas_adicionales}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDashboardDoctor = () => {
    if (!user || (user.rol !== 'doctor' && user.rol !== 'enfermero')) {
      return null;
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Bienvenido, {user.first_name || user.username}
            </h2>
            <p className="text-gray-600 mt-1">
              {user.rol === 'doctor' ? 'Panel de Trabajo - Doctor' : 'Panel de Visualización - Enfermero'}
            </p>
          </div>
          <div className="bg-blue-100 px-6 py-3 rounded-lg">
            <p className="text-sm text-gray-600">Hora actual</p>
            <p className="text-2xl font-bold text-blue-600">
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Tarjeta de citas del día */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Mis Citas de Hoy</h3>
              <p className="text-blue-100 text-sm">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-5xl font-bold opacity-30">
              {misCitasHoy.length}
            </div>
          </div>
        </div>

        {/* Citas de hoy */}
        {user.rol === 'doctor' && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-800">Citas Programadas</h3>
            
            {misCitasHoy.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <Calendar className="text-gray-400 mx-auto mb-4" size={48} />
                <p className="text-gray-600 text-lg">No tienes citas programadas para hoy</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {misCitasHoy.map((cita) => (
                  <div key={cita.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all hover:shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <h4 className="text-lg font-bold text-gray-800 mt-1">
                          {cita.paciente_info.nombre} {cita.paciente_info.apellidos}
                        </h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        cita.estado === 'programada' ? 'bg-blue-100 text-blue-800' :
                        cita.estado === 'en_curso' ? 'bg-yellow-100 text-yellow-800' :
                        cita.estado === 'completada' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {cita.estado}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Motivo:</span> {cita.motivo}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p className="flex items-center">
                        <Stethoscope className="mr-2" size={16} />
                        N° Historia: {cita.paciente_info.numero_historia}
                      </p>
                      <p className="flex items-center">
                        <Activity className="mr-2" size={16} />
                        Tipo de sangre: {cita.paciente_info.tipo_sangre}
                      </p>
                    </div>

                    {cita.estado === 'programada' && (
                      <button
                        onClick={() => iniciarConsulta(cita)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
                      >
                        Iniciar Consulta
                      </button>
                    )}
                    {cita.estado === 'en_curso' && (
                      <button
                        onClick={() => {
                          setCitaEnConsulta(cita);
                          setActiveView('consulta');
                        }}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 rounded-lg transition-colors"
                      >
                        Continuar Consulta
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Acceso rápido */}
        {user.rol === 'doctor' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveView('pacientes')}
              className="bg-white border-2 border-blue-200 hover:border-blue-600 rounded-xl p-6 transition-all hover:shadow-lg"
            >
              <Users className="text-blue-600 mx-auto mb-3" size={32} />
              <p className="font-semibold text-gray-800">Mis Pacientes</p>
              <p className="text-xs text-gray-600 mt-1">Del departamento</p>
            </button>

            <button
              onClick={() => setActiveView('hospitalizacion')}
              className="bg-white border-2 border-purple-200 hover:border-purple-600 rounded-xl p-6 transition-all hover:shadow-lg"
            >
              <Bed className="text-purple-600 mx-auto mb-3" size={32} />
              <p className="font-semibold text-gray-800">Hospitalizaciones</p>
              <p className="text-xs text-gray-600 mt-1">Activos</p>
            </button>

            <button
              onClick={() => setActiveView('medicamentos')}
              className="bg-white border-2 border-green-200 hover:border-green-600 rounded-xl p-6 transition-all hover:shadow-lg"
            >
              <Activity className="text-green-600 mx-auto mb-3" size={32} />
              <p className="font-semibold text-gray-800">Medicamentos</p>
              <p className="text-xs text-gray-600 mt-1">Disponibles</p>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderConsulta = () => {
    if (!citaEnConsulta) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">No hay consulta en curso</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setCitaEnConsulta(null);
              setShowFormConsulta(false);
              setActiveView('dashboard');
            }}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Consulta en Curso</h2>
          <div></div>
        </div>

        {/* Información del paciente */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {citaEnConsulta.paciente_info.nombre} {citaEnConsulta.paciente_info.apellidos}
              </h3>
              <p className="text-blue-100">N° Historia: {citaEnConsulta.paciente_info.numero_historia}</p>
              <p className="text-blue-100">Tipo de sangre: {citaEnConsulta.paciente_info.tipo_sangre}</p>
            </div>
          </div>
        </div>

        {/* Alergias destacadas */}
        {citaEnConsulta.paciente_info.alergias && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Activity className="text-red-600 mr-2" size={20} />
              <p className="font-bold text-red-800">ALERGIAS REGISTRADAS</p>
            </div>
            <p className="text-red-700 font-semibold">{citaEnConsulta.paciente_info.alergias}</p>
          </div>
        )}

        {/* Formulario de consulta */}
        {!citaEnConsulta.historia_id ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Registrar Nueva Consulta</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Síntomas</label>
                <textarea
                  value={nuevaHistoria.sintomas}
                  onChange={(e) => setNuevaHistoria({...nuevaHistoria, sintomas: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Describe los síntomas del paciente..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnóstico</label>
                <textarea
                  value={nuevaHistoria.diagnostico}
                  onChange={(e) => setNuevaHistoria({...nuevaHistoria, diagnostico: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Diagnóstico del paciente..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tratamiento</label>
                <textarea
                  value={nuevaHistoria.tratamiento}
                  onChange={(e) => setNuevaHistoria({...nuevaHistoria, tratamiento: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Tratamiento recomendado..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Exámenes Solicitados</label>
                <textarea
                  value={nuevaHistoria.examenes_solicitados}
                  onChange={(e) => setNuevaHistoria({...nuevaHistoria, examenes_solicitados: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Exámenes o pruebas a realizar..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notas Adicionales</label>
                <textarea
                  value={nuevaHistoria.notas_adicionales}
                  onChange={(e) => setNuevaHistoria({...nuevaHistoria, notas_adicionales: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Anotaciones adicionales..."
                />
              </div>

              <button
                onClick={guardarHistoriaClinica}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Guardar Historia Clínica
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-green-800 font-semibold mb-4">Historia clínica guardada correctamente</p>
            <button
              onClick={() => setShowFormPrescripcion(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Recetar Medicamentos
            </button>
          </div>
        )}

        {/* Formulario de prescripción */}
        {citaEnConsulta.historia_id && showFormPrescripcion && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recetar Medicamento</h3>
            
            {alertaMedicamento && (
              <div className={`mb-4 p-4 rounded-lg ${
                alertaMedicamento.alerta 
                  ? 'bg-red-50 border-2 border-red-300' 
                  : 'bg-green-50 border-2 border-green-300'
              }`}>
                <p className={`font-semibold ${
                  alertaMedicamento.alerta ? 'text-red-800' : 'text-green-800'
                }`}>
                  {alertaMedicamento.mensaje}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Medicamento</label>
                <select
                  value={nuevaPrescripcion.medicamento_id}
                  onChange={(e) => {
                    setNuevaPrescripcion({...nuevaPrescripcion, medicamento_id: e.target.value});
                    verificarAlergias(e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Selecciona un medicamento --</option>
                  {medicamentosDisponibles.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.nombre} - {med.presentacion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dosis</label>
                  <input
                    type="text"
                    value={nuevaPrescripcion.dosis}
                    onChange={(e) => setNuevaPrescripcion({...nuevaPrescripcion, dosis: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 500mg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Frecuencia</label>
                  <input
                    type="text"
                    value={nuevaPrescripcion.frecuencia}
                    onChange={(e) => setNuevaPrescripcion({...nuevaPrescripcion, frecuencia: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 3 veces al día"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duración</label>
                <input
                  type="text"
                  value={nuevaPrescripcion.duracion}
                  onChange={(e) => setNuevaPrescripcion({...nuevaPrescripcion, duracion: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 7 días"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Instrucciones</label>
                <textarea
                  value={nuevaPrescripcion.instrucciones}
                  onChange={(e) => setNuevaPrescripcion({...nuevaPrescripcion, instrucciones: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Instrucciones especiales..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={guardarPrescripcion}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Recetar Medicamento
                </button>
                <button
                  onClick={() => {
                    setNuevaPrescripcion({
                      medicamento_id: '',
                      dosis: '',
                      frecuencia: '',
                      duracion: '',
                      instrucciones: ''
                    });
                    setAlertaMedicamento(null);
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botón finalizar consulta */}
        {citaEnConsulta.historia_id && (
          <button
            onClick={completarConsulta}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Finalizar Consulta
          </button>
        )}
      </div>
    );
  };

  const renderHospitalizacion = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Hospitalizaciones</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <Bed className="mb-2" size={32} />
            <p className="text-blue-100 text-sm">Hospitalizaciones Activas</p>
            <p className="text-4xl font-bold">{hospitalizacionesActivas.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <Activity className="mb-2" size={32} />
            <p className="text-green-100 text-sm">Pacientes Internados</p>
            <p className="text-4xl font-bold">{hospitalizacionesActivas.filter(h => h.estado === 'activa').length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <Calendar className="mb-2" size={32} />
            <p className="text-purple-100 text-sm">Altas Realizadas</p>
            <p className="text-4xl font-bold">{hospitalizacionesActivas.filter(h => h.estado === 'alta').length}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Hospitalizaciones Activas</h3>
          
          {hospitalizacionesActivas.filter(h => h.estado === 'activa').length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Bed className="text-gray-400 mx-auto mb-4" size={48} />
              <p className="text-gray-600">No hay pacientes hospitalizados actualmente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {hospitalizacionesActivas.filter(h => h.estado === 'activa').map((hospitalizacion) => (
                <div key={hospitalizacion.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">
                        {hospitalizacion.paciente_info.nombre} {hospitalizacion.paciente_info.apellidos}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Habitación: {hospitalizacion.habitacion_info.numero} - Piso {hospitalizacion.habitacion_info.piso}
                      </p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      En tratamiento
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Tipo de Sangre</p>
                      <p className="text-lg font-bold text-gray-800">{hospitalizacion.paciente_info.tipo_sangre}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Fecha Ingreso</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(hospitalizacion.fecha_ingreso).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Días Hospitalizados</p>
                      <p className="text-lg font-bold text-gray-800">{hospitalizacion.dias_hospitalizacion}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Doctor Responsable</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {hospitalizacion.doctor_info?.nombre_completo || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Motivo:</span>
                      <span className="text-gray-600 ml-2">{hospitalizacion.motivo}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Diagnóstico:</span>
                      <span className="text-gray-600 ml-2">{hospitalizacion.diagnostico}</span>
                    </p>
                  </div>

                  {user.rol === 'doctor' && (
                    <button
                      onClick={() => {
                        // Aquí irá la funcionalidad de dar alta
                        alert('Funcionalidad de dar alta disponible próximamente');
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
                    >
                      Dar de Alta
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMedicamentos = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Medicamentos Disponibles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicamentosDisponibles.map((medicamento) => (
            <div key={medicamento.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 transition-all hover:shadow-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">{medicamento.nombre}</h3>
                  <p className="text-xs text-gray-600 mt-1">{medicamento.presentacion}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  medicamento.stock > 20 ? 'bg-green-100 text-green-800' :
                  medicamento.stock > 10 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  Stock: {medicamento.stock}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-3">
                <p>
                  <span className="font-semibold">P. Activo:</span> {medicamento.principio_activo}
                </p>
                {medicamento.precio > 0 && (
                  <p>
                    <span className="font-semibold">Precio:</span> ${medicamento.precio}
                  </p>
                )}
                
              </div>

              {medicamento.descripcion && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {medicamento.descripcion}
                </p>
              )}

              <div className="pt-3 border-t border-gray-200">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  medicamento.activo ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {medicamento.activo ? 'Disponible' : 'Descontinuado'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {medicamentosDisponibles.length === 0 && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Activity className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-600">No hay medicamentos disponibles</p>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Activity className="text-blue-600 mr-3" size={32} />
              <span className="text-xl font-bold text-gray-800">Hospital Medac</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                  activeView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home size={18} className="mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              
              {/* Mostrar diferentes menús según el rol */}
              {user?.rol === 'doctor' && (
                <>
                  <button
                    onClick={() => setActiveView('consulta')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'consulta' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Stethoscope size={18} className="mr-2" />
                    <span className="hidden sm:inline">Consulta</span>
                  </button>

                  <button
                    onClick={() => setActiveView('hospitalizacion')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'hospitalizacion' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Bed size={18} className="mr-2" />
                    <span className="hidden sm:inline">Hospitalización</span>
                  </button>

                  <button
                    onClick={() => setActiveView('medicamentos')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'medicamentos' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Activity size={18} className="mr-2" />
                    <span className="hidden sm:inline">Medicamentos</span>
                  </button>

                  <button
                    onClick={() => setActiveView('pacientes')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'pacientes' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Users size={18} className="mr-2" />
                    <span className="hidden sm:inline">Pacientes</span>
                  </button>
                </>
              )}

              {user?.rol === 'enfermero' && (
                <>
                  <button
                    onClick={() => setActiveView('pacientes')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'pacientes' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Users size={18} className="mr-2" />
                    <span className="hidden sm:inline">Pacientes</span>
                  </button>

                  <button
                    onClick={() => setActiveView('hospitalizacion')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'hospitalizacion' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Bed size={18} className="mr-2" />
                    <span className="hidden sm:inline">Hospitalización</span>
                  </button>

                  <button
                    onClick={() => setActiveView('medicamentos')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'medicamentos' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Activity size={18} className="mr-2" />
                    <span className="hidden sm:inline">Medicamentos</span>
                  </button>

                  <button
                    onClick={() => setActiveView('citas')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'citas' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar size={18} className="mr-2" />
                    <span className="hidden sm:inline">Citas</span>
                  </button>
                </>
              )}

              {user?.rol === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveView('pacientes')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'pacientes' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Users size={18} className="mr-2" />
                    <span className="hidden sm:inline">Pacientes</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveView('citas')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'citas' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar size={18} className="mr-2" />
                    <span className="hidden sm:inline">Citas</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveView('doctores')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'doctores' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Stethoscope size={18} className="mr-2" />
                    <span className="hidden sm:inline">Doctores</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveView('habitaciones')}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      activeView === 'habitaciones' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Bed size={18} className="mr-2" />
                    <span className="hidden sm:inline">Habitaciones</span>
                  </button>
                </>
              )}
              <div className="flex items-center text-gray-700 px-3">
                <User size={18} className="mr-2" />
                <span className="hidden md:inline">{user?.username}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {user?.rol === 'doctor' || user?.rol === 'enfermero' ? (
    <>
      {activeView === 'dashboard' && user?.rol === 'doctor' && renderDashboardDoctor()}
      {activeView === 'dashboard' && user?.rol === 'enfermero' && renderDashboardDoctor()}
      {activeView === 'consulta' && user?.rol === 'doctor' && renderConsulta()}
      {activeView === 'hospitalizacion' && renderHospitalizacion()}
      {activeView === 'medicamentos' && renderMedicamentos()}
      {activeView === 'pacientes' && renderPacientes()}
      {activeView === 'perfil-paciente' && renderPerfilPaciente()}
      {activeView === 'citas' && renderCitas()}
      {activeView === 'detalle-habitacion' && renderDetalleHabitacion()}
    </>
  ) : (
    <>
      {activeView === 'dashboard' && renderDashboard()}
      {activeView === 'pacientes' && renderPacientes()}
      {activeView === 'perfil-paciente' && renderPerfilPaciente()}
      {activeView === 'citas' && renderCitas()}
      {activeView === 'doctores' && renderDoctores()}
      {activeView === 'habitaciones' && renderHabitaciones()}
      {activeView === 'detalle-habitacion' && renderDetalleHabitacion()} 
      {activeView === 'historias' && renderHistoriasClinicas()}
    </>
  )}
</main>
    </div>
  );
};

export default HospitalManagementSystem;