# 📋 Documentación de Paginación - Sistema POS API

## 🚀 Descripción General

La función `paginate` es una solución completa y robusta para manejar paginación, filtrado y ordenamiento en consultas TypeORM. Diseñada con principios de código limpio y arquitectura escalable.

## 📦 Características Principales

- ✅ **Paginación inteligente** con metadatos automáticos
- ✅ **Filtrado avanzado** con validación de seguridad
- ✅ **Búsqueda por múltiples campos**
- ✅ **Filtros de rango de fechas**
- ✅ **Ordenamiento configurable**
- ✅ **Soporte para eliminación lógica (soft delete)**
- ✅ **Consultas raw y de entidades**
- ✅ **Manejo robusto de errores**
- ✅ **TypeScript con tipado estricto**

## 🔧 Instalación y Configuración

### Dependencias Requeridas

```json
{
  "typeorm": "^0.3.x",
  "date-fns": "^2.x",
  "@nestjs/common": "^10.x",
  "class-transformer": "^0.5.x",
  "class-validator": "^0.14.x"
}
```

### Importación

```typescript
import { paginate } from '../core/paginate/paginate';
import { PageOptionsDto } from '../core/interfaces/pageOptions.dto';
```

## 📖 API Reference

### Función Principal

```typescript
export const paginate = async <T extends ObjectLiteral = any>(
  query: SelectQueryBuilder<T>,
  pageOptionsDto: PageOptionsDto,
  options: PaginationOptions = {}
): Promise<PageDto<T> | T[]>
```

### Interfaces

#### PaginationOptions
```typescript
interface PaginationOptions {
  /** Lista de claves permitidas para filtrado. Si es null, se permiten todas las claves */
  allowedKeys?: string[] | null;
  /** Retornar datos antes de aplicar los límites de paginación */
  getBeforePaginate?: boolean;
  /** Forzar modo de consulta raw */
  isRaw?: boolean;
  /** Incluir registros eliminados lógicamente */
  withDeleted?: boolean;
}
```

#### PageOptionsDto
```typescript
class PageOptionsDto {
  order?: Order = Order.ASC;           // Orden de clasificación
  orderBy: string;                     // Campo para ordenar
  page: number = 1;                    // Página actual
  limit: number = 10;                  // Elementos por página
  fields: string;                      // Campos para búsqueda
  filter: string;                      // Término de búsqueda
  whitDeleted: boolean;                // Incluir eliminados
  queryAnd: string;                    // Filtros personalizados
  queryDate: string;                   // Filtros de fecha
}
```

## 🎯 Ejemplos de Uso

### 1. Paginación Básica

```typescript
@Get()
async findAll(@Query() pageOptionsDto: PageOptionsDto) {
  const query = this.userRepository
    .createQueryBuilder('user')
    .select(['user.id', 'user.name', 'user.email']);

  return await paginate(query, pageOptionsDto);
}
```

**Resultado:**
```json
{
  "data": [
    { "id": 1, "name": "Juan Pérez", "email": "juan@example.com" },
    { "id": 2, "name": "María García", "email": "maria@example.com" }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "itemCount": 2,
    "pageCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### 2. Filtrado con Validación de Seguridad

```typescript
@Get('users')
async getUsers(@Query() pageOptionsDto: PageOptionsDto) {
  const query = this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.profile', 'profile');

  const options: PaginationOptions = {
    allowedKeys: ['status', 'role', 'department'], // Solo estos campos pueden filtrarse
  };

  return await paginate(query, pageOptionsDto, options);
}
```

**URL de ejemplo:**
```
GET /users?queryAnd=status:active,role:admin&page=1&limit=5
```

### 3. Búsqueda por Múltiples Campos

```typescript
@Get('search')
async searchProducts(@Query() pageOptionsDto: PageOptionsDto) {
  const query = this.productRepository
    .createQueryBuilder('product')
    .select(['product.id', 'product.name', 'product.description', 'product.sku']);

  // Los campos especificados en 'fields' serán buscados con el término en 'filter'
  return await paginate(query, pageOptionsDto);
}
```

**URL de ejemplo:**
```
GET /search?fields=name,description,sku&filter=laptop&page=1&limit=20
```

### 4. Filtros de Fecha

```typescript
@Get('orders')
async getOrdersByDate(@Query() pageOptionsDto: PageOptionsDto) {
  const query = this.orderRepository
    .createQueryBuilder('order')
    .select(['order.id', 'order.total', 'order.createdAt']);

  return await paginate(query, pageOptionsDto);
}
```

**URL de ejemplo:**
```
GET /orders?queryDate=createdAt:2024-01-01,2024-12-31&orderBy=createdAt&order=DESC
```

### 5. Consultas Raw con Joins Complejos

```typescript
@Get('reports')
async getAdvancedReport(@Query() pageOptionsDto: PageOptionsDto) {
  const query = this.orderRepository
    .createQueryBuilder('order')
    .select([
      'order.id',
      'user.name as userName',
      'SUM(orderItem.quantity * orderItem.price) as total'
    ])
    .leftJoin('order.user', 'user')
    .leftJoin('order.items', 'orderItem')
    .groupBy('order.id, user.name');

  const options: PaginationOptions = {
    isRaw: true, // Forzar modo raw para consultas con agregaciones
  };

  return await paginate(query, pageOptionsDto, options);
}
```

### 6. Obtener Todos los Datos sin Paginación

```typescript
@Get('export')
async exportData(@Query() pageOptionsDto: PageOptionsDto) {
  const query = this.productRepository
    .createQueryBuilder('product')
    .select(['product.id', 'product.name', 'product.price']);

  const options: PaginationOptions = {
    getBeforePaginate: true, // Retorna todos los datos sin paginación
  };

  const allProducts = await paginate(query, pageOptionsDto, options);
  // allProducts será un array de productos, no un objeto PageDto
  
  return this.exportService.generateCSV(allProducts);
}
```

### 7. Incluir Registros Eliminados

```typescript
@Get('archived')
async getArchivedUsers(@Query() pageOptionsDto: PageOptionsDto) {
  const query = this.userRepository
    .createQueryBuilder('user')
    .select(['user.id', 'user.name', 'user.deletedAt']);

  const options: PaginationOptions = {
    withDeleted: true, // Incluir registros con soft delete
  };

  return await paginate(query, pageOptionsDto, options);
}
```

## 🔍 Parámetros de URL Detallados

### Parámetros de Paginación
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, máximo: 50)

### Parámetros de Filtrado
- `queryAnd`: Filtros exactos en formato `campo:valor,campo2:valor2`
- `fields`: Campos para búsqueda separados por comas
- `filter`: Término de búsqueda que se aplicará a los campos especificados
- `queryDate`: Filtro de rango de fechas en formato `campo:fechaInicio,fechaFin`

### Parámetros de Ordenamiento
- `orderBy`: Campo por el cual ordenar
- `order`: Dirección del ordenamiento (`ASC` o `DESC`)

### Parámetros de Configuración
- `whitDeleted`: Incluir registros eliminados lógicamente (`true` o `false`)

## 🛠️ Ejemplos de URLs Completas

```bash
# Paginación básica
GET /api/users?page=2&limit=25

