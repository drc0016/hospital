from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

Usuario = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol', 'telefono', 'direccion']
        extra_kwargs = {'password': {'write_only': True}}

class PacienteSerializer(serializers.ModelSerializer):
    edad = serializers.SerializerMethodField()
    
    class Meta:
        model = Paciente
        fields = '__all__'
    
    def get_edad(self, obj):
        from datetime import date
        today = date.today()
        return today.year - obj.fecha_nacimiento.year - (
            (today.month, today.day) < (obj.fecha_nacimiento.month, obj.fecha_nacimiento.day)
        )

class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = '__all__'

class DoctorSerializer(serializers.ModelSerializer):
    usuario_info = UsuarioSerializer(source='usuario', read_only=True)
    departamento_info = DepartamentoSerializer(source='departamento', read_only=True)
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = Doctor
        fields = '__all__'
    
    def get_nombre_completo(self, obj):
        return f"Dr. {obj.usuario.first_name} {obj.usuario.last_name}"

class CitaSerializer(serializers.ModelSerializer):
    paciente_info = PacienteSerializer(source='paciente', read_only=True)
    doctor_info = DoctorSerializer(source='doctor', read_only=True)
    
    class Meta:
        model = Cita
        fields = '__all__'

class MedicamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicamento
        fields = '__all__'

class PrescripcionSerializer(serializers.ModelSerializer):
    medicamento_info = MedicamentoSerializer(source='medicamento', read_only=True)
    
    class Meta:
        model = Prescripcion
        fields = '__all__'

class HistoriaClinicaSerializer(serializers.ModelSerializer):
    paciente_info = PacienteSerializer(source='paciente', read_only=True)
    doctor_info = DoctorSerializer(source='doctor', read_only=True)
    prescripciones = PrescripcionSerializer(many=True, read_only=True, source='prescripcion_set')
    
    class Meta:
        model = HistoriaClinica
        fields = '__all__'

class HabitacionSerializer(serializers.ModelSerializer):
    departamento_info = DepartamentoSerializer(source='departamento', read_only=True)
    capacidad = serializers.SerializerMethodField()
    ocupadas = serializers.SerializerMethodField()
    disponible = serializers.SerializerMethodField()
    
    class Meta:
        model = Habitacion
        fields = '__all__'
    
    def get_capacidad(self, obj):
        capacidades = {
            'individual': 1,
            'doble': 2,
            'triple': 3,
            'uci': 1,
            'emergencia': 1,
        }
        return capacidades.get(obj.tipo, 1)
    
    def get_ocupadas(self, obj):
        return Hospitalizacion.objects.filter(
            habitacion=obj,
            estado='activa'
        ).count()
    
    def get_disponible(self, obj):
        capacidad = self.get_capacidad(obj)
        ocupadas = self.get_ocupadas(obj)
        return ocupadas < capacidad
    
    class Meta:
        model = Habitacion
        fields = '__all__'

class HospitalizacionSerializer(serializers.ModelSerializer):
    paciente_info = PacienteSerializer(source='paciente', read_only=True)
    doctor_info = DoctorSerializer(source='doctor_responsable', read_only=True)
    habitacion_info = HabitacionSerializer(source='habitacion', read_only=True)
    dias_hospitalizacion = serializers.SerializerMethodField()
    
    class Meta:
        model = Hospitalizacion
        fields = '__all__'
    
    def get_dias_hospitalizacion(self, obj):
        from datetime import datetime
        fecha_fin = obj.fecha_alta if obj.fecha_alta else datetime.now()
        delta = fecha_fin - obj.fecha_ingreso
        return delta.days