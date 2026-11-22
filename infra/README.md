# Infraestructura — WP-10

## Estado

La infraestructura de `dev` y `staging` queda pendiente de decisiones humanas antes de
provisionar recursos. OD-03 deja sin definir nube y residencia/región; ADR-022 deja sin
definir el gestor de secretos y el proveedor. No se fijan recursos, imágenes, credenciales,
dominios ni valores de región en este cambio. Este directorio no afirma que haya entornos
desplegados.

## Controles que debe demostrar la implementación elegida

- TLS 1.2 como mínimo (1.3 preferido) en cada salto, incluido el tráfico a PostgreSQL.
- Cifrado en reposo de volúmenes, base de datos, objetos y backups con claves gestionadas.
- Cifrado de aplicación para identidad según FR-STU-01; el cifrado de disco por sí solo no
  satisface ese requisito.
- Secretos en un gestor dedicado e identidad de carga de trabajo donde esté disponible;
  nunca secretos en el repositorio, imágenes, prompts o artefactos CI.
- Entornos separados `dev` y `staging`, con permisos mínimos y sin datos reales/PII.
- Planes de infraestructura revisables en CI. El despliegue y la inspección de configuración
  TLS/cifrado requieren seleccionar proveedor y región, configurar credenciales fuera del
  repositorio y desplegar recursos. No se ejecuta `apply` ni se crean recursos desde CI.

## Evidencia requerida para TC-NFR-SEC-01

El gate sigue abierto hasta que una revisión del entorno desplegado aporta el resultado de
un escaneo TLS y evidencia verificable de cifrado de volúmenes y objetos. Debe incluir la
conexión a PostgreSQL y los backups. Las plantillas IaC deben hacer fallar el plan si TLS o
cifrado están deshabilitados; un valor predeterminado del proveedor no cuenta como evidencia.

## Integración del harness WP-03

WP-03 aún no está presente en este worktree. Al integrarlo, AG-INT debe añadir al workflow
sus comandos reales para ejecutar el harness con PostgreSQL en contenedor, el escáner de
secretos con historial completo y el escáner de PII. Este cambio no inventa comandos ni
presenta esos controles como ejecutados. TC-SPR-08 también requiere revisión de nuevas
dependencias; el SBOM y la auditoría automática no sustituyen esa revisión humana.
