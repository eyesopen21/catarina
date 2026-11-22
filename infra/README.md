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

El workflow ejecuta `terraform init -backend=false` y `terraform validate`: la validación
del esquema no requiere token, valores de variables ni bundles y no llama a la API de
Cloudflare. No ejecuta `plan`/`apply`, no escanea TLS, ni prueba cifrado en reposo; por tanto,
no constituye evidencia para `TC-NFR-SEC-01`.

Terraform requiere `cloudflare_account_id`, bundles construidos para `dev`/`staging` y
orígenes PostgreSQL independientes para planificar/aplicar. `cloudflare_api_token` se lee desde
`TF_VAR_cloudflare_api_token` o un almacén de secretos de CI. No guardar secretos en archivos
tfvars ni copiar el estado o plan al repositorio. El estado contiene el password sensible de
Hyperdrive; antes de `apply` se debe configurar backend remoto cifrado y acceso restringido.
`versions.tf` fija el provider Cloudflare en `5.19.1`. En esta rama se instaló Terraform CLI
1.11.4 en un directorio temporal fuera del repositorio y se ejecutaron `init -backend=false
-input=false` y `validate`, ambos con éxito (`Success! The configuration is valid.`, exit 0).
El provider 5.19.1 se descargó de `registry.terraform.io` y sus hashes quedaron registrados en
`infra/cloudflare/.terraform.lock.hcl`, que se versiona para fijar la versión. No se ejecutó
`plan`/`apply` ni se desplegaron recursos.

El esquema oficial de `cloudflare_workers_script` en el provider 5.19.1 no incluye el
argumento `files` (causa del fallo del run de CI 45061620938). Sí incluye `content_file`,
que debe ir acompañado de `content_sha256`, además de `content_type` y `main_module`; el
recurso de `main.tf` usa ese esquema y `validate` lo confirmó.

El plan Cloudflare gratuito incluye Workers y Hyperdrive con cuota de Hyperdrive de 100 000
sentencias/día; al exceder la cuota, las operaciones fallan. Eso no cubre el costo o las
cuotas del proveedor PostgreSQL externo ni demuestra que el piloto completo quepa en gratis.

## Evidencia TC-NFR-SEC-01 y TC-SPR-08

El IaC configura Workers, Hyperdrive y R2, pero `TC-NFR-SEC-01` sigue abierto hasta validar
el bundle ejecutable, escanear TLS en staging y aportar evidencia de cifrado en reposo de
PostgreSQL y backups. El cifrado de objetos R2 está documentado por Cloudflare. Terraform
solo valida configuración; no constituye evidencia del despliegue.

`TC-SPR-08` se demuestra en CI mediante SBOM CycloneDX, versiones fijadas (lockfiles), SCA
(`pnpm audit --audit-level=critical`) y SAST (CodeQL); el gate no admite excepciones
automáticas. Como control del gate se usó un fixture aislado fuera del repositorio con
`minimist@1.2.5`: aviso `critical` (GHSA-xvch-5gv4-984h) y `pnpm audit --audit-level=critical`
con exit 1, sin tocar el lockfile de producción (hash SHA-256 idéntico antes y después).

Los jobs `contracts` y `harness` ya están declarados en `.github/workflows/ci.yml`, con
`fetch-depth: 0`, `BASE_REF=origin/main`, comparador verificado contra un cambio `major` y
un servicio PostgreSQL 17 real. El escáner de secretos sobre el historial completo sigue
pendiente de AG-INT (el escáner de WP-03 solo recorre el árbol de trabajo).

Sondeo informativo (no ejecutado en esta rama): el árbol de dependencias de la rama
`wp-02-contracts` produce 2 avisos críticos vía `@asyncapi/cli > @asyncapi/generator >
simple-git` (GHSA-v5rq-49vh-5v5c y GHSA-x6jw-m9v5-85vh) y `pnpm audit --audit-level=critical`
termina con exit 1. Sin excepción registrada, el job `supply-chain` fallará al integrar WP-02.
Requiere decisión humana; no se relajó el gate ni se cambiaron versiones para eludirlo.

`asyncapi validate` queda explícitamente fuera del job `contracts` por el bloqueo de
telemetría vigente. Además, `@asyncapi/cli@6.2.2` declara `engines.node >=24` mientras CI
fija Node 22: pendiente de decisión humana, sin cambios de versión que puedan eludir el bloqueo.

### Referencias oficiales consultadas

- [Cloudflare Hyperdrive: PostgreSQL y drivers](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/)
- [Cloudflare Hyperdrive: TLS y bases soportadas](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/)
- [Cloudflare Workers: `node:http` y `httpServerHandler`](https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/)
- [Cloudflare Workers: Rust/Wasm](https://developers.cloudflare.com/workers/languages/rust/)
- [Cloudflare R2: cifrado de datos](https://developers.cloudflare.com/r2/reference/data-security/)
- [Cloudflare Hyperdrive: precios](https://developers.cloudflare.com/hyperdrive/platform/pricing/)
- [Esquema oficial del provider Cloudflare 5.19.1 para Workers Script](https://github.com/cloudflare/terraform-provider-cloudflare/blob/v5.19.1/docs/resources/workers_script.md)
