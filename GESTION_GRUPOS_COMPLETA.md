# 🏐 Gestión de Grupos en Ligas de Voleibol

## 🤔 **Tu Pregunta: ¿Cuándo se especifican los grupos?**

Excelente pregunta. Te explico **CUÁNDO y CÓMO** se configuran los grupos en el sistema:

---

## 📅 **FLUJO TEMPORAL DE CONFIGURACIÓN**

### **1. AL CREAR LA LIGA** (Fase inicial)
```javascript
POST /api/liga
{
  "nombre": "Liga Metropolitana 2025",
  "numeroGrupos": 2,        // ← AQUÍ se define cuántos grupos habrá
  "vueltas": 2,
  "sistemaPuntos": "FIVB"
}
```
**Resultado**: Liga creada con **estructura de 2 grupos**

### **2. AL CREAR EQUIPOS** (Opcional durante creación)
```javascript
POST /api/equipo
{
  "nombre": "Tigres FC",
  "capitanId": 15,
  "ligaId": 5,
  "grupoNumero": 1         // ← OPCIONAL: Asignar grupo desde el inicio
}
```
**Resultado**: Equipo creado **ya asignado al Grupo 1**

### **3. ANTES DE INICIAR LA LIGA** (Fase de organización)
```javascript
// Asignación automática de todos los equipos
POST /api/equipo/grupos/asignar-automatico
{
  "ligaId": 5,
  "metodo": "BALANCEADO"   // BALANCEADO | ALEATORIO | POR_RANKING
}
```
**Resultado**: Todos los equipos **distribuidos automáticamente** en grupos

### **4. VALIDACIÓN FINAL** (Antes del inicio)
```javascript
GET /api/equipo/grupos/validar/5
```
**Resultado**: Verificación de que la configuración es **válida para iniciar**

---

## 🔧 **MÉTODOS DE ASIGNACIÓN DE GRUPOS**

### **Método 1: Asignación Individual** 
```javascript
PUT /api/equipo/12/grupo
{
  "grupoNumero": 2
}
```
**Cuándo usar**: Asignación manual específica

### **Método 2: Asignación Masiva**
```javascript
POST /api/equipo/grupos/asignar-masivo
{
  "asignaciones": [
    { "equipoId": 12, "grupoNumero": 1 },
    { "equipoId": 15, "grupoNumero": 1 },
    { "equipoId": 18, "grupoNumero": 2 },
    { "equipoId": 22, "grupoNumero": 2 }
  ]
}
```
**Cuándo usar**: Control total sobre asignaciones

### **Método 3: Asignación Automática** ⭐ **RECOMENDADO**
```javascript
POST /api/equipo/grupos/asignar-automatico
{
  "ligaId": 5,
  "metodo": "BALANCEADO"
}
```

**Métodos disponibles**:
- **BALANCEADO**: Distribuye equipos de manera equitativa
- **ALEATORIO**: Asignación aleatoria
- **POR_RANKING**: Por estadísticas (futuro)

---

## 📊 **EJEMPLO PRÁCTICO COMPLETO**

### **Escenario**: Liga con 10 equipos en 2 grupos

#### **Paso 1: Crear Liga**
```bash
curl -X POST /api/liga \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "nombre": "Liga Metropolitana 2025",
    "numeroGrupos": 2,
    "vueltas": 2
  }'
```

#### **Paso 2: Agregar Equipos** (sin asignar grupos aún)
```bash
# Equipo 1
curl -X POST /api/equipo \
  -d '{"nombre": "Tigres FC", "capitanId": 15, "ligaId": 5}'

# Equipo 2  
curl -X POST /api/equipo \
  -d '{"nombre": "Águilas United", "capitanId": 18, "ligaId": 5}'

# ... así hasta 10 equipos
```

#### **Paso 3: Ver Estado Actual**
```bash
curl -X GET /api/equipo/grupos/liga/5
```
**Respuesta**:
```json
{
  "liga": { "id": 5, "nombre": "Liga Metropolitana 2025", "numeroGrupos": 2 },
  "totalEquipos": 10,
  "equiposAsignados": 0,
  "equiposSinAsignar": 10,
  "grupos": [
    { "grupoNumero": 1, "cantidadEquipos": 0, "equipos": [] },
    { "grupoNumero": 2, "cantidadEquipos": 0, "equipos": [] }
  ],
  "equiposSinGrupo": [
    { "id": 12, "nombre": "Tigres FC" },
    { "id": 15, "nombre": "Águilas United" },
    // ... 8 equipos más
  ]
}
```

