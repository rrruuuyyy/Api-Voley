# 📋 API de Gestión de Grupos - Documentación Frontend

## 🎯 **Introducción**

Esta documentación explica cómo consumir la API de gestión de grupos para ligas de voleibol desde el frontend. Incluye todos los endpoints, flujos de trabajo y ejemplos de integración.

---

## 🔑 **Autenticación**

Todos los endpoints requieren autenticación JWT:

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

**Permisos requeridos**: `ADMINISTRADOR` o `ADMIN_LIGA`

---

## 📊 **Endpoints Disponibles**

### 1. **Obtener Estado de Grupos**

**GET** `/api/equipo/grupos/liga/{ligaId}`

**Propósito**: Ver el estado actual de los grupos de una liga.

**Ejemplo de uso**:
```javascript
const obtenerEstadoGrupos = async (ligaId) => {
  const response = await fetch(`/api/equipo/grupos/liga/${ligaId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Uso
const estado = await obtenerEstadoGrupos(5);
console.log(estado);
```

**Respuesta**:
```json
{
  "liga": {
    "id": 5,
    "nombre": "Liga Metropolitana 2025",
    "numeroGrupos": 2
  },
  "totalEquipos": 10,
  "equiposAsignados": 6,
  "equiposSinAsignar": 4,
  "grupos": [
    {
      "grupoNumero": 1,
      "cantidadEquipos": 3,
      "equipos": [
        {
          "id": 12,
          "nombre": "Tigres FC",
          "capitan": {
            "id": 25,
            "nombre": "Carlos Mendoza"
          },
          "color": "azul",
          "descripcion": "Equipo veterano"
        }
      ]
    },
    {
      "grupoNumero": 2,
      "cantidadEquipos": 3,
      "equipos": [...]
    }
  ],
  "equiposSinGrupo": [
    {
      "id": 18,
      "nombre": "Águilas United",
      "capitan": {
        "id": 30,
        "nombre": "María López"
      }
    }
  ]
}
```

### 2. **Asignación Automática de Grupos**

**POST** `/api/equipo/grupos/asignar-automatico`

**Propósito**: Distribuir automáticamente todos los equipos de una liga en grupos balanceados.

**Body**:
```typescript
interface AsignarGruposAutomaticoDto {
  ligaId: number;
  metodo?: 'BALANCEADO' | 'ALEATORIO' | 'POR_RANKING'; // default: 'BALANCEADO'
}
```

**Ejemplo de uso**:
```javascript
const asignarGruposAutomatico = async (ligaId, metodo = 'BALANCEADO') => {
  const response = await fetch('/api/equipo/grupos/asignar-automatico', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ligaId,
      metodo
    })
  });
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  
  return await response.json();
};

// Uso
try {
  const resultado = await asignarGruposAutomatico(5, 'BALANCEADO');
  console.log('Grupos asignados:', resultado);
} catch (error) {
  console.error('Error al asignar grupos:', error);
}
```

**Respuesta exitosa**:
```json
{
  "message": "Grupos asignados automáticamente usando método BALANCEADO",
  "liga": {
    "id": 5,
    "nombre": "Liga Metropolitana 2025",
    "numeroGrupos": 2
  },
  "metodoUsado": "BALANCEADO",
  "totalEquipos": 10,
  "equiposPorGrupo": 5,
  "asignaciones": [
    {
      "equipoId": 12,
      "equipoNombre": "Tigres FC",
      "grupoAsignado": 1
    }
  ],
  "resumenGrupos": [
    {
      "grupoNumero": 1,
      "cantidadEquipos": 5,
      "equipos": [
        { "id": 12, "nombre": "Tigres FC" }
      ]
    }
  ]
}
```

### 3. **Asignación Masiva de Grupos**

**POST** `/api/equipo/grupos/asignar-masivo`

**Propósito**: Asignar múltiples equipos a grupos específicos en una sola operación.

**Body**:
```typescript
interface AsignarGruposDto {
  asignaciones: AsignacionGrupoDto[];
}

interface AsignacionGrupoDto {
  equipoId: number;
  grupoNumero: number;
}
```

**Ejemplo de uso**:
```javascript
const asignarGruposMasivo = async (asignaciones) => {
  const response = await fetch('/api/equipo/grupos/asignar-masivo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      asignaciones
    })
  });
  return await response.json();
};

// Uso
const asignaciones = [
  { equipoId: 12, grupoNumero: 1 },
  { equipoId: 15, grupoNumero: 1 },
  { equipoId: 18, grupoNumero: 2 },
  { equipoId: 22, grupoNumero: 2 }
];

const resultado = await asignarGruposMasivo(asignaciones);
```

**Respuesta**:
```json
{
  "message": "Asignación masiva completada: 3 exitosos, 1 errores",
  "exitosos": [
    {
      "equipoId": 12,
      "equipoNombre": "Tigres FC",
      "grupoAnterior": 0,
      "grupoNuevo": 1,
      "status": "exitoso"
    }
  ],
  "errores": [
    {
      "equipoId": 25,
      "grupoNumero": 3,
      "error": "El grupo 3 no es válido. La liga solo tiene 2 grupos",
      "status": "error"
    }
  ],
  "resumen": {
    "total": 4,
    "exitosos": 3,
    "errores": 1
  }
}
```

### 4. **Asignar Grupo Individual**

**PUT** `/api/equipo/{equipoId}/grupo`

**Propósito**: Cambiar el grupo de un equipo específico.

**Body**:
```typescript
interface UpdateGrupoEquipoDto {
  grupoNumero: number;
}
```

**Ejemplo de uso**:
```javascript
const asignarGrupoIndividual = async (equipoId, grupoNumero) => {
  const response = await fetch(`/api/equipo/${equipoId}/grupo`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grupoNumero
    })
  });
  return await response.json();
};

// Uso
await asignarGrupoIndividual(12, 2); // Mover Tigres FC al Grupo 2
```

### 5. **Validar Configuración de Grupos**

**GET** `/api/equipo/grupos/validar/{ligaId}`

**Propósito**: Verificar si la configuración actual es válida para iniciar la liga.

**Ejemplo de uso**:
```javascript
const validarConfiguracionGrupos = async (ligaId) => {
  const response = await fetch(`/api/equipo/grupos/validar/${ligaId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Uso
const validacion = await validarConfiguracionGrupos(5);
if (validacion.validacion.puedeIniciarLiga) {
  console.log('✅ Liga lista para iniciar');
} else {
  console.log('❌ Problemas encontrados:', validacion.validacion.problemas);
}
```

**Respuesta**:
```json
{
  "liga": { "id": 5, "nombre": "Liga Metropolitana 2025" },
  "totalEquipos": 10,
  "equiposAsignados": 10,
  "equiposSinAsignar": 0,
  "grupos": [...],
  "validacion": {
    "esValida": true,
    "problemas": [],
    "recomendaciones": [],
    "puedeIniciarLiga": true
  }
}
```

**Posibles problemas**:
```json
{
  "validacion": {
    "esValida": false,
    "problemas": [
      "3 equipos sin grupo asignado",
      "Grupos desbalanceados: min 2 equipos, max 5 equipos",
      "1 grupos con menos de 2 equipos"
    ],
    "recomendaciones": [
      "Usar asignación automática o asignar manualmente",
      "Redistribuir equipos para mejor balance",
      "Mínimo 2 equipos por grupo para competición válida"
    ],
    "puedeIniciarLiga": false
  }
}
```

---

## 🎮 **Flujo de Trabajo Completo**

### **Fase 1: Configuración Inicial**

```javascript
// 1. Crear liga con número de grupos
const crearLiga = async (datosLiga) => {
  const response = await fetch('/api/liga', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nombre: datosLiga.nombre,
      numeroGrupos: datosLiga.numeroGrupos, // ← Importante: Define cuántos grupos
      vueltas: datosLiga.vueltas,
      sistemaPuntos: datosLiga.sistemaPuntos
    })
  });
  return await response.json();
};

// 2. Agregar equipos (sin asignar grupos inicialmente)
const agregarEquipo = async (equipoData) => {
  const response = await fetch('/api/equipo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nombre: equipoData.nombre,
      capitanId: equipoData.capitanId,
      ligaId: equipoData.ligaId,
      color: equipoData.color
      // grupoNumero se asignará después
    })
  });
  return await response.json();
};
```

### **Fase 2: Gestión de Grupos**

```javascript
const gestionarGrupos = async (ligaId) => {
  // 1. Ver estado actual
  const estado = await obtenerEstadoGrupos(ligaId);
  console.log(`Equipos sin asignar: ${estado.equiposSinAsignar}`);
  
  // 2. Asignar grupos automáticamente si hay equipos sin asignar
  if (estado.equiposSinAsignar > 0) {
    const asignacion = await asignarGruposAutomatico(ligaId, 'BALANCEADO');
    console.log('Asignación completada:', asignacion.message);
  }
  
  // 3. Validar configuración
  const validacion = await validarConfiguracionGrupos(ligaId);
  
  if (validacion.validacion.puedeIniciarLiga) {
    console.log('✅ Liga lista para generar fixtures');
    return true;
  } else {
    console.log('❌ Problemas encontrados:');
    validacion.validacion.problemas.forEach(problema => {
      console.log(`- ${problema}`);
    });
    return false;
  }
};
```

### **Fase 3: Iniciar Liga**

```javascript
const iniciarLiga = async (ligaId) => {
  // 1. Validar configuración final
  const puedeIniciar = await gestionarGrupos(ligaId);
  
  if (!puedeIniciar) {
    throw new Error('La liga no puede iniciarse. Revisar configuración de grupos.');
  }
  
  // 2. Generar fixtures para cada grupo
  const liga = await fetch(`/api/liga/${ligaId}`).then(r => r.json());
  
  for (let grupo = 1; grupo <= liga.numeroGrupos; grupo++) {
    await fetch(`/api/partido/generate-fixtures/${ligaId}?grupo=${grupo}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`✅ Fixtures generados para Grupo ${grupo}`);
  }
  
  console.log('🏐 Liga iniciada exitosamente');
};
```

---

## 🖥️ **Componentes de Frontend Sugeridos**

### **1. Componente Principal**

```typescript
// ConfiguracionGrupos.tsx
interface ConfiguracionGruposProps {
  ligaId: number;
  onConfiguracionCompleta: () => void;
}

const ConfiguracionGrupos: React.FC<ConfiguracionGruposProps> = ({ 
  ligaId, 
  onConfiguracionCompleta 
}) => {
  const [estado, setEstado] = useState(null);
  const [validacion, setValidacion] = useState(null);
  const [loading, setLoading] = useState(false);

  const cargarEstado = async () => {
    const estadoGrupos = await obtenerEstadoGrupos(ligaId);
    const validacionGrupos = await validarConfiguracionGrupos(ligaId);
    setEstado(estadoGrupos);
    setValidacion(validacionGrupos);
  };

  const handleAsignacionAutomatica = async (metodo: string) => {
    setLoading(true);
    try {
      await asignarGruposAutomatico(ligaId, metodo);
      await cargarEstado(); // Recargar estado
      toast.success('Grupos asignados exitosamente');
    } catch (error) {
      toast.error('Error al asignar grupos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="configuracion-grupos">
      <EstadoGrupos estado={estado} />
      <AsignacionAutomatica onAsignar={handleAsignacionAutomatica} loading={loading} />
      <ValidacionGrupos validacion={validacion} />
      <AccionesGrupos 
        ligaId={ligaId}
        estado={estado}
        onActualizar={cargarEstado}
      />
    </div>
  );
};
```

### **2. Componente de Estado de Grupos**

```typescript
// EstadoGrupos.tsx
const EstadoGrupos: React.FC<{ estado: any }> = ({ estado }) => {
  if (!estado) return <Loading />;

  return (
    <div className="estado-grupos">
      <div className="resumen">
        <h3>{estado.liga.nombre}</h3>
        <div className="stats">
          <div>Total equipos: {estado.totalEquipos}</div>
          <div>Equipos asignados: {estado.equiposAsignados}</div>
          <div>Sin asignar: {estado.equiposSinAsignar}</div>
        </div>
      </div>

      <div className="grupos-grid">
        {estado.grupos.map(grupo => (
          <div key={grupo.grupoNumero} className="grupo-card">
            <h4>Grupo {grupo.grupoNumero}</h4>
            <div className="equipos-count">{grupo.cantidadEquipos} equipos</div>
            <div className="equipos-list">
              {grupo.equipos.map(equipo => (
                <div key={equipo.id} className="equipo-item">
                  <span>{equipo.nombre}</span>
                  <small>{equipo.capitan.nombre}</small>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {estado.equiposSinGrupo.length > 0 && (
        <div className="equipos-sin-grupo">
          <h4>Equipos sin asignar ({estado.equiposSinGrupo.length})</h4>
          <div className="equipos-list">
            {estado.equiposSinGrupo.map(equipo => (
              <div key={equipo.id} className="equipo-sin-grupo">
                {equipo.nombre}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### **3. Componente de Asignación Automática**

```typescript
// AsignacionAutomatica.tsx
interface AsignacionAutomaticaProps {
  onAsignar: (metodo: string) => void;
  loading: boolean;
}

const AsignacionAutomatica: React.FC<AsignacionAutomaticaProps> = ({
  onAsignar,
  loading
}) => {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('BALANCEADO');

  const metodos = [
    { value: 'BALANCEADO', label: 'Balanceado', description: 'Distribuye equipos equitativamente' },
    { value: 'ALEATORIO', label: 'Aleatorio', description: 'Asignación aleatoria' },
    { value: 'POR_RANKING', label: 'Por Ranking', description: 'Basado en estadísticas (próximamente)' }
  ];

  return (
    <div className="asignacion-automatica">
      <h4>Asignación Automática</h4>
      
      <div className="metodos">
        {metodos.map(metodo => (
          <label key={metodo.value} className="metodo-option">
            <input
              type="radio"
              value={metodo.value}
              checked={metodoSeleccionado === metodo.value}
              onChange={(e) => setMetodoSeleccionado(e.target.value)}
              disabled={metodo.value === 'POR_RANKING'} // Deshabilitado temporalmente
            />
            <div>
              <strong>{metodo.label}</strong>
              <small>{metodo.description}</small>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={() => onAsignar(metodoSeleccionado)}
        disabled={loading}
        className="btn-asignar-automatico"
      >
        {loading ? 'Asignando...' : 'Asignar Grupos Automáticamente'}
      </button>
    </div>
  );
};
```

### **4. Componente de Validación**

```typescript
// ValidacionGrupos.tsx
const ValidacionGrupos: React.FC<{ validacion: any }> = ({ validacion }) => {
  if (!validacion) return null;

  const { validacion: val } = validacion;

  return (
    <div className={`validacion-grupos ${val.esValida ? 'valida' : 'invalida'}`}>
      <div className="validacion-header">
        <h4>
          {val.esValida ? '✅ Configuración Válida' : '❌ Problemas Encontrados'}
        </h4>
        <div className="puede-iniciar">
          {val.puedeIniciarLiga ? 'Liga lista para iniciar' : 'No se puede iniciar aún'}
        </div>
      </div>

      {val.problemas.length > 0 && (
        <div className="problemas">
          <h5>Problemas:</h5>
          <ul>
            {val.problemas.map((problema, index) => (
              <li key={index} className="problema">{problema}</li>
            ))}
          </ul>
        </div>
      )}

      {val.recomendaciones.length > 0 && (
        <div className="recomendaciones">
          <h5>Recomendaciones:</h5>
          <ul>
            {val.recomendaciones.map((recomendacion, index) => (
              <li key={index} className="recomendacion">{recomendacion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

---

## 🎨 **Estilos CSS Sugeridos**

```css
/* ConfiguracionGrupos.css */
.configuracion-grupos {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.estado-grupos .resumen {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.estado-grupos .stats {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.grupos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.grupo-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  background: white;
}

.grupo-card h4 {
  margin: 0 0 10px 0;
  color: #495057;
}

.equipos-count {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 10px;
}

.equipo-item {
  padding: 8px;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.equipos-sin-grupo {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.asignacion-automatica {
  background: #e3f2fd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.metodos {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 15px 0;
}

.metodo-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
}

.metodo-option:hover {
  background: #f8f9fa;
}

.btn-asignar-automatico {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-asignar-automatico:hover {
  background: #0056b3;
}

.btn-asignar-automatico:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.validacion-grupos.valida {
  background: #d4edda;
  border: 1px solid #c3e6cb;
}

.validacion-grupos.invalida {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

.validacion-grupos {
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.problemas, .recomendaciones {
  margin-top: 15px;
}

.problema {
  color: #721c24;
  margin-bottom: 5px;
}

.recomendacion {
  color: #155724;
  margin-bottom: 5px;
}
```

---

## 🚨 **Manejo de Errores**

```javascript
// ErrorHandler.js
export const handleApiError = (error, customMessages = {}) => {
  const defaultMessages = {
    400: 'Datos inválidos enviados',
    401: 'No autorizado - verificar token',
    403: 'Sin permisos para esta acción',
    404: 'Recurso no encontrado',
    409: 'Conflicto - recurso ya existe o no válido',
    500: 'Error interno del servidor'
  };

  const status = error.status || error.response?.status;
  const message = customMessages[status] || defaultMessages[status] || 'Error desconocido';
  
  console.error('API Error:', error);
  
  return {
    status,
    message,
    details: error.response?.data || error.message
  };
};

// Uso en componentes
const handleAsignacionError = (error) => {
  const errorInfo = handleApiError(error, {
    400: 'Grupo inválido o datos incorrectos',
    409: 'El equipo ya está asignado a ese grupo'
  });
  
  toast.error(errorInfo.message);
};
```

---

## 📱 **Ejemplo de Integración Completa**

```typescript
// LigaConfigPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConfiguracionGrupos from './components/ConfiguracionGrupos';
import { toast } from 'react-toastify';

const LigaConfigPage: React.FC = () => {
  const { ligaId } = useParams<{ ligaId: string }>();
  const navigate = useNavigate();
  const [liga, setLiga] = useState(null);
  const [paso, setPaso] = useState(1); // 1: equipos, 2: grupos, 3: confirmación

  useEffect(() => {
    cargarLiga();
  }, [ligaId]);

  const cargarLiga = async () => {
    try {
      const response = await fetch(`/api/liga/${ligaId}`);
      const ligaData = await response.json();
      setLiga(ligaData);
    } catch (error) {
      toast.error('Error al cargar liga');
    }
  };

  const handleConfiguracionCompleta = async () => {
    try {
      // Validar una vez más
      const validacion = await validarConfiguracionGrupos(parseInt(ligaId!));
      
      if (validacion.validacion.puedeIniciarLiga) {
        setPaso(3);
        toast.success('Configuración de grupos completada');
      } else {
        toast.error('La configuración aún tiene problemas');
      }
    } catch (error) {
      toast.error('Error al validar configuración');
    }
  };

  const iniciarLiga = async () => {
    try {
      // Generar fixtures para todos los grupos
      for (let grupo = 1; grupo <= liga.numeroGrupos; grupo++) {
        await fetch(`/api/partido/generate-fixtures/${ligaId}?grupo=${grupo}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      toast.success('Liga iniciada exitosamente');
      navigate(`/liga/${ligaId}/dashboard`);
    } catch (error) {
      toast.error('Error al iniciar liga');
    }
  };

  if (!liga) return <div>Cargando...</div>;

  return (
    <div className="liga-config-page">
      <div className="header">
        <h1>Configuración: {liga.nombre}</h1>
        <div className="progress">
          Paso {paso} de 3: {
            paso === 1 ? 'Equipos' : 
            paso === 2 ? 'Grupos' : 
            'Confirmación'
          }
        </div>
      </div>

      {paso === 2 && (
        <ConfiguracionGrupos
          ligaId={parseInt(ligaId!)}
          onConfiguracionCompleta={handleConfiguracionCompleta}
        />
      )}

      {paso === 3 && (
        <div className="confirmacion">
          <h2>🎉 ¡Liga lista para iniciar!</h2>
          <p>La configuración de grupos está completa y validada.</p>
          <button 
            onClick={iniciarLiga}
            className="btn-iniciar-liga"
          >
            🚀 Iniciar Liga y Generar Fixtures
          </button>
        </div>
      )}
    </div>
  );
};

export default LigaConfigPage;
```

---

## 🎯 **Resumen para Desarrolladores Frontend**

### **Flujo Principal**:
1. **Crear liga** → Especificar `numeroGrupos`
2. **Agregar equipos** → Sin grupos inicialmente
3. **Configurar grupos** → Usar endpoints de gestión
4. **Validar** → Verificar que todo esté correcto
5. **Iniciar liga** → Generar fixtures

### **Endpoints Clave**:
- `GET /api/equipo/grupos/liga/{id}` → Estado actual
- `POST /api/equipo/grupos/asignar-automatico` → Asignación automática
- `GET /api/equipo/grupos/validar/{id}` → Validación
- `PUT /api/equipo/{id}/grupo` → Cambio individual

### **Estados de UI**:
- **Loading**: Durante asignaciones
- **Error**: Mostrar problemas específicos
- **Success**: Confirmación de acciones
- **Validation**: Mostrar problemas/recomendaciones

### **Componentes Reutilizables**:
- `ConfiguracionGrupos` (principal)
- `EstadoGrupos` (visualización)
- `AsignacionAutomatica` (acciones)
- `ValidacionGrupos` (verificación)

**¡Con esta documentación el frontend puede implementar completamente la gestión de grupos!** 🚀🏐
