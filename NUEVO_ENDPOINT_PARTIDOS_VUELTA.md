# 🆕 **NUEVO ENDPOINT: Partidos por Vuelta**

## 🎯 **ENDPOINT CREADO**

```bash
GET /partido/liga/{ligaId}/vuelta/{numeroVuelta}
```

### **📋 Parámetros:**
- `ligaId`: ID de la liga
- `numeroVuelta`: Número de vuelta (1, 2, 3, etc.)
- `status` (opcional): Filtrar por estado del partido

### **🔍 Query Parameters Opcionales:**
```bash
# Todos los partidos de la vuelta
GET /partido/liga/1/vuelta/1

# Solo partidos finalizados
GET /partido/liga/1/vuelta/1?status=finalizado

# Solo partidos pendientes
GET /partido/liga/1/vuelta/1?status=programado

# Solo partidos en curso
GET /partido/liga/1/vuelta/1?status=en_curso
```

---

## 📊 **RESPUESTA COMPLETA**

```json
{
  "liga": {
    "id": 1,
    "nombre": "Pochutla Team",
    "vueltas": 2
  },
  "vuelta": {
    "numero": 1,
    "partidosTotales": 6,           // Total que debería haber (round-robin)
    "partidosCreados": 4,           // Partidos actualmente creados
    "partidosSinCrear": 2,          // Partidos faltantes por crear
    "completados": 4,               // Partidos finalizados
    "pendientes": 0,                // Partidos programados
    "enCurso": 0,                   // Partidos en curso
    "porcentajeCompletado": 66.67   // % de completado
  },
  "partidos": [
    {
      "id": 1,
      "jornada": 1,
      "vuelta": 1,
      "fechaHora": "2025-08-24T18:00:00.000Z",
      "status": "finalizado",
      "equipoLocal": {
        "id": 2,
        "nombre": "Julian Team"
      },
      "equipoVisitante": {
        "id": 3,
        "nombre": "Equipo Test"
      },
      "resultado": {
        "setsLocal": 2,
        "setsVisitante": 0,
        "puntosLocal": 2,
        "puntosVisitante": 0,
        "detallesSets": [
          { "local": 25, "visitante": 10 },
          { "local": 25, "visitante": 10 }
        ]
      },
      "jornadaPersonalizada": {
        "id": 1,
        "nombre": "Jornada del 24/8/2025"
      },
      "observaciones": null
    },
    {
      "id": 2,
      "jornada": 1,
      "vuelta": 1,
      "fechaHora": "2025-08-24T19:00:00.000Z",
      "status": "finalizado",
      "equipoLocal": {
        "id": 3,
        "nombre": "Equipo Test"
      },
      "equipoVisitante": {
        "id": 4,
        "nombre": "Equipo Capitan 3"
      },
      "resultado": {
        "setsLocal": 0,
        "setsVisitante": 2,
        "puntosLocal": 1,
        "puntosVisitante": 3,
        "detallesSets": [
          { "local": 22, "visitante": 25 },
          { "local": 18, "visitante": 25 }
        ]
      },
      "jornadaPersonalizada": {
        "id": 1,
        "nombre": "Jornada del 24/8/2025"
      },
      "observaciones": null
    }
    // ... más partidos
  ]
}
```

---

## 🎮 **CASOS DE USO**

### **1. Ver todos los partidos jugados de Vuelta 1:**
```bash
GET /partido/liga/1/vuelta/1?status=finalizado
```

### **2. Ver partidos pendientes de Vuelta 2:**
```bash
GET /partido/liga/1/vuelta/2?status=programado
```

### **3. Ver estado completo de Vuelta 1:**
```bash
GET /partido/liga/1/vuelta/1
```

### **4. Identificar partidos faltantes:**
```javascript
// Si partidosSinCrear > 0, faltan partidos por crear
if (response.vuelta.partidosSinCrear > 0) {
  console.log(`Faltan ${response.vuelta.partidosSinCrear} partidos por crear`);
}
```

---

## 🔍 **INFORMACIÓN DETALLADA QUE OBTIENES**

### **📊 Por cada partido:**
- ✅ **Información básica:** ID, jornada, vuelta, fecha
- ✅ **Equipos:** Nombres e IDs de local y visitante  
- ✅ **Estado:** programado, en_curso, finalizado
- ✅ **Resultado completo:** Sets, puntos, detalles por set (si está finalizado)
- ✅ **Jornada personalizada:** Si pertenece a una jornada creada manualmente
- ✅ **Observaciones:** Notas adicionales del partido

### **📈 Estadísticas de la vuelta:**
- ✅ **Progreso real:** Partidos que deberían existir vs creados
- ✅ **Estados:** Cuántos completados, pendientes, en curso
- ✅ **Porcentaje:** Avance real de la vuelta

---

## 🚀 **VENTAJAS DEL NUEVO ENDPOINT**

### **✅ Información Específica:**
- Solo partidos de la vuelta que necesitas
- Filtrado opcional por estado del partido
- Estadísticas precisas de esa vuelta específica

### **✅ Optimizado para Frontend:**
- Datos listos para mostrar en tablas
- Resultados formateados para UI
- Información de progreso para barras de avance

### **✅ Validaciones Incluidas:**
- Verifica que la liga exista
- Valida que el número de vuelta sea correcto
- Valida parámetros de estado si se especifican

---

## 📱 **EJEMPLO EN TU FRONTEND**

```javascript
// Obtener partidos jugados de vuelta 1
const response = await fetch('/partido/liga/1/vuelta/1?status=finalizado');
const data = await response.json();

// Mostrar en una tabla
data.partidos.forEach(partido => {
  console.log(`${partido.equipoLocal.nombre} ${partido.resultado.setsLocal} - ${partido.resultado.setsVisitante} ${partido.equipoVisitante.nombre}`);
});

// Mostrar progreso
console.log(`Vuelta ${data.vuelta.numero}: ${data.vuelta.porcentajeCompletado}% completada`);
console.log(`Partidos: ${data.vuelta.completados}/${data.vuelta.partidosTotales}`);
```

**🎉 ¡Ya tienes el endpoint perfecto para obtener partidos detallados por vuelta!**
