# API Endpoint: Estado General de Liga

## GET `/api/liga/{id}/estado-general`

Este endpoint proporciona un estado detallado y completo de una liga, incluyendo información por vueltas, estadísticas de equipos, tablas de posiciones y progreso general.

### Permisos Requeridos
- `ADMINISTRADOR`
- `ADMIN_LIGA`

### Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | number | ID de la liga |

### Respuesta

La respuesta incluye información detallada dividida en las siguientes secciones:

#### Liga
Información básica de la liga:
```json
{
  "liga": {
    "id": 1,
    "nombre": "Liga Nacional de Voleibol 2024",
    "descripcion": "Liga profesional de voleibol",
    "status": "en_curso",
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
  }
}
```

#### Resumen General
Estadísticas globales de la liga:
```json
{
  "resumenGeneral": {
    "equiposTotal": 8,
    "partidosTotales": 56,
    "partidosCompletados": 32,
    "partidosPendientes": 24,
    "porcentajeCompletado": 57.14,
    "vueltas": 2,
    "jornadaActual": 12
  }
}
```

#### Vueltas
Información detallada por cada vuelta:
```json
{
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
        {
          "equipo": {
            "id": 1,
            "nombre": "Águilas Voladoras",
            "grupoNumero": 0
          },
          "partidosJugados": 7,
          "victorias": 6,
          "derrotas": 1,
          "setsGanados": 18,
          "setsPerdidos": 5,
          "puntosAFavor": 525,
          "puntosEnContra": 380,
          "puntosLiga": 18,
          "setRatio": 3.6,
          "pointRatio": 1.38
        }
      ],
      "proximosPartidos": []
    },
    {
      "numero": 2,
      "partidosTotales": 28,
      "partidosCompletados": 4,
      "partidosPendientes": 24,
      "porcentajeCompletado": 14.29,
      "jornadaActual": 2,
      "proximaJornada": 3,
      "totalJornadas": 14,
      "estado": "en_curso",
      "tabla": [...],
      "proximosPartidos": [
        {
          "id": 45,
          "equipoLocal": {
            "id": 1,
            "nombre": "Águilas Voladoras"
          },
          "equipoVisitante": {
            "id": 3,
            "nombre": "Rayos del Norte"
          },
          "jornada": 3,
          "fechaHora": "2024-02-15T19:00:00Z"
        }
      ]
    }
  ]
}
```

#### Tabla General
Tabla de posiciones general de toda la liga:
```json
{
  "tablaGeneral": [
    {
      "equipo": {
        "id": 1,
        "nombre": "Águilas Voladoras",
        "color": "#FF5733",
        "grupoNumero": 0,
        "capitan": {
          "id": 10,
          "nombre": "Carlos López"
        }
      },
      "partidosJugados": 11,
      "victorias": 9,
      "derrotas": 2,
      "setsGanados": 27,
      "setsPerdidos": 8,
      "puntosAFavor": 780,
      "puntosEnContra": 590,
      "puntosLiga": 27,
      "setRatio": 3.375,
      "pointRatio": 1.32
    }
  ]
}
```

#### Equipos
Estadísticas detalladas por equipo:
```json
{
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
        "partidosJugados": 11,
        "partidosGanados": 9,
        "partidosPerdidos": 2,
        "setsAFavor": 27,
        "setsEnContra": 8,
        "puntosLiga": 27
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
          "partidosJugados": 4,
          "partidosGanados": 3,
          "partidosPerdidos": 1,
          "setsAFavor": 9,
          "setsEnContra": 3,
          "puntosLiga": 9
        }
      ],
      "partidosPendientes": 3,
      "posicionGeneral": 1
    }
  ]
}
```

#### Próximas Jornadas
Información sobre jornadas programadas:
```json
{
  "proximasJornadas": [
    {
      "id": 15,
      "numero": 16,
      "nombre": "Jornada 16 - Segunda Vuelta",
      "tipo": "REGULAR",
      "fechaProgramada": "2024-02-20T18:00:00Z",
      "partidosPendientes": 4,
      "partidosTotales": 4
    }
  ]
}
```

### Estados de Vuelta

- `no_iniciada`: La vuelta aún no ha comenzado
- `en_curso`: La vuelta está en progreso
- `completada`: Todos los partidos de la vuelta han sido jugados

### Casos de Uso

Este endpoint es ideal para:

1. **Dashboard Administrativo**: Mostrar un resumen completo del estado de la liga
2. **Análisis de Progreso**: Comparar el rendimiento entre vueltas
3. **Planificación**: Ver próximos partidos y jornadas pendientes
4. **Estadísticas**: Obtener métricas detalladas por equipo y vuelta
5. **Reportes**: Generar informes de progreso de la liga

### Ejemplo de Uso Frontend

```javascript
// Obtener estado general de la liga
const response = await fetch('/api/liga/1/estado-general', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const estadoGeneral = await response.json();

// Mostrar progreso por vuelta
estadoGeneral.vueltas.forEach(vuelta => {
  console.log(`Vuelta ${vuelta.numero}: ${vuelta.porcentajeCompletado.toFixed(1)}% completada`);
  console.log(`Estado: ${vuelta.estado}`);
});

// Mostrar tabla de la primera vuelta
const primeraVuelta = estadoGeneral.vueltas[0];
console.log('Tabla Primera Vuelta:', primeraVuelta.tabla);

// Mostrar próximos partidos
if (estadoGeneral.proximasJornadas.length > 0) {
  console.log('Próximas jornadas:', estadoGeneral.proximasJornadas);
}
```

### Notas Importantes

- El endpoint requiere autenticación y permisos específicos
- Las estadísticas se calculan en tiempo real basándose en los partidos finalizados
- La tabla general incluye todos los partidos de todas las vueltas
- Las tablas por vuelta solo incluyen partidos de esa vuelta específica
- Los ratios se calculan automáticamente para evitar división por cero
