
# hospital/views/hospitalizaciones.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime

from ..models import Hospitalizacion, Doctor
from ..serializers import HospitalizacionSerializer
from ..permissions import IsDoctorOrAdmin


class HospitalizacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar hospitalizaciones"""
    queryset = Hospitalizacion.objects.select_related(
        'paciente', 'habitacion', 'doctor_responsable'
    ).all()
    serializer_class = HospitalizacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'paciente', 'doctor_responsable']
    
    def get_queryset(self):
        """Filtrar hospitalizaciones según el rol"""
        user = self.request.user
        print(f"🔍 Usuario: {user.username}, Rol: {user.rol}")
        
        # Admin ve TODO
        if user.rol == 'admin':
            return Hospitalizacion.objects.all()
        
        # Doctor ve SOLO su departamento
        if user.rol == 'doctor':
            try:
                doctor = Doctor.objects.get(usuario=user)
                print(f"👨‍⚕️ Doctor encontrado: Dr. {doctor.usuario.get_full_name() or doctor.usuario.username}")
                print(f"🏥 Departamento: {doctor.departamento}")
                
                hospitalizaciones = Hospitalizacion.objects.filter(
                    habitacion__departamento=doctor.departamento,
                    estado='activa'
                ).select_related('paciente', 'habitacion', 'doctor_responsable')
                
                print(f"📊 Hospitalizaciones encontradas: {hospitalizaciones.count()}")
                return hospitalizaciones
                
            except Doctor.DoesNotExist:
                print(f"❌ Doctor no encontrado")
                return Hospitalizacion.objects.none()
        
        # Enfermero ve todo
        if user.rol == 'enfermero':
            return Hospitalizacion.objects.all()
        
        return Hospitalizacion.objects.none()
    
    def get_permissions(self):
        """Solo doctores pueden gestionar hospitalizaciones"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsDoctorOrAdmin()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Marcar habitación como ocupada al crear hospitalización"""
        hospitalizacion = serializer.save()
        habitacion = hospitalizacion.habitacion
        habitacion.ocupada = True
        habitacion.save()
    
    @action(detail=True, methods=['post'])
    def dar_alta(self, request, pk=None):
        """Dar de alta a un paciente hospitalizado"""
        if request.user.rol not in ['doctor', 'admin']:
            return Response(
                {'error': 'No tiene permiso para dar altas'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        hospitalizacion = self.get_object()
        hospitalizacion.fecha_alta = datetime.now()
        hospitalizacion.estado = 'alta'
        hospitalizacion.save()
        
        # Liberar habitación
        habitacion = hospitalizacion.habitacion
        habitacion.ocupada = False
        habitacion.save()
        
        return Response({'status': 'Alta registrada'})