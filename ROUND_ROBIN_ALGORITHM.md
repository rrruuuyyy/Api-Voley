# Algoritmo Round-Robin - Implementación Técnica

## Descripción del Algoritmo

El algoritmo implementado en el servicio `PartidoService.generateRoundRobinFixtures()` utiliza el método del **círculo rotatorio** para generar un calendario balanceado donde todos los equipos se enfrentan entre sí.

## Cómo Funciona

### 1. Preparación de Equipos
- Si hay número impar de equipos, se agrega un equipo "bye" temporal (ID: -1)
- Esto asegura que siempre haya un número par de equipos para el algoritmo

### 2. Algoritmo del Círculo
```
Para n equipos y k vueltas:
- Equipo 0 permanece fijo
- Los demás equipos rotan en cada jornada
- En cada jornada se enfrentan: (0 vs n-j), (1+j vs n-1-(1-j)), etc.
```

### 3. Ejemplo Visual (6 equipos)
```
Jornada 1:  0-5  1-4  2-3
Jornada 2:  0-4  5-3  1-2  
Jornada 3:  0-3  4-2  5-1
Jornada 4:  0-2  3-1  4-5
Jornada 5:  0-1  2-5  3-4
```

### 4. Manejo de Múltiples Vueltas
- Para doble vuelta (k=2): Se repite el proceso
- En vuelta par, se intercambian local y visitante
- Esto simula "ida y vuelta"

### 5. Equipos con Bye
- Si hay equipos impares, algunos descansan cada jornada
- El algoritmo asegura distribución equitativa de descansos

## Propiedades del Algoritmo

### ✅ Garantías
- Cada equipo juega exactamente (n-1) × k partidos
- Cada par de equipos se enfrenta exactamente k veces
- Distribución balanceada de partidos locales y visitantes
- Máxima eficiencia: mínimo número de jornadas necesarias

### 📊 Estadísticas
- **Equipos pares**: n-1 jornadas, n/2 partidos por jornada
- **Equipos impares**: n jornadas, (n-1)/2 partidos por jornada + 1 bye

## Ventajas de Esta Implementación

1. **Balanceado**: Todos los equipos tienen las mismas oportunidades
2. **Eficiente**: Utiliza el mínimo número de jornadas posible
3. **Flexible**: Soporta múltiples vueltas y grupos
4. **Escalable**: Funciona con cualquier número de equipos
5. **Estándar**: Algoritmo reconocido internacionalmente

## Sistema de Puntos Integrado

La API calcula automáticamente los puntos según el sistema configurado:

### Sistema FIVB (Recomendado para Voleibol)
```typescript
if (setsLocal > setsVisitante) {
    // Victoria 3-0 o 3-1 → 3pts ganador, 0pts perdedor
    // Victoria 3-2 → 2pts ganador, 1pt perdedor
    return setsLocal === 3 && setsVisitante <= 1 
        ? { puntosLocal: 3, puntosVisitante: 0 }
        : { puntosLocal: 2, puntosVisitante: 1 };
}
```

### Sistema Simple
- Victoria: 3 puntos
- Derrota: 0 puntos

## Cálculo de Desempates

El sistema ordena automáticamente la tabla según criterios configurables:

```typescript
tabla.sort((a, b) => {
    if (a.puntosLiga !== b.puntosLiga) return b.puntosLiga - a.puntosLiga;
    if (a.victorias !== b.victorias) return b.victorias - a.victorias;
    if (a.setRatio !== b.setRatio) return b.setRatio - a.setRatio;
    return b.pointRatio - a.pointRatio;
});
```

## Extensibilidad

El sistema está diseñado para ser extensible:

- **Grupos múltiples**: Se puede ejecutar el algoritmo por grupo
- **Fases eliminatorias**: Los primeros de cada grupo pueden pasar a playoffs
- **Calendarios complejos**: Se pueden asignar fechas específicas a cada jornada
- **Restricciones**: Se pueden agregar reglas adicionales (días disponibles, canchas, etc.)

## Consideraciones de Performance

- La generación de fixtures es O(n²k) donde n=equipos, k=vueltas
- Para ligas grandes (>50 equipos), considerar ejecutar en background
- La tabla de posiciones se recalcula en tiempo real

## Testing del Algoritmo

Para verificar que el algoritmo funciona correctamente:

1. **Cada equipo juega (n-1)×k partidos**
2. **Total de partidos = n×(n-1)/2×k**
3. **No hay equipos que se enfrenten más de k veces**
4. **Distribución balanceada local/visitante**

Este algoritmo ha sido probado y es utilizado en competiciones deportivas a nivel mundial.
