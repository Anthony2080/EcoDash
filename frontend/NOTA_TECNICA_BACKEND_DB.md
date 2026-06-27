# Nota técnica: desalineación entre Backend y Base de Datos

## 1. Resumen del problema

La base de datos disenada en `database/EcoDash-db.sql` y los modelos Django actuales no estan alineados. El SQL define una estructura de tablas y columnas que no coincide completamente con lo que Django espera consultar mediante sus modelos, vistas y APIs.

Esto provoca que el backend falle antes de que el frontend pueda validar flujos como envios, pagos o notificaciones. La deuda no deberia resolverse desde el frontend: Django debe exponer APIs estables y ocultar los detalles internos de tablas, nombres de columnas y compatibilidad con SQL heredado.

## 2. Evidencia

Tablas definidas por `database/EcoDash-db.sql`:

- `usuario`
- `usuario_cliente`
- `usuario_repartidor`
- `envio`
- `pago`
- `notificacion`

Tablas esperadas por los modelos Django actuales:

- `usuario`
- `cliente`
- `repartidor`
- `envio`
- `pago`
- `notificacion`

Diferencias principales:

- El SQL usa `usuario_cliente`; Django espera `cliente`.
- El SQL usa `usuario_repartidor`; Django espera `repartidor`.
- Algunas columnas de `envio` tienen nombres distintos entre SQL y modelos/API.

Columnas de `envio` en el SQL:

- `origenGeo`
- `destinoGeo`
- `distanciaKm`
- `pesoKg`
- `fotoEntrega`
- `firmaDigital`

Columnas esperadas por modelos/API actuales:

- `direccion_origen`
- `direccion_destino`
- `distancia_km`
- `peso_kg`
- `foto_entrega`
- `firma_digital`

## 3. Impacto actual

- Django lanza `ProgrammingError` porque busca tablas que no existen en la base actual.
- El frontend no puede probar correctamente envios, pagos ni notificaciones.
- El registro puede fallar si la tabla `usuario` no existe.
- `endpoints.js` contiene normalizaciones defensivas porque el contrato de datos no esta estable.
- La validacion del frontend queda bloqueada por errores de backend/DB, aunque los templates y `router.js` esten funcionando a nivel estatico.

## 4. Decision temporal

Esta deuda no se va a resolver desde el frontend.

El frontend debe consumir APIs estables y no conocer detalles internos de tablas, columnas ni decisiones de persistencia. No corresponde agregar parches en `router.js`, templates o CSS para compensar errores de base de datos o desalineacion entre SQL y modelos.

Hasta que backend defina una fuente de verdad, el frontend debe mantenerse lo mas simple posible: renderizar templates, inicializar comportamiento interactivo y consumir respuestas API ya normalizadas por Django.

## 5. Opciones de solucion backend

### Opcion A: Adaptar modelos Django al SQL real

Usar `db_table` y `db_column` para que los modelos Django apunten a la estructura definida en `database/EcoDash-db.sql`.

Ejemplos conceptuales:

- Modelo `Cliente` con `db_table = "usuario_cliente"`.
- Modelo `Repartidor` con `db_table = "usuario_repartidor"`.
- Campos de `Envio` mapeados con `db_column`, por ejemplo `direccion_origen` apuntando a `origenGeo`, si se decide conservar nombres Python limpios.

Esta opcion preserva el SQL del equipo como fuente de verdad.

### Opcion B: Modificar el SQL para coincidir con Django

Actualizar `database/EcoDash-db.sql` para que cree las tablas y columnas que los modelos actuales esperan:

- `cliente`
- `repartidor`
- `direccion_origen`
- `direccion_destino`
- `distancia_km`
- `peso_kg`
- `foto_entrega`
- `firma_digital`

Esta opcion convierte los modelos/migraciones de Django en fuente de verdad.

### Opcion C: Generar modelos desde la DB real con `inspectdb`

Importar la DB real, ejecutar `inspectdb` y usar el resultado como base para reconstruir modelos Django.

Luego habria que limpiar manualmente:

- Nombres de clases.
- Relaciones.
- `related_name`.
- Tipos de campos.
- Choices.
- Validaciones.
- Serializacion en views/APIs.

Esta opcion es util si la DB ya existe y debe respetarse, pero requiere curaduria.

### Opcion D: Definir un contrato API estable

Independientemente de como se llamen las tablas o columnas internamente, las views/serializers deben exponer un contrato estable hacia frontend.

