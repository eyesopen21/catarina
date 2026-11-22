import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  createCurriculumPlanningPort,
  curriculumFixtureContent,
  curriculumFixtureContentJson,
  curriculumSeed,
} from "./curriculum.ts";

const validActivitySection = {
  id: "019a0000-0000-7000-8000-000000000010",
  plan_id: "019a0000-0000-7000-8000-000000000011",
  kind: "activity",
  position: 0,
  state: "draft",
  current_version_id: "019a0000-0000-7000-8000-000000000012",
  row_version: 0,
  content: {
    type: "activity",
    moment: "inicio",
    teacher_actions: "Presenta una consigna de lectura.",
    student_actions: "Leen y comentan en parejas.",
    instructions: "Lean el texto y compartan una observación.",
    grouping: "parejas",
    materials: ["cuento sintético"],
    estimated_minutes: 10,
    learning_outcome_ids: ["019a0000-0000-7000-8000-000000000013"],
    evidence: "Cada pareja comparte una observación del texto.",
  },
  links: [],
};

function inputWithSection(section) {
  return {
    subject: "espanol",
    educationLevel: "I_ciclo",
    modality: "regular",
    sections: [section],
  };
}

test("TC-FR-CUR-01: source digest matches explicit reproducible fixture content", () => {
  assert.match(curriculumSeed.source.id, /^[0-9a-f-]{36}$/);
  assert.equal(curriculumSeed.source.validationStatus, "unvalidated");
  assert.equal(curriculumSeed.rule.sourceId, curriculumSeed.source.id);
  assert.equal(curriculumSeed.rule.sourceVersion, "synthetic-1");
  assert.equal(curriculumSeed.rule.sourceSection, "fixture/activities/evidence");
  assert.equal(
    curriculumSeed.source.sha256,
    createHash("sha256").update(curriculumFixtureContentJson, "utf8").digest("hex"),
  );
  assert.equal(curriculumFixtureContentJson, JSON.stringify(curriculumFixtureContent));
});

test("TC-FR-CUR-02: rule has versioned provenance and schema vocabulary", () => {
  const { rule } = curriculumSeed;
  for (const field of [
    "sourceId",
    "sourceVersion",
    "sourceSection",
    "effectiveFrom",
    "educationLevel",
    "modality",
    "subject",
    "ruleType",
    "severity",
    "validator",
    "humanExplanation",
    "exceptions",
    "ruleClass",
  ]) {
    assert.ok(field in rule, `missing ${field}`);
  }
  assert.equal(rule.validator.validatorId, "section-field-present");
  assert.equal(rule.validator.params.kind, "activity");
  assert.equal(rule.validator.params.field, "evidence");
  assert.equal(rule.ruleClass, "recommended_by_pedagogy");
  assert.equal(validActivitySection.kind, "activity");
  assert.equal(validActivitySection.content.type, "activity");
});

test("TC-FR-CUR-03 in-scope: a schema-shaped plan result stays validation_incomplete", () => {
  const result = createCurriculumPlanningPort().validatePlan(inputWithSection(validActivitySection));
  assert.equal(result.validationStatus, "validation_incomplete");
  assert.deepEqual(result.findings, []);
});

test("TC-FR-CUR-03: missing optional activity evidence yields a cited finding", () => {
  const { evidence: _evidence, ...activityContent } = validActivitySection.content;
  const sectionWithoutOptionalEvidence = { ...validActivitySection, content: activityContent };
  const result = createCurriculumPlanningPort().validatePlan(
    inputWithSection(sectionWithoutOptionalEvidence),
  );
  assert.equal(result.validationStatus, "validation_incomplete");
  assert.equal(result.findings[0].code, "CUR-SYN-001");
  assert.equal(result.findings[0].ruleClass, "recommended_by_pedagogy");
  assert.deepEqual(result.findings[0].citation, {
    sourceId: curriculumSeed.source.id,
    sourceVersion: "synthetic-1",
    section: "fixture/activities/evidence",
  });
});

test("TC-BR-02: pedagogical recommendation is never labelled as MEP", () => {
  const result = createCurriculumPlanningPort().validatePlan({
    subject: "espanol",
    educationLevel: "I_ciclo",
    modality: "regular",
    sections: [],
  });
  assert.equal(result.findings[0].ruleClass, "recommended_by_pedagogy");
  assert.notEqual(result.findings[0].ruleClass, "required_by_MEP");
  assert.ok(!result.findings[0].message.toLowerCase().includes("mep"));
});

test("TC-INV-12 reduced: in-memory seed record is immutable", () => {
  assert.ok(Object.isFrozen(curriculumSeed));
  assert.ok(Object.isFrozen(curriculumSeed.source));
  assert.ok(Object.isFrozen(curriculumSeed.rule.validator.params));
  assert.throws(() => {
    curriculumSeed.rule.sourceVersion = "mutated";
  }, TypeError);
  assert.equal(curriculumSeed.rule.sourceVersion, "synthetic-1");
});

test("validation is deterministic and only applies to the seeded scope", () => {
  const port = createCurriculumPlanningPort();
  const input = inputWithSection(validActivitySection);
  assert.deepEqual(port.validatePlan(input), port.validatePlan(input));
  const otherScope = port.validatePlan({ ...input, educationLevel: "II_ciclo" });
  assert.deepEqual(otherScope.appliedRuleIds, []);
  assert.deepEqual(otherScope.findings, []);
  assert.equal(otherScope.validationStatus, "validation_incomplete");
});
