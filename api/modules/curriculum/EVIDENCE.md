# Curriculum fixture evidence (WP-17)

## Reduced scope

- Synthetic fixture only: `espanol`, `I_ciclo`, `regular`; no MEP document, normative claim, or expert validation.
- Source SHA-256 is computed from the explicit JSON fixture payload and asserted by the module test.
- Rule validator checks `PlanSection.kind=activity` and the optional `ActivityContent.evidence` field from the read-only `plan-section.schema.json` contract.
- The public planning port returns `validation_incomplete` for every result.

## Executed checks

Command: `node --experimental-strip-types --test api/modules/curriculum/curriculum.test.mjs`

Result at implementation time: 7 passed, 0 failed. The input fixture uses the contract's PlanSection required fields and ActivityContent required fields; the finding case omits only the schema-optional `evidence` field.

| TC | Evidence in this module | Pending integration evidence |
|---|---|---|
| TC-FR-CUR-01 | One source/rule fixture carries IDs, versions, section, dates, validation state, and a recomputed SHA-256. | Persistent/versioned source catalog, URL consultation metadata lifecycle, and catalog integration test. |
| TC-FR-CUR-02 | Seed rule contains required semantic fields and a deterministic validator; Subject values follow the curriculum-rule schema enum. | JSON Schema contract validation and UI display of rule class. |
| TC-FR-CUR-03 | Deterministic local check emits a source/section-cited finding; result remains `validation_incomplete`. | Planning-service integration, applicable rule selection across catalog versions, human expert-validation workflow, and demonstration. |
| TC-BR-02 | The fixture is `recommended_by_pedagogy`, and its result does not claim MEP status. | Cross-class precedence/conflict cases and presentation-layer verification. |
| TC-INV-12 | Deep-frozen in-memory seed cannot be mutated. | Published-rule persistence/DB enforcement, append-only version creation, and integration test. |

These are reduced module checks only. The pending evidence should be added to the requirement-to-test matrix when integration establishes its owning service and test layer; this note does not amend the matrix or contracts.
