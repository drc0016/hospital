#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py shell -c "
from hospital.models import Usuario
if not Usuario.objects.filter(username='admin').exists():
    Usuario.objects.create_superuser('admin', 'admin@hospital.com', 'Medac123', rol='admin')
    print('Superusuario creado')
else:
    print('Superusuario ya existe')
"