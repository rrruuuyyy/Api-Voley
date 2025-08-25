# 🏐 API de Equipos para Gestión de Jornadas

## 📋 **Resumen de Endpoints**

Esta documentación describe los endpoints disponibles para obtener información de equipos organizados por liga y grupos, especialmente útil para la creación y gestión de jornadas.

---

## 🎯 **Endpoints Principales**

### 1. **Obtener Equipos de Liga (Mejorado)**

**GET** `/api/equipo?ligaId={id}&grupo={grupoNumero}`

**Propósito**: Obtener todos los equipos de una liga, con filtrado opcional por grupo.

**Parámetros Query**:
- `ligaId` (opcional): ID de la liga
- `grupo` (opcional): Número del grupo específico

**Ejemplos de uso**:

```javascript
// Todos los equipos de la liga 5
const equipos = await fetch('/api/equipo?ligaId=5');

// Solo equipos del grupo 1 de la liga 5
const equiposGrupo1 = await fetch('/api/equipo?ligaId=5&grupo=1');

// Todos los equipos (sin filtro)
const todosEquipos = await fetch('/api/equipo');
```

**Respuesta**:
```json
[
  {
    "id": 12,
    "nombre": "Tigres FC",
    "grupoNumero": 1,
    "color": "azul",
    "descripcion": "Equipo veterano",
    "capitan": {
      "id": 25,
      "nombre": "Carlos Mendoza",
      "correo": "carlos@email.com"
    },
    "liga": {
      "id": 5,
      "nombre": "Liga Metropolitana 2025"
    },
    "active": true,
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

### 2. **Obtener Equipos de Liga (Desde Liga Controller)**

**GET** `/api/liga/{ligaId}/equipos?grupo={grupoNumero}`

**Propósito**: Obtener equipos de una liga específica con información estructurada.

**Parámetros**:
- `ligaId` (requerido): ID de la liga
- `grupo` (query opcional): Número del grupo específico

**Ejemplo de uso**:
```javascript
const obtenerEquiposLiga = async (ligaId, grupo = null) => {
  const url = `/api/liga/${ligaId}/equipos${grupo ? `?grupo=${grupo}` : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Todos los equipos de la liga
const equiposLiga = await obtenerEquiposLiga(5);

// Solo equipos del grupo 2
const equiposGrupo2 = await obtenerEquiposLiga(5, 2);
```

**Respuesta**:
```json
{
  "liga": {
    "id": 5,
    "nombre": "Liga Metropolitana 2025",
    "numeroGrupos": 2,
    "status": "EN_CONFIGURACION"
  },
  "grupo": 1,
  "totalEquipos": 5,
  "equipos": [
    {
      "id": 12,
      "nombre": "Tigres FC",
      "grupoNumero": 1,
      "color": "azul",
      "descripcion": "Equipo veterano",
      "capitan": {
        "id": 25,
        "nombre": "Carlos Mendoza",
        "correo": "carlos@email.com"
      }
    }
  ]
}
```

### 3. **Obtener Equipos Preparados para Jornadas (¡NUEVO!)**

**GET** `/api/liga/{ligaId}/equipos/jornadas`

**Propósito**: Obtener información completa de equipos organizados por grupos con cálculos automáticos para generar jornadas.

**Casos de uso**:
- ✅ Crear fixtures por grupo
- ✅ Validar configuración antes de generar jornadas
- ✅ Obtener cálculos automáticos (partidos, jornadas)
- ✅ Visualizar resumen de la liga

**Ejemplo de uso**:
```javascript
const obtenerEquiposParaJornadas = async (ligaId) => {
  const response = await fetch(`/api/liga/${ligaId}/equipos/jornadas`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

const datosJornadas = await obtenerEquiposParaJornadas(5);
console.log('Grupos listos para jornadas:', datosJornadas.resumen.gruposListosParaJornadas);
```

**Respuesta completa**:
```json
{
  "liga": {
    "id": 5,
    "nombre": "Liga Metropolitana 2025",
    "numeroGrupos": 2,
    "vueltas": 2,
    "status": "EN_CONFIGURACION"
  },
  "totalEquipos": 10,
  "equiposAsignados": 10,
  "equiposSinAsignar": 0,
  "grupos": [
    {
      "grupoNumero": 1,
      "cantidadEquipos": 5,
      "equipos": [
        {
          "id": 12,
          "nombre": "Tigres FC",
          "grupoNumero": 1,
          "color": "azul",
          "capitan": {
            "id": 25,
            "nombre": "Carlos Mendoza"
          }
        }
      ],
      "puedeGenerarJornadas": true,
      "calculos": {
        "partidosPorEquipo": 8,
        "partidosTotales": 20,
        "jornadas": 8,
        "partidosPorJornada": 2
      }
    },
    {
      "grupoNumero": 2,
      "cantidadEquipos": 5,
      "equipos": [...],
      "puedeGenerarJornadas": true,
      "calculos": {
        "partidosPorEquipo": 8,
        "partidosTotales": 20,
        "jornadas": 8,
        "partidosPorJornada": 2
      }
    }
  ],
  "equiposSinGrupo": [],
  "resumen": {
    "gruposConfigurados": 2,
    "gruposListosParaJornadas": 2,
    "totalCalculos": {
      "partidosTotalesLiga": 40,
      "jornadasMaximas": 8
    }
  }
}
```

---

## 🎮 **Flujos de Trabajo para Jornadas**

### **Flujo 1: Validación antes de crear jornadas**

```javascript
const validarAntesDeCrearJornadas = async (ligaId) => {
  // 1. Obtener información completa
  const datos = await obtenerEquiposParaJornadas(ligaId);
  
  // 2. Verificar que todos los grupos están listos
  const gruposProblematicos = datos.grupos.filter(g => !g.puedeGenerarJornadas);
  
  if (gruposProblematicos.length > 0) {
    console.error('Grupos con problemas:', gruposProblematicos.map(g => g.grupoNumero));
    return false;
  }
  
  // 3. Verificar que no hay equipos sin asignar
  if (datos.equiposSinAsignar > 0) {
    console.error(`${datos.equiposSinAsignar} equipos sin grupo asignado`);
    return false;
  }
  
  console.log('✅ Liga lista para generar jornadas');
  console.log(`Total de partidos: ${datos.resumen.totalCalculos.partidosTotalesLiga}`);
  console.log(`Jornadas máximas: ${datos.resumen.totalCalculos.jornadasMaximas}`);
  
  return true;
};
```

### **Flujo 2: Crear jornadas por grupo**

```javascript
const crearJornadasPorGrupo = async (ligaId) => {
  // 1. Validar configuración
  const esValida = await validarAntesDeCrearJornadas(ligaId);
  if (!esValida) return;
  
  // 2. Obtener datos para jornadas
  const datos = await obtenerEquiposParaJornadas(ligaId);
  
  // 3. Crear jornadas para cada grupo
  for (const grupo of datos.grupos) {
    console.log(`Creando jornadas para Grupo ${grupo.grupoNumero}...`);
    
    try {
      // Llamar al endpoint de generación de fixtures (implementar en partido service)
      const fixtures = await fetch(`/api/partido/generate-fixtures/${ligaId}?grupo=${grupo.grupoNumero}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          equipos: grupo.equipos.map(e => e.id),
          vueltas: datos.liga.vueltas
        })
      });
      
      const result = await fixtures.json();
      console.log(`✅ Grupo ${grupo.grupoNumero}: ${grupo.calculos.partidosTotales} partidos creados`);
      
    } catch (error) {
      console.error(`❌ Error en Grupo ${grupo.grupoNumero}:`, error);
    }
  }
  
  console.log('🏐 Todas las jornadas han sido creadas');
};
```

### **Flujo 3: Selector de equipos para jornada manual**

```javascript
const SelectorEquiposJornada = ({ ligaId, grupoSeleccionado, onEquiposSelected }) => {
  const [datos, setDatos] = useState(null);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  
  useEffect(() => {
    cargarEquipos();
  }, [ligaId, grupoSeleccionado]);
  
  const cargarEquipos = async () => {
    const url = grupoSeleccionado 
      ? `/api/liga/${ligaId}/equipos?grupo=${grupoSeleccionado}`
      : `/api/liga/${ligaId}/equipos/jornadas`;
    
    const response = await fetch(url);
    const data = await response.json();
    setDatos(data);
  };
  
  const toggleEquipo = (equipoId) => {
    setEquiposSeleccionados(prev => 
      prev.includes(equipoId) 
        ? prev.filter(id => id !== equipoId)
        : [...prev, equipoId]
    );
  };
  
  const puedeCrearPartidos = equiposSeleccionados.length >= 2 && equiposSeleccionados.length % 2 === 0;
  
  return (
    <div className="selector-equipos">
      <h3>Seleccionar Equipos para Jornada</h3>
      
      {datos?.grupos?.map(grupo => (
        <div key={grupo.grupoNumero} className="grupo-equipos">
          <h4>Grupo {grupo.grupoNumero} ({grupo.cantidadEquipos} equipos)</h4>
          
          <div className="equipos-grid">
            {grupo.equipos.map(equipo => (
              <div 
                key={equipo.id} 
                className={`equipo-card ${equiposSeleccionados.includes(equipo.id) ? 'selected' : ''}`}
                onClick={() => toggleEquipo(equipo.id)}
              >
                <div className="equipo-nombre">{equipo.nombre}</div>
                <div className="equipo-capitan">{equipo.capitan.nombre}</div>
                <div className="equipo-color" style={{backgroundColor: equipo.color}}></div>
              </div>
            ))}
          </div>
          
          <div className="grupo-calculos">
            <small>
              Partidos totales grupo: {grupo.calculos.partidosTotales} | 
              Jornadas: {grupo.calculos.jornadas}
            </small>
          </div>
        </div>
      )) || (
        // Si es un grupo específico
        datos?.equipos?.map(equipo => (
          <div 
            key={equipo.id} 
            className={`equipo-card ${equiposSeleccionados.includes(equipo.id) ? 'selected' : ''}`}
            onClick={() => toggleEquipo(equipo.id)}
          >
            <div className="equipo-nombre">{equipo.nombre}</div>
            <div className="equipo-capitan">{equipo.capitan.nombre}</div>
          </div>
        ))
      )}
      
      <div className="acciones">
        <div className="equipos-seleccionados">
          Equipos seleccionados: {equiposSeleccionados.length}
        </div>
        
        <button 
          onClick={() => onEquiposSelected(equiposSeleccionados)}
          disabled={!puedeCrearPartidos}
          className="btn-crear-partidos"
        >
          {puedeCrearPartidos 
            ? `Crear ${equiposSeleccionados.length / 2} Partidos`
            : 'Selecciona equipos (par número)'
          }
        </button>
      </div>
    </div>
  );
};
```

---

## 📊 **Información de Cálculos Automáticos**

El endpoint `/api/liga/{id}/equipos/jornadas` incluye cálculos automáticos para cada grupo:

### **Fórmulas utilizadas**:

```javascript
// Para cada grupo:
const partidosPorEquipo = (numeroEquipos - 1) * vueltas;
const partidosTotales = (numeroEquipos * (numeroEquipos - 1) / 2) * vueltas;
const jornadas = (numeroEquipos % 2 === 0 ? numeroEquipos - 1 : numeroEquipos) * vueltas;
const partidosPorJornada = numeroEquipos % 2 === 0 ? numeroEquipos / 2 : (numeroEquipos - 1) / 2;
```

### **Ejemplo de cálculos**:

| Equipos | Vueltas | Partidos/Equipo | Partidos Totales | Jornadas | Partidos/Jornada |
|---------|---------|-----------------|------------------|----------|------------------|
| 4       | 1       | 3               | 6                | 3        | 2                |
| 4       | 2       | 6               | 12               | 6        | 2                |
| 5       | 1       | 4               | 10               | 5        | 2                |
| 6       | 1       | 5               | 15               | 5        | 3                |
| 8       | 2       | 14              | 56               | 14       | 4                |

---

## 🎨 **Componente Frontend de Ejemplo**

```typescript
// EquiposParaJornadas.tsx
interface EquiposParaJornadasProps {
  ligaId: number;
  onJornadasCreated: () => void;
}

const EquiposParaJornadas: React.FC<EquiposParaJornadasProps> = ({ 
  ligaId, 
  onJornadasCreated 
}) => {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [ligaId]);

  const cargarDatos = async () => {
    try {
      const response = await fetch(`/api/liga/${ligaId}/equipos/jornadas`);
      const data = await response.json();
      setDatos(data);
    } catch (error) {
      toast.error('Error al cargar equipos');
    }
  };

  const crearJornadasCompletas = async () => {
    setLoading(true);
    try {
      for (const grupo of datos.grupos) {
        await fetch(`/api/partido/generate-fixtures/${ligaId}?grupo=${grupo.grupoNumero}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      toast.success('Jornadas creadas exitosamente');
      onJornadasCreated();
    } catch (error) {
      toast.error('Error al crear jornadas');
    } finally {
      setLoading(false);
    }
  };

  if (!datos) return <Loading />;

  return (
    <div className="equipos-para-jornadas">
      <div className="header">
        <h2>Equipos para Jornadas - {datos.liga.nombre}</h2>
        <div className="resumen">
          <span>Equipos: {datos.totalEquipos}</span>
          <span>Grupos: {datos.resumen.gruposConfigurados}</span>
          <span>Partidos totales: {datos.resumen.totalCalculos.partidosTotalesLiga}</span>
        </div>
      </div>

      <div className="grupos-container">
        {datos.grupos.map(grupo => (
          <div key={grupo.grupoNumero} className="grupo-card">
            <div className="grupo-header">
              <h3>Grupo {grupo.grupoNumero}</h3>
              <span className={`status ${grupo.puedeGenerarJornadas ? 'ready' : 'not-ready'}`}>
                {grupo.puedeGenerarJornadas ? '✅ Listo' : '❌ No listo'}
              </span>
            </div>

            <div className="grupo-stats">
              <div>Equipos: {grupo.cantidadEquipos}</div>
              <div>Partidos: {grupo.calculos.partidosTotales}</div>
              <div>Jornadas: {grupo.calculos.jornadas}</div>
            </div>

            <div className="equipos-list">
              {grupo.equipos.map(equipo => (
                <div key={equipo.id} className="equipo-item">
                  <span className="equipo-nombre">{equipo.nombre}</span>
                  <span className="equipo-capitan">{equipo.capitan.nombre}</span>
                </div>
              ))}
            </div>

            <button 
              className="btn-grupo"
              onClick={() => setGrupoSeleccionado(grupo.grupoNumero)}
            >
              Ver Detalles Grupo {grupo.grupoNumero}
            </button>
          </div>
        ))}
      </div>

      {datos.equiposSinGrupo.length > 0 && (
        <div className="equipos-sin-grupo">
          <h4>⚠️ Equipos sin grupo ({datos.equiposSinGrupo.length})</h4>
          <div className="equipos-list">
            {datos.equiposSinGrupo.map(equipo => (
              <div key={equipo.id} className="equipo-sin-grupo">
                {equipo.nombre}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="acciones">
        <button 
          onClick={crearJornadasCompletas}
          disabled={loading || datos.resumen.gruposListosParaJornadas !== datos.resumen.gruposConfigurados}
          className="btn-crear-jornadas"
        >
          {loading ? 'Creando...' : 'Crear Todas las Jornadas'}
        </button>
      </div>
    </div>
  );
};
```

---

## 🚨 **Casos de Error y Validación**

### **Errores comunes**:

```javascript
// Liga no encontrada
{
  "statusCode": 404,
  "message": "Liga no encontrada"
}

// Grupo inválido
{
  "statusCode": 400,
  "message": "El grupo 5 no existe en esta liga"
}

// Sin permisos
{
  "statusCode": 403,
  "message": "Sin permisos para acceder a esta liga"
}
```

### **Validaciones automáticas**:

- ✅ Liga debe existir y estar activa
- ✅ Grupo debe ser válido (1 ≤ grupo ≤ numeroGrupos)
- ✅ Equipos deben pertenecer a la liga
- ✅ Mínimo 2 equipos por grupo para generar jornadas
- ✅ Autenticación y permisos requeridos

---

## 🎯 **Resumen de Endpoints para Frontend**

### **Para obtener equipos**:
1. `GET /api/equipo?ligaId={id}&grupo={grupo}` - Lista simple
2. `GET /api/liga/{id}/equipos?grupo={grupo}` - Con info de liga
3. `GET /api/liga/{id}/equipos/jornadas` - Para generación de jornadas

### **Para gestión de grupos**:
4. `GET /api/equipo/grupos/liga/{id}` - Estado de grupos
5. `POST /api/equipo/grupos/asignar-automatico` - Asignación automática
6. `GET /api/equipo/grupos/validar/{id}` - Validación

### **Flujo recomendado**:
1. **Configurar grupos** → Usar endpoints de gestión de grupos
2. **Validar configuración** → Verificar que todo esté listo
3. **Obtener equipos para jornadas** → Usar `/equipos/jornadas`
4. **Crear jornadas** → Usar datos obtenidos para fixtures

**¡Con estos endpoints tienes toda la información necesaria para crear y gestionar jornadas de manera eficiente!** 🏐🚀
