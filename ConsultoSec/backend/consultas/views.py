from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Consulta, ChecklistItem, AreaCatalogo, PropuestaMejora, RequisitoCatalogo, Capacitacion, CapacitacionArchivo
from .serializers import ConsultaSerializer, ChecklistItemSerializer, AreaCatalogoSerializer, RequisitoCatalogoSerializer, SolicitudCreateSerializer, PropuestaMejoraSerializer, CapacitacionSerializer, CapacitacionArchivoSerializer
from django.template.loader import render_to_string
from django.http import HttpResponse
from rest_framework.decorators import action

class AreaCatalogoViewSet(viewsets.ModelViewSet):
    queryset = AreaCatalogo.objects.all()
    serializer_class = AreaCatalogoSerializer

class RequisitoCatalogoViewSet(viewsets.ModelViewSet):
    queryset = RequisitoCatalogo.objects.all()
    serializer_class = RequisitoCatalogoSerializer

class ConsultaViewSet(viewsets.ModelViewSet):
    queryset = Consulta.objects.all()
    
    def get_serializer_class(self):
        # Si la petición es POST, usa el serializador con los campos definidos
        if self.action == 'create':
            return SolicitudCreateSerializer
        # Para GET, PUT, PATCH, usa el serializador completo con los items anidados
        return ConsultaSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Consulta.objects.none()
            
        # Administradores y superusuarios ven todas las auditorías
        if user.is_superuser or getattr(user, 'role', '') == 'ADMIN':
            return Consulta.objects.filter(eliminado=False)
            
        # Consultores solo ven las auditorías en las que están asignados como responsables
        return Consulta.objects.filter(responsables=user, eliminado=False).distinct()
    
    @action(detail=True, methods=['get'], url_path='pdf')
    def generar_pdf(self, request, pk=None):
        """
        Endpoint GET /api/solicitudes/{id}/pdf/
        Genera y descarga el reporte PDF de la auditoría.
        """
        consulta = self.get_object()
        
        # Solo se permite generar el PDF si la auditoría ha concluido
        if consulta.estado != 'finalizada':
            return Response(
                {"detail": "El reporte PDF solo puede generarse cuando la auditoría está en estado 'Finalizada'."},
                status=status.HTTP_400_BAD_REQUEST
            )


        # 1. Preparamos los datos que le vamos a enviar al HTML
        context = {
            'consulta': consulta,
            'items': consulta.items_checklist.all(),
            # Traemos las propuestas ordenadas por plazo (corto, mediano, largo)
            'propuestas': consulta.propuestas_mejora.all().order_by('-plazo', 'fecha_inicio'),
            
            # Traemos las capacitaciones vinculadas a esta consulta
            'capacitaciones': consulta.capacitaciones.all().order_by('fecha'),
            'request': request, # Necesario para armar las rutas de las fotos
        }
        
        # 2. Renderizamos la plantilla HTML con los datos de la base de datos
        html_string = render_to_string('reporte_auditoria.html', context)
        
        # 3. Convertimos a PDF. 
        from weasyprint import HTML
        # base_url es clave: le dice a WeasyPrint dónde buscar las fotos (localhost:8000/media/...)
        pdf_file = HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf()
        
        # 4. Devolvemos el archivo forzando su descarga (attachment)
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Auditoria_{consulta.id}.pdf"'
        
        return response
    

    @action(detail=True, methods=['patch'], url_path='eliminar')
    def eliminar_logico(self, request, pk=None):
        consulta = self.get_object()
        consulta.eliminado = True
        consulta.save(update_fields=['eliminado'])
        return Response({'status': 'eliminado'})

class ChecklistItemViewSet(viewsets.ModelViewSet):
    queryset = ChecklistItem.objects.all()
    serializer_class = ChecklistItemSerializer

class PropuestaMejoraViewSet(viewsets.ModelViewSet):
    queryset = PropuestaMejora.objects.all()
    serializer_class = PropuestaMejoraSerializer

    def get_queryset(self):
        """
        Permite filtrar las propuestas usando query params.
        Ejemplo: /api/propuestas/?consulta=5
                 /api/propuestas/?plazo=corto
        """
        queryset = super().get_queryset()
        consulta_param = self.request.query_params.get('consulta', None)
        plazo_param = self.request.query_params.get('plazo', None)
        
        if consulta_param:
            queryset = queryset.filter(consulta_id=consulta_param)
        if plazo_param:
            queryset = queryset.filter(plazo=plazo_param)
                
        return queryset

class CapacitacionViewSet(viewsets.ModelViewSet):
    queryset = Capacitacion.objects.all()
    serializer_class = CapacitacionSerializer

class CapacitacionArchivoViewSet(viewsets.ModelViewSet):
    queryset = CapacitacionArchivo.objects.all()
    serializer_class = CapacitacionArchivoSerializer
