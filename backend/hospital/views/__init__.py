# hospital/views/__init__.py
"""
Importar todos los ViewSets para que sean accesibles desde hospital.views
"""

from .pacientes import PacienteViewSet
from .citas import CitaViewSet
from .doctores import DoctorViewSet
from .habitaciones import HabitacionViewSet
from .hospitalizaciones import HospitalizacionViewSet
from .historias import HistoriaClinicaViewSet
from .medicamentos import MedicamentoViewSet
from .prescripciones import PrescripcionViewSet
from .dashboard import DashboardViewSet
from .auth import obtener_usuario_actual

__all__ = [
    'PacienteViewSet',
    'CitaViewSet',
    'DoctorViewSet',
    'HabitacionViewSet',
    'HospitalizacionViewSet',
    'HistoriaClinicaViewSet',
    'MedicamentoViewSet',
    'PrescripcionViewSet',
    'DashboardViewSet',
    'obtener_usuario_actual',
]