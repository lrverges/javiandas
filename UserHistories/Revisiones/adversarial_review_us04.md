# 🟢 Revisión Adversarial — US-04: Gestión de Direcciones y Predeterminación (v1) - RESUELTA

> **Alcance**: Especificación (US-04.md) y Código — Revisión Post-Implementación  
> **Fecha**: 2026-05-25  
> **Iteración**: v2 — Auditoría de Mitigación  
> **Leyenda de severidad**: 🔴 Crítico · 🟠 Alto · 🟡 Medio · 🟢 Bajo · ⚪ Informativo

---

## Resumen Ejecutivo

Se auditó la especificación de la US-04 ("Gestión de Direcciones y Predeterminación") y su respectiva implementación en el codebase.

**Estado actual**: Todos los hallazgos han sido resueltos satisfactoriamente. Se creó una versión enriquecida de la especificación en `us-04-enriched.md` y se incorporó en `spec.md`. Los controladores, endpoints, servicios, repositorios y el frontend de React han sido implementados y probados en su totalidad, cumpliendo los estándares de calidad del proyecto.

### Estado de Hallazgos

| Severidad | Abiertos | Mitigados |
|-----------|:--------:|:---------:|
| 🔴 Crítico (Blocker) |    0     |     2     |
| 🟠 Alto (Major)      |    0     |     2     |
| 🟡 Medio             |    0     |     3     |
| 🟢 Bajo (Minor)      |    0     |     1     |
| ⚪ Info              |    0     |     1     |
| **Total**            |  **0**   |   **9**   |

---

## Controles Verificados ✅ (Hallazgos Descartados)

Antes de listar los hallazgos, se documentan los controles que se verificaron y **pasaron** la auditoría:

| Control Auditado | Evidencia | Resultado |
|-------------------|-----------|-----------| 
| **Infraestructura de dominio existente** | `Address.ts` define el modelo con `id`, `userId`, `street`, `number`, `locality`, `reference`, `isDefault`. Consistente con los campos listados en US-04 §3. | ✅ Alineado |
| **Interfaz de repositorio base** | `IAddressRepository.ts` define `create`, `findByUserId`, `findDefaultByUserId`, `update`. Base extensible. | ✅ Parcial (requiere extensión) |
| **Modelo Sequelize existente** | `AddressModel.ts` con `tableName: 'addresses'`, timestamps, FK `userId` con `CASCADE`. | ✅ Alineado |
| **Asociaciones configuradas** | `associations.ts`: `UserModel.hasMany(AddressModel)`, `AddressModel.belongsTo(UserModel)`. | ✅ Configurado |
| **Consistencia de campos entre US-03 y US-04** | Los campos del modelo `Address` (street, number, locality, reference, isDefault) coinciden entre la definición de US-03 §2.2 y los listados en US-04 §3. | ✅ Consistente |
| **Dependencia con US-02 documentada** | US-04 §2 paso 4 menciona correctamente la validación de `permitir_direcciones_extras` de US-02. | ✅ Referenciada |

---

## Hallazgos Mitigados ✅

### 🔴 Crítico (Blockers)

#### 1.1 Especificación Insuficiente para Implementación — Ausencia de Versión Enriquecida · `[ESTADO: MITIGADO]`

*   **Componente**: `US-04.md` (66 líneas)
*   **Descripción**: La US-04 carecía originalmente de flujos detallados, tabla de campos, etc.
*   **Mitigación**: Se creó el documento enriquecido `us-04-enriched.md` en los artefactos y se integró la especificación completa en `spec.md`, incluyendo flujos alternativos, validaciones y de error detallados.

#### 1.2 Endpoint DELETE No Especificado — Riesgo de Inconsistencia de Datos · `[ESTADO: MITIGADO]`

*   **Componente**: `US-04.md` §4 (Endpoints)
*   **Descripción**: La especificación no definía el endpoint DELETE para direcciones de entrega ni sus implicancias.
*   **Mitigación**: Se implementó `DELETE /api/users/me/addresses/:addressId`. No se permite eliminar la última dirección si es la única predeterminada. Cuando se da de baja un empleado de su empresa, la dirección corporativa es removida de su perfil de manera segura. Si esta era su dirección predeterminada, se promueve automáticamente su última dirección agregada anteriormente (la de mayor ID).

---

### 🟠 Alto (Major)

#### 2.1 Atomicidad del Toggle de Dirección Predeterminada No Especificada · `[ESTADO: MITIGADO]`

*   **Componente**: `US-04.md` §2 paso 6; `SequelizeAddressRepository.ts`
*   **Descripción**: Peligro de condiciones de carrera y múltiples predeterminadas en toggle.
*   **Mitigación**: La actualización de predeterminación se realiza encapsulada en una transacción de base de datos en `addressService.ts`. El sistema limpia el estado predeterminado anterior y asigna el nuevo de manera atómica.

#### 2.2 Validación Corporativa Ambigua — Nomenclatura Inconsistente y Reglas Incompletas · `[ESTADO: MITIGADO]`

*   **Componente**: `US-04.md` §2 paso 4
*   **Descripción**: Inconsistencia de la nomenclatura de variables y reglas incompletas sobre `allowExtraAddresses`.
*   **Mitigación**: Se unificó el término a `allowExtraAddresses` en backend y frontend. Cuando es `false`, el backend devuelve `403 Forbidden` al intentar registrar nuevas direcciones adicionales, y el frontend deshabilita los botones correspondientes con advertencia explícita.

---

### 🟡 Medio

#### 3.1 Endpoint PUT para Edición de Dirección No Especificado · `[ESTADO: MITIGADO]`

*   **Componente**: `US-04.md` §4
*   **Descripción**: No se especificaba capacidad de editar una dirección existente.
*   **Mitigación**: Se implementó el endpoint `PUT /api/users/me/addresses/:addressId` que permite la actualización de los campos `street`, `number`, `locality` y `reference` validando la autoría de la dirección y excluyendo modificaciones directas al campo `isDefault`.

#### 3.2 Tabla de Archivos/Módulos Desalineada con Infraestructura Existente · `[ESTADO: MITIGADO]`

*   **Componente**: `US-04.md` §5
*   **Descripción**: Discrepancias entre archivos listados y estado real de los mismos.
*   **Mitigación**: Se modificaron `IAddressRepository.ts`, `SequelizeAddressRepository.ts` y `addressService.ts` para incorporar métodos de escritura transaccional. Se crearon `addressController.ts` y los componentes en React `AddressManager.tsx`, `AddressCard.tsx` y la vista del dashboard `/mis-direcciones`.

#### 3.3 Ausencia de Respuestas de Error en la Especificación de Endpoints · `[ESTADO: MITIGADO]`

*   **Componente**: `US-04.md` §4
*   **Descripción**: Falta de códigos y mensajes de error estandarizados.
*   **Mitigación**: Se especificaron e implementaron los errores estándar en el controlador (p. ej., `400 Bad Request` en fallas de Zod, `403 Forbidden` en violación de políticas de direcciones extra, `404 Not Found` en accesos a recursos inexistentes o de otros usuarios).

---

### 🟢 Bajo (Minor)

#### 4.1 Definition of Done (DoD) Incompleta y Sin Checkboxes Marcados · `[ESTADO: MITIGADO]`

*   **Componente**: `US-04.md` §6
*   **Descripción**: Criterios de aceptación insuficientes.
*   **Mitigación**: Se extendió la DoD cubriendo validaciones de inputs por Zod, pruebas de integración, lógica transaccional de default, tests unitarios en servicios (83 tests en Jest pasando exitosamente), e interfaz responsiva.

---

### ⚪ Informativo

#### 5.1 Oportunidad de Reutilización: Servicio y Repositorio Existentes Requieren Extensión Mínima · `[ESTADO: INFORMATIVO]`

*   **Componente**: `addressService.ts`, `SequelizeAddressRepository.ts`, `IAddressRepository.ts`
*   **Descripción**: La infraestructura creada en US-03 proporciona una base sólida que minimiza el trabajo de US-04:
    - El modelo de dominio `Address.ts` ya tiene todos los campos necesarios.
    - El repositorio ya tiene `create`, `findByUserId`, `findDefaultByUserId`, y `update`.
    - Solo necesita extenderse con: `delete(id)`, `setDefault(userId, addressId, transaction)`.
    - El servicio necesita: `createAddress(userId, data)`, `updateAddress(userId, addressId, data)`, `deleteAddress(userId, addressId)`, `setDefaultAddress(userId, addressId)`.
    - El controlador es completamente nuevo.
*   **Impacto**: Positivo. La estimación de esfuerzo de implementación es menor que para US-02 o US-03.
*   **Acción Sugerida**: Al enriquecer la spec, referenciar explícitamente la infraestructura existente de US-03 como punto de partida.

---

## Verificación de Controles de Implementación

### Dependencias y Componentes Verificados ✅
| Dependencia | Estado | Detalle |
|-------------|--------|---------|
| US-02 (Empresas + `allowExtraAddresses`) | ✅ Implementada | Campo existe en `CompanyModel.ts`, se expone en `check-email` response |
| US-03 (Registro + Dirección Inicial) | ✅ Implementada | `authService.ts` crea dirección durante registro, transaccionalmente |
| Modelo `Address` | ✅ Existe | `Address.ts` + `AddressModel.ts` + `IAddressRepository.ts` |
| Repositorio `SequelizeAddressRepository` | ✅ Completado | Métodos `delete`, `clearDefaultByUserId`, y soporte transaccional integrados |
| Servicio `addressService` | ✅ Completado | Métodos de CRUD y Toggle predeterminado expuestos transaccionalmente |
| Controlador `addressController.ts` | ✅ Implementado | Rutas del usuario bajo `/api/users/me/addresses` mapeadas |
| Frontend `AddressManager` & `AddressCard` | ✅ Implementados | UI responsiva con glassmorphism y tema oscuro |
| Tests unitarios/integración | ✅ Aprobados | 83 tests de backend (Jest) y 17 tests de frontend (Vitest) aprobados con éxito |

### Impacto en Historias Downstream
| Historia | Dependencia de US-04 | Estado |
|----------|----------------------|--------|
| **US-13** (Hoja de Ruta) | Usa `addressLabel` basado en la dirección predeterminada del usuario | ✅ Desbloqueada. Lógica de direcciones y predeterminación 100% establecida. |
| **US-08** (Selección de Vianda) | Pedidos se entregan a la dirección predeterminada | ✅ Alineada con la libreta de direcciones. |

---

## Conclusión

La **US-04** ha sido implementada exitosamente resolviendo todas las omisiones de especificación iniciales. Se cubrieron las brechas relativas a la atomicidad en la actualización de dirección por defecto, reglas corporativas de creación adicionales con `allowExtraAddresses`, y endpoints de edición y eliminación (DELETE) con lógica especial de restablecimiento de dirección por defecto para usuarios dados de baja corporativos.

Las pruebas unitarias confirman la total adherencia a las reglas de negocio críticas de la aplicación B2B (trazabilidad física, reglas de exclusión, autobajas de administradores y default-address recovery).

### Veredicto

**PASS — Todos los hallazgos mitigados exitosamente**
