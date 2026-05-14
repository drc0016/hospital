# hospital/views/medicamentos.py
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Medicamento
from ..serializers import MedicamentoSerializer
from ..permissions import IsEnfermeroOrAbove


class MedicamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar medicamentos"""
    queryset = Medicamento.objects.all()
    serializer_class = MedicamentoSerializer
    permission_classes = [IsAuthenticated, IsEnfermeroOrAbove]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'principio_activo']
    filterset_fields = ['activo']
    
    @action(detail=False, methods=['get'])
    def bajo_stock(self, request):
        """Obtener medicamentos con stock bajo"""
        minimo = int(request.query_params.get('minimo', 10))
        medicamentos = Medicamento.objects.filter(stock__lte=minimo, activo=True)
        serializer = self.get_serializer(medicamentos, many=True)
        return Response(serializer.data)