# Ejemplos Prácticos de Uso - Frontend

## Ejemplo 1: Crear Liga Completa (8 equipos, doble vuelta)

### Paso 1: Crear la Liga
```javascript
const liga = await fetch('/liga', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    nombre: "Liga Juvenil 2024",
    vueltas: 2, // Ida y vuelta
    sistemaPuntos: "fivb",
    fechaInicio: "2024-03-01",
    adminLigaId: 2,
    sedeId: 1
  })
});
```

### Paso 2: Crear 8 Equipos
```javascript
const equipos = [];
for (let i = 1; i <= 8; i++) {
  const equipo = await fetch('/equipo', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      nombre: `Equipo ${i}`,
      capitanId: capitanIds[i-1],
      ligaId: liga.id
    })
  });
  equipos.push(await equipo.json());
}
```

### Paso 3: Generar Fixture Automático
```javascript
const fixture = await fetch(`/partido/generate-fixtures/${liga.id}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

const result = await fixture.json();
// Result contendrá:
// {
//   totalPartidos: 56,      // 8×7÷2×2 = 56 partidos
//   partidosPorJornada: 4,  // 8÷2 = 4 partidos por jornada
//   totalJornadas: 14,      // 7×2 = 14 jornadas
//   partidos: [...]         // Array con todos los partidos
// }
```

### Paso 4: Mostrar Calendario por Jornada
```javascript
const getJornada = async (jornadaNum) => {
  const response = await fetch(`/partido/liga/${liga.id}?jornada=${jornadaNum}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Jornada 1: 4 partidos simultáneos
const jornada1 = await getJornada(1);
```

### Paso 5: Registrar Resultado
```javascript
const registrarResultado = async (partidoId, resultado) => {
  return fetch(`/partido/${partidoId}/resultado`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(resultado)
  });
};

// Ejemplo: Victoria 3-1 (local gana)
await registrarResultado(123, {
  setsEquipoLocal: 3,
  setsEquipoVisitante: 1,
  detallesSets: [
    {local: 25, visitante: 23},
    {local: 23, visitante: 25}, 
    {local: 25, visitante: 20},
    {local: 25, visitante: 22}
  ]
});
```

### Paso 6: Mostrar Tabla de Posiciones
```javascript
const tabla = await fetch(`/partido/tabla/${liga.id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const posiciones = await tabla.json();
// Retorna array ordenado por puntos, victorias, etc.
```

## Ejemplo 2: Liga con Grupos (16 equipos, 2 grupos de 8)

### Crear Liga con Grupos
```javascript
const liga = await fetch('/liga', {
  method: 'POST',
  body: JSON.stringify({
    nombre: "Liga Profesional",
    numeroGrupos: 2,
    vueltas: 1
    // ... otros campos
  })
});
```

### Asignar Equipos a Grupos
```javascript
// Grupo A (equipos 1-8)
for (let i = 0; i < 8; i++) {
  await fetch(`/equipo/${equiposIds[i]}/grupo`, {
    method: 'PUT',
    body: JSON.stringify({ grupoNumero: 1 })
  });
}

// Grupo B (equipos 9-16)  
for (let i = 8; i < 16; i++) {
  await fetch(`/equipo/${equiposIds[i]}/grupo`, {
    method: 'PUT',
    body: JSON.stringify({ grupoNumero: 2 })
  });
}
```

### Generar Fixtures por Grupo
```javascript
// Fixture Grupo A
const fixtureA = await fetch(`/partido/generate-fixtures/${liga.id}?grupo=1`, {
  method: 'POST'
});

// Fixture Grupo B
const fixtureB = await fetch(`/partido/generate-fixtures/${liga.id}?grupo=2`, {
  method: 'POST'
});
```

### Tabla por Grupo
```javascript
const tablaGrupoA = await fetch(`/partido/tabla/${liga.id}?grupo=1`);
const tablaGrupoB = await fetch(`/partido/tabla/${liga.id}?grupo=2`);
```

## Ejemplo 3: Gestión de Usuarios y QR

### Crear Capitán y Generar QR
```javascript
const capitan = await fetch('/usuario/jugador', {
  method: 'POST',
  body: JSON.stringify({
    nombre: "Carlos Rodríguez",
    correo: "carlos@example.com",
    password: "password123",
    rol: "jugador" // Se cambiará a capitán después
  })
});

// Cambiar rol a capitán
await fetch(`/usuario/${capitan.id}/role`, {
  method: 'PUT',
  body: JSON.stringify({ newRole: "capitan" })
});
```

### Login con QR
```javascript
// El jugador escanea su QR que contiene su código
const loginResponse = await fetch('/auth/login-sucursal', {
  method: 'POST',
  body: JSON.stringify({
    code: "scannedQrCode" // Viene del QR escaneado
  })
});
```

### Buscar Jugador por QR para Agregar a Equipo
```javascript
const jugador = await fetch(`/usuario/qr/${qrCodeEscaneado}`);
const jugadorData = await jugador.json();

// Agregar al equipo
await fetch(`/equipo/${equipoId}/jugadores`, {
  method: 'POST',
  body: JSON.stringify({
    jugadorId: jugadorData.id,
    numeroJugador: "10",
    posicion: "Atacante"
  })
});
```

## Ejemplo 4: Dashboard de Liga

### Obtener Estadísticas Completas
```javascript
const getDashboardData = async (ligaId) => {
  const [liga, equipos, partidos, tabla] = await Promise.all([
    fetch(`/liga/${ligaId}`).then(r => r.json()),
    fetch(`/equipo?ligaId=${ligaId}`).then(r => r.json()),
    fetch(`/partido/liga/${ligaId}`).then(r => r.json()),
    fetch(`/partido/tabla/${ligaId}`).then(r => r.json())
  ]);

  const partidosJugados = partidos.filter(p => p.status === 'finalizado').length;
  const partidosPendientes = partidos.filter(p => p.status === 'programado').length;
  
  return {
    liga,
    equipos: equipos.length,
    partidosJugados,
    partidosPendientes,
    tabla,
    progreso: Math.round((partidosJugados / partidos.length) * 100)
  };
};
```

### Siguiente Jornada
```javascript
const getSiguienteJornada = async (ligaId) => {
  const partidos = await fetch(`/partido/liga/${ligaId}`).then(r => r.json());
  
  // Buscar primera jornada con partidos pendientes
  const partidosPendientes = partidos.filter(p => p.status === 'programado');
  if (partidosPendientes.length === 0) return null;
  
  const siguienteJornada = Math.min(...partidosPendientes.map(p => p.jornada));
  
  return partidos.filter(p => 
    p.jornada === siguienteJornada && 
    p.status === 'programado'
  );
};
```

## Ejemplo 5: Validaciones Comunes

### Verificar si Liga puede Iniciar
```javascript
const canStartLiga = async (ligaId) => {
  const equipos = await fetch(`/equipo?ligaId=${ligaId}`).then(r => r.json());
  
  if (equipos.length < 2) {
    return { canStart: false, reason: "Se necesitan al menos 2 equipos" };
  }
  
  // Verificar que todos los equipos tengan jugadores
  const checks = await Promise.all(
    equipos.map(async (equipo) => {
      const jugadores = await fetch(`/equipo/${equipo.id}/jugadores`).then(r => r.json());
      return { equipoId: equipo.id, jugadores: jugadores.length };
    })
  );
  
  const equiposSinJugadores = checks.filter(c => c.jugadores === 0);
  if (equiposSinJugadores.length > 0) {
    return { 
      canStart: false, 
      reason: "Todos los equipos deben tener al menos un jugador" 
    };
  }
  
  return { canStart: true };
};
```

### Validar Resultado de Partido
```javascript
const validateResult = (setsLocal, setsVisitante, detalles) => {
  // Voleibol: máximo 5 sets, gana quien llega a 3
  if (setsLocal > 3 || setsVisitante > 3) {
    return { valid: false, error: "Máximo 3 sets por equipo" };
  }
  
  if (setsLocal === setsVisitante) {
    return { valid: false, error: "No puede haber empate" };
  }
  
  const ganador = setsLocal > setsVisitante ? setsLocal : setsVisitante;
  if (ganador !== 3) {
    return { valid: false, error: "El ganador debe tener exactamente 3 sets" };
  }
  
  if (detalles.length !== (setsLocal + setsVisitante)) {
    return { valid: false, error: "Detalles de sets inconsistentes" };
  }
  
  return { valid: true };
};
```

## Manejo de Estados

### Estados de Liga
```javascript
const LigaStatus = {
  PROGRAMADA: 'programada',    // Recién creada
  EN_CURSO: 'en_curso',       // Activa
  FINALIZADA: 'finalizada',   // Completada
  CANCELADA: 'cancelada'      // Cancelada
};
```

### Estados de Partido
```javascript
const PartidoStatus = {
  PROGRAMADO: 'programado',   // Esperando jugarse
  EN_CURSO: 'en_curso',       // En desarrollo
  FINALIZADO: 'finalizado',   // Completado
  CANCELADO: 'cancelado',     // Cancelado
  APLAZADO: 'aplazado'        // Pospuesto
};
```

Estos ejemplos cubren los casos de uso más comunes para integrar la API en una aplicación frontend.