#### **Paso 4: Asignación Automática**
```bash
curl -X POST /api/equipo/grupos/asignar-automatico \
  -d '{
    "ligaId": 5,
    "metodo": "BALANCEADO"
  }'
```
**Respuesta**:
```json
{
  "message": "Grupos asignados automáticamente usando método BALANCEADO",
  "totalEquipos": 10,
  "equiposPorGrupo": 5,
  "resumenGrupos": [
    {
      "grupoNumero": 1,
      "cantidadEquipos": 5,
      "equipos": [
        { "id": 12, "nombre": "Tigres FC" },
        { "id": 18, "nombre": "Leones FC" },
        { "id": 22, "nombre": "Pumas FC" },
        { "id": 25, "nombre": "Jaguares FC" },
        { "id": 28, "nombre": "Halcones FC" }
      ]
    },
    {
      "grupoNumero": 2,
      "cantidadEquipos": 5,
      "equipos": [
        { "id": 15, "nombre": "Águilas United" },
        { "id": 19, "nombre": "Lobos United" },
        { "id": 23, "nombre": "Osos United" },
        { "id": 26, "nombre": "Cóndores United" },
        { "id": 29, "nombre": "Búhos United" }
      ]
    }
  ]
}
```

#### **Paso 5: Validación Final**
```bash
curl -X GET /api/equipo/grupos/validar/5
```
**Respuesta**:
```json
{
  "liga": { "id": 5, "nombre": "Liga Metropolitana 2025" },
  "totalEquipos": 10,
  "equiposAsignados": 10,
  "equiposSinAsignar": 0,
  "validacion": {
    "esValida": true,
    "problemas": [],
    "recomendaciones": [],
    "puedeIniciarLiga": true
  }
}
```

#### **Paso 6: ¡Liga Lista para Iniciar!**
```bash
# Generar fixtures por grupo
curl -X POST /api/partido/generate-fixtures/5?grupo=1
curl -X POST /api/partido/generate-fixtures/5?grupo=2
```

---

## ⚠️ **VALIDACIONES AUTOMÁTICAS**

### **Al Asignar Grupos**:
✅ **Grupo válido**: No puede exceder `numeroGrupos` de la liga  
✅ **Grupo positivo**: Debe ser ≥ 1  
✅ **Liga existe**: Verificar que la liga esté activa  

### **Antes de Iniciar Liga**:
✅ **Todos asignados**: No hay equipos sin grupo  
✅ **Mínimo por grupo**: Al menos 2 equipos por grupo  
✅ **Balance aceptable**: Diferencia máxima de 1 equipo entre grupos  

---

## 🚨 **CASOS DE ERROR COMUNES**

### **Error 1: Grupo inválido**
```json
{
  "statusCode": 400,
  "message": "El grupo 3 no es válido. La liga 'Liga Metropolitana 2025' solo tiene 2 grupos"
}
```

### **Error 2: Equipos sin asignar**
```json
{
  "validacion": {
    "esValida": false,
    "problemas": ["5 equipos sin grupo asignado"],
    "recomendaciones": ["Usar asignación automática o asignar manualmente"],
    "puedeIniciarLiga": false
  }
}
```

### **Error 3: Grupo insuficiente**
```json
{
  "validacion": {
    "esValida": false,
    "problemas": ["1 grupos con menos de 2 equipos"],
    "recomendaciones": ["Mínimo 2 equipos por grupo para competición válida"],
    "puedeIniciarLiga": false
  }
}
```

---

## 🎯 **RESPUESTA A TU PREGUNTA**

### **¿CUÁNDO se especifican los grupos?**

1. **📝 Número de grupos**: Se define **AL CREAR LA LIGA** (`numeroGrupos`)
2. **👥 Asignación de equipos**: Se hace **DESPUÉS** de crear equipos, **ANTES** de iniciar la liga
3. **⏰ Momento ideal**: Cuando ya tienes todos los equipos registrados
4. **🔧 Método recomendado**: Asignación automática con método **BALANCEADO**

### **¿DÓNDE se gestiona?**

- **Liga Controller**: Define cuántos grupos (`numeroGrupos`)
- **Equipo Controller**: Asigna equipos a grupos específicos
- **Validación**: Antes de generar fixtures/iniciar liga

### **¿Por qué esta flexibilidad?**

1. **🆕 Equipos pueden llegar tarde**: Algunos se inscriben después
2. **🔄 Cambios de último minuto**: Retiros, nuevos equipos
3. **⚖️ Balance deportivo**: Redistribuir por nivel/ranking
4. **🎲 Variedad**: Diferentes métodos según preferencia del admin

---

## 🚀 **FLUJO RECOMENDADO PARA FRONTEND**

### **Dashboard de Configuración de Liga**:

1. **Crear Liga** → Especificar `numeroGrupos`
2. **Agregar Equipos** → Sin asignar grupos inicialmente  
3. **Vista "Configurar Grupos"**:
   - Mostrar equipos sin asignar
   - Botón "Asignación Automática"
   - Opción de asignación manual
   - Vista previa de grupos
4. **Validación** → Mostrar problemas/recomendaciones
5. **Confirmar** → Generar fixtures e iniciar liga

### **Componentes UI Sugeridos**:
```javascript
// Componente principal
<ConfiguracionGrupos ligaId={5} />

// Sub-componentes
<EquiposSinAsignar />
<GruposPreview />
<AsignacionAutomatica />
<ValidacionGrupos />
<ConfirmarConfiguracion />
```

¡El sistema te da **flexibilidad total** para manejar grupos según las necesidades reales de tu liga! 🏐✨
