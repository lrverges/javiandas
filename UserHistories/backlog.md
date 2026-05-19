# 📑 Backlog de Historias de Usuario - Javiandas (MVP)

Este documento contiene la especificación funcional y el mapa de historias de usuario para el Producto Mínimo Viable (MVP) de **Javiandas**, optimizado para un enfoque de **Spec-Driven Development (SDD)**, y ordenado lógicamente para un desarrollo "bottom-up" (desde las bases hasta la transaccionalidad).

---

## 🗺️ Mapa de Historias de Usuario (Orden de Ejecución Lógico)

| Épica / Fase | 1. Entidades Base (Setup) | 2. Catálogo y Oferta | 3. Transaccional (Pedidos) | 4. Gestión Compleja | 5. Reportes y Logística |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Historias del MVP** | **US-01:** Login de usuarios.<br><br>**US-02:** Panel de asignación corporativa.<br><br>**US-03:** Registro inteligente (Onboarding).<br><br>**US-04:** Gestión de direcciones. | **US-05:** Catálogo de platos base.<br><br>**US-06:** Reglas de cierre y feriados.<br><br>**US-07:** Panel de planificación semanal. | **US-08:** Selección de vianda diaria.<br><br>**US-09:** Bloqueo automatizado de pedidos. | **US-10:** Deshabilitar empleados.<br><br>**US-11:** Panel de alertas corporativas. | **US-12:** Consolidado de cocina.<br><br>**US-13:** Hoja de ruta diaria. |

---

## 🏗️ Fase 1: Base de Datos y Entidades Core (Setup)

### **US-01: Login de Usuarios**
* *(Ver especificación detallada en el archivo `US-01.md`)*.

### **US-02: Panel de Asignación Corporativa**
* **Como:** Administrador de Javiandas  
* **Quiero:** Gestionar la vinculación de empresas, administradores y empleados  
* **Para:** Configurar el modelo comercial y los accesos antes de que los usuarios se registren.
* **Dependencias:** Ninguna (Entidad independiente).

### **US-03: Registro de Usuario (Onboarding Inteligente)**
* **Como:** Usuario Nuevo  
* **Quiero:** Registrar mis datos personales en la aplicación  
* **Para:** Comenzar a operar como cliente particular o corporativo.
* **Dependencias:** Depende de la validación corporativa (US-02).

### **US-04: Gestión de Direcciones y Predetermación**
* **Como:** Usuario (Particular o Empleado)  
* **Quiero:** Gestionar mis direcciones de entrega y elegir una predeterminada  
* **Para:** Agilizar el proceso de envío y recibir las viandas en el lugar correcto.
* **Dependencias:** Depende de los usuarios registrados (US-03) y reglas de empresa (US-02).

---

## 📋 Fase 2: Catálogo y Oferta (Administración)

### **US-05: Catálogo de Platos Base**
* **Como:** Administrador de Javiandas  
* **Quiero:** Dar de alta, editar o eliminar platos en un catálogo general  
* **Para:** Mantener un inventario de opciones reutilizables para los menús semanales.
* **Dependencias:** Ninguna (Entidad maestra).

### **US-06: Configuración de Reglas de Cierre y Feriados**
* **Como:** Administrador de Javiandas  
* **Quiero:** Definir los horarios límite de pedidos y el calendario de feriados  
* **Para:** Automatizar el bloqueo de solicitudes y modificaciones por parte de los clientes.
* **Dependencias:** Ninguna (Configuración del sistema).

### **US-07: Panel Interactivo de Planificación Semanal**
* **Como:** Administrador de Javiandas  
* **Quiero:** Contar con un panel de planificación visual e interactivo  
* **Para:** Asignar y estructurar la oferta comercial de platos por día y tipo de cliente de forma ágil.
* **Dependencias:** Depende del catálogo (US-05) y las reglas/feriados (US-06).

---

## 🍽️ Fase 3: Transaccional (Pedidos de Clientes)

### **US-08: Visualización y Selección de Vianda**
* **Como:** Usuario (Particular o Empleado)  
* **Quiero:** Ver el calendario semanal con las opciones disponibles según mi beneficio  
* **Para:** Elegir mi menú diario o modificar mis selecciones previas.
* **Dependencias:** Depende de la planificación activa (US-07) y del usuario logueado (US-01/US-03).

### **US-09: Bloqueo Automatizado de Pedidos**
* **Como:** Sistema  
* **Quiero:** Evaluar la fecha y hora del servidor frente a las reglas de cierre  
* **Para:** Restringir cambios fuera de término en la interfaz del cliente.
* **Dependencias:** Middleware que intercepta flujos de US-08 basándose en US-06.

---

## ⚠️ Fase 4: Casos Complejos de Gestión y Alertas

### **US-10: Deshabilitar Empleados con Flujo de Decisión**
* **Como:** Administrador de Empresa  
* **Quiero:** Deshabilitar a un empleado de la plataforma  
* **Para:** Controlar quiénes acceden al beneficio de las viandas corporativas.
* **Dependencias:** Requiere que existan usuarios (US-03) y pedidos (US-08) para poder cancelarlos.

### **US-11: Panel de Historial e Alertas Corporativas**
* **Como:** Administrador de Javiandas  
* **Quiero:** Contar con una sección interna de alertas/historial en la aplicación  
* **Para:** Enterarme en tiempo real de las modificaciones logísticas realizadas por las empresas clientes.
* **Dependencias:** Recibe los eventos generados por US-10.

---

## 🚚 Fase 5: Reportes y Logística

### **US-12: Consolidado de Producción para Cocina**
* **Como:** Administrador de Javiandas  
* **Quiero:** Visualizar la sumatoria total de platos solicitados por día  
* **Para:** Planificar eficientemente la compra de insumos y las tareas de la cocina.
* **Dependencias:** Agrupación basada en los pedidos de US-08.

### **US-13: Hoja de Ruta para Distribución**
* **Como:** Administrador de Javiandas  
* **Quiero:** Generar el reporte diario de entregas  
* **Para:** Proveer al cadete de una guía de distribución clara y ordenada.
* **Dependencias:** Listado complejo combinando pedidos (US-08) y direcciones predeterminadas (US-04).