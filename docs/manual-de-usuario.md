# Manual de usuario

Sistema de Control y Cobro de Pensiones y Aranceles. Unidad Educativa Fiscomisional Monseñor Ángel Barbisotti.

Autoras del proyecto de grado: Alexa Nebraska Castro Guagua y Brianna Elena Casanova Olmedo. Tutor de prácticas: Farit Reasco.

## Ingreso

La pantalla de acceso pide correo y clave. La sesión dura doce horas. Salir cierra la sesión en ese navegador.

Quien cobra entra a Caja. Quien administra ve, además, Usuarios, Catálogo, Años lectivos y Auditoría.

## Caja

El cobro tiene tres pasos.

1. **Estudiante.** Se elige el año lectivo, el curso y el paralelo. El desplegable lista a ese curso. También se puede escribir el nombre o la cédula: al elegir un resultado, el curso y el paralelo se ajustan solos.
2. **Meses.** En pensión aparece el checklist de mayo a febrero. Cada mes está pendiente, con abono o pagado. Se marcan uno o varios meses. Un mes ya pagado no se vuelve a cobrar. Un abono sí admite después el pago que lo completa. Si el rubro no es pensión, se elige un solo mes.
3. **Pago.** Se elige el concepto y se escribe el monto. Las formas de pago son efectivo y transferencia. La transferencia pide banco, número de comprobante, fecha y el archivo del voucher. El botón Adjuntar comprobante acepta PDF, JPG o PNG, también al soltar el archivo encima.

Registrar pago emite el recibo. El número automático tiene la forma `REC-año-######`. Se puede escribir un número manual si el talonario físico ya trae uno. Desde el recibo emitido se imprime o se descarga el PDF.

Limpiar vacía el formulario. Anular último recibo pide un motivo de al menos diez caracteres. La anulación no borra el recibo: queda en el historial con el motivo y la persona que anuló.

Los recibos del día se listan de 25 en 25.

## Estudiantes

La matrícula se filtra por año lectivo, nombre o cédula, curso y paralelo. Los filtros se aplican al escribir o al cambiar el desplegable. La tabla muestra 25 estudiantes por página.

Crear estudiante pide apellido y nombre, cédula opcional, año, curso, paralelo, especialidad y estado. No se admite dos veces el mismo nombre en el mismo curso, paralelo y año. Una cédula no puede repetirse.

Actualizar estudiante cambia esos datos. Eliminar solo es posible si no tiene recibos. Si ya pagó, el estado se cambia a Retirado y deja de salir en caja.

Exportar estudiantes descarga el filtro completo, no solo la página visible. Data completa descarga tres hojas: estudiantes, recibos y deudas del lectivo elegido.

En la ficha de cada estudiante se ve el checklist de pensiones del lectivo y el historial de recibos, también paginado.

## Deudas

Cada fila es un estudiante del lectivo. Las columnas son los meses de mayo a febrero.

- Verde: pensión pagada.
- Ámbar: abono o saldo.
- Rojo: mes sin pago.

Se filtra por año, curso y nombre. La tabla va de 25 en 25. Los totales de arriba cuentan toda la cartera, no solo la página.

Exportar deudores trae a quien tiene meses pendientes o abonos. Exportar checklist trae a todo el curso filtrado, al día o no.

## Pagos

El cierre suma efectivo, banco y el total emitido entre dos fechas, o durante un año lectivo. Se puede limitar por colectora y buscar por estudiante o número de recibo. Incluir anulados los muestra, pero no entran en los totales.

La tabla va de 25 en 25. Cada número abre el recibo. El administrador puede anular uno emitido, con motivo. Exportar Excel descarga el rango filtrado, no solo la página.

## Comprobantes

Lista los vouchers de transferencia del lectivo. Se filtran por estado (pendiente, aprobado, rechazado) y por estudiante, banco o referencia. Cada archivo se ve y se descarga. El administrador aprueba o rechaza los pendientes, con una nota.

## Administración

**Usuarios.** Crear, actualizar o eliminar. No se elimina a quien ya cobró ni al único administrador activo: en ese caso se desactiva.

**Catálogo.** Conceptos de pensión, matrícula, prácticas, libros, uniformes y cartera. Crear, actualizar o eliminar. No se elimina un concepto que ya está en un recibo. Si el monto base queda vacío, caja escribe la cantidad en cada pago.

**Años lectivos.** Crear un lectivo indica el año de inicio. El sistema abre mayo de ese año y cierra febrero del siguiente. Solo uno está activo. No se elimina un lectivo que tenga estudiantes o recibos.

**Auditoría.** Registra emisiones, anulaciones y cambios de usuarios, conceptos, lectivos y estudiantes. Se busca por acción, persona o detalle, de 25 en 25.

## Bancos

En transferencia se ofrecen Banco Pichincha, Banco del Pacífico, Banco de Guayaquil, Produbanco, Banco Bolivariano, Banco Internacional, BanEcuador, Banco Solidario, Banco del Austro, Cooperativa JEP, Cooperativa 29 de Octubre y Mutualista Pichincha.

## Qué no hace la caja

No se registra cheque. El depósito se trata como transferencia. El monto se escribe en todas las formas de pago. La matrícula no se importa desde un archivo: se crea en Estudiantes o llega con la carga inicial del libro histórico.
