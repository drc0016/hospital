from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from datetime import datetime, timedelta
from .models import *
from .serializers import *
from .permissions import IsAdminUser, IsDoctorOrAdmin, IsEnfermeroOrAbove, IsDoctorOnly, CanViewOwnCitas, CanViewDepartmentPacientes


class PacienteViewSet(viewsets.ModelViewSet):
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
            # Obtener departamento del doctor/enfermero
            return Paciente.objects.all()
        
        # Paciente solo ve sus propios datos
        if user.rol == 'paciente' and user.paciente_asociado:
            return Paciente.objects.filter(id=user.paciente_asociado.id)
        
        return Paciente.objects.none()
    
    @action(detail=True, methods=['get'])
    def historia_clinica(self, request, pk=None):
        paciente = self.get_object()
        
        # Verificar permisos
        user = request.user
        if user.rol == 'paciente':
            if not user.paciente_asociado or user.paciente_asociado.id != paciente.id:
                return Response({'error': 'No tiene permiso para ver este historial'}, 
                            status=status.HTTP_403_FORBIDDEN)
        elif user.rol == 'doctor':
            # Doctor solo puede ver historias de sus pacientes
            doctor = Doctor.objects.filter(usuario=user).first()
            if not doctor:
                return Response({'error': 'No es un doctor'}, status=status.HTTP_403_FORBIDDEN)
            # Verificar que tiene cita con este paciente
            tiene_cita = Cita.objects.filter(doctor=doctor, paciente=paciente).exists()
            if not tiene_cita:
                return Response({'error': 'No tiene citas con este paciente'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        historias = HistoriaClinica.objects.filter(paciente=paciente)
        serializer = HistoriaClinicaSerializer(historias, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def citas(self, request, pk=None):
        paciente = self.get_object()
        
        # Verificar permisos
        user = request.user
        if user.rol == 'paciente':
            if not user.paciente_asociado or user.paciente_asociado.id != paciente.id:
                return Response({'error': 'No tiene permiso para ver estas citas'}, 
                            status=status.HTTP_403_FORBIDDEN)
        elif user.rol == 'doctor':
            # Doctor solo puede ver citas de sus pacientes
            doctor = Doctor.objects.filter(usuario=user).first()
            if not doctor:
                return Response({'error': 'No es un doctor'}, status=status.HTTP_403_FORBIDDEN)
            tiene_cita = Cita.objects.filter(doctor=doctor, paciente=paciente).exists()
            if not tiene_cita:
                return Response({'error': 'No tiene citas con este paciente'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        citas = Cita.objects.filter(paciente=paciente)
        serializer = CitaSerializer(citas, many=True)
        return Response(serializer.data)


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.select_related('usuario', 'departamento').all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated, IsEnfermeroOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['especialidad', 'departamento', 'activo']
    search_fields = ['usuario__first_name', 'usuario__last_name', 'especialidad']
    
    @action(detail=True, methods=['get'])
    def agenda(self, request, pk=None):
        doctor = self.get_object()
        fecha = request.query_params.get('fecha', datetime.now().date())
        citas = Cita.objects.filter(
            doctor=doctor,
            fecha_hora__date=fecha
        ).order_by('fecha_hora')
        serializer = CitaSerializer(citas, many=True)
        return Response(serializer.data)


class CitaViewSet(viewsets.ModelViewSet):
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
        hoy = datetime.now().date()
        citas = self.get_queryset().filter(fecha_hora__date=hoy)
        serializer = self.get_serializer(citas, many=True)
        return Response(serializer.data)


class HistoriaClinicaViewSet(viewsets.ModelViewSet):
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


class MedicamentoViewSet(viewsets.ModelViewSet):
    queryset = Medicamento.objects.all()
    serializer_class = MedicamentoSerializer
    permission_classes = [IsAuthenticated, IsEnfermeroOrAbove]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'principio_activo']
    filterset_fields = ['activo']
    
    @action(detail=False, methods=['get'])
    def bajo_stock(self, request):
        minimo = int(request.query_params.get('minimo', 10))
        medicamentos = Medicamento.objects.filter(stock__lte=minimo, activo=True)
        serializer = self.get_serializer(medicamentos, many=True)
        return Response(serializer.data)


class HabitacionViewSet(viewsets.ModelViewSet):
    queryset = Habitacion.objects.select_related('departamento').all()
    serializer_class = HabitacionSerializer
    permission_classes = [IsAuthenticated, IsEnfermeroOrAbove]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo', 'piso', 'departamento', 'activa']
    
    def get_queryset(self):
        """Mostrar solo habitaciones activas"""
        return Habitacion.objects.filter(activa=True)
    
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Listar habitaciones disponibles"""
        habitaciones = Habitacion.objects.filter(ocupada=False, activa=True)
        serializer = self.get_serializer(habitaciones, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def pacientes(self, request, pk=None):
        """Obtener pacientes hospitalizados en esta habitación"""
        habitacion = self.get_object()
        hospitalizaciones = Hospitalizacion.objects.filter(
            habitacion=habitacion,
            estado='activa'
        ).select_related('paciente', 'doctor_responsable')
        
        data = []
        for hosp in hospitalizaciones:
            # Obtener última historia clínica del paciente
            ultima_historia = HistoriaClinica.objects.filter(
                paciente=hosp.paciente
            ).order_by('-fecha').first()
            
            data.append({
                'id': hosp.id,
                'paciente': {
                    'id': hosp.paciente.id,
                    'nombre': hosp.paciente.nombre,
                    'apellidos': hosp.paciente.apellidos,
                    'numero_historia': hosp.paciente.numero_historia,
                    'tipo_sangre': hosp.paciente.tipo_sangre,
                    'alergias': hosp.paciente.alergias,
                    'telefono': hosp.paciente.telefono,
                },
                'hospitalizacion': {
                    'motivo': hosp.motivo,
                    'diagnostico': hosp.diagnostico,
                    'fecha_ingreso': hosp.fecha_ingreso,
                    'dias': (datetime.now().replace(tzinfo=None) - hosp.fecha_ingreso.replace(tzinfo=None)).days,
                },
                'ultima_consulta': {
                    'diagnostico': ultima_historia.diagnostico if ultima_historia else 'N/A',
                    'sintomas': ultima_historia.sintomas if ultima_historia else 'N/A',
                    'tratamiento': ultima_historia.tratamiento if ultima_historia else 'N/A',
                    'fecha': ultima_historia.fecha if ultima_historia else None,
                } if ultima_historia else None,
                'doctor': {
                    'nombre': hosp.doctor_responsable.usuario.get_full_name(),
                    'especialidad': hosp.doctor_responsable.especialidad,
                }
            })
        
        return Response(data)


class HospitalizacionViewSet(viewsets.ModelViewSet):
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


class PrescripcionViewSet(viewsets.ModelViewSet):
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
            alergias_lista = [alergia.strip() for alergia in historia.paciente.alergias.split(',') if historia.paciente.alergias]
            medicamento_nombre = medicamento.nombre.lower()
            
            alerta = False
            for alergia in alergias_lista:
                if alergia.lower() in medicamento_nombre or medicamento_nombre in alergia.lower():
                    alerta = True
                    break
            
            return Response({
                'alerta': alerta,
                'mensaje': f'⚠️ El paciente es alérgico a: {historia.paciente.alergias}' if alerta else 'Sin alergias conocidas',
                'puede_continuar': True
            })
        except:
            return Response({'error': 'Error al verificar alergias'}, status=400)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        user = request.user
        hoy = datetime.now().date()
        
        # Estadísticas según el rol
        if user.rol in ['admin', 'doctor', 'enfermero', 'recepcionista']:
            # Ver estadísticas generales
            stats = {
                'total_pacientes': Paciente.objects.filter(activo=True).count(),
                'citas_hoy': Cita.objects.filter(fecha_hora__date=hoy).count(),
                'hospitalizaciones_activas': Hospitalizacion.objects.filter(estado='activa').count(),
                'habitaciones_disponibles': Habitacion.objects.filter(ocupada=False, activa=True).count(),
                'citas_pendientes': Cita.objects.filter(
                    estado='programada',
                    fecha_hora__gte=datetime.now()
                ).count(),
            }
        elif user.rol == 'paciente' and user.paciente_asociado:
            # Estadísticas personales del paciente
            stats = {
                'mis_citas_pendientes': Cita.objects.filter(
                    paciente=user.paciente_asociado,
                    estado='programada',
                    fecha_hora__gte=datetime.now()
                ).count(),
                'total_citas': Cita.objects.filter(
                    paciente=user.paciente_asociado
                ).count(),
                'historias_clinicas': HistoriaClinica.objects.filter(
                    paciente=user.paciente_asociado
                ).count(),
            }
        else:
            stats = {}
        
        return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_usuario_actual(request):
    """Obtener información del usuario autenticado"""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'rol': user.rol,
    })