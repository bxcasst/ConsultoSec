from rest_framework import serializers
from .models import Consulta, ChecklistItem, AreaCatalogo, RequisitoCatalogo, PropuestaMejora, Capacitacion, CapacitacionArchivo

class AreaCatalogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AreaCatalogo
        fields = '__all__'

class RequisitoCatalogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequisitoCatalogo
        fields = '__all__'

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = '__all__'

class ConsultaSerializer(serializers.ModelSerializer):
    items_checklist = ChecklistItemSerializer(many=True, read_only=True)
    area_nombre = serializers.ReadOnlyField(source='area_laboratorio.nombre')

    class Meta:
        model = Consulta
        fields = '__all__'

class SolicitudCreateSerializer(serializers.ModelSerializer):
    area_nombre = serializers.ReadOnlyField(source='area_laboratorio.nombre')
    
    class Meta:
        model = Consulta
        # Definimos los campos que el Frontend puede enviar al crear
        fields = ['id', 'area_laboratorio', 'area_nombre', 'notas', 'responsables', 'fecha_finalizacion_propuesta', 'estado']
        
    def validate_area_laboratorio(self, value):
        """
        Validación personalizada: Asegura que siempre se envíe un área 
        para que el signal 'generar_checklist' funcione correctamente.
        """
        if not value:
            raise serializers.ValidationError("El área de laboratorio es obligatoria para procesar la solicitud.")
        return value
    
class PropuestaMejoraSerializer(serializers.ModelSerializer):
    duracion_dias = serializers.ReadOnlyField()

    class Meta:
        model = PropuestaMejora
        fields = '__all__'
        read_only_fields = ['fecha_creacion']

class CapacitacionArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CapacitacionArchivo
        fields = '__all__'

    def to_representation(self, instance):
        """Devuelve URL absoluta para el campo 'archivo' en respuestas GET."""
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.archivo.name and request:
            try:
                representation['archivo'] = request.build_absolute_uri(instance.archivo.url)
            except Exception:
                pass  # Si el archivo no existe en disco, dejamos el path relativo
        return representation

class CapacitacionSerializer(serializers.ModelSerializer):
    archivos = CapacitacionArchivoSerializer(many=True, read_only=True)

    class Meta:
        model = Capacitacion
        fields = '__all__'