# Filtrado específico con seguridad
GET /api/products?queryAnd=category:electronics,status:active&page=1&limit=10

# Búsqueda en múltiples campos
GET /api/users?fields=name,email,phone&filter=juan&page=1&limit=5

# Filtro de fecha con ordenamiento
GET /api/orders?queryDate=createdAt:2024-01-01,2024-03-31&orderBy=total&order=DESC&page=1&limit=20

# Combinación de filtros
GET /api/products?queryAnd=category:electronics&fields=name,description&filter=laptop&queryDate=createdAt:2024-01-01,2024-12-31&orderBy=price&order=ASC&page=1&limit=15
```

## ⚡ Optimizaciones y Mejores Prácticas

### 1. Índices de Base de Datos
```sql
-- Crear índices para campos frecuentemente filtrados
CREATE INDEX idx_user_status ON users(status);
CREATE INDEX idx_product_category ON products(category);
CREATE INDEX idx_order_created_at ON orders(created_at);
```

### 2. Validación en DTOs
```typescript
export class ProductSearchDto extends PageOptionsDto {
  @IsOptional()
  @IsIn(['electronics', 'clothing', 'books'])
  category?: string;

  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;
}
```

### 3. Servicio Reutilizable
```typescript
@Injectable()
export class PaginationService {
  async paginateWithDefaults<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    pageOptionsDto: PageOptionsDto,
    allowedKeys: string[] = []
  ) {
    const options: PaginationOptions = {
      allowedKeys,
    };

    return await paginate(query, pageOptionsDto, options);
  }
}
```

## 🚨 Manejo de Errores

La función incluye manejo robusto de errores con mensajes específicos:

- **400 Bad Request**: Parámetros de paginación inválidos
- **400 Bad Request**: Formato de filtro inválido
- **500 Internal Server Error**: Errores durante el procesamiento

```typescript
try {
  const result = await paginate(query, pageOptionsDto);
  return result;
} catch (error) {
  // Los errores son automáticamente manejados y convertidos a HttpException
  throw error;
}
```

## 🔒 Consideraciones de Seguridad

1. **Validación de Campos**: Usar `allowedKeys` para prevenir inyección SQL
2. **Límites de Paginación**: Máximo 50 elementos por página
3. **Sanitización**: Todos los valores son sanitizados automáticamente
4. **Rate Limiting**: Implementar en el nivel de controlador

```typescript
// Ejemplo de uso seguro
const options: PaginationOptions = {
  allowedKeys: ['status', 'category'], // Solo estos campos pueden filtrarse
};
```

## 📊 Monitoreo y Performance

### Logging de Consultas
```typescript
// En desarrollo, habilitar logging de TypeORM
{
  type: 'postgres',
  logging: ['query', 'error'],
  // ...otras configuraciones
}
```

### Métricas Recomendadas
- Tiempo de respuesta por endpoint
- Número de consultas por minuto
- Tamaño promedio de resultados
- Errores de paginación

## 🔄 Migración desde paginateV2

Si anteriormente usabas `paginateV2`, la migración es sencilla:

```typescript
// Antes (paginateV2)
const result = await paginateV2(query, pageOptionsDto, {
  allowedKeys: ['status'],
  getBeforePaginate: false,
  isRaw: false
});

// Ahora (paginate)
const result = await paginate(query, pageOptionsDto, {
  allowedKeys: ['status'],
  getBeforePaginate: false,
  isRaw: false
});
```

## 🤝 Contribución

Para contribuir al desarrollo de esta función de paginación:

1. Seguir principios SOLID
2. Mantener cobertura de tests > 90%
3. Documentar cambios en este README
4. Usar TypeScript estricto
5. Seguir convenciones de naming

---

**Desarrollado con ❤️ por el equipo de POS API**

*Última actualización: Junio 2025*
