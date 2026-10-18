# Arquitectura

Sistema de Control y Cobro de Pensiones y Aranceles de la Unidad Educativa Fiscomisional Monseñor Ángel Barbisotti.

Autoras del proyecto de grado: Alexa Nebraska Castro Guagua y Brianna Elena Casanova Olmedo. Tutor de prácticas: Farit Reasco.

## Stack

- Next.js (App Router) y React, con TypeScript
- PostgreSQL 16 y Prisma
- Tailwind CSS
- Zod para los formularios
- ExcelJS para las exportaciones
- PDF del recibo con `@react-pdf/renderer`

La sesión viaja en la cookie `sp_session`, firmada con `AUTH_SECRET`, durante doce horas. Solo `/login` es público.

## Módulos

| Ruta | Función |
| --- | --- |
| `/caja` | Emite, limpia y anula recibos |
| `/estudiantes` | Matrícula del lectivo |
| `/recibos/[id]` | Recibo para ver, imprimir y descargar |
| `/vouchers` | Comprobantes de transferencia |
| `/reportes` | Recaudación por fechas o por lectivo |
| `/reportes/deudas` | Checklist de pensión por estudiante |
| `/admin/usuarios` | Colectoras y administrador |
| `/admin/catalogo` | Rubros |
| `/admin/anios` | Años lectivos de la Costa |
| `/admin/auditoria` | Bitácora de cambios |

Las exportaciones están en `/api/export/estudiantes`, `/api/export/completo`, `/api/reportes/excel` y `/api/reportes/deudas`. El voucher se sirve en `/api/vouchers/[id]`; `?descarga=1` lo baja como archivo.

## Datos

El dinero se guarda en decimal y se opera en centavos. La cédula, cuando se informa, valida el dígito ecuatoriano y es única.

Un recibo es un estudiante, un concepto, un monto y una o varias mensualidades. `coveredMonth` conserva el primer mes. `coveredMonths` guarda todos los meses del pago. El número `REC-año-######` sale de una secuencia por año calendario. Un número manual puede repetirse, porque el talonario histórico reutilizó números.

El voucher queda en disco, en `data/vouchers`, fuera del repositorio. Se aceptan PDF, JPEG y PNG de hasta 5 MB.

## Pensión

Un concepto de la categoría pensión es pago completo, salvo que el nombre contenga «abono» o «saldo»: eso es un abono. El checklist del régimen Costa recorre mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre, enero y febrero.

Al emitir, la caja bloquea la fila del estudiante y vuelve a leer los recibos vigentes. Si alguno de los meses pedidos ya tiene una pensión completa, el cobro se rechaza. Un abono no bloquea el pago posterior. Un pago completo no se reabre con otro abono.

## Listados

Ninguna tabla muestra más de 50 filas. El tamaño de página es 25. Los totales de un reporte se calculan sobre todo el filtro. La página solo corta lo que se ve. Los filtros de texto esperan un instante y consultan de nuevo. Los desplegables consultan al cambiar.

## Pruebas

`npm test` cubre la cédula, el calendario Costa, el catálogo, el dinero, el correlativo, el corte de páginas y las reglas de pensión: cierre de un mes, abono que después se completa, reparto del monto entre meses y rechazo de un mes ya pagado.

## Carga inicial

`npm run db:seed` no borra una base que ya tiene usuarios. En una base nueva crea la institución (Esmeraldas, teléfono 062720000), los cursos, el catálogo, los lectivos y los usuarios de caja. Si existe el Excel indicado en `EXCEL_SOURCE`, incorpora la matrícula y los recibos históricos de ese libro.
