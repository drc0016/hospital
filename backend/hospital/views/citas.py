# hospital/views/citas.py
from rest_framework import viewsets, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from datetime import datetime

from ..models import Cita, Doctor, Paciente
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
        
        if user.rol == 'admin':
            return Cita.objects.all()
        
        if user.rol == 'doctor':
            doctor = Doctor.objects.filter(usuario=user).first()
            if doctor:
                return Cita.objects.filter(doctor=doctor)
            return Cita.objects.none()
        
        if user.rol == 'enfermero':
            return Cita.objects.all()
        
        if user.rol == 'paciente' and user.paciente_asociado:
            return Cita.objects.filter(paciente=user.paciente_asociado)
        
        return Cita.objects.none()
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsDoctorOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        if user.rol == 'paciente':
            paciente = user.paciente_asociado
            if not paciente:
                raise serializers.ValidationError('No tienes un paciente asociado.')
            if not paciente.medico_cabecera:
                raise serializers.ValidationError('No tienes médico de cabecera asignado.')
            serializer.save(
                paciente=paciente,
                doctor=paciente.medico_cabecera
            )
        else:
            serializer.save()
    
    @action(detail=False, methods=['post'])
    def derivar(self, request):
        """El médico de cabecera deriva a un paciente a un especialista"""
        if request.user.rol != 'doctor':
            return Response(
                {'error': 'Solo los médicos pueden realizar derivaciones'},
                status=status.HTTP_403_FORBIDDEN
            )

        departamento_id = request.data.get('departamento')
        fecha_hora = request.data.get('fecha_hora')
        motivo = request.data.get('motivo')
        paciente_id = request.data.get('paciente')

        if not all([departamento_id, fecha_hora, motivo, paciente_id]):
            return Response(
                {'error': 'Faltan campos: departamento, fecha_hora, motivo, paciente'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            paciente = Paciente.objects.get(id=paciente_id)
        except Paciente.DoesNotExist:
            return Response({'error': 'Paciente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        doctor = Doctor.objects.filter(
            departamento__id=departamento_id,
            activo=True
        ).annotate(
            num_citas=Count('cita', filter=Q(cita__estado__in=['programada', 'en_curso']))
        ).order_by('num_citas').first()

        if not doctor:
            return Response(
                {'error': 'No hay doctores disponibles en ese departamento'},
                status=status.HTTP_404_NOT_FOUND
            )

        cita = Cita.objects.create(
            paciente=paciente,
            doctor=doctor,
            fecha_hora=fecha_hora,
            motivo=motivo,
            estado='programada'
        )

        serializer = CitaSerializer(cita)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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
        if request.user.rol not in ['doctor', 'admin', 'paciente']:
            return Response(
                {'error': 'No tiene permiso para cambiar el estado'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cita = self.get_object()
        nuevo_estado = request.data.get('estado')

        # Paciente solo puede cancelar sus propias citas
        if request.user.rol == 'paciente':
            if not request.user.paciente_asociado or cita.paciente != request.user.paciente_asociado:
                return Response({'error': 'No puedes modificar esta cita'}, status=status.HTTP_403_FORBIDDEN)
            if nuevo_estado != 'cancelada':
                return Response({'error': 'Solo puedes cancelar citas'}, status=status.HTTP_403_FORBIDDEN)

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