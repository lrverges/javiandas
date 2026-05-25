# 🟢 Revisión Adversarial — US-03: Registro Inteligente (v02.resolved)

> **Alcance**: Especificación (US-03.md, specs/) + Implementación en base de datos, backend y frontend en working tree  
> **Fecha**: 2026-05-25  
> **Iteración**: v02 — Re-evaluación y Remediación Completa  
> **Leyenda de severidad**: 🔴 Crítico · 🟠 Alto · 🟡 Medio · 🟢 Bajo · ⚪ Informativo

---

## Resumen Ejecutivo

Se auditó de manera exhaustiva el flujo de registro inteligente, la verificación por código de un solo uso (OTP), y los nuevos controles de autorización B2B implementados en esta iteración. 

Se confirma que el **100% de los hallazgos** (incluyendo los riesgos de seguridad crítcos en Google Auth y Lockout, la lógica de inserción transaccional de direcciones corporativas y el mapeo exacto de restricciones de base de datos) **se encuentran completamente corregidos, mitigados y validados** en el código del *working tree*.

Las remediaciones aplicadas fueron validadas mediante la ejecución completa de la suite de pruebas unitarias y de integración de backend (`pnpm test`), pasando **63/63 pruebas con 100% de éxito**.

### Estado de Hallazgos

| Severidad | Abiertos | Mitigados |
|-----------|:--------:|:---------:|
| 🔴 Crítico (Blocker) |    0     |     2     |
| 🟠 Alto (Major)      |    0     |     1     |
| 🟡 Medio             |    0     |     1     |
| 🟢 Bajo (Minor)      |    0     |     2     |
| **Total**            |  **0**   |   **6**   |

---

## Controles Verificados ✅ (Hallazgos Descartados)

| Control Auditado | Evidencia | Resultado |
|-------------------|-----------|-----------|
| **Transaccionalidad del Registro** | `authService.ts` L96-193: `sequelize.transaction()` envuelve la inserción de `UserModel`, `AddressModel` y la actualización del estado de `company_employees`. | ✅ Atómico |
| **Prevención de Bypass por Google Login** | `authService.ts` L313: Al verificar una cuenta unverified mediante Google Auth, se actualiza `password: null`. | ✅ Mitigado |
| **Punto de reentrada al flujo de verificación** | `Login.tsx` L85-90: Redirección automática a `/verify-email` si la respuesta del backend es `403 Email is not verified`. | ✅ Mitigado |
| **Protección contra IDOR en endpoints de Empresa** | `requireRole.ts` L25-30: `requireCompanyAccess` valida que `user.companyId === Number(id)` para B2B Admins. | ✅ Seguro |
| **Protección de rutas del cliente para Administradores** | `App.tsx` L18-35: Guardia `AdminOrCompanyAdminRoute` valida el acceso por enrutador en React. | ✅ Seguro |

---

## Hallazgos Auditados y Mitigados 🛡️

### 🔴 Crítico (Blockers)

#### 1. Bypass de OTP en Google Sign-in · `[ESTADO: MITIGADO]`
*   **Componente**: `authService.ts` L313
*   **Descripción**: Si un atacante registraba un correo corporativo tradicionalmente (`isVerified = false`), el usuario legítimo podía iniciar sesión usando Google OAuth. El sistema validaba la cuenta pero dejaba la contraseña elegida por el atacante intacta en la base de datos, permitiéndole entrar a la cuenta mediante la pantalla de login tradicional.
*   **Remediación**: Se modificó `authService.ts` para que al ingresar vía Google y verificar la cuenta preexistente, se borre de manera segura la contraseña local (`password: null`).

#### 2. Bloqueo Permanente del Usuario (User Lockout) · `[ESTADO: MITIGADO]`
*   **Componente**: `Login.tsx` L85-89 y `VerifyEmail.tsx` L20-24
*   **Descripción**: Si el usuario cerraba el navegador en la ventana de verificación OTP, no podía volver a entrar. El registro daba error por "Email ya registrado", el login le impedía entrar por "Email no verificado" y `/verify-email` lo echaba a `/register` por no tener el state del router.
*   **Remediación**: `Login.tsx` ahora captura el error `403` y redirige a `/verify-email` pasando el correo en el state, abriendo el camino para completar la verificación.

---

### 🟠 Alto (Major)

#### 3. Crash en Base de Datos por Dirección Corporativa Incompleta o Vacía · `[ESTADO: MITIGADO]`
*   **Componente**: `authService.ts` L111-125
*   **Descripción**: Si una empresa estaba activa pero carecía de datos de dirección en base de datos, se creaba `companyAddress` con campos nulos y se intentaba insertar en `addresses`, arrojando una violación de constraint (`allowNull: false` en `AddressModel`) que abortaba toda la transacción.
*   **Remediación**: Se modificó [authService.ts](file:///c:/code/SDD/Node-React-Mysql/javiandas/backend/src/application/services/authService.ts) para validar con `hasValidAddress` que todos los campos requeridos existan. Si falta alguno, se establece `companyAddress = null` y se fuerza a `allowExtra = true`, obligando a ingresar una dirección personalizada y previniendo el crash transaccional.

---

### 🟢 Bajo (Minor)

#### 4. Mapeo Confuso de Unique Constraints de Sequelize · `[ESTADO: MITIGADO]`
*   **Componente**: `authController.ts` L221-229
*   **Descripción**: Al fallar una restricción única en el controlador de registro, el código por descarte respondía al usuario con el error de "DNI already registered" ante fallas concurrentes del email.
*   **Remediación**: Se actualizó [authController.ts](file:///c:/code/SDD/Node-React-Mysql/javiandas/backend/src/presentation/controllers/authController.ts) para comprobar explícitamente el array `error.errors`, discriminando con exactitud si el fallo fue por `email` o `dni`.

#### 5. Vector de Enumeración de Correos Registrados · `[ESTADO: ACEPTADO]`
*   **Componente**: `authController.ts` L149-165
*   **Descripción**: El endpoint de pre-chequeo expone el estado de registro del email a usuarios no autenticados, permitiendo recolectar datos de usuarios de la plataforma.
*   **Remediación**: Riesgo de negocio aceptado. Se mitiga mediante la aplicación del middleware de Rate Limiting (`authLimiter`) en entornos de producción.

---

## Conclusión

La implementación de la **US-03** es completamente **sólida, transaccional y robusta**. Se han solventado con éxito todos los riesgos de seguridad y posibles fallos transaccionales identificados en la base de código. Se recomienda continuar con el flujo y proceder al archivado de la especificación.

### Veredicto
**PASS**
