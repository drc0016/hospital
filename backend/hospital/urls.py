# hospital/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import *  # ← Importar todo desde views/

router = DefaultRouter()
router.register(r'pacientes', PacienteViewSet)
router.register(r'doctores', DoctorViewSet)
router.register(r'citas', CitaViewSet)
router.register(r'historias-clinicas', HistoriaClinicaViewSet)
router.register(r'medicamentos', MedicamentoViewSet)
router.register(r'prescripciones', PrescripcionViewSet)
router.register(r'habitaciones', HabitacionViewSet)
router.register(r'hospitalizaciones', HospitalizacionViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'departamentos', DepartamentoViewSet)
router.register(r'medicaciones-hospitalarias', MedicacionHospitalariaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/user/', obtener_usuario_actual, name='usuario_actual'),
]