from django.contrib import admin
from .models import (
    AreaCatalogo, 
    RequisitoCatalogo, 
    Consulta, 
    Evidencia, 
    ChecklistItem, 
    PropuestaMejora, 
    Capacitacion, 
    CapacitacionArchivo
)

# Registramos todos los modelos para que aparezcan en el panel web
admin.site.register(AreaCatalogo)
admin.site.register(RequisitoCatalogo)
admin.site.register(Consulta)
admin.site.register(Evidencia)
admin.site.register(ChecklistItem)
admin.site.register(PropuestaMejora)
admin.site.register(Capacitacion)
admin.site.register(CapacitacionArchivo)