# hospital/views/pacientes.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Paciente, Doctor, Cita, HistoriaClinica
from ..serializers import PacienteSerializer, HistoriaClinicaSerializer, CitaSerializer


class PacienteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar pacientes"""
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_sangre', 'genero', 'activo']
    search_fields = ['nombre', 'apellidos', 'numero_historia', 'telefono']
    ordering_fields = ['fecha_registro', 'nombre']
    
    def get_queryset(self):
        """Filtrar datos según el rol del usuario"""
        user = self.request.user
        
        # Admin ve todo
        if user.rol == 'admin' or user.rol == 'doctor':
            return Paciente.objects.all()
        
        # Doctor y Enfermero ven pacientes de su departamento
        if user.rol in ['enfermero']:
            return Paciente.objects.all()
        
        # Paciente solo ve sus propios datos
        if user.rol == 'paciente' and user.paciente_asociado:
            return Paciente.objects.filter(id=user.paciente_asociado.id)
        
        return Paciente.objects.none()
    
    @action(detail=True, methods=['get'])
    def historia_clinica(self, request, pk=None):
        """Obtener historia clínica de un paciente"""
        paciente = self.get_object()
        
        # Verificar permisos
        user = request.user
        if user.rol == 'paciente':
            if not user.paciente_asociado or user.paciente_asociado.id != paciente.id:
                return Response(
                    {'error': 'No tiene permiso para ver este historial'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.rol == 'doctor':
            # Doctor solo puede ver historias de sus pacientes
            doctor = Doctor.objects.filter(usuario=user).first()
            if not doctor:
                return Response(
                    {'error': 'No es un doctor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            # Verificar que tiene cita con este paciente
            tiene_cita = Cita.objects.filter(doctor=doctor, paciente=paciente).exists()
            if not tiene_cita:
                return Response(
                    {'error': 'No tiene citas con este paciente'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        historias = HistoriaClinica.objects.filter(paciente=paciente)
        serializer = HistoriaClinicaSerializer(historias, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def citas(self, request, pk=None):
        """Obtener citas de un paciente"""
        paciente = self.get_object()
        
        # Verificar permisos
        user = request.user
        if user.rol == 'paciente':
            if not user.paciente_asociado or user.paciente_asociado.id != paciente.id:
                return Response(
                    {'error': 'No tiene permiso para ver estas citas'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.rol == 'doctor':
            # Doctor solo puede ver citas de sus pacientes
            doctor = Doctor.objects.filter(usuario=user).first()
            if not doctor:
                return Response(
                    {'error': 'No es un doctor'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            tiene_cita = Cita.objects.filter(doctor=doctor, paciente=paciente).exists()
            if not tiene_cita:
                return Response(
                    {'error': 'No tiene citas con este paciente'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        citas = Cita.objects.filter(paciente=paciente)
        serializer = CitaSerializer(citas, many=True)
        return Response(serializer.data)