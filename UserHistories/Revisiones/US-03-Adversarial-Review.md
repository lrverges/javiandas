## Revisión Adversarial (Auditoría Final)

**Alcance**: us-03-onboarding (Flujo de Registro, Verificación de Email y Guardias de Roles)
**Fuentes**:
- [spec.md (user-onboarding)](file:///c:/code/SDD/Node-React-Mysql/openspec/changes/us-03-onboarding/specs/user-onboarding/spec.md)
- [spec.md (user-authentication)](file:///c:/code/SDD/Node-React-Mysql/openspec/changes/us-03-onboarding/specs/user-authentication/spec.md)
- [design.md](file:///c:/code/SDD/Node-React-Mysql/openspec/changes/us-03-onboarding/design.md)
- [authService.ts](file:///c:/code/SDD/Node-React-Mysql/javiandas/backend/src/application/services/authService.ts)
- [authController.ts](file:///c:/code/SDD/Node-React-Mysql/javiandas/backend/src/presentation/controllers/authController.ts)
- [requireRole.ts](file:///c:/code/SDD/Node-React-Mysql/javiandas/backend/src/presentation/middlewares/requireRole.ts)
- [adminRoutes.ts](file:///c:/code/SDD/Node-React-Mysql/javiandas/backend/src/presentation/routes/adminRoutes.ts)
- [App.tsx](file:///c:/code/SDD/Node-React-Mysql/javiandas/client/src/App.tsx)
- [Login.tsx](file:///c:/code/SDD/Node-React-Mysql/javiandas/client/src/components/Login.tsx)

### Alineación con especificaciones y tareas
- **Desviación del Diseño Principal**: Incorporación exitosa del flujo OTP en la base de datos y la UI, mitigando el secuestro financiero de cuentas corporativas.
- **Guardias de Roles y B2B**: Se auditaron las modificaciones asociadas a la gestión de accesos B2B introducidas en esta rama.

### Hallazgos de Seguridad y Mitigaciones

| Severidad | Área | Hallazgo | Evidencia | Estado / Solución sugerida |
|----------|------|---------|----------|-----------------------------|
| **Resuelto (Blocker)** | Seguridad | **Bypass de OTP en Google Sign-in**: Google OAuth verificaba cuentas tradicionales previamente creadas por atacantes sin borrar la contraseña local. | [authService.ts:313](file:///c:/code/SDD/Node-React-Mysql/javiandas/backend/src/application/services/authService.ts#L313) | **CORREGIDO**: Se limpia la contraseña local (`password: null`) tras el inicio de sesión vía Google. |
| **Resuelto (Blocker)** | UX / Usabilidad | **Bloqueo Permanente de Cuenta (User Lockout)**: Falta de punto de reentrada a la verificación si el usuario salía de la pantalla post-registro. | [Login.tsx:85-89](file:///c:/code/SDD/Node-React-Mysql/javiandas/client/src/components/Login.tsx#L85-L89) | **CORREGIDO**: `Login.tsx` captura el error `403` y redirige a `/verify-email` inyectando el correo en el state. |
| **Verificado (OK)** | Seguridad B2B | **Riesgo de IDOR y Escalación de Privilegios B2B**: Posibilidad de que un administrador de una empresa (`admin_empresa`) consulte o modifique datos de otra empresa manipulando el `id` en la URL de la API. | [requireRole.ts:25-30](file:///c:/code/SDD/Node-React-Mysql/javiandas/backend/src/presentation/middlewares/requireRole.ts#L25-L30) y [App.tsx:49-54](file:///c:/code/SDD/Node-React-Mysql/javiandas/client/src/App.tsx#L49-L54) | **SEGURO**: El middleware `requireCompanyAccess` en Express y el guardia `AdminOrCompanyAdminRoute` en React validan estrictamente que `user.companyId === Number(id)`, previniendo cualquier acceso no autorizado inter-empresa. |
| **Resuelto (Major)** | Lógica / Datos | **Crash de Registro por Dirección Corporativa Incompleta o Vacía**: Si una empresa no tiene dirección cargada, el backend intenta insertar nulos en `addresses`, tirando un error de constraint que aborta la transacción. | [authService.ts:117-121](file:///c:/code/SDD/Node-React-Mysql/javiandas/backend/src/application/services/authService.ts#L117-L121) | **CORREGIDO**: Se agregaron chequeos explícitos para asegurar que los campos `street`, `addressNumber` y `locality` de la empresa sean *truthy* antes de instanciar `companyAddress`. |
| **Resuelto (Minor)** | Manejo de Errores | **Mapeo de Errores Confuso**: Mensaje de error incorrecto de DNI duplicado al fallar la colisión única de email de forma concurrente. | [authController.ts:221-229](file:///c:/code/SDD/Node-React-Mysql/javiandas/backend/src/presentation/controllers/authController.ts#L221-L229) | **CORREGIDO**: Se analiza explícitamente el array de errores de Sequelize para determinar la clave fallida. |

### Veredicto
**PASS**

### Recomendaciones
Ninguna. Los riesgos críticos de seguridad y los riesgos residuales transaccionales han sido completamente resueltos y mitigados en la base de código. Es seguro archivar este cambio.
