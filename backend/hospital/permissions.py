from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.rol == 'admin'

class IsDoctorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.rol in ['doctor', 'admin']

class IsEnfermeroOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.rol in ['enfermero', 'doctor', 'admin']

class IsDoctorOnly(permissions.BasePermission):
    """Solo doctores pueden recetar"""
    def has_permission(self, request, view):
        return request.user and request.user.rol == 'doctor'

class CanViewOwnCitas(permissions.BasePermission):
    """Doctores ven solo sus citas, otros ven todo"""
    def has_permission(self, request, view):
        return request.user and request.user.rol in ['doctor', 'admin', 'enfermero']

class CanViewDepartmentPacientes(permissions.BasePermission):
    """Ver pacientes del departamento"""
    def has_permission(self, request, view):
        return request.user and request.user.rol in ['doctor', 'admin', 'enfermero']