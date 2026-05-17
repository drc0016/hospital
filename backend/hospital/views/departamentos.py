# hospital/views/departamentos.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import Departamento
from ..serializers import DepartamentoSerializer


class DepartamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar departamentos"""
    queryset = Departamento.objects.filter(activo=True)
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]