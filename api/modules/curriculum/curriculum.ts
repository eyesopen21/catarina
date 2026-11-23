/**
 * Small deterministic curriculum engine used as a synthetic development fixture.
 * Its contents are not MEP material and are not suitable for validating real plans.
 */
import { createHash } from "node:crypto";

export type RuleClass =
  | "required_by_MEP"
  | "recommended_by_pedagogy"
  | "teacher_preference"
  | "local_institution_policy";

export type Subject =
  | "espanol"
  | "matematica"
  | "estudios_sociales_civica"
  | "ciencias";

export interface CurriculumSource {
  readonly id: string;
  readonly document: string;
  readonly url: string;
  readonly consultedOn: string;
  readonly sha256: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly validationStatus: "unvalidated" | "expert_validated";
}

export interface CurriculumRule {
  readonly id: string;
  readonly curriculumVersionId: string;
  readonly sourceId: string;
  readonly sourceVersion: string;
  readonly sourceSection: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly educationLevel: "I_ciclo" | "II_ciclo";
  readonly modality: string;
  readonly subject: Subject;
  readonly ruleType: "structure";
  readonly ruleClass: RuleClass;
  readonly severity: "error" | "warning" | "info";
  readonly validator: {
    readonly validatorId: "section-field-present";
    readonly params: { readonly kind: "activity"; readonly field: "evidence" };
  };
  readonly humanExplanation: string;
  readonly exceptions: readonly string[];
  readonly validationStatus: "unvalidated" | "expert_validated";
}

export interface CurriculumPlanInput {
  readonly subject: Subject;
  readonly educationLevel: "I_ciclo" | "II_ciclo";
  readonly modality: string;
  readonly sections: readonly {
    readonly kind:
      | "learning_outcome"
      | "content"
      | "methodology"
      | "strategy"
      | "activity"
      | "question"
      | "annex"
      | "indicator"
      | "instrument"
      | "time"
      | "source"
      | "competency"
      | "reflection";
    readonly content?: Readonly<Record<string, unknown>>;
  }[];
}

export interface CurriculumFinding {
  readonly code: "CUR-SYN-001";
  readonly ruleId: string;
  readonly ruleClass: RuleClass;
  readonly severity: CurriculumRule["severity"];
  readonly message: string;
  readonly citation: {
    readonly sourceId: string;
    readonly sourceVersion: string;
    readonly section: string;
  };
}

export interface CurriculumValidationResult {
  readonly validationStatus: "validation_incomplete";
  readonly findings: readonly CurriculumFinding[];
  readonly appliedRuleIds: readonly string[];
}

/** Stable public port consumed by planning; it has no dependency on planning. */
export interface CurriculumPlanningPort {
  validatePlan(input: CurriculumPlanInput): CurriculumValidationResult;
}

/** Exact explicit payload whose digest is recorded as the synthetic source hash. */
export const curriculumFixtureContent = deepFreeze({
  source: {
    id: "019a0000-0000-7000-8000-000000000001",
    document: "Synthetic Spanish curriculum fixture",
    url: "synthetic://catarina/curriculum/espanol",
    consultedOn: "2026-11-22",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
  },
  rule: {
    id: "019a0000-0000-7000-8000-000000000002",
    curriculumVersionId: "019a0000-0000-7000-8000-000000000003",
    sourceId: "019a0000-0000-7000-8000-000000000001",
    sourceVersion: "synthetic-1",
    sourceSection: "fixture/activities/evidence",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    educationLevel: "I_ciclo" as const,
    modality: "regular",
    subject: "espanol" as const,
    ruleType: "structure" as const,
    ruleClass: "recommended_by_pedagogy" as const,
    severity: "info" as const,
    validator: {
      validatorId: "section-field-present" as const,
      params: { kind: "activity" as const, field: "evidence" as const },
    },
    humanExplanation:
      "La actividad del fixture sintético incluye evidencia observable para facilitar su revisión.",
    exceptions: [] as string[],
  },
});

export const curriculumFixtureContentJson = JSON.stringify(curriculumFixtureContent);
const fixtureHash = createHash("sha256")
  .update(curriculumFixtureContentJson, "utf8")
  .digest("hex");

const source: CurriculumSource = deepFreeze({
  ...curriculumFixtureContent.source,
  sha256: fixtureHash,
  validationStatus: "unvalidated" as const,
});

const rule: CurriculumRule = deepFreeze({
  ...curriculumFixtureContent.rule,
  validationStatus: "unvalidated" as const,
});

/** Read-only synthetic fixture; its identifiers and content are stable. */
export const curriculumSeed = deepFreeze({ source, rule });

export function createCurriculumPlanningPort(): CurriculumPlanningPort {
  return Object.freeze({
    validatePlan(input: CurriculumPlanInput): CurriculumValidationResult {
      const applies =
        input.subject === rule.subject &&
        input.educationLevel === rule.educationLevel &&
        input.modality === rule.modality;
      const findings: CurriculumFinding[] = [];

      if (applies) {
        const hasEvidence = input.sections.some(
          (section) =>
            section.kind === rule.validator.params.kind &&
            section.content?.type === "activity" &&
            typeof section.content?.[rule.validator.params.field] === "string" &&
            (section.content?.[rule.validator.params.field] as string).trim().length > 0,
        );
        if (!hasEvidence) {
          findings.push({
            code: "CUR-SYN-001",
            ruleId: rule.id,
            ruleClass: rule.ruleClass,
            severity: rule.severity,
            message: rule.humanExplanation,
            citation: {
              sourceId: rule.sourceId,
              sourceVersion: rule.sourceVersion,
              section: rule.sourceSection,
            },
          });
        }
      }

      // No seed rule has expert validation, so this engine cannot issue a final
      // curricular judgment regardless of whether a synthetic check passed.
      return deepFreeze({
        validationStatus: "validation_incomplete" as const,
        findings,
        appliedRuleIds: applies ? [rule.id] : [],
      });
    },
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
