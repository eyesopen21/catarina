# Infraestructura — WP-10

## Dirección Cloudflare

`cloudflare/` contiene Terraform para separar `dev` y `staging` en Cloudflare Workers,
Hyperdrive y buckets privados de R2. Los Worker bundles y los datos de conexión PostgreSQL
son entradas obligatorias: el repositorio todavía no produce un bundle compatible con
Workers y no se eligió un proveedor PostgreSQL. Las variables `postgres_origins` no
seleccionan proveedor ni región. No hay valores de cuenta, credenciales, hostname o secreto
guardados en el repo; el token del proveedor se inyecta por entorno.

Workers es global, por lo que este IaC no fija región ni placement. R2 omite la opción de
ubicación; la residencia de datos sigue pendiente de OD-03. Hyperdrive se limita a TLS por
defecto y se desactiva su caché SQL para no cachear lecturas de datos transaccionales. R2
cifra objetos en reposo con claves gestionadas por Cloudflare. La conexión Hyperdrive cifra
tráfico a PostgreSQL, pero el cifrado en reposo de esa base depende del proveedor PostgreSQL
que aún no está elegido. El servicio Workers usa TLS de Cloudflare al recibir solicitudes.

## Compatibilidad de la aplicación

- La API actual ejecuta `NestFactory.create(AppModule)` y `app.listen(...)` en
  `api/src/main.ts`. Workers tiene compatibilidad Node.js parcial y ofrece
  `httpServerHandler` para adaptar un servidor HTTP Node a su handler Fetch; falta una
  entrada específica de Worker y pruebas con NestJS, Express y sus dependencias antes de
  aceptar el bundle de API.
- Hyperdrive conecta Workers a PostgreSQL externo y requiere TLS. La guía oficial recomienda
  `pg` (mínimo `8.16.3`) para TypeScript/JavaScript en Workers; la API actual aún no declara
  `pg` ni configura Nest para usar el binding Hyperdrive.
- Cloudflare ejecuta Rust como WebAssembly; el crate actual solo es un stub. Requiere
  compilar para `wasm32-unknown-unknown` y comprobar compatibilidad de dependencias. No se
  configura ejecución de binarios nativos, hilos Wasm ni una nueva arquitectura Rust.

## Ejecución y gates

Terraform requiere `cloudflare_account_id`, bundles construidos para `dev`/`staging` y
orígenes PostgreSQL independientes. `cloudflare_api_token` se lee desde
`TF_VAR_cloudflare_api_token` o un almacén de secretos de CI. No guardar secretos en archivos
tfvars ni copiar el estado o plan al repositorio. El estado contiene el password sensible de
Hyperdrive; antes de `apply` se debe configurar backend remoto cifrado y acceso restringido.
Esta rama no ejecutó Terraform ni se desplegaron recursos.

El plan Cloudflare gratuito incluye Workers y Hyperdrive con cuota de Hyperdrive de 100 000
sentencias/día; al exceder la cuota, las operaciones fallan. Eso no cubre el costo o las
cuotas del proveedor PostgreSQL externo ni demuestra que el piloto completo quepa en gratis.

## Evidencia TC-NFR-SEC-01 y TC-SPR-08

El IaC configura Workers, Hyperdrive y R2, pero `TC-NFR-SEC-01` sigue abierto hasta validar
el bundle ejecutable, escanear TLS en staging y aportar evidencia de cifrado en reposo de
PostgreSQL y backups. El cifrado de objetos R2 está documentado por Cloudflare. Terraform
solo valida configuración; no constituye evidencia del despliegue.

`TC-SPR-08` sigue sujeto al job de CI SCA/SAST/SBOM. Al integrar WP-03, AG-INT debe incorporar
los comandos reales del harness de PostgreSQL, el escáner de secretos con historial completo
y el escáner de PII. Esta rama no inventa comandos ni presenta esos controles como ejecutados.

### Referencias oficiales consultadas

- [Cloudflare Hyperdrive: PostgreSQL y drivers](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/)
- [Cloudflare Hyperdrive: TLS y bases soportadas](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/)
- [Cloudflare Workers: `node:http` y `httpServerHandler`](https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/)
- [Cloudflare Workers: Rust/Wasm](https://developers.cloudflare.com/workers/languages/rust/)
- [Cloudflare R2: cifrado de datos](https://developers.cloudflare.com/r2/reference/data-security/)
- [Cloudflare Hyperdrive: precios](https://developers.cloudflare.com/hyperdrive/platform/pricing/)
