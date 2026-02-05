
# hospital/views/citas.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime

from ..models import Cita, Doctor
from ..serializers import CitaSerializer
from ..permissions import IsDoctorOrAdmin


class CitaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar citas médicas"""
    queryset = Cita.objects.select_related('paciente', 'doctor').all()
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['estado', 'doctor', 'paciente']
    ordering_fields = ['fecha_hora']
    
    def get_queryset(self):
        """Filtrar citas según el rol"""
        user = self.request.user
        
        # Admin ve todo
        if user.rol == 'admin':
            return Cita.objects.all()
        
        # Doctor solo ve sus citas
        if user.rol == 'doctor':
            doctor = Doctor.objects.filter(usuario=user).first()
            if doctor:
                return Cita.objects.filter(doctor=doctor)
            return Cita.objects.none()
        
        # Enfermero ve todas
        if user.rol == 'enfermero':
            return Cita.objects.all()
        
        # Paciente ve sus citas
        if user.rol == 'paciente' and user.paciente_asociado:
            return Cita.objects.filter(paciente=user.paciente_asociado)
        
        return Cita.objects.none()
    
    def get_permissions(self):
        """Solo admin y doctor pueden crear citas"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsDoctorOrAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def mis_citas(self, request):
        """Mis citas (solo para doctores)"""
        if request.user.rol != 'doctor':
            return Response(
                {'error': 'Solo doctores pueden usar este endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        doctor = Doctor.objects.filter(usuario=request.user).first()
        if not doctor:
            return Response([])
        
        fecha = request.query_params.get('fecha', datetime.now().date())
        citas = Cita.objects.filter(
            doctor=doctor,
            fecha_hora__date=fecha
        ).order_by('fecha_hora')
        serializer = CitaSerializer(citas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar el estado de una cita"""
        if request.user.rol not in ['doctor', 'admin']:
            return Response(
                {'error': 'No tiene permiso para cambiar el estado'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cita = self.get_object()
        nuevo_estado = request.data.get('estado')
        if nuevo_estado in dict(Cita.ESTADOS).keys():
            cita.estado = nuevo_estado
            cita.save()
            return Response({'status': 'Estado actualizado'})
        return Response(
            {'error': 'Estado inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def hoy(self, request):
        """Obtener citas de hoy"""
        hoy = datetime.now().date()
        citas = self.get_queryset().filter(fecha_hora__date=hoy)
        serializer = self.get_serializer(citas, many=True)
        return Response(serializer.data)