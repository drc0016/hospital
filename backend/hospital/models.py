from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    ROLES = (
        ('admin', 'Administrador'),
        ('doctor', 'Doctor'),
        ('enfermero', 'Enfermero'),
        ('recepcionista', 'Recepcionista'),
        ('paciente', 'Paciente'),
    )
    rol = models.CharField(max_length=20, choices=ROLES)
    telefono = models.CharField(max_length=15, blank=True)
    direccion = models.TextField(blank=True)
    paciente_asociado = models.OneToOneField(
        'Paciente', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='usuario_paciente'
    )
    
    class Meta:
        db_table = 'usuarios'

class Paciente(models.Model):
    TIPO_SANGRE = (
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    )
    
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    fecha_nacimiento = models.DateField()
    genero = models.CharField(max_length=1, choices=(('M', 'Masculino'), ('F', 'Femenino')))
    tipo_sangre = models.CharField(max_length=3, choices=TIPO_SANGRE)
    telefono = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    direccion = models.TextField()
    alergias = models.TextField(blank=True)
    seguro_medico = models.CharField(max_length=100, blank=True)
    numero_historia = models.CharField(max_length=50, unique=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'pacientes'
        ordering = ['-fecha_registro']
    
    def __str__(self):
        return f"{self.nombre} {self.apellidos}"

class Departamento(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    extension = models.CharField(max_length=10)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'departamentos'
    
    def __str__(self):
        return self.nombre

class Doctor(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)
    especialidad = models.CharField(max_length=100)
    licencia_medica = models.CharField(max_length=50, unique=True)
    departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True)
    horario_atencion = models.TextField()
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'doctores'
    
    def __str__(self):
        full_name = self.usuario.get_full_name() or str(self.usuario)
        return f"Dr. {full_name}"

class Cita(models.Model):
    ESTADOS = (
        ('programada', 'Programada'),
        ('en_curso', 'En Curso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    )
    
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    fecha_hora = models.DateTimeField()
    motivo = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='programada')
    observaciones = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'citas'
        ordering = ['fecha_hora']
    
    def __str__(self):
        return f"Cita {self.paciente} - {self.doctor} ({self.fecha_hora})"

class HistoriaClinica(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    cita = models.ForeignKey(Cita, on_delete=models.CASCADE, null=True, blank=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)
    diagnostico = models.TextField()
    sintomas = models.TextField()
    tratamiento = models.TextField()
    examenes_solicitados = models.TextField(blank=True)
    notas_adicionales = models.TextField(blank=True)
    
    class Meta:
        db_table = 'historias_clinicas'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"Historia {self.paciente} - {self.fecha}"

class Medicamento(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    principio_activo = models.CharField(max_length=200)
    presentacion = models.CharField(max_length=100)
    stock = models.IntegerField(default=0)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'medicamentos'
    
    def __str__(self):
        return self.nombre

class Prescripcion(models.Model):
    historia_clinica = models.ForeignKey(HistoriaClinica, on_delete=models.CASCADE)
    medicamento = models.ForeignKey(Medicamento, on_delete=models.CASCADE)
    dosis = models.CharField(max_length=100)
    frecuencia = models.CharField(max_length=100)
    duracion = models.CharField(max_length=100)
    instrucciones = models.TextField()
    
    class Meta:
        db_table = 'prescripciones'
    
    def __str__(self):
        return f"{self.medicamento} - {self.dosis}"

class Habitacion(models.Model):
    TIPOS = (
        ('individual', 'Individual'),
        ('doble', 'Doble'),
        ('uci', 'UCI'),
        ('emergencia', 'Emergencia'),
    )
    
    numero = models.CharField(max_length=10, unique=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    piso = models.IntegerField()
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    ocupada = models.BooleanField(default=False)
    activa = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'habitaciones'
    
    def __str__(self):
        return f"Habitación {self.numero}"

class Hospitalizacion(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    habitacion = models.ForeignKey(Habitacion, on_delete=models.CASCADE)
    doctor_responsable = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    fecha_ingreso = models.DateTimeField(auto_now_add=True)
    fecha_alta = models.DateTimeField(null=True, blank=True)
    motivo = models.TextField()
    diagnostico = models.TextField()
    estado = models.CharField(max_length=20, choices=(
        ('activa', 'Activa'),
        ('alta', 'Alta'),
    ), default='activa')
    
    class Meta:
        db_table = 'hospitalizaciones'
        ordering = ['-fecha_ingreso']
    
    def __str__(self):
        return f"Hospitalización {self.paciente} - Hab. {self.habitacion.numero}"