Por ejemplo, la API podria devolver siempre:

- `id`
- `origen`
- `destino`
- `distancia`
- `peso`
- `estado`
- `precio`

Y resolver internamente si esos datos vienen de `origenGeo`, `direccion_origen` u otra columna.

## 6. Recomendacion

Definir una sola fuente de verdad:

- O la DB SQL real (`database/EcoDash-db.sql`).
- O los modelos Django y sus migraciones.

Si el equipo ya decidio usar `database/EcoDash-db.sql`, la recomendacion es adaptar Django a esa DB, no modificar el frontend ni seguir agregando normalizaciones defensivas.

En ese escenario, backend deberia:

- Ajustar `db_table` para `cliente` y `repartidor`.
- Ajustar `db_column` para campos con nombres distintos.
- Revisar migraciones para que no creen una estructura incompatible.
- Exponer APIs limpias y estables para frontend.

## 7. Que NO hacer

- No seguir agregando normalizaciones en frontend para tapar diferencias de modelos/DB.
- No importar SQL viejo y correr migraciones incompatibles encima sin revisar.
- No hacer parches en `router.js` para compensar errores de backend.
- No mezclar correccion DB con CSS, encoding, templates o refactors frontend.
- No asumir que `manage.py check` valida existencia o compatibilidad de tablas.
- No mantener dos fuentes de verdad activas sin una decision explicita.

## Adaptador temporal en frontend

Para poder entregar una demo funcional, `frontend/static/js/endpoints.js` incluye una capa temporal de adaptacion y normalizacion de datos.

Esta capa:

- Prepara payloads de registro con `nombre`, `email`, `telefono`, `direccion`, `password` y `rol`.
- Respeta el rol seleccionado por la UI y mantiene `cliente` solo como fallback temporal si no llega ningun rol.
- Traduce aliases de envio como `origen`, `origenGeo`, `distanciaKm` o `pesoKg` hacia los campos que el backend Django actual espera.
- Normaliza respuestas de envios, pagos y notificaciones para que el frontend lea nombres estables.
- No renderiza HTML ni reemplaza responsabilidades de templates o backend.

Esto no debe ser la solucion definitiva. El backend debe definir un contrato API estable y ocultar las diferencias internas entre SQL, modelos Django y nombres de columnas.

El frontend no deberia conocer nombres fisicos de columnas de base de datos. Cuando backend y DB queden alineados, estos normalizadores deberian simplificarse o eliminarse.

## Manejo temporal de roles

- El frontend ahora permite elegir si la cuenta se registra como cliente o repartidor.
- `endpoints.js` respeta el rol seleccionado y solo usa `cliente` como fallback temporal cuando el dato no llega.
- El backend debe crear el perfil asociado correcto en `cliente` o `repartidor` segun el rol recibido.
- La separacion real de permisos por rol sigue siendo deuda tecnica.
- Mas adelante deben revisarse los filtros de APIs para que clientes y repartidores no vean datos que no corresponden.

## Ajuste temporal de roles

- Para la entrega se dejaron solo dos roles funcionales: cliente y repartidor.
- El registro respeta el rol elegido por el usuario.
- El backend crea perfil `Cliente` o `Repartidor` segun corresponda.
- La lectura de JSON en backend acepta `application/json` con parametros como `charset`, para evitar perder `rol` y caer al fallback `cliente`.
- Los scripts de acceso y panel usan version en la URL para evitar que el navegador conserve JS viejo con cache `immutable`.
- Se agregaron logs temporales/controlados para diagnosticar el rol enviado por frontend y recibido por backend.
- La separacion fina de permisos/API por rol queda como deuda tecnica.
- Mas adelante deben revisarse los filtros para que cliente y repartidor solo vean datos propios.

## 8. Proximos pasos sugeridos

1. Confirmar si `database/EcoDash-db.sql` es la fuente de verdad.
2. Si el SQL es la fuente de verdad, adaptar modelos Django con `db_table` y `db_column`.
3. Si Django es la fuente de verdad, actualizar o reemplazar el SQL inicial.
4. Elegir una estrategia controlada: importar SQL o ejecutar migraciones, pero no mezclar ambas sin revisar compatibilidad.
5. Crear datos demo coherentes con la estrategia elegida.
6. Probar endpoints de login, registro, envios, pagos y notificaciones.
7. Recien despues limpiar `endpoints.js`, quitando normalizaciones defensivas que ya no hagan falta.
