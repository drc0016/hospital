# hospital/views/doctores.py
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime

from ..models import Doctor, Cita
from ..serializers import DoctorSerializer, CitaSerializer
from ..permissions import IsEnfermeroOrAbove


class DoctorViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar doctores"""
    queryset = Doctor.objects.select_related('usuario', 'departamento').all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated, IsEnfermeroOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['especialidad', 'departamento', 'activo']
    search_fields = ['usuario__first_name', 'usuario__last_name', 'especialidad']
    
    @action(detail=True, methods=['get'])
    def agenda(self, request, pk=None):
        """Obtener agenda de un doctor para una fecha específica"""
        doctor = self.get_object()
        fecha = request.query_params.get('fecha', datetime.now().date())
        citas = Cita.objects.filter(
            doctor=doctor,
            fecha_hora__date=fecha
        ).order_by('fecha_hora')
        serializer = CitaSerializer(citas, many=True)
        return Respons