from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'first_name', 'last_name', 'is_active', 'date_joined')

    def validate_username(self, value):
        """Verificar que el username no esté en uso por otro usuario."""
        qs = User.objects.filter(username=value)
        # Si estamos editando, excluir al usuario actual
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f"El nombre de usuario \"{value}\" ya está registrado en el sistema."
            )
        return value

    def validate_email(self, value):
        """Verificar que el correo no esté en uso por otro usuario."""
        if not value:
            return value
        qs = User.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f"El correo \"{value}\" ya está registrado en el sistema."
            )
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', User.Role.CONSULTOR),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        return super().update(instance, validated_data)

class ConsultorSerializer(serializers.ModelSerializer):
    """Serializer de solo lectura con campos mínimos para el selector de asistentes."""
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role', 'is_active')
