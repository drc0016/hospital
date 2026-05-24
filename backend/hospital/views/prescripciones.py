# hospital/views/prescripciones.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import Prescripcion, HistoriaClinica, Medicamento
from ..serializers import PrescripcionSerializer
from ..permissions import IsDoctorOnly


class PrescripcionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar prescripciones médicas"""
    queryset = Prescripcion.objects.all()
    serializer_class = PrescripcionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Solo doctores pueden crear prescripciones"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsDoctorOnly()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def crear_con_alerta(self, request):
        """Crear prescripción con alerta de alergias"""
        if request.user.rol != 'doctor':
            return Response(
                {'error': 'Solo doctores pueden recetar'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        historia_id = request.data.get('historia_clinica_id')
        medicamento_id = request.data.get('medicamento_id')
        
        try:
            historia = HistoriaClinica.objects.get(id=historia_id)
            medicamento = Medicamento.objects.get(id=medicamento_id)
            
            # Verificar alergias
            alergias_lista = [
                alergia.strip() 
                for alergia in historia.paciente.alergias.split(',') 
                if historia.paciente.alergias
            ]
            medicamento_nombre = medicamento.nombre.lower()
            
            alerta = False
            for alergia in alergias_lista:
                if alergia.lower() in medicamento_nombre or medicamento_nombre in alergia.lower():
                    alerta = True
                    break
            
            return Response({
                'alerta': alerta,
                'mensaje': f'⚠️ El paciente es alérgico a: {historia.paciente.alergias}' if alerta else 'Sin alergias conocidas',
                'puede_continuar': not alerta
            })
        except:
            return Response({'error': 'Error al verificar alergias'}, status=400)