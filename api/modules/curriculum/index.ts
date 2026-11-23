/** Curriculum bounded context entry point. */
export type Marker = object;

export {
  createCurriculumPlanningPort,
  curriculumFixtureContent,
  curriculumFixtureContentJson,
  curriculumSeed,
} from "./curriculum.js";
export type {
  CurriculumFinding,
  CurriculumPlanInput,
  CurriculumPlanningPort,
  CurriculumRule,
  CurriculumSource,
  CurriculumValidationResult,
  RuleClass,
  Subject,
} from "./curriculum.js";
