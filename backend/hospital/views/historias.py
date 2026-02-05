# hospital/views/historias.py
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import HistoriaClinica
from ..serializers import HistoriaClinicaSerializer
from ..permissions import IsDoctorOrAdmin


class HistoriaClinicaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar historias clínicas"""
    queryset = HistoriaClinica.objects.select_related('paciente', 'doctor').all()
    serializer_class = HistoriaClinicaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['paciente', 'doctor']
    ordering_fields = ['fecha']
    
    def get_queryset(self):
        """Filtrar historias según el rol"""
        user = self.request.user
        
        # Admin, Doctor, Enfermero ven todo
        if user.rol in ['admin', 'doctor', 'enfermero']:
            return HistoriaClinica.objects.all()
        
        # Paciente solo ve su propio historial
        if user.rol == 'paciente' and user.paciente_asociado:
            return HistoriaClinica.objects.filter(paciente=user.paciente_asociado)
        
        return HistoriaClinica.objects.none()
    
    def get_permissions(self):
        """Solo doctores pueden crear/editar historias clínicas"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsDoctorOrAdmin()]
        return [IsAuthenticated()]