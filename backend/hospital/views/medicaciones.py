# hospital/views/medicaciones.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import MedicacionHospitalaria, Doctor
from ..serializers import MedicacionHospitalariaSerializer
from ..permissions import IsDoctorOrAdmin


class MedicacionHospitalariaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar medicaciones durante hospitalización"""
    queryset = MedicacionHospitalaria.objects.all()
    serializer_class = MedicacionHospitalariaSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsDoctorOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        hospitalizacion_id = self.request.query_params.get('hospitalizacion')
        if hospitalizacion_id:
            return MedicacionHospitalaria.objects.filter(
                hospitalizacion__id=hospitalizacion_id,
                activo=True
            )
        return MedicacionHospitalaria.objects.filter(activo=True)

    def perform_create(self, serializer):
        doctor = Doctor.objects.filter(usuario=self.request.user).first()
        serializer.save(doctor=doctor)