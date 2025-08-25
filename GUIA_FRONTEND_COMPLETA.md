# 📋 GUÍA FRONTEND: Gestión de Jornadas y Partidos

## 🎯 **ENDPOINTS PRINCIPALES PARA GESTIÓN**

### **1. Estado de vueltas por liga (PRINCIPAL)**
```
GET /partido/estado-vueltas/liga/{ligaId}
```

#### **Ejemplo de solicitud:**
```javascript
const response = await fetch('/partido/estado-vueltas/liga/1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

#### **Ejemplo de respuesta:**
```json
{
  "liga": {
    "id": 1,
    "nombre": "Liga Nacional de Voleibol 2024",
    "vueltas": 2
  },
  "vueltaActual": 2,
  "vueltas": [
    {
      "numero": 1,
      "totalPartidos": 28,
      "completados": 28,
      "pendientes": 0,
      "porcentajeCompletado": 100,
      "estado": "completada",
      "puedeCrearJornada": false
    },
    {
      "numero": 2,
      "totalPartidos": 28,
      "completados": 15,
      "pendientes": 13,
      "porcentajeCompletado": 53.57,
      "estado": "en_curso",
      "puedeCrearJornada": true
    }
  ],
  "resumen": {
    "totalVueltas": 2,
    "vueltasCompletadas": 1,
    "vueltasEnCurso": 1,
    "vueltasSinIniciar": 0
  }
}
```

---

### **2. Ver partidos pendientes por equipo**
```
GET /partido/pendientes/equipo/{equipoId}
```

#### **Ejemplo de solicitud:**
```javascript
const response = await fetch('/partido/pendientes/equipo/1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

#### **Ejemplo de respuesta:**
```json
{
  "equipo": {
    "id": 1,
    "nombre": "Águilas Voladoras",
    "capitan": {
      "id": 10,
      "nombre": "Carlos López"
    }
  },
  "partidosPendientes": {
    "total": 5,
    "programados": 5,
    "enCurso": 0,
    "partidos": [
      {
        "id": 45,
        "jornada": 8,
        "vuelta": 2,
        "fechaHora": "2024-02-15T19:00:00Z",
        "status": "PROGRAMADO",
        "rivales": {
          "id": 3,
          "nombre": "Rayos del Norte"
        },
        "esLocal": true,
        "jornadaPersonalizada": {
          "id": 12,
          "nombre": "Jornada de Recuperación"
        }
      },
      {
        "id": 46,
        "jornada": 9,
        "vuelta": 2,
        "fechaHora": null,
        "status": "PROGRAMADO",
        "rivales": {
          "id": 5,
          "nombre": "Tigres del Sur"
        },
        "esLocal": false,
        "jornadaPersonalizada": null
      }
    ]
  },
  "estatisticas": {
    "partidosJugados": 8,
    "partidosGanados": 6,
    "partidosPerdidos": 2,
    "setsAFavor": 18,
    "setsEnContra": 8,
    "puntosLiga": 18
  }
}
```

---

### **3. Ver todos los partidos de una liga**
```
GET /partido/liga/{ligaId}
GET /partido/liga/{ligaId}?jornada={numeroJornada}
```

#### **Ejemplo de solicitud:**
```javascript
// Todos los partidos
const response = await fetch('/partido/liga/1');

// Partidos de jornada específica
const response = await fetch('/partido/liga/1?jornada=5');
```

#### **Ejemplo de respuesta:**
```json
[
  {
    "id": 42,
    "jornada": 5,
    "vuelta": 1,
    "fechaHora": "2024-01-20T18:00:00Z",
    "status": "FINALIZADO",
    "setsEquipoLocal": 2,
    "setsEquipoVisitante": 1,
    "detallesSets": [
      { "local": 25, "visitante": 20 },
      { "local": 23, "visitante": 25 },
      { "local": 25, "visitante": 18 }
    ],
    "puntosEquipoLocal": 3,
    "puntosEquipoVisitante": 1,
    "observaciones": "Partido muy reñido",
    "equipoLocal": {
      "id": 1,
      "nombre": "Águilas Voladoras",
      "color": "#FF5733",
      "grupoNumero": 0,
      "capitan": {
        "id": 10,
        "nombre": "Carlos López"
      }
    },
    "equipoVisitante": {
      "id": 3,
      "nombre": "Rayos del Norte",
      "color": "#33C1FF",
      "grupoNumero": 0,
      "capitan": {
        "id": 15,
        "nombre": "Ana Martínez"
      }
    },
    "liga": {
      "id": 1,
      "nombre": "Liga Nacional 2024"
    }
  },
  {
    "id": 43,
    "jornada": 6,
    "vuelta": 1,
    "fechaHora": null,
    "status": "PROGRAMADO",
    "setsEquipoLocal": 0,
    "setsEquipoVisitante": 0,
    "detallesSets": null,
    "puntosEquipoLocal": 0,
    "puntosEquipoVisitante": 0,
    "observaciones": null,
    "equipoLocal": {
      "id": 2,
      "nombre": "Halcones Azules",
      "color": "#0033FF"
    },
    "equipoVisitante": {
      "id": 4,
      "nombre": "Leones Dorados",
      "color": "#FFD700"
    }
  }
]
```

---

### **4. Crear jornada personalizada**
```
POST /partido/jornada-personalizada
```

#### **Ejemplo de solicitud:**
```javascript
const response = await fetch('/partido/jornada-personalizada', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    "nombre": "Jornada 8 - Segunda Vuelta",
    "descripcion": "Jornada de recuperación para completar la segunda vuelta",
    "ligaId": 1,
    "fechaProgramada": "2024-02-20",
    "horaProgramada": "19:00",
    "partidos": [
      {
        "equipoLocalId": 1,
        "equipoVisitanteId": 3,
        "fechaHora": "2024-02-20T19:00:00Z"
      },
      {
        "equipoLocalId": 2,
        "equipoVisitanteId": 4,
        "fechaHora": "2024-02-20T20:30:00Z"
      }
    ]
  })
});
```

#### **Ejemplo de respuesta:**
```json
{
  "message": "Jornada personalizada creada exitosamente",
  "jornada": {
    "id": 15,
    "numero": 15,
    "nombre": "Jornada 8 - Segunda Vuelta",
    "descripcion": "Jornada de recuperación para completar la segunda vuelta",
    "tipo": "PERSONALIZADA",
    "status": "PROGRAMADA",
    "partidosTotales": 2,
    "partidosCompletados": 0,
    "fechaProgramada": "2024-02-20T00:00:00Z",
    "horaProgramada": "19:00",
    "liga": {
      "id": 1,
      "nombre": "Liga Nacional 2024"
    },
    "creadoPor": {
      "id": 5,
      "nombre": "Admin Liga",
      "correo": "admin@liga.com"
    },
    "partidos": [
      {
        "id": 75,
        "jornada": 15,
        "vuelta": 2,
        "fechaHora": "2024-02-20T19:00:00Z",
        "status": "PROGRAMADO",
        "equipoLocal": {
          "id": 1,
          "nombre": "Águilas Voladoras"
        },
        "equipoVisitante": {
          "id": 3,
          "nombre": "Rayos del Norte"
        }
      },
      {
        "id": 76,
        "jornada": 15,
        "vuelta": 2,
        "fechaHora": "2024-02-20T20:30:00Z",
        "status": "PROGRAMADO",
        "equipoLocal": {
          "id": 2,
          "nombre": "Halcones Azules"
        },
        "equipoVisitante": {
          "id": 4,
          "nombre": "Leones Dorados"
        }
      }
    ]
  }
}
```

---

### **5. Subir resultado de partido**
```
PUT /partido/{partidoId}/resultado
```

#### **Ejemplo de solicitud:**
```javascript
const response = await fetch('/partido/45/resultado', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    "setsEquipoLocal": 2,
    "setsEquipoVisitante": 1,
    "detallesSets": [
      { "local": 25, "visitante": 20 },
      { "local": 23, "visitante": 25 },
      { "local": 25, "visitante": 18 }
    ],
    "observaciones": "Excelente partido, muy reñido en el segundo set"
  })
});
```

#### **Ejemplo de respuesta:**
```json
{
  "id": 45,
  "jornada": 8,
  "vuelta": 2,
  "fechaHora": "2024-02-15T19:00:00Z",
  "status": "FINALIZADO",
  "setsEquipoLocal": 2,
  "setsEquipoVisitante": 1,
  "detallesSets": [
    { "local": 25, "visitante": 20 },
    { "local": 23, "visitante": 25 },
    { "local": 25, "visitante": 18 }
  ],
  "puntosEquipoLocal": 3,
  "puntosEquipoVisitante": 1,
  "observaciones": "Excelente partido, muy reñido en el segundo set",
  "equipoLocal": {
    "id": 1,
    "nombre": "Águilas Voladoras"
  },
  "equipoVisitante": {
    "id": 3,
    "nombre": "Rayos del Norte"
  },
  "liga": {
    "id": 1,
    "nombre": "Liga Nacional 2024"
  }
}
```

---

### **6. Ver tabla de posiciones**
```
GET /partido/tabla/{ligaId}
GET /partido/tabla/{ligaId}?grupo=1
```

#### **Ejemplo de solicitud:**
```javascript
const response = await fetch('/partido/tabla/1');
```

#### **Ejemplo de respuesta:**
```json
[
  {
    "equipo": {
      "id": 1,
      "nombre": "Águilas Voladoras",
      "color": "#FF5733",
      "grupoNumero": 0,
      "capitan": {
        "id": 10,
        "nombre": "Carlos López",
        "correo": "carlos@email.com"
      }
    },
    "partidosJugados": 10,
    "victorias": 8,
    "derrotas": 2,
    "setsGanados": 24,
    "setsPerdidos": 8,
    "puntosAFavor": 650,
    "puntosEnContra": 520,
    "puntosLiga": 24,
    "setRatio": 3.0,
    "pointRatio": 1.25
  },
  {
    "equipo": {
      "id": 3,
      "nombre": "Rayos del Norte",
      "color": "#33C1FF",
      "grupoNumero": 0
    },
    "partidosJugados": 10,
    "victorias": 6,
    "derrotas": 4,
    "setsGanados": 20,
    "setsPerdidos": 15,
    "puntosAFavor": 580,
    "puntosEnContra": 560,
    "puntosLiga": 18,
    "setRatio": 1.33,
    "pointRatio": 1.04
  }
]
```

---

### **7. Estado general completo de liga**
```
GET /liga/{ligaId}/estado-general
```

#### **Ejemplo de respuesta (resumida):**
```json
{
  "liga": {
    "id": 1,
    "nombre": "Liga Nacional de Voleibol 2024",
    "status": "EN_CURSO",
    "vueltas": 2,
    "numeroGrupos": 1,
    "sistemaPuntos": "FIVB",
    "fechaInicio": "2024-01-15",
    "fechaFin": "2024-06-30",
    "adminLiga": {
      "id": 5,
      "nombre": "Juan Pérez"
    },
    "sede": {
      "id": 2,
      "nombre": "Polideportivo Central"
    }
  },
  "resumenGeneral": {
    "equiposTotal": 8,
    "partidosTotales": 56,
    "partidosCompletados": 43,
    "partidosPendientes": 13,
    "porcentajeCompletado": 76.79,
    "vueltas": 2,
    "jornadaActual": 14
  },
  "vueltas": [
    {
      "numero": 1,
      "partidosTotales": 28,
      "partidosCompletados": 28,
      "partidosPendientes": 0,
      "porcentajeCompletado": 100,
      "jornadaActual": 14,
      "proximaJornada": null,
      "totalJornadas": 14,
      "estado": "completada",
      "tabla": [
        // Tabla específica de la vuelta 1
      ],
      "proximosPartidos": []
    },
    {
      "numero": 2,
      "partidosTotales": 28,
      "partidosCompletados": 15,
      "partidosPendientes": 13,
      "porcentajeCompletado": 53.57,
      "jornadaActual": 8,
      "proximaJornada": 9,
      "totalJornadas": 14,
      "estado": "en_curso",
      "proximosPartidos": [
        {
          "id": 46,
          "equipoLocal": {
            "id": 2,
            "nombre": "Halcones Azules"
          },
          "equipoVisitante": {
            "id": 4,
            "nombre": "Leones Dorados"
          },
          "jornada": 9,
          "fechaHora": null
        }
      ]
    }
  ],
  "equipos": [
    {
      "id": 1,
      "nombre": "Águilas Voladoras",
      "capitan": {
        "id": 10,
        "nombre": "Carlos López"
      },
      "grupoNumero": 0,
      "estadisticasGenerales": {
        "partidosJugados": 15,
        "partidosGanados": 12,
        "partidosPerdidos": 3,
        "setsAFavor": 36,
        "setsEnContra": 12,
        "puntosLiga": 36
      },
      "estadisticasPorVuelta": [
        {
          "vuelta": 1,
          "partidosJugados": 7,
          "partidosGanados": 6,
          "partidosPerdidos": 1,
          "setsAFavor": 18,
          "setsEnContra": 5,
          "puntosLiga": 18
        },
        {
          "vuelta": 2,
          "partidosJugados": 8,
          "partidosGanados": 6,
          "partidosPerdidos": 2,
          "setsAFavor": 18,
          "setsEnContra": 7,
          "puntosLiga": 18
        }
      ],
      "partidosPendientes": 3,
      "posicionGeneral": 1
    }
  ]
}
```

---

## 🎯 **COMPONENTES FRONTEND RECOMENDADOS**

### **1. Dashboard de Gestión de Vueltas**
```javascript
// Componente principal para mostrar estado de vueltas
const VueltasManager = () => {
  const [estadoVueltas, setEstadoVueltas] = useState(null);
  
  useEffect(() => {
    fetch(`/partido/estado-vueltas/liga/${ligaId}`)
      .then(res => res.json())
      .then(data => setEstadoVueltas(data));
  }, []);

  return (
    <div>
      <h2>Gestión de Vueltas - {estadoVueltas?.liga.nombre}</h2>
      <div>Vuelta Actual: {estadoVueltas?.vueltaActual}</div>
      
      {estadoVueltas?.vueltas.map(vuelta => (
        <div key={vuelta.numero}>
          <h3>Vuelta {vuelta.numero}</h3>
          <div>Estado: {vuelta.estado}</div>
          <div>Progreso: {vuelta.porcentajeCompletado.toFixed(1)}%</div>
          <div>Pendientes: {vuelta.pendientes} partidos</div>
          {vuelta.puedeCrearJornada && (
            <button>Crear Jornada</button>
          )}
        </div>
      ))}
    </div>
  );
};
```

### **2. Lista de Partidos Pendientes**
```javascript
const PartidosPendientes = ({ equipoId }) => {
  const [partidos, setPartidos] = useState(null);
  
  useEffect(() => {
    fetch(`/partido/pendientes/equipo/${equipoId}`)
      .then(res => res.json())
      .then(data => setPartidos(data));
  }, [equipoId]);

  return (
    <div>
      <h3>Próximos Partidos - {partidos?.equipo.nombre}</h3>
      {partidos?.partidosPendientes.partidos.map(partido => (
        <div key={partido.id}>
          <div>
            {partido.esLocal ? 'Local' : 'Visitante'} vs {partido.rivales.nombre}
          </div>
          <div>Vuelta: {partido.vuelta} | Jornada: {partido.jornada}</div>
          <div>Fecha: {partido.fechaHora || 'Por definir'}</div>
          <button onClick={() => subirResultado(partido.id)}>
            Subir Resultado
          </button>
        </div>
      ))}
    </div>
  );
};
```

### **3. Formulario de Resultado**
```javascript
const SubirResultado = ({ partidoId }) => {
  const [resultado, setResultado] = useState({
    setsEquipoLocal: 0,
    setsEquipoVisitante: 0,
    detallesSets: [],
    observaciones: ''
  });

  const agregarSet = () => {
    setResultado(prev => ({
      ...prev,
      detallesSets: [...prev.detallesSets, { local: 0, visitante: 0 }]
    }));
  };

  const submitResultado = async () => {
    const response = await fetch(`/partido/${partidoId}/resultado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(resultado)
    });
    
    if (response.ok) {
      alert('Resultado guardado exitosamente');
    }
  };

  return (
    <form onSubmit={submitResultado}>
      <div>
        <label>Sets Equipo Local:</label>
        <input 
          type="number" 
          value={resultado.setsEquipoLocal}
          onChange={(e) => setResultado(prev => ({
            ...prev, 
            setsEquipoLocal: parseInt(e.target.value)
          }))}
        />
      </div>
      
      <div>
        <label>Sets Equipo Visitante:</label>
        <input 
          type="number" 
          value={resultado.setsEquipoVisitante}
          onChange={(e) => setResultado(prev => ({
            ...prev, 
            setsEquipoVisitante: parseInt(e.target.value)
          }))}
        />
      </div>

      <div>
        <h4>Detalle por Sets:</h4>
        {resultado.detallesSets.map((set, index) => (
          <div key={index}>
            <input 
              placeholder="Puntos Local"
              type="number"
              value={set.local}
              onChange={(e) => {
                const newSets = [...resultado.detallesSets];
                newSets[index].local = parseInt(e.target.value);
                setResultado(prev => ({...prev, detallesSets: newSets}));
              }}
            />
            <input 
              placeholder="Puntos Visitante"
              type="number"
              value={set.visitante}
              onChange={(e) => {
                const newSets = [...resultado.detallesSets];
                newSets[index].visitante = parseInt(e.target.value);
                setResultado(prev => ({...prev, detallesSets: newSets}));
              }}
            />
          </div>
        ))}
        <button type="button" onClick={agregarSet}>Agregar Set</button>
      </div>

      <div>
        <textarea 
          placeholder="Observaciones"
          value={resultado.observaciones}
          onChange={(e) => setResultado(prev => ({
            ...prev, 
            observaciones: e.target.value
          }))}
        />
      </div>

      <button type="submit">Guardar Resultado</button>
    </form>
  );
};
```

---

## 🚀 **FLUJO RECOMENDADO PARA TU FRONTEND**

### **1. Pantalla Principal de Gestión:**
- Mostrar estado de vueltas con `GET /partido/estado-vueltas/liga/{id}`
- Dashboard con progreso visual de cada vuelta
- Botones para crear jornadas donde sea posible

### **2. Gestión de Jornadas:**
- Lista de equipos y sus partidos pendientes
- Formulario para crear jornadas personalizadas
- Validación automática de enfrentamientos

### **3. Registro de Resultados:**
- Lista de partidos por jornada
- Formularios para subir resultados set por set
- Confirmación y validación en tiempo real

### **4. Consulta de Información:**
- Tablas de posiciones actualizadas
- Histórico de resultados por partido
- Estadísticas por vuelta y generales

¡Con estos ejemplos tienes todo lo necesario para construir tu frontend completo! 🎉
