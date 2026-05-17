import React, { useState, useEffect } from 'react';
import { Calendar, Users, Stethoscope, Bed, Activity, Clock, Search, Plus, X, User, LogOut, Home, FileText, Phone, Menu } from 'lucide-react';
import './App.css';

const API_URL = 'https://hospital-backend-6h6n.onrender.com/api';

const badgeEstado = (estado) => {
  const map = { programada: 'badge-blue', en_curso: 'badge-yellow', completada: 'badge-green', cancelada: 'badge-red' };
  return map[estado] || 'badge-gray';
};

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
  const [navOpen, setNavOpen] = useState(false);
  const [misDoctorData, setMisDoctorData] = useState(null);
  const [misCitasHoy, setMisCitasHoy] = useState([]);
  const [citaEnConsulta, setCitaEnConsulta] = useState(null);
  const [nuevaHistoria, setNuevaHistoria] = useState({ sintomas: '', diagnostico: '', tratamiento: '', examenes_solicitados: '', notas_adicionales: '' });
  const [prescripciones, setPrescripciones] = useState([]);
  const [nuevaPrescripcion, setNuevaPrescripcion] = useState({ medicamento_id: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' });
  const [medicamentosDisponibles, setMedicamentosDisponibles] = useState([]);
  const [showFormConsulta, setShowFormConsulta] = useState(false);
  const [showFormPrescripcion, setShowFormPrescripcion] = useState(false);
  const [alertaMedicamento, setAlertaMedicamento] = useState(null);
  const [hospitalizacionesActivas, setHospitalizacionesActivas] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [showFormDerivacion, setShowFormDerivacion] = useState(false);
  const [nuevaDerivacion, setNuevaDerivacion] = useState({ departamento: '', fecha_hora: '', motivo: '' });
  const [showFormHospitalizacion, setShowFormHospitalizacion] = useState(false);
  const [nuevaHospitalizacion, setNuevaHospitalizacion] = useState({ habitacion: '', motivo: '', diagnostico: '' });
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [misCitas, setMisCitas] = useState([]);
  const [showModalCitaPaciente, setShowModalCitaPaciente] = useState(false);
  const [nuevaCitaPaciente, setNuevaCitaPaciente] = useState({ fecha_hora: '', motivo: '' });
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [newPaciente, setNewPaciente] = useState({ nombre: '', apellidos: '', fecha_nacimiento: '', genero: 'M', tipo_sangre: 'O+', telefono: '', direccion: '', numero_historia: '' });
  const [newCita, setNewCita] = useState({ paciente: '', doctor: '', fecha_hora: '', motivo: '' });

  const obtenerFechaHoy = () => new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const navTo = (view) => { setActiveView(view); setNavOpen(false); };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      fetchDashboardStats(storedToken);
      setActiveView('dashboard');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/auth/login/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginData) });
      if (!response.ok) { alert('Credenciales incorrectas'); return; }
      const data = await response.json();
      if (data.access) {
        setToken(data.access);
        localStorage.setItem('token', data.access);
        const userResponse = await fetch(`${API_URL}/auth/user/`, { headers: { 'Authorization': `Bearer ${data.access}` } });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          fetchDashboardStats(data.access);
          setActiveView('dashboard');
        }
      }
    } catch (error) { alert('Error al iniciar sesión.'); }
  };

  const handleLogout = () => { setToken(''); setUser(null); localStorage.removeItem('token'); localStorage.removeItem('user'); };

  const fetchDashboardStats = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/dashboard/estadisticas/`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      setStats(await response.json());
    } catch {}
  };

  const authHeaders = () => ({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });

  const cambiarEstadoCita = async (citaId, nuevoEstado) => {
    try {
      const r = await fetch(`${API_URL}/citas/${citaId}/cambiar_estado/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ estado: nuevoEstado }) });
      if (r.ok) { fetchMisCitasHoy(); fetchCitas(); }
      else alert('Error al actualizar el estado');
    } catch { alert('Error al actualizar el estado'); }
  };

  const fetchPacienteDetalle = async (pacienteId) => {
    try {
      const pacienteResponse = await fetch(`${API_URL}/pacientes/${pacienteId}/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!pacienteResponse.ok) throw new Error(`Error ${pacienteResponse.status}`);
      setSelectedPaciente(await pacienteResponse.json());
      const historiasR = await fetch(`${API_URL}/pacientes/${pacienteId}/historia_clinica/`, { headers: { 'Authorization': `Bearer ${token}` } });
      setPacienteHistorias(historiasR.ok ? await historiasR.json() : null);
      const citasR = await fetch(`${API_URL}/pacientes/${pacienteId}/citas/`, { headers: { 'Authorization': `Bearer ${token}` } });
      setPacienteCitas(citasR.ok ? await citasR.json() : null);
      setActiveView('perfil-paciente');
    } catch (error) { alert('Error al cargar los datos: ' + error.message); }
  };

  const fetchPacientesHabitacion = async (habitacionId) => {
    if (!habitacionId) return;
    try {
      const r = await fetch(`${API_URL}/habitaciones/${habitacionId}/pacientes/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!r.ok) throw new Error(`Error HTTP: ${r.status}`);
      const data = await r.json();
      setPacientesHabitacion(Array.isArray(data) ? data : []);
    } catch (error) { alert(`No se pudieron cargar los pacientes: ${error.message}`); setPacientesHabitacion([]); }
  };

  const fetchPacientes = async () => { try { const r = await fetch(`${API_URL}/pacientes/`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await r.json(); setPacientes(d.results || d); } catch {} };
  const fetchHospitalizaciones = async () => { try { const r = await fetch(`${API_URL}/hospitalizaciones/`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await r.json(); setHospitalizacionesActivas(d.results || d); } catch {} };
  const fetchCitas = async () => { try { const r = await fetch(`${API_URL}/citas/`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await r.json(); setCitas(d.results || d); } catch {} };
  const fetchDoctores = async () => { try { const r = await fetch(`${API_URL}/doctores/`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await r.json(); setDoctores(d.results || d); } catch {} };
  const fetchHabitaciones = async () => { try { const r = await fetch(`${API_URL}/habitaciones/`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await r.json(); setHabitaciones(d.results || d); } catch {} };
  const fetchHistoriasClinicas = async () => { try { const r = await fetch(`${API_URL}/historias-clinicas/`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await r.json(); setHistorias(d.results || d); } catch {} };
  const fetchMisDatos = async () => { try { if (user.rol === 'doctor') { const r = await fetch(`${API_URL}/doctores/`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await r.json(); const docs = d.results || d; const miDoc = docs.find(d => d.usuario_info?.username === user.username); if (miDoc) setMisDoctorData(miDoc); } } catch {} };
  const fetchMisCitasHoy = async () => { if (user?.rol !== 'doctor') return; try { const r = await fetch(`${API_URL}/citas/mis_citas/?fecha=${new Date().toISOString().split('T')[0]}`, { headers: { 'Authorization': `Bearer ${token}` } }); setMisCitasHoy(await r.json()); } catch {} };
  const fetchMedicamentos = async () => { try { const r = await fetch(`${API_URL}/medicamentos/`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await r.json(); setMedicamentosDisponibles(d.results || d); } catch {} };
  const fetchDepartamentos = async () => { try { const r = await fetch(`${API_URL}/departamentos/`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await r.json(); setDepartamentos(d.results || d); } catch {} };
  const fetchMisCitasPaciente = async () => { try { const r = await fetch(`${API_URL}/citas/`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await r.json(); setMisCitas(d.results || d); } catch {} };

  const handleSolicitarCita = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API_URL}/citas/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(nuevaCitaPaciente) });
      if (r.ok) { setShowModalCitaPaciente(false); setNuevaCitaPaciente({ fecha_hora: '', motivo: '' }); fetchMisCitasPaciente(); alert('Cita solicitada correctamente'); }
      else { const err = await r.json(); alert(err.detail || err.error || 'Error al solicitar la cita. ¿Tienes médico de cabecera asignado?'); }
    } catch { alert('Error al solicitar la cita'); }
  };

  const handleCancelarCitaPaciente = async (citaId) => {
    if (!window.confirm('¿Seguro que quieres cancelar esta cita?')) return;
    try {
      const r = await fetch(`${API_URL}/citas/${citaId}/cambiar_estado/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ estado: 'cancelada' }) });
      if (r.ok) fetchMisCitasPaciente(); else alert('Error al cancelar la cita');
    } catch { alert('Error al cancelar la cita'); }
  };

  const verificarAlergias = async (medicamentoId) => {
    if (!citaEnConsulta || !medicamentoId) return;
    try {
      const r = await fetch(`${API_URL}/prescripciones/crear_con_alerta/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ historia_clinica_id: citaEnConsulta.historia_id, medicamento_id: medicamentoId }) });
      setAlertaMedicamento(await r.json());
    } catch {}
  };

  const iniciarConsulta = async (cita) => {
    try {
      await fetch(`${API_URL}/citas/${cita.id}/cambiar_estado/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ estado: 'en_curso' }) });
      const r = await fetch(`${API_URL}/pacientes/${cita.paciente_info.id}/historia_clinica/`, { headers: { 'Authorization': `Bearer ${token}` } });
      setCitaEnConsulta({ ...cita, historia_id: null, historias_previas: await r.json() });
      setShowFormConsulta(true);
      setActiveView('consulta');
    } catch { alert('Error al iniciar consulta'); }
  };

  const guardarHistoriaClinica = async () => {
    if (!citaEnConsulta || !nuevaHistoria.diagnostico || !nuevaHistoria.sintomas) { alert('Por favor completa diagnóstico y síntomas'); return; }
    try {
      const r = await fetch(`${API_URL}/historias-clinicas/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ paciente: citaEnConsulta.paciente_info.id, doctor: misDoctorData.id, cita: citaEnConsulta.id, ...nuevaHistoria }) });
      if (r.ok) { const data = await r.json(); setCitaEnConsulta({ ...citaEnConsulta, historia_id: data.id }); alert('Historia clínica guardada'); setNuevaHistoria({ sintomas: '', diagnostico: '', tratamiento: '', examenes_solicitados: '', notas_adicionales: '' }); }
    } catch { alert('Error al guardar historia clínica'); }
  };

  const guardarPrescripcion = async () => {
    if (!citaEnConsulta?.historia_id || !nuevaPrescripcion.medicamento_id) { alert('Por favor selecciona un medicamento'); return; }
    try {
      const r = await fetch(`${API_URL}/prescripciones/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ historia_clinica: citaEnConsulta.historia_id, medicamento: nuevaPrescripcion.medicamento_id, ...nuevaPrescripcion }) });
      if (r.ok) { alert('Medicamento recetado'); setNuevaPrescripcion({ medicamento_id: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' }); setAlertaMedicamento(null); fetchMedicamentos(); }
    } catch { alert('Error al recetar medicamento'); }
  };

  const completarConsulta = async () => {
    try {
      await fetch(`${API_URL}/citas/${citaEnConsulta.id}/cambiar_estado/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ estado: 'completada' }) });
      alert('Consulta completada');
      setCitaEnConsulta(null); setShowFormConsulta(false); setShowFormPrescripcion(false); setShowFormDerivacion(false);
      fetchMisCitasHoy(); setActiveView('dashboard');
    } catch { alert('Error al completar consulta'); }
  };

  const handleDerivar = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API_URL}/citas/derivar/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ departamento: nuevaDerivacion.departamento, fecha_hora: nuevaDerivacion.fecha_hora, motivo: nuevaDerivacion.motivo, paciente: citaEnConsulta.paciente_info.id }) });
      if (r.ok) { const data = await r.json(); alert(`Derivación creada. Doctor asignado: ${data.doctor_info?.nombre_completo || 'asignado'}`); setShowFormDerivacion(false); setNuevaDerivacion({ departamento: '', fecha_hora: '', motivo: '' }); }
      else { const err = await r.json(); alert(err.error || 'Error al crear la derivación'); }
    } catch { alert('Error al crear la derivación'); }
  };

  const fetchHabitacionesDisponibles = async () => {
    try {
      if (!misDoctorData?.departamento) return;
      const r = await fetch(`${API_URL}/habitaciones/?departamento=${misDoctorData.departamento}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await r.json();
      const todas = data.results || data;
      const capMap = { individual: 1, doble: 2, triple: 3, uci: 1, emergencia: 1 };
      setHabitacionesDisponibles(todas.filter(h => {
        const cap = capMap[h.tipo] || 1;
        return (h.ocupadas || 0) < cap && h.activa && h.tipo !== 'consulta';
      }));
    } catch { }
  };

  const handleHospitalizar = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API_URL}/hospitalizaciones/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          paciente: citaEnConsulta.paciente_info.id,
          habitacion: nuevaHospitalizacion.habitacion,
          doctor_responsable: misDoctorData.id,
          motivo: nuevaHospitalizacion.motivo,
          diagnostico: nuevaHospitalizacion.diagnostico,
        })
      });
      if (r.ok) {
        alert('Paciente hospitalizado correctamente');
        setShowFormHospitalizacion(false);
        setNuevaHospitalizacion({ habitacion: '', motivo: '', diagnostico: '' });
      } else {
        const err = await r.json();
        alert(err.detail || err.non_field_errors?.[0] || 'Error al hospitalizar');
      }
    } catch { alert('Error al hospitalizar'); }
  };

  const handleDarAlta = async (hospitalizacionId) => {
    if (!window.confirm('¿Confirmas que quieres dar el alta a este paciente?')) return;
    try {
      const r = await fetch(`${API_URL}/hospitalizaciones/${hospitalizacionId}/`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ estado: 'alta' }) });
      if (r.ok) { alert('Paciente dado de alta correctamente'); fetchHospitalizaciones(); }
      else { const err = await r.json(); alert(err.detail || 'Error al dar el alta'); }
    } catch { alert('Error al dar el alta'); }
  };

  const volverALista = () => { setSelectedPaciente(null); setPacienteHistorias([]); setPacienteCitas([]); setActiveView('pacientes'); setActiveTab('info'); };

  const handleCreatePaciente = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API_URL}/pacientes/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(newPaciente) });
      if (r.ok) { setShowModal(false); fetchPacientes(); alert('Paciente creado exitosamente'); setNewPaciente({ nombre: '', apellidos: '', fecha_nacimiento: '', genero: 'M', tipo_sangre: 'O+', telefono: '', direccion: '', numero_historia: '' }); }
      else alert('Error al crear paciente');
    } catch { alert('Error al crear paciente'); }
  };

  const handleCreateCita = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API_URL}/citas/`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(newCita) });
      if (r.ok) { setShowModal(false); fetchCitas(); alert('Cita creada exitosamente'); setNewCita({ paciente: '', doctor: '', fecha_hora: '', motivo: '' }); }
      else alert('Error al crear cita');
    } catch { alert('Error al crear cita'); }
  };

  useEffect(() => {
    if (token) {
      if (activeView === 'pacientes') fetchPacientes();
      if (activeView === 'citas') fetchCitas();
      if (activeView === 'doctores') fetchDoctores();
      if (activeView === 'habitaciones') fetchHabitaciones();
      if (activeView === 'historias') fetchHistoriasClinicas();
      if (activeView === 'hospitalizacion') fetchHospitalizaciones();
      if (activeView === 'mis-citas') fetchMisCitasPaciente();
    }
  }, [activeView, token]);

  useEffect(() => {
    if (token && user && (user.rol === 'doctor' || user.rol === 'enfermero')) {
      fetchMisDatos();
      if (user.rol === 'doctor') fetchMisCitasHoy();
      fetchMedicamentos();
      fetchDepartamentos();
    }
  }, [token, user]);

  useEffect(() => {
    if (token && selectedHabitacion && activeView === 'detalle-habitacion') {
      fetchPacientesHabitacion(selectedHabitacion.id);
    }
  }, [selectedHabitacion, activeView, token]);

  const canAccess = (feature) => {
    if (!user) return false;
    const permissions = {
      pacientes: ['admin', 'doctor', 'enfermero', 'recepcionista'],
      citas: ['admin', 'doctor', 'enfermero', 'recepcionista', 'paciente'],
      doctores: ['admin', 'doctor', 'enfermero', 'recepcionista'],
      habitaciones: ['admin', 'doctor', 'enfermero'],
      historias: ['admin', 'doctor', 'enfermero', 'paciente'],
      crear_paciente: ['admin', 'doctor', 'recepcionista'],
      crear_cita: ['admin', 'doctor', 'recepcionista'],
    };
    return permissions[feature]?.includes(user.rol) || false;
  };

  // ── LOGIN ──
  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <Activity color="#fff" size={26} />
          </div>
          <h1 className="login-title">Hospital Medac</h1>
          <p className="login-sub">Sistema de Gestión Interna</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <input className="form-control" type="text" value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} placeholder="Introduce tu usuario" required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-control" type="password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} placeholder="Introduce tu contraseña" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 8 }}>Iniciar sesión</button>
          </form>
          <div style={{ marginTop: 20 }}>
            <div className="info-block-label" style={{ marginBottom: 10 }}>Acceso rápido de demostración</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Médico Cabecera 1', username: 'MedicoCab1', rol: 'Medicina General' },
                { label: 'Médico Cabecera 2', username: 'MedicoCab2', rol: 'Medicina General' },
                { label: 'Paciente 1', username: 'Pacienteuno', rol: 'Paciente' },
                { label: 'Paciente 2', username: 'PacienteDos', rol: 'Paciente' },
                { label: 'Especialista 1', username: 'garcia', rol: 'Especialista' },
                { label: 'Especialista 2', username: 'lopez', rol: 'Especialista' },
              ].map(u => (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => setLoginData({ username: u.username, password: 'Medac123' })}
                  className="btn btn-outline btn-sm"
                  style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '8px 12px', height: 'auto' }}
                >
                  <span className="font-semibold" style={{ fontSize: 12 }}>{u.label}</span>
                  <span className="text-muted" style={{ fontSize: 11 }}>{u.rol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── NAV LINKS por rol ──
  const navLinks = {
    paciente: [
      { view: 'mis-citas', label: 'Mis Citas', icon: <Calendar size={16} /> },
      { view: 'historias', label: 'Mi Historial', icon: <FileText size={16} /> },
    ],
    doctor: [
      { view: 'consulta', label: 'Consulta', icon: <Stethoscope size={16} /> },
      { view: 'pacientes', label: 'Pacientes', icon: <Users size={16} /> },
      { view: 'hospitalizacion', label: 'Hospitalización', icon: <Bed size={16} /> },
      { view: 'medicamentos', label: 'Medicamentos', icon: <Activity size={16} /> },
    ],
    enfermero: [
      { view: 'pacientes', label: 'Pacientes', icon: <Users size={16} /> },
      { view: 'citas', label: 'Citas', icon: <Calendar size={16} /> },
      { view: 'hospitalizacion', label: 'Hospitalización', icon: <Bed size={16} /> },
      { view: 'medicamentos', label: 'Medicamentos', icon: <Activity size={16} /> },
    ],
    admin: [
      { view: 'pacientes', label: 'Pacientes', icon: <Users size={16} /> },
      { view: 'citas', label: 'Citas', icon: <Calendar size={16} /> },
      { view: 'doctores', label: 'Doctores', icon: <Stethoscope size={16} /> },
      { view: 'habitaciones', label: 'Habitaciones', icon: <Bed size={16} /> },
    ],
  };
  const links = navLinks[user?.rol] || [];

  // ── STAT CARD ──
  const StatCard = ({ title, value, color }) => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-card-val">{value ?? 0}</div>
      <div className="stat-card-lbl">{title}</div>
    </div>
  );

  // ── DASHBOARD ──
  const renderDashboard = () => {
    const isPaciente = user?.rol === 'paciente';
    return (
      <div className="space-y">
        <div className="page-header">
          <div>
            <h1 className="page-title">{isPaciente ? 'Mi Panel Personal' : 'Panel de Control'}</h1>
            <p className="page-subtitle">Rol: {user?.rol?.toUpperCase()}</p>
          </div>
        </div>

        {isPaciente ? (
          <>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              <StatCard title="Citas Pendientes" value={stats.mis_citas_pendientes} color="var(--blue)" />
              <StatCard title="Total de Citas" value={stats.total_citas} color="var(--green)" />
              <StatCard title="Historias Clínicas" value={stats.historias_clinicas} color="var(--purple)" />
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Acceso Rápido</span></div>
              <div className="card-body space-y">
                <button onClick={() => navTo('mis-citas')} className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start', gap: 10 }}>
                  <Calendar size={18} color="var(--blue)" /> <span>Mis Citas</span>
                </button>
                <button onClick={() => navTo('historias')} className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start', gap: 10 }}>
                  <FileText size={18} color="var(--purple)" /> <span>Mi Historial Médico</span>
                </button>
              </div>
            </div>
            <div className="hero-banner">
              <h1>Bienvenido a tu portal</h1>
              <p>Aquí puedes consultar tus citas, ver tu historial médico y estar al día con tu salud.</p>
            </div>
          </>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard title="Total Pacientes" value={stats.total_pacientes} color="var(--blue)" />
              <StatCard title="Citas Hoy" value={stats.citas_hoy} color="var(--green)" />
              <StatCard title="Hospitalizaciones" value={stats.hospitalizaciones_activas} color="var(--purple)" />
              <StatCard title="Hab. Libres" value={stats.habitaciones_disponibles} color="var(--orange)" />
            </div>
            <div className="grid-2">
              <div className="card">
                <div className="card-header"><span className="card-title">Acceso Rápido</span></div>
                <div className="card-body space-y">
                  {canAccess('pacientes') && <button onClick={() => navTo('pacientes')} className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start', gap: 10 }}><Users size={16} color="var(--blue)" /> Gestionar Pacientes</button>}
                  <button onClick={() => navTo('citas')} className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start', gap: 10 }}><Calendar size={16} color="var(--green)" /> Ver Citas</button>
                  {canAccess('doctores') && <button onClick={() => navTo('doctores')} className="btn btn-outline btn-block" style={{ justifyContent: 'flex-start', gap: 10 }}><Stethoscope size={16} color="var(--purple)" /> Doctores</button>}
                </div>
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title">Estadísticas</span></div>
                <div className="card-body">
                  <div className="list-item">
                    <span className="text-secondary">Citas pendientes</span>
                    <strong style={{ color: 'var(--blue)' }}>{stats.citas_pendientes || 0}</strong>
                  </div>
                  <div className="list-item">
                    <span className="text-secondary">Ocupación</span>
                    <strong style={{ color: 'var(--green)' }}>
                      {stats.hospitalizaciones_activas && stats.habitaciones_disponibles
                        ? Math.round((stats.hospitalizaciones_activas / (stats.hospitalizaciones_activas + stats.habitaciones_disponibles)) * 100)
                        : 0}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── DASHBOARD DOCTOR ──
  const renderDashboardDoctor = () => (
    <div className="space-y">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bienvenido, {user.first_name || user.username}</h1>
          <p className="page-subtitle">{user.rol === 'doctor' ? 'Panel de Trabajo · Doctor' : 'Panel de Visualización · Enfermero'}</p>
        </div>
        <div className="card" style={{ padding: '10px 16px', textAlign: 'center' }}>
          <div className="text-muted text-sm">Hora actual</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--primary)' }}>{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <div className="hero-banner">
        <div className="flex justify-between items-center">
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Mis Citas de Hoy</h1>
            <p>{obtenerFechaHoy()}</p>
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, opacity: 0.25 }}>{misCitasHoy.length}</div>
        </div>
      </div>

      {user.rol === 'doctor' && (
        <>
          <h2 className="page-title">Citas Programadas</h2>
          {misCitasHoy.length === 0 ? (
            <div className="empty-state"><Calendar className="empty-state-icon" size={40} /><h3>Sin citas para hoy</h3></div>
          ) : (
            <div className="grid-2">
              {misCitasHoy.map(cita => (
                <div key={cita.id} className="cita-card" style={{ borderLeft: `4px solid var(--${cita.estado === 'programada' ? 'blue' : cita.estado === 'en_curso' ? 'orange' : cita.estado === 'completada' ? 'green' : 'red'})` }}>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="text-muted text-sm">{new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="font-semibold" style={{ fontSize: 15, marginTop: 2 }}>{cita.paciente_info.nombre} {cita.paciente_info.apellidos}</div>
                    </div>
                    <span className={`badge ${badgeEstado(cita.estado)}`}>{cita.estado}</span>
                  </div>
                  <div className="info-block mb-8">
                    <div className="info-block-label">Motivo</div>
                    <div className="info-block-val">{cita.motivo}</div>
                  </div>
                  <div className="flex gap-8 text-sm text-secondary mb-12">
                    <span>N° Historia: {cita.paciente_info.numero_historia}</span>
                    <span>Sangre: {cita.paciente_info.tipo_sangre}</span>
                  </div>
                  {cita.estado === 'programada' && <button onClick={() => iniciarConsulta(cita)} className="btn btn-primary btn-block">Iniciar Consulta</button>}
                  {cita.estado === 'en_curso' && <button onClick={() => { setCitaEnConsulta(cita); setActiveView('consulta'); }} className="btn btn-warning btn-block">Continuar Consulta</button>}
                </div>
              ))}
            </div>
          )}
          <div className="grid-3">
            <button onClick={() => navTo('pacientes')} className="card" style={{ padding: 20, textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}>
              <Users size={28} color="var(--blue)" style={{ marginBottom: 8 }} />
              <div className="font-semibold">Mis Pacientes</div>
            </button>
            <button onClick={() => navTo('hospitalizacion')} className="card" style={{ padding: 20, textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}>
              <Bed size={28} color="var(--purple)" style={{ marginBottom: 8 }} />
              <div className="font-semibold">Hospitalizaciones</div>
            </button>
            <button onClick={() => navTo('medicamentos')} className="card" style={{ padding: 20, textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)' }}>
              <Activity size={28} color="var(--green)" style={{ marginBottom: 8 }} />
              <div className="font-semibold">Medicamentos</div>
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ── PACIENTES ──
  const renderPacientes = () => {
    if (!canAccess('pacientes')) return <div className="alert alert-danger">No tienes permisos para acceder a esta sección.</div>;
    return (
      <div className="space-y">
        <div className="page-header">
          <h1 className="page-title">Pacientes</h1>
          {canAccess('crear_paciente') && <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={16} /> Nuevo Paciente</button>}
        </div>
        <div className="card">
          <div className="card-body">
            <div className="search-wrap">
              <Search className="search-icon" size={16} />
              <input type="text" placeholder="Buscar por nombre, apellidos o N° historia..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>N° Historia</th><th>Nombre</th><th>Tipo Sangre</th><th>Teléfono</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.filter(p =>
                    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.numero_historia.includes(searchTerm)
                  ).map(paciente => (
                    <tr key={paciente.id}>
                      <td>{paciente.numero_historia}</td>
                      <td><strong>{paciente.nombre} {paciente.apellidos}</strong></td>
                      <td>{paciente.tipo_sangre}</td>
                      <td>{paciente.telefono}</td>
                      <td><span className={`badge ${paciente.activo ? 'badge-green' : 'badge-red'}`}>{paciente.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td><button onClick={() => fetchPacienteDetalle(paciente.id)} className="btn btn-primary btn-sm"><User size={13} /> Ver Perfil</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2 className="modal-title">Nuevo Paciente</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreatePaciente}>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Nombre</label><input className="form-control" value={newPaciente.nombre} onChange={e => setNewPaciente({ ...newPaciente, nombre: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Apellidos</label><input className="form-control" value={newPaciente.apellidos} onChange={e => setNewPaciente({ ...newPaciente, apellidos: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Fecha Nacimiento</label><input className="form-control" type="date" value={newPaciente.fecha_nacimiento} onChange={e => setNewPaciente({ ...newPaciente, fecha_nacimiento: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Género</label><select className="form-control" value={newPaciente.genero} onChange={e => setNewPaciente({ ...newPaciente, genero: e.target.value })}><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
                  <div className="form-group"><label className="form-label">Tipo de Sangre</label><select className="form-control" value={newPaciente.tipo_sangre} onChange={e => setNewPaciente({ ...newPaciente, tipo_sangre: e.target.value })}>{['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => <option key={t}>{t}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Teléfono</label><input className="form-control" type="tel" value={newPaciente.telefono} onChange={e => setNewPaciente({ ...newPaciente, telefono: e.target.value })} required /></div>
                </div>
                <div className="form-group"><label className="form-label">N° Historia Clínica</label><input className="form-control" value={newPaciente.numero_historia} onChange={e => setNewPaciente({ ...newPaciente, numero_historia: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Dirección</label><textarea className="form-control" rows="2" value={newPaciente.direccion} onChange={e => setNewPaciente({ ...newPaciente, direccion: e.target.value })} required /></div>
                <button type="submit" className="btn btn-primary btn-block">Crear Paciente</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── PERFIL PACIENTE ──
  const renderPerfilPaciente = () => {
    if (!selectedPaciente) return <div className="empty-state"><p>Cargando...</p></div>;
    const calcularEdad = (f) => { const h = new Date(); const n = new Date(f); let e = h.getFullYear() - n.getFullYear(); if (h.getMonth() - n.getMonth() < 0 || (h.getMonth() - n.getMonth() === 0 && h.getDate() < n.getDate())) e--; return e; };

    return (
      <div className="space-y">
        <div className="flex justify-between items-center">
          <button className="back-btn" onClick={volverALista}>← Volver a la lista</button>
          <span className={`badge ${selectedPaciente.activo ? 'badge-green' : 'badge-red'}`}>{selectedPaciente.activo ? 'Paciente Activo' : 'Paciente Inactivo'}</span>
        </div>

        <div className="hero-banner">
          <div className="flex items-center gap-12">
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', padding: 16 }}>
              <User size={40} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <h1>{selectedPaciente.nombre} {selectedPaciente.apellidos}</h1>
              <div className="hero-meta">
                <span className="hero-meta-item">N° Historia: <strong>{selectedPaciente.numero_historia}</strong></span>
                <span className="hero-meta-item">Edad: <strong>{calcularEdad(selectedPaciente.fecha_nacimiento)} años</strong></span>
                <span className="hero-meta-item">Sangre: <strong>{selectedPaciente.tipo_sangre}</strong></span>
                <span className="hero-meta-item">Género: <strong>{selectedPaciente.genero === 'M' ? 'Masculino' : 'Femenino'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="tabs">
            {[['info','Información'], ['historias', `Historial (${pacienteHistorias === null ? '!' : pacienteHistorias.length})`], ['citas', `Citas (${pacienteCitas === null ? '!' : pacienteCitas.length})`], ['alergias','Alergias']].map(([key, label]) => (
              <button key={key} className={`tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>{label}</button>
            ))}
          </div>
          <div className="tab-content">
            {activeTab === 'info' && (
              <div className="space-y">
                <div className="grid-2">
                  <div className="info-block"><div className="info-block-label">Teléfono</div><div className="info-block-val">{selectedPaciente.telefono}</div></div>
                  <div className="info-block"><div className="info-block-label">Email</div><div className="info-block-val">{selectedPaciente.email || 'No registrado'}</div></div>
                  <div className="info-block" style={{ gridColumn: '1/-1' }}><div className="info-block-label">Dirección</div><div className="info-block-val">{selectedPaciente.direccion}</div></div>
                  <div className="info-block"><div className="info-block-label">Seguro Médico</div><div className="info-block-val">{selectedPaciente.seguro_medico || 'Sin seguro'}</div></div>
                  <div className="info-block"><div className="info-block-label">Fecha de Registro</div><div className="info-block-val">{formatearFecha(selectedPaciente.fecha_registro)}</div></div>
                </div>
                <div className="grid-3">
                  <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div className="text-muted text-sm mb-4">Total Citas</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--blue)' }}>{pacienteCitas === null ? '-' : pacienteCitas.length}</div>
                  </div>
                  <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div className="text-muted text-sm mb-4">Historias Clínicas</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--purple)' }}>{pacienteHistorias === null ? '-' : pacienteHistorias.length}</div>
                  </div>
                  <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div className="text-muted text-sm mb-4">Estado</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: selectedPaciente.activo ? 'var(--green)' : 'var(--red)' }}>{selectedPaciente.activo ? 'Activo' : 'Inactivo'}</div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'historias' && (
              <div className="space-y">
                {pacienteHistorias === null ? (
                  <div className="alert alert-danger"><strong>Acceso restringido.</strong> No tienes permiso para ver el historial de este paciente.</div>
                ) : pacienteHistorias.length === 0 ? (
                  <div className="empty-state"><FileText className="empty-state-icon" size={36} /><h3>Sin historias clínicas</h3></div>
                ) : pacienteHistorias.map(historia => (
                  <div key={historia.id} className="card">
                    <div className="card-header">
                      <span className="card-title">{formatearFecha(historia.fecha)}</span>
                      <span className="text-secondary text-sm">Atendido por {historia.doctor_info?.nombre_completo || 'Doctor'}</span>
                    </div>
                    <div className="card-body space-y">
                      <div className="mr-block mr-diagnostico"><div className="mr-block-label">Diagnóstico</div><div className="mr-block-text">{historia.diagnostico}</div></div>
                      <div className="mr-block mr-sintomas"><div className="mr-block-label">Síntomas</div><div className="mr-block-text">{historia.sintomas}</div></div>
                      <div className="mr-block mr-tratamiento"><div className="mr-block-label">Tratamiento</div><div className="mr-block-text">{historia.tratamiento}</div></div>
                      {historia.examenes_solicitados && <div className="mr-block mr-examenes"><div className="mr-block-label">Exámenes</div><div className="mr-block-text">{historia.examenes_solicitados}</div></div>}
                      {historia.notas_adicionales && <div className="mr-block mr-notas"><div className="mr-block-label">Notas</div><div className="mr-block-text">{historia.notas_adicionales}</div></div>}
                      {historia.prescripciones?.length > 0 && (
                        <div>
                          <div className="info-block-label mb-8">Medicación prescrita</div>
                          {historia.prescripciones.map((p, i) => (
                            <div key={i} className="info-block mb-4">
                              <strong>{p.medicamento_info?.nombre}</strong>
                              <div className="text-secondary text-sm">Dosis: {p.dosis} · Frecuencia: {p.frecuencia} · Duración: {p.duracion}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'citas' && (
              <div className="space-y">
                {pacienteCitas === null ? (
                  <div className="alert alert-danger"><strong>Acceso restringido.</strong> No tienes permiso para ver las citas de este paciente.</div>
                ) : pacienteCitas.length === 0 ? (
                  <div className="empty-state"><Calendar className="empty-state-icon" size={36} /><h3>Sin citas registradas</h3></div>
                ) : (
                  <div className="grid-2">
                    {pacienteCitas.map(cita => (
                      <div key={cita.id} className={`cita-card ${cita.estado}`}>
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <div className="text-muted text-sm">{formatearFecha(cita.fecha_hora)}</div>
                            <div className="font-semibold mt-4">{cita.doctor_info?.nombre_completo || 'Doctor'}</div>
                          </div>
                          <span className={`badge ${badgeEstado(cita.estado)}`}>{cita.estado}</span>
                        </div>
                        <div className="text-secondary text-sm">Motivo: {cita.motivo}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'alergias' && (
              <div className="space-y">
                <div className="alert alert-danger">
                  <strong>Alergias registradas</strong>
                  <div style={{ marginTop: 6 }}>{selectedPaciente.alergias || 'Sin alergias registradas'}</div>
                </div>
                <div className="grid-2">
                  <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                    <div className="info-block-label mb-4">Tipo de Sangre</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--blue)' }}>{selectedPaciente.tipo_sangre}</div>
                  </div>
                  <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                    <div className="info-block-label mb-4">Seguro Médico</div>
                    <div style={{ fontWeight: 600, color: 'var(--purple)' }}>{selectedPaciente.seguro_medico || 'Sin seguro'}</div>
                  </div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <div className="info-block-label mb-8">Contacto de Emergencia</div>
                  <div className="text-secondary text-sm">Tel: {selectedPaciente.telefono}</div>
                  <div className="text-secondary text-sm mt-4">Dir: {selectedPaciente.direccion}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── CITAS ──
  const renderCitas = () => {
    const isMedico = user?.rol === 'doctor' || user?.rol === 'enfermero';
    return (
      <div className="space-y">
        <div className="page-header">
          <h1 className="page-title">{isMedico && user?.rol === 'doctor' ? 'Mis Citas' : 'Citas Médicas'}</h1>
          {user?.rol === 'doctor' && <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={16} /> Nueva Cita</button>}
        </div>
        {citas.length === 0 ? (
          <div className="empty-state"><Calendar className="empty-state-icon" size={40} /><h3>Sin citas</h3><p>{user?.rol === 'doctor' ? 'No tienes citas programadas.' : 'No hay citas en el sistema.'}</p></div>
        ) : (
          <div className={isMedico ? 'space-y' : 'grid-2'}>
            {citas.map(cita => (
              <div key={cita.id} className={`cita-card ${cita.estado}`} style={{ cursor: user?.rol === 'doctor' ? 'pointer' : 'default' }}
                onClick={() => { if (user?.rol === 'doctor') { setCitaEnConsulta(cita); setActiveView('consulta'); } }}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-muted text-sm">{formatearFecha(cita.fecha_hora)}</div>
                    <div className="font-semibold mt-4" style={{ fontSize: 15 }}>{cita.paciente_info.nombre} {cita.paciente_info.apellidos}</div>
                    <div className="text-secondary text-sm">N° {cita.paciente_info.numero_historia}</div>
                  </div>
                  <span className={`badge ${badgeEstado(cita.estado)}`}>{cita.estado}</span>
                </div>
                <div className="separator" />
                <div className="flex gap-12 text-sm text-secondary mb-8">
                  <span>Sangre: {cita.paciente_info.tipo_sangre}</span>
                  <span>{cita.paciente_info.telefono}</span>
                </div>
                <div className="info-block mb-8"><div className="info-block-label">Motivo</div><div className="info-block-val">{cita.motivo}</div></div>
                {user?.rol === 'doctor' && cita.estado === 'programada' && (
                  <div className="flex gap-8" onClick={e => e.stopPropagation()}>
                    <button onClick={() => cambiarEstadoCita(cita.id, 'en_curso')} className="btn btn-warning btn-sm" style={{ flex: 1 }}>Iniciar</button>
                    <button onClick={() => cambiarEstadoCita(cita.id, 'cancelada')} className="btn btn-danger btn-sm" style={{ flex: 1 }}>Cancelar</button>
                  </div>
                )}
                {user?.rol === 'doctor' && cita.estado === 'en_curso' && (
                  <div className="flex gap-8" onClick={e => e.stopPropagation()}>
                    <button onClick={() => cambiarEstadoCita(cita.id, 'completada')} className="btn btn-success btn-sm" style={{ flex: 1 }}>Completar</button>
                    <button onClick={() => cambiarEstadoCita(cita.id, 'cancelada')} className="btn btn-danger btn-sm" style={{ flex: 1 }}>Cancelar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {showModal && canAccess('crear_cita') && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header"><h2 className="modal-title">Nueva Cita</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
              <form onSubmit={handleCreateCita}>
                <div className="form-group"><label className="form-label">Paciente ID</label><input className="form-control" type="number" value={newCita.paciente} onChange={e => setNewCita({ ...newCita, paciente: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Doctor ID</label><input className="form-control" type="number" value={newCita.doctor} onChange={e => setNewCita({ ...newCita, doctor: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Fecha y Hora</label><input className="form-control" type="datetime-local" value={newCita.fecha_hora} onChange={e => setNewCita({ ...newCita, fecha_hora: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Motivo</label><textarea className="form-control" rows="3" value={newCita.motivo} onChange={e => setNewCita({ ...newCita, motivo: e.target.value })} required /></div>
                <button type="submit" className="btn btn-primary btn-block">Crear Cita</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── DOCTORES ──
  const renderDoctores = () => {
    if (!canAccess('doctores')) return <div className="alert alert-danger">No tienes permisos para acceder a esta sección.</div>;
    return (
      <div className="space-y">
        <h1 className="page-title">Doctores</h1>
        {doctores.length === 0 ? (
          <div className="empty-state"><Stethoscope className="empty-state-icon" size={40} /><h3>Sin doctores registrados</h3></div>
        ) : (
          <div className="grid-3">
            {doctores.map(doc => (
              <div key={doc.id} className="doctor-card">
                <div className="doctor-card-head">
                  <div className="doctor-avatar">{doc.usuario_info?.first_name?.[0]}{doc.usuario_info?.last_name?.[0]}</div>
                  <div>
                    <div className="doctor-name">{doc.nombre_completo}</div>
                    <div className="doctor-esp">{doc.especialidad}</div>
                  </div>
                </div>
                <div className="separator" />
                <div className="text-secondary text-sm mt-8">Licencia: {doc.licencia_medica}</div>
                <div className="text-secondary text-sm mt-4">Depto: {doc.departamento_info?.nombre || 'N/A'}</div>
                <div className="mt-8"><span className={`badge ${doc.activo ? 'badge-green' : 'badge-red'}`}>{doc.activo ? 'Activo' : 'Inactivo'}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── HABITACIONES ──
  const renderHabitaciones = () => {
    if (!canAccess('habitaciones')) return <div className="alert alert-danger">No tienes permisos.</div>;
    const capMap = { individual: 1, doble: 2, triple: 3, uci: 1, emergencia: 1 };
    return (
      <div className="space-y">
        <h1 className="page-title">Habitaciones</h1>
        {habitaciones.length === 0 ? (
          <div className="empty-state"><Bed className="empty-state-icon" size={40} /><h3>Sin habitaciones</h3></div>
        ) : (
          <div className="grid-4">
            {habitaciones.map(hab => {
              const cap = capMap[hab.tipo] || 1;
              const ocu = hab.ocupadas || 0;
              const pct = Math.min((ocu / cap) * 100, 100);
              const estado = ocu >= cap ? 'llena' : ocu > 0 ? 'parcial' : 'disponible';
              const fillColor = estado === 'llena' ? 'var(--red)' : estado === 'parcial' ? 'var(--blue)' : 'var(--green)';
              return (
                <div key={hab.id} className={`hab-card ${estado}`} onClick={() => { setSelectedHabitacion(hab); setActiveView('detalle-habitacion'); }}>
                  <div className="hab-card-num">Hab. {hab.numero}</div>
                  <div className="hab-card-tipo">{hab.tipo} · Piso {hab.piso}</div>
                  <div className="hab-progress">
                    <div className="hab-progress-fill" style={{ width: `${pct}%`, background: fillColor }} />
                  </div>
                  <div className="hab-card-info">
                    <span>{ocu}/{cap} camas</span>
                    <span className={`badge ${estado === 'llena' ? 'badge-red' : estado === 'parcial' ? 'badge-blue' : 'badge-green'}`}>{estado === 'llena' ? 'Llena' : estado === 'parcial' ? 'Parcial' : 'Libre'}</span>
                  </div>
                  <div className="text-muted text-sm mt-4" style={{ fontSize: 11 }}>{hab.departamento_info?.nombre}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── DETALLE HABITACION ──
  const renderDetalleHabitacion = () => {
    if (!selectedHabitacion) return null;
    const capMap = { individual: 1, doble: 2, triple: 3, uci: 1, emergencia: 1 };
    const cap = capMap[selectedHabitacion.tipo] || 1;
    return (
      <div className="space-y">
        <button className="back-btn" onClick={() => { setSelectedHabitacion(null); setPacientesHabitacion([]); setActiveView('habitaciones'); }}>← Volver a Habitaciones</button>
        <div className="hero-banner">
          <div className="flex justify-between items-center">
            <div>
              <h1>Habitación {selectedHabitacion.numero}</h1>
              <p>{selectedHabitacion.tipo} · Piso {selectedHabitacion.piso} · {selectedHabitacion.departamento_info?.nombre}</p>
            </div>
            <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 20px' }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{pacientesHabitacion.length}/{cap}</div>
              <div style={{ fontSize: 12, color: '#a8c0d4' }}>Pacientes</div>
            </div>
          </div>
        </div>
        {!pacientesHabitacion?.length ? (
          <div className="empty-state"><Bed className="empty-state-icon" size={40} /><h3>Sin pacientes en esta habitación</h3></div>
        ) : (
          <>
            <h2 className="page-title">Pacientes Hospitalizados ({pacientesHabitacion.length})</h2>
            <div className={pacientesHabitacion.length >= 2 ? 'grid-2' : 'space-y'}>
              {pacientesHabitacion.map((item, idx) => (
                <div key={item.id || idx} className="hosp-card">
                  <div className="hosp-card-header">
                    <div>
                      <div className="font-semibold" style={{ fontSize: 15 }}>{item.paciente.nombre} {item.paciente.apellidos}</div>
                      <div className="text-secondary text-sm">N° {item.paciente.numero_historia}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue)' }}>{item.hospitalizacion.dias}</div>
                      <div className="text-muted text-sm">días</div>
                    </div>
                  </div>
                  <div className="grid-4" style={{ gap: 8, marginBottom: 12 }}>
                    {[['Sangre', item.paciente.tipo_sangre], ['Tel.', item.paciente.telefono], ['Doctor', item.doctor.nombre], ['Esp.', item.doctor.especialidad]].map(([l, v]) => (
                      <div key={l} className="info-block"><div className="info-block-label">{l}</div><div className="info-block-val" style={{ fontSize: 12 }}>{v}</div></div>
                    ))}
                  </div>
                  {item.paciente.alergias && <div className="alert alert-danger mb-8"><strong>⚠ Alergias:</strong> {item.paciente.alergias}</div>}
                  <div className="mr-block mr-diagnostico mb-4"><div className="mr-block-label">Motivo hospitalización</div><div className="mr-block-text">{item.hospitalizacion.motivo}</div></div>
                  <div className="mr-block mr-tratamiento mb-4"><div className="mr-block-label">Diagnóstico</div><div className="mr-block-text">{item.hospitalizacion.diagnostico}</div></div>
                  {item.ultima_consulta && <>
                    <div className="mr-block mr-sintomas mb-4"><div className="mr-block-label">Tratamiento</div><div className="mr-block-text">{item.ultima_consulta.tratamiento}</div></div>
                  </>}
                  <div className="separator" />
                  <div className="text-muted text-sm">Ingreso: {formatearFecha(item.hospitalizacion.fecha_ingreso)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // ── HISTORIAS CLINICAS ──
  const renderHistoriasClinicas = () => (
    <div className="space-y">
      <h1 className="page-title">{user?.rol === 'paciente' ? 'Mi Historial Médico' : 'Historias Clínicas'}</h1>
      {historias.length === 0 ? (
        <div className="empty-state"><FileText className="empty-state-icon" size={40} /><h3>Sin historias clínicas</h3></div>
      ) : historias.map(h => (
        <div key={h.id} className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{h.paciente_info ? `${h.paciente_info.nombre} ${h.paciente_info.apellidos}` : 'Paciente'}</div>
              <div className="text-secondary text-sm">{formatearFecha(h.fecha)}</div>
            </div>
            <div className="text-right"><div className="text-muted text-sm">Atendido por</div><div className="font-semibold">{h.doctor_info?.nombre_completo || 'Doctor'}</div></div>
          </div>
          <div className="card-body space-y">
            <div className="mr-block mr-diagnostico"><div className="mr-block-label">Diagnóstico</div><div className="mr-block-text">{h.diagnostico}</div></div>
            <div className="mr-block mr-sintomas"><div className="mr-block-label">Síntomas</div><div className="mr-block-text">{h.sintomas}</div></div>
            <div className="mr-block mr-tratamiento"><div className="mr-block-label">Tratamiento</div><div className="mr-block-text">{h.tratamiento}</div></div>
            {h.examenes_solicitados && <div className="mr-block mr-examenes"><div className="mr-block-label">Exámenes</div><div className="mr-block-text">{h.examenes_solicitados}</div></div>}
            {h.notas_adicionales && <div className="mr-block mr-notas"><div className="mr-block-label">Notas</div><div className="mr-block-text">{h.notas_adicionales}</div></div>}
          </div>
        </div>
      ))}
    </div>
  );

  // ── MEDICAMENTOS ──
  const renderMedicamentos = () => (
    <div className="space-y">
      <h1 className="page-title">Medicamentos Disponibles</h1>
      {medicamentosDisponibles.length === 0 ? (
        <div className="empty-state"><Activity className="empty-state-icon" size={40} /><h3>Sin medicamentos</h3></div>
      ) : (
        <div className="grid-3">
          {medicamentosDisponibles.map(m => (
            <div key={m.id} className="med-card">
              <div className="med-card-header">
                <div><div className="med-name">{m.nombre}</div><div className="med-pres">{m.presentacion}</div></div>
                <span className={`badge ${m.stock > 20 ? 'badge-green' : m.stock > 10 ? 'badge-yellow' : 'badge-red'}`}>Stock: {m.stock}</span>
              </div>
              <div className="separator" />
              <div className="text-secondary text-sm">P. Activo: {m.principio_activo}</div>
              {m.precio > 0 && <div className="text-secondary text-sm mt-4">Precio: {m.precio}€</div>}
              {m.descripcion && <div className="text-muted text-sm mt-4" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{m.descripcion}</div>}
              <div className="mt-8"><span className={`badge ${m.activo ? 'badge-blue' : 'badge-gray'}`}>{m.activo ? 'Disponible' : 'Descontinuado'}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── HOSPITALIZACION ──
  const renderHospitalizacion = () => (
    <div className="space-y">
      <h1 className="page-title">Gestión de Hospitalizaciones</h1>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <StatCard title="Total" value={hospitalizacionesActivas.length} color="var(--blue)" />
        <StatCard title="Activas" value={hospitalizacionesActivas.filter(h => h.estado === 'activa').length} color="var(--green)" />
        <StatCard title="Altas realizadas" value={hospitalizacionesActivas.filter(h => h.estado === 'alta').length} color="var(--purple)" />
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Hospitalizaciones Activas</h2>
      {hospitalizacionesActivas.filter(h => h.estado === 'activa').length === 0 ? (
        <div className="empty-state"><Bed className="empty-state-icon" size={40} /><h3>Sin pacientes hospitalizados</h3></div>
      ) : hospitalizacionesActivas.filter(h => h.estado === 'activa').map(h => (
        <div key={h.id} className="hosp-card">
          <div className="hosp-card-header">
            <div>
              <div className="font-semibold" style={{ fontSize: 15 }}>{h.paciente_info.nombre} {h.paciente_info.apellidos}</div>
              <div className="text-secondary text-sm">Hab. {h.habitacion_info.numero} · Piso {h.habitacion_info.piso}</div>
            </div>
            <span className="badge badge-blue">En tratamiento</span>
          </div>
          <div className="grid-4" style={{ gap: 8, marginBottom: 12 }}>
            {[['Sangre', h.paciente_info.tipo_sangre], ['Ingreso', formatearFecha(h.fecha_ingreso)], ['Días', h.dias_hospitalizacion], ['Doctor', h.doctor_info?.nombre_completo || 'N/A']].map(([l, v]) => (
              <div key={l} className="info-block"><div className="info-block-label">{l}</div><div className="info-block-val" style={{ fontSize: 12 }}>{v}</div></div>
            ))}
          </div>
          <div className="mr-block mr-diagnostico mb-4"><div className="mr-block-label">Motivo</div><div className="mr-block-text">{h.motivo}</div></div>
          <div className="mr-block mr-sintomas"><div className="mr-block-label">Diagnóstico</div><div className="mr-block-text">{h.diagnostico}</div></div>
          {user.rol === 'doctor' && (
            <div className="mt-12"><button onClick={() => handleDarAlta(h.id)} className="btn btn-success btn-block">Dar de Alta</button></div>
          )}
        </div>
      ))}
    </div>
  );

  // ── CONSULTA ──
  const renderConsulta = () => {
    if (!citaEnConsulta) return <div className="alert alert-danger">No hay consulta en curso.</div>;
    return (
      <div className="space-y">
        <div className="flex justify-between items-center">
          <button className="back-btn" onClick={() => { setCitaEnConsulta(null); setShowFormConsulta(false); setActiveView('dashboard'); }}>← Volver</button>
          <h1 className="page-title">Consulta en Curso</h1>
          <div />
        </div>
        <div className="hero-banner">
          <div className="flex items-center gap-12">
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', padding: 14 }}><User size={32} color="#fff" /></div>
            <div>
              <h1>{citaEnConsulta.paciente_info.nombre} {citaEnConsulta.paciente_info.apellidos}</h1>
              <div className="hero-meta">
                <span className="hero-meta-item">N° Historia: <strong>{citaEnConsulta.paciente_info.numero_historia}</strong></span>
                <span className="hero-meta-item">Sangre: <strong>{citaEnConsulta.paciente_info.tipo_sangre}</strong></span>
              </div>
            </div>
          </div>
        </div>
        {citaEnConsulta.paciente_info.alergias && <div className="alert alert-danger"><strong>⚠ ALERGIAS REGISTRADAS:</strong> {citaEnConsulta.paciente_info.alergias}</div>}

        {!citaEnConsulta.historia_id ? (
          <div className="card">
            <div className="card-header"><span className="card-title">Registrar Nueva Consulta</span></div>
            <div className="card-body space-y">
              {[['sintomas','Síntomas','Describe los síntomas...'], ['diagnostico','Diagnóstico','Diagnóstico del paciente...'], ['tratamiento','Tratamiento','Tratamiento recomendado...'], ['examenes_solicitados','Exámenes Solicitados','Pruebas a realizar...'], ['notas_adicionales','Notas Adicionales','Anotaciones...']].map(([key, lbl, ph]) => (
                <div key={key} className="form-group">
                  <label className="form-label">{lbl}</label>
                  <textarea className="form-control" rows={key === 'sintomas' || key === 'diagnostico' ? 3 : 2} placeholder={ph} value={nuevaHistoria[key]} onChange={e => setNuevaHistoria({ ...nuevaHistoria, [key]: e.target.value })} />
                </div>
              ))}
              <button onClick={guardarHistoriaClinica} className="btn btn-primary btn-block">Guardar Historia Clínica</button>
            </div>
          </div>
        ) : (
          <div className="alert alert-success">✓ Historia clínica guardada correctamente.
            <button onClick={() => setShowFormPrescripcion(true)} className="btn btn-success btn-sm" style={{ marginLeft: 12 }}>Recetar Medicamentos</button>
          </div>
        )}

        {citaEnConsulta.historia_id && showFormPrescripcion && (
          <div className="card">
            <div className="card-header"><span className="card-title">Recetar Medicamento</span></div>
            <div className="card-body space-y">
              {alertaMedicamento && <div className={`alert ${alertaMedicamento.alerta ? 'alert-danger' : 'alert-success'}`}>{alertaMedicamento.mensaje}</div>}
              <div className="form-group">
                <label className="form-label">Medicamento</label>
                <select className="form-control" value={nuevaPrescripcion.medicamento_id} onChange={e => { setNuevaPrescripcion({ ...nuevaPrescripcion, medicamento_id: e.target.value }); verificarAlergias(e.target.value); }} required>
                  <option value="">-- Selecciona --</option>
                  {medicamentosDisponibles.map(m => <option key={m.id} value={m.id}>{m.nombre} — {m.presentacion}</option>)}
                </select>
              </div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Dosis</label><input className="form-control" placeholder="Ej: 500mg" value={nuevaPrescripcion.dosis} onChange={e => setNuevaPrescripcion({ ...nuevaPrescripcion, dosis: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Frecuencia</label><input className="form-control" placeholder="Ej: 3 veces al día" value={nuevaPrescripcion.frecuencia} onChange={e => setNuevaPrescripcion({ ...nuevaPrescripcion, frecuencia: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Duración</label><input className="form-control" placeholder="Ej: 7 días" value={nuevaPrescripcion.duracion} onChange={e => setNuevaPrescripcion({ ...nuevaPrescripcion, duracion: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Instrucciones</label><textarea className="form-control" rows="2" value={nuevaPrescripcion.instrucciones} onChange={e => setNuevaPrescripcion({ ...nuevaPrescripcion, instrucciones: e.target.value })} /></div>
              <div className="flex gap-8">
                <button onClick={guardarPrescripcion} className="btn btn-success" style={{ flex: 1 }}>Recetar</button>
                <button onClick={() => { setNuevaPrescripcion({ medicamento_id: '', dosis: '', frecuencia: '', duracion: '', instrucciones: '' }); setAlertaMedicamento(null); }} className="btn btn-outline" style={{ flex: 1 }}>Limpiar</button>
              </div>
            </div>
          </div>
        )}

        {citaEnConsulta.historia_id && (
          <div className="space-y">

            {/* Hospitalizar */}
            {!showFormHospitalizacion ? (
              <button
                onClick={() => { setShowFormHospitalizacion(true); fetchHabitacionesDisponibles(); }}
                className="btn btn-success btn-block"
              >
                Hospitalizar Paciente
              </button>
            ) : (
              <div className="card">
                <div className="card-header"><span className="card-title">Hospitalizar Paciente</span></div>
                <div className="card-body">
                  <form onSubmit={handleHospitalizar} className="space-y">
                    <div className="form-group">
                      <label className="form-label">Habitación disponible</label>
                      <select className="form-control" value={nuevaHospitalizacion.habitacion} onChange={e => setNuevaHospitalizacion({ ...nuevaHospitalizacion, habitacion: e.target.value })} required>
                        <option value="">-- Selecciona habitación --</option>
                        {habitacionesDisponibles.map(h => (
                          <option key={h.id} value={h.id}>Hab. {h.numero} · {h.tipo} · Piso {h.piso}</option>
                        ))}
                      </select>
                      {habitacionesDisponibles.length === 0 && (
                        <div className="alert alert-warning" style={{ marginTop: 8 }}>No hay habitaciones disponibles en tu departamento.</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Motivo de hospitalización</label>
                      <textarea className="form-control" rows="2" value={nuevaHospitalizacion.motivo} onChange={e => setNuevaHospitalizacion({ ...nuevaHospitalizacion, motivo: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Diagnóstico</label>
                      <textarea className="form-control" rows="2" value={nuevaHospitalizacion.diagnostico} onChange={e => setNuevaHospitalizacion({ ...nuevaHospitalizacion, diagnostico: e.target.value })} required />
                    </div>
                    <div className="flex gap-8">
                      <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Confirmar</button>
                      <button type="button" onClick={() => setShowFormHospitalizacion(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancelar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Derivar */}
            {!showFormDerivacion ? (
              <button onClick={() => setShowFormDerivacion(true)} className="btn btn-purple btn-block">Derivar a Especialista</button>
            ) : (
              <div className="card">
                <div className="card-header"><span className="card-title">Derivar a Especialista</span></div>
                <div className="card-body">
                  <form onSubmit={handleDerivar} className="space-y">
                    <div className="form-group">
                      <label className="form-label">Departamento</label>
                      <select className="form-control" value={nuevaDerivacion.departamento} onChange={e => setNuevaDerivacion({ ...nuevaDerivacion, departamento: e.target.value })} required>
                        <option value="">-- Selecciona departamento --</option>
                        {departamentos.filter(d => d.nombre !== 'Medicina General' && d.activo).map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Fecha y Hora</label><input className="form-control" type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={nuevaDerivacion.fecha_hora} onChange={e => setNuevaDerivacion({ ...nuevaDerivacion, fecha_hora: e.target.value })} required /></div>
                    <div className="form-group"><label className="form-label">Motivo de la derivación</label><textarea className="form-control" rows="3" value={nuevaDerivacion.motivo} onChange={e => setNuevaDerivacion({ ...nuevaDerivacion, motivo: e.target.value })} required /></div>
                    <div className="flex gap-8">
                      <button type="submit" className="btn btn-purple" style={{ flex: 1 }}>Confirmar Derivación</button>
                      <button type="button" onClick={() => setShowFormDerivacion(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancelar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <button onClick={completarConsulta} className="btn btn-danger btn-block">Finalizar Consulta</button>
          </div>
        )}
      </div>
    );
  };

  // ── MIS CITAS PACIENTE ──
  const renderMisCitas = () => (
    <div className="space-y">
      <div className="page-header">
        <h1 className="page-title">Mis Citas</h1>
        <button onClick={() => setShowModalCitaPaciente(true)} className="btn btn-primary"><Plus size={16} /> Solicitar Cita</button>
      </div>
      {misCitas.length === 0 ? (
        <div className="empty-state"><Calendar className="empty-state-icon" size={40} /><h3>Sin citas registradas</h3><p>Solicita una cita con tu médico de cabecera.</p></div>
      ) : (
        <div className="grid-2">
          {misCitas.map(cita => (
            <div key={cita.id} className={`cita-card ${cita.estado}`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-muted text-sm">{formatearFecha(cita.fecha_hora)}</div>
                  <div className="font-semibold mt-4">{cita.doctor_info?.nombre_completo || 'Médico de cabecera'}</div>
                  <div className="text-secondary text-sm">{cita.doctor_info?.departamento_info?.nombre}</div>
                </div>
                <span className={`badge ${badgeEstado(cita.estado)}`}>{cita.estado}</span>
              </div>
              <div className="info-block mb-8"><div className="info-block-label">Motivo</div><div className="info-block-val">{cita.motivo}</div></div>
              {cita.estado === 'programada' && <button onClick={() => handleCancelarCitaPaciente(cita.id)} className="btn btn-danger btn-block btn-sm">Cancelar cita</button>}
            </div>
          ))}
        </div>
      )}
      {showModalCitaPaciente && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2 className="modal-title">Solicitar Cita</h2><button className="modal-close" onClick={() => setShowModalCitaPaciente(false)}><X size={20} /></button></div>
            <div className="alert alert-info mb-12">La cita se asignará automáticamente a tu médico de cabecera.</div>
            <form onSubmit={handleSolicitarCita}>
              <div className="form-group"><label className="form-label">Fecha y Hora</label><input className="form-control" type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={nuevaCitaPaciente.fecha_hora} onChange={e => setNuevaCitaPaciente({ ...nuevaCitaPaciente, fecha_hora: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Motivo de la consulta</label><textarea className="form-control" rows="3" placeholder="Describe brevemente el motivo..." value={nuevaCitaPaciente.motivo} onChange={e => setNuevaCitaPaciente({ ...nuevaCitaPaciente, motivo: e.target.value })} required /></div>
              <button type="submit" className="btn btn-primary btn-block">Solicitar Cita</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // ── RENDER PRINCIPAL ──
  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo"><Activity size={16} color="#fff" /></div>
          <span className="navbar-title">Hospital Medac</span>
        </div>
        <div className="navbar-links">
          <button className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => navTo('dashboard')}><Home size={15} /> Dashboard</button>
          {links.map(l => (
            <button key={l.view} className={`nav-link ${activeView === l.view ? 'active' : ''}`} onClick={() => navTo(l.view)}>{l.icon} {l.label}</button>
          ))}
        </div>
        <div className="navbar-right">
          <div className="nav-user"><User size={13} /> {user?.username} · {user?.rol}</div>
          <button className="btn-logout" onClick={handleLogout}><LogOut size={13} /> Salir</button>
          <button className="nav-hamburger" onClick={() => setNavOpen(o => !o)}><Menu size={22} /></button>
        </div>
      </nav>

      {navOpen && (
        <div className="nav-mobile-menu open">
          <button className={`nav-mobile-link ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => navTo('dashboard')}><Home size={16} /> Dashboard</button>
          {links.map(l => (
            <button key={l.view} className={`nav-mobile-link ${activeView === l.view ? 'active' : ''}`} onClick={() => navTo(l.view)}>{l.icon} {l.label}</button>
          ))}
          <div className="nav-mobile-divider" />
          <button className="nav-mobile-link" style={{ color: '#ffaaaa' }} onClick={handleLogout}><LogOut size={16} /> Cerrar Sesión</button>
        </div>
      )}

      <main className="main-content">
        {user?.rol === 'doctor' || user?.rol === 'enfermero' ? (
          <>
            {activeView === 'dashboard' && renderDashboardDoctor()}
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
            {activeView === 'mis-citas' && renderMisCitas()}
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
