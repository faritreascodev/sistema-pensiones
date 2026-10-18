# Sistema de Control y Cobro de Pensiones y Aranceles

Unidad Educativa Fiscomisional Monseñor Ángel Barbisotti, Esmeraldas. El año lectivo sigue el régimen Costa: abre en mayo y cierra en febrero del año siguiente.

El sistema reemplaza el libro de recibos en Excel. La colectora registra cada pago, el administrador consulta deudas y recaudación, y cada recibo se puede imprimir o descargar.

## Autoría

Proyecto de grado:

- Alexa Nebraska Castro Guagua
- Brianna Elena Casanova Olmedo

Tutor de prácticas: Farit Reasco.

## Documentación

- [Manual de usuario](docs/manual-de-usuario.md): caja, matrícula, deudas, pagos, comprobantes y administración.
- [Arquitectura](docs/arquitectura.md): módulos, datos, reglas de pensión y pruebas.

## Requisitos

- Node.js 20 o superior
- Docker, para PostgreSQL 16
- npm

## Arranque

1. Copiar el entorno: `copy .env.example .env` y completar `DATABASE_URL` y `AUTH_SECRET`.
2. `docker compose up -d`
3. `npm install`
4. `npm run db:migrate`
5. `npm run db:seed`
6. `npm run dev` y abrir [http://localhost:3000](http://localhost:3000)

El seed crea la institución, los cursos, el catálogo de rubros, los años lectivos de la Costa y los tres usuarios de abajo. Si `EXCEL_SOURCE` apunta a `Registro-pensiones.xlsm`, también carga la matrícula y el historial de recibos de ese libro. Sin ese archivo, el sistema arranca vacío y la matrícula se crea desde Estudiantes.

## Usuarios iniciales

| Correo | Clave | Cargo |
| --- | --- | --- |
| admin@uef-barbisotti.local | Admin2026! | Administrador |
| nubia.loor@uef-barbisotti.local | Caja2026! | Colectora |
| sayira.hinojosa@uef-barbisotti.local | Caja2026! | Colectora |

Hay que cambiar estas claves antes de usarlo con datos reales. El administrador lo hace en Usuarios.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm test` | Pruebas de dominio, paginación y pensión |
| `npm run db:migrate` | Aplica las migraciones |
| `npm run db:seed` | Carga los datos iniciales |

## Identidad visual

Azul institucional `#0077c8` y blanco, tomados de la fachada de la unidad. La barra lateral usa un azul más oscuro para separar la navegación del contenido.
