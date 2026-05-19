# Javiandas - Viandas Saludables

Este proyecto contiene el Frontend y Backend para la aplicación de Viandas Saludables (javiandas).

## Requisitos Previos 

- **Node.js** (v18 o superior)
- **pnpm** (recomendado, puedes instalarlo con `npm install -g pnpm`) o **npm**
- **MySQL** (Servidor de base de datos corriendo localmente)

---

## 1. Configuración e Inicialización del Backend

El backend está construido con Node.js, Express, TypeScript y Sequelize.

### Pasos:

1. Abre una terminal y navega a la carpeta del backend:
   ```bash
   cd javiandas/backend
   ```

2. Instala las dependencias:
   ```bash
   pnpm install
   ```
   *(Si no usas pnpm, utiliza `npm install`)*

3. Configura las variables de entorno:
   - Verifica que exista un archivo `.env` en la carpeta `backend`.
   - Asegúrate de que las credenciales de tu base de datos local sean correctas en la variable `DATABASE_URL` (por ejemplo: `mysql://usuario:contraseña@localhost:3306/viandas_saludables`).

4. Crea la base de datos (Ejecutar solo la primera vez):
   ```bash
   npx tsx src/createDb.ts
   ```

5. Inicia el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```
   *(El servidor arrancará en `http://localhost:4000` y Sequelize sincronizará las tablas automáticamente).*

---

## 2. Configuración e Inicialización del Frontend

El frontend está construido con React, TypeScript y Vite.

### Pasos:

1. Abre una **nueva** terminal (para no cerrar el backend) y navega a la carpeta del frontend:
   ```bash
   cd javiandas/frontend
   ```

2. Instala las dependencias:
   ```bash
   pnpm install
   ```

3. Inicia el servidor de desarrollo de Vite:
   ```bash
   pnpm run dev
   ```
   *(La aplicación arrancará y podrás verla en tu navegador, normalmente en `http://localhost:5174` o `http://localhost:5173`).*

---

## ¡Listo para probar!

Con ambas terminales corriendo (Frontend y Backend), abre la URL del frontend en tu navegador web. Si es la primera vez y quieres un usuario de prueba en la base de datos, puedes ir a la terminal del backend y ejecutar:
```bash
pnpm run seed
```
Esto creará el usuario `guest@guest.com` con contraseña `Pa$$w0rd123` para que pruebes el login.

---

## 3. Administración Corporativa B2B (US-02)

Se ha implementado un completo **Panel de Administración B2B** para la gestión de clientes corporativos, delegación de administradores de empresa y carga masiva de empleados autorizados.

### Elevación a Superadmin para Pruebas:
Para poder visualizar y operar el Panel B2B, el usuario debe tener el rol de superadministrador (`admin_javiandas`). Puedes elevar la cuenta del usuario de prueba `guest@guest.com` ejecutando la utilidad en el backend:
```bash
npx tsx src/setAdmin.ts
```

### Rutas de la API de Administración (`/api/admin`):
Todas las rutas de administración están protegidas con tokens y requieren rol `admin_javiandas`:

* **Empresas (B2B CRUD):**
  * `POST /api/admin/companies`: Registrar una nueva empresa corporativa.
  * `GET /api/admin/companies`: Listar y buscar empresas (soporta filtros, paginación y búsqueda).
  * `GET /api/admin/companies/:id`: Obtener el detalle completo de una empresa.
  * `PUT /api/admin/companies/:id`: Actualizar empresa (el campo CUIT es inmutable y protegido).

* **Delegación de Administradores de Empresa:**
  * `POST /api/admin/companies/:id/admins`: Asignar administrador por email (usuario preexistente pasa a rol `admin_empresa` y vinculación activa; email no registrado se pre-asigna en estado pendiente).
  * `DELETE /api/admin/companies/:id/admins/:adminId`: Remover/revocar delegación de administrador de empresa.

* **Pre-asignación Masiva de Empleados:**
  * `POST /api/admin/companies/:id/employees/batch`: Importar masivamente emails de empleados (soporta validación de formato sintáctico y detección de duplicados en la base de datos, retornando un reporte detallado con conteos).
  * `DELETE /api/admin/companies/:id/employees/:employeeId`: Eliminar la pre-asignación de un empleado (solo permitido si se encuentra en estado `pending`).

