# hospital/views/dashboard.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime

from ..models import Paciente, Cita, Hospitalizacion, Habitacion, HistoriaClinica


class DashboardViewSet(viewsets.ViewSet):
    """ViewSet para estadísticas del dashboard"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas según el rol del usuario"""
        user = request.user
        hoy = datetime.now().date()
        
        # Estadísticas según el rol
        if user.rol in ['admin', 'doctor', 'enfermero', 'recepcionista']:
            # Ver estadísticas generales
            stats = {
                'total_pacientes': Paciente.objects.filter(activo=True).count(),
                'citas_hoy': Cita.objects.filter(fecha_hora__date=hoy).count(),
                'hospitalizaciones_activas': Hospitalizacion.objects.filter(estado='activa').count(),
                'habitaciones_disponibles': Habitacion.objects.filter(ocupada=False, activa=True).count(),
                'citas_pendientes': Cita.objects.filter(
                    estado='programada',
                    fecha_hora__gte=datetime.now()
                ).count(),
            }
        elif user.rol == 'paciente' and user.paciente_asociado:
            # Estadísticas personales del paciente
            stats = {
                'mis_citas_pendientes': Cita.objects.filter(
                    paciente=user.paciente_asociado,
                    estado='programada',
                    fecha_hora__gte=datetime.now()
                ).count(),
                'total_citas': Cita.objects.filter(
                    paciente=user.paciente_asociado
                ).count(),
                'historias_clinicas': HistoriaClinica.objects.filter(
                    paciente=user.paciente_asociado
                ).count(),
            }
        else:
            stats = {}
        
        return Response(stats)