from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Paciente, Doctor, Departamento, Cita, HistoriaClinica, Medicamento, Prescripcion, Habitacion, Hospitalizacion

class UsuarioAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('rol', 'telefono', 'direccion', 'paciente_asociado')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Adicional', {'fields': ('rol', 'telefono', 'direccion', 'paciente_asociado')}),
    )

admin.site.register(Usuario, UsuarioAdmin)
admin.site.register(Paciente)
admin.site.register(Doctor)
admin.site.register(Departamento)
admin.site.register(Cita)
admin.site.register(HistoriaClinica)
admin.site.register(Medicamento)
admin.site.register(Prescripcion)
admin.site.register(Habitacion)
admin.site.register(Hospitalizacion)

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'rol', 'is_active']
    list_filter = ['rol', 'is_active', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('rol', 'telefono', 'direccion')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Adicional', {'fields': ('rol', 'telefono', 'direccion')}),
    )

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ['numero_historia', 'nombre', 'apellidos', 'tipo_sangre', 'telefono', 'activo']
    list_filter = ['tipo_sangre', 'genero', 'activo']
    search_fields = ['nombre', 'apellidos', 'numero_historia', 'telefono']
    date_hierarchy = 'fecha_registro'
    ordering = ['-fecha_registro']

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'extension', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre']

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['get_nombre', 'especialidad', 'licencia_medica', 'departamento', 'activo']
    list_filter = ['especialidad', 'departamento', 'activo']
    search_fields = ['usuario__first_name', 'usuario__last_name', 'licencia_medica']
    
    def get_nombre(self, obj):
        return f"Dr. {obj.usuario.get_full_name()}"
    get_nombre.short_description = 'Nombre'

@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ['paciente', 'doctor', 'fecha_hora', 'estado']
    list_filter = ['estado', 'fecha_hora']
    search_fields = ['paciente__nombre', 'paciente__apellidos', 'doctor__usuario__first_name']
    date_hierarchy = 'fecha_hora'
    ordering = ['-fecha_hora']

@admin.register(HistoriaClinica)
class HistoriaClinicaAdmin(admin.ModelAdmin):
    list_display = ['paciente', 'doctor', 'fecha', 'diagnostico_corto']
    list_filter = ['fecha']
    search_fields = ['paciente__nombre', 'paciente__apellidos', 'diagnostico']
    date_hierarchy = 'fecha'
    ordering = ['-fecha']
    
    def diagnostico_corto(self, obj):
        return obj.diagnostico[:50] + '...' if len(obj.diagnostico) > 50 else obj.diagnostico
    diagnostico_corto.short_description = 'Diagnóstico'

@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'principio_activo', 'stock', 'precio', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre', 'principio_activo']

@admin.register(Prescripcion)
class PrescripcionAdmin(admin.ModelAdmin):
    list_display = ['get_paciente', 'medicamento', 'dosis', 'frecuencia']
    search_fields = ['medicamento__nombre', 'historia_clinica__paciente__nombre']
    
    def get_paciente(self, obj):
        return obj.historia_clinica.paciente
    get_paciente.short_description = 'Paciente'

@admin.register(Habitacion)
class HabitacionAdmin(admin.ModelAdmin):
    list_display = ['numero', 'tipo', 'piso', 'departamento', 'ocupada', 'activa']
    list_filter = ['tipo', 'piso', 'ocupada', 'activa']
    search_fields = ['numero']

@admin.register(Hospitalizacion)
class HospitalizacionAdmin(admin.ModelAdmin):
    list_display = ['paciente', 'habitacion', 'doctor_responsable', 'fecha_ingreso', 'estado']
    list_filter = ['estado', 'fecha_ingreso']
    search_fields = ['paciente__nombre', 'paciente__apellidos']
    date_hierarchy = 'fecha_ingreso'
    ordering = ['-fecha_ingreso']