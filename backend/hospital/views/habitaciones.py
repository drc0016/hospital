# hospital/views/habitaciones.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime

from ..models import Habitacion, Hospitalizacion, HistoriaClinica
from ..serializers import HabitacionSerializer
from ..permissions import IsEnfermeroOrAbove


class HabitacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar habitaciones"""
    queryset = Habitacion.objects.select_related('departamento').all()
    serializer_class = HabitacionSerializer
    permission_classes = [IsAuthenticated, IsEnfermeroOrAbove]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo', 'piso', 'departamento', 'activa']
    
    def get_queryset(self):
        return Habitacion.objects.filter(activa=True).exclude(tipo='consulta')
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Listar habitaciones disponibles"""
        habitaciones = Habitacion.objects.filter(ocupada=False, activa=True)
        serializer = self.get_serializer(habitaciones, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def consultas(self, request):
        """Listar solo habitaciones de tipo consulta"""
        consultas = Habitacion.objects.filter(tipo='consulta', activa=True)
        serializer = self.get_serializer(consultas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def pacientes(self, request, pk=None):
        """Obtener pacientes hospitalizados en esta habitación"""
        habitacion = self.get_object()
        hospitalizaciones = Hospitalizacion.objects.filter(
            habitacion=habitacion,
            estado='activa'
        ).select_related('paciente', 'doctor_responsable')
        
        data = []
        for hosp in hospitalizaciones:
            # Obtener última historia clínica del paciente
            ultima_historia = HistoriaClinica.objects.filter(
                paciente=hosp.paciente
            ).order_by('-fecha').first()
            
            data.append({
                'id': hosp.id,
                'paciente': {
                    'id': hosp.paciente.id,
                    'nombre': hosp.paciente.nombre,
                    'apellidos': hosp.paciente.apellidos,
                    'numero_historia': hosp.paciente.numero_historia,
                    'tipo_sangre': hosp.paciente.tipo_sangre,
                    'alergias': hosp.paciente.alergias,
                    'telefono': hosp.paciente.telefono,
                },
                'hospitalizacion': {
                    'motivo': hosp.motivo,
                    'diagnostico': hosp.diagnostico,
                    'fecha_ingreso': hosp.fecha_ingreso,
                    'dias': (datetime.now().replace(tzinfo=None) - hosp.fecha_ingreso.replace(tzinfo=None)).days,
                },
                'ultima_consulta': {
                    'diagnostico': ultima_historia.diagnostico if ultima_historia else 'N/A',
                    'sintomas': ultima_historia.sintomas if ultima_historia else 'N/A',
                    'tratamiento': ultima_historia.tratamiento if ultima_historia else 'N/A',
                    'fecha': ultima_historia.fecha if ultima_historia else None,
                } if ultima_historia else None,
                'doctor': {
                    'nombre': hosp.doctor_responsable.usuario.get_full_name(),
                    'especialidad': hosp.doctor_responsable.especialidad,
                }
            })
        
        return Response(data)