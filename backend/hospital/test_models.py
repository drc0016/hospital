import pytest
from hospital.models import Paciente

@pytest.mark.django_db
def test_paciente_str():
    paciente = Paciente.objects.create(
        nombre="Juan",
        apellidos="Pérez",
        fecha_nacimiento="1990-01-01",
        genero="M",
        tipo_sangre="A+",
        telefono="123456789",
        email="juan.perez@example.com",
        direccion="Calle Falsa 123",
        alergias="Ninguna",
        seguro_medico="SeguroX",
        numero_historia="HIST123"
    )
    assert str(paciente) == "Juan Pérez"