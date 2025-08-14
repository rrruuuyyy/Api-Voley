# Database Seeder

## Descripción
El seeder se encarga de crear datos iniciales necesarios para el funcionamiento de la aplicación.

## Usuario Administrador por Defecto
- **Nombre**: Rodrigo Mendoza
- **Email**: ruymenca1@gmail.com
- **Password**: 123456
- **Rol**: ADMINISTRADOR
- **QR Code**: Se genera automáticamente

## Cómo Ejecutar el Seeder

### Comando
```bash
npm run seed
```

### Lo que hace el seeder:
1. ✅ Verifica si ya existe un usuario administrador
2. ✅ Si no existe, crea el usuario con los datos especificados
3. ✅ Genera automáticamente un código QR único
4. ✅ Encripta la contraseña usando bcrypt
5. ✅ Muestra información del usuario creado

### Notas Importantes:
- El seeder solo crea el usuario si no existe otro administrador
- Si ya existe un administrador, el seeder se salta la creación
- La contraseña se encripta automáticamente
- El QR code se genera con nanoid(12)

### Salida del Comando:
```
🚀 Ejecutando seeder...
🌱 Iniciando seeder...
👤 Creando usuario administrador...
✅ Usuario administrador creado exitosamente
📧 Email: ruymenca1@gmail.com
🔑 Password: 123456
📱 QR Code: [código_generado]
🌱 Seeder completado exitosamente
🎉 Seeder ejecutado correctamente
```

### En caso de error:
Si el seeder falla, verifica:
1. Conexión a la base de datos
2. Configuración del archivo .env
3. Que las tablas estén creadas (ejecuta la app una vez para crear las tablas)

### Archivos del Seeder:
- `src/database/database.seeder.ts` - Lógica del seeder
- `src/database/seed.ts` - Script ejecutable
- `package.json` - Comando npm run seed
