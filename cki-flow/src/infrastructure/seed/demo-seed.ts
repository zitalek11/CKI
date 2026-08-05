import {
  AssigneeRule,
  CreationPolicy,
  DependencyKind,
  DependencyStrength,
  EpicStatus,
  InitiativeStatus,
  QuarterStatus,
  SprintStatus,
  StoryType,
  TemplateStatus,
  TemplateVersionState,
} from '@/domain/model/enums'
import { createEmptyDatabase, type DomainDatabase } from '@/domain/model/database'
import { createId } from '@/domain/model/ids'
import { formatQuarterKey } from '@/domain/model/keys'
import { touchSystemFields } from '@/domain/model/system'

const ACTOR = 'system'

export function createDemoDatabase(): DomainDatabase {
  const db = createEmptyDatabase()
  const now = touchSystemFields(undefined, ACTOR)

  const productId = createId()
  const teamId = createId()
  const quarterId = createId()
  const initiativeId = createId()
  const epicId = createId()

  const roleBA = createId()
  const roleSA = createId()
  const roleBE = createId()
  const roleFE = createId()
  const roleQA = createId()
  const rolePM = createId()

  const wtBA = createId()
  const wtSA = createId()
  const wtBE = createId()
  const wtFE = createId()
  const wtQA = createId()
  const wtREL = createId()

  const templateId = createId()
  const versionId = createId()
  const docsTemplateId = createId()
  const docsVersionId = createId()

  db.products.push({
    id: productId,
    key: 'CKI',
    name: 'ЦКИ Platform',
    description: 'Demo product for CKI Flow',
    defaultWorkflowTemplateId: templateId,
    storySequence: 0,
    ...now,
  })

  db.teams.push({
    id: teamId,
    productId,
    name: 'Team Core',
    code: 'CORE',
    ...now,
  })

  const roles: Array<[typeof roleBA, string, string]> = [
    [roleBA, 'BA', 'Business Analyst'],
    [roleSA, 'SA', 'System Analyst'],
    [roleBE, 'BE', 'Backend'],
    [roleFE, 'FE', 'Frontend'],
    [roleQA, 'QA', 'QA'],
    [rolePM, 'PM', 'Product Manager'],
  ]
  for (const [id, code, name] of roles) {
    db.roleSkills.push({ id, productId, code, name, isActive: true, ...now })
  }

  const workTypes: Array<[typeof wtBA, string, string, typeof roleBA]> = [
    [wtBA, 'BA', 'Business Analysis', roleBA],
    [wtSA, 'SA', 'System Analysis', roleSA],
    [wtBE, 'BE', 'Backend Development', roleBE],
    [wtFE, 'FE', 'Frontend Development', roleFE],
    [wtQA, 'QA', 'QA', roleQA],
    [wtREL, 'REL', 'Release Prep', rolePM],
  ]
  for (const [id, code, name, roleId] of workTypes) {
    db.workTypes.push({
      id,
      productId,
      code,
      name,
      defaultRoleSkillId: roleId,
      isActive: true,
      ...now,
    })
  }

  const employees = [
    { name: 'Анна PM', role: rolePM },
    { name: 'Борис BA', role: roleBA },
    { name: 'Светлана SA', role: roleSA },
    { name: 'Дмитрий BE', role: roleBE },
    { name: 'Елена FE', role: roleFE },
    { name: 'Игорь QA', role: roleQA },
  ]
  for (const person of employees) {
    const employeeId = createId()
    db.employees.push({
      id: employeeId,
      productId,
      displayName: person.name,
      defaultTeamId: teamId,
      weeklyHours: 40,
      productAllocationPercent: 100,
      status: 'active',
      ...now,
    })
    db.employeeSkills.push({
      id: createId(),
      employeeId,
      roleSkillId: person.role,
      weight: 1,
    })
  }

  db.quarters.push({
    id: quarterId,
    productId,
    key: formatQuarterKey(2026, 3),
    year: 2026,
    index: 3,
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    status: QuarterStatus.Active,
    ...now,
  })

  db.quarterGoals.push({
    id: createId(),
    quarterId,
    productId,
    title: 'Ускорить поставку отчётности',
    statement: 'Сократить цикл подготовки еженедельного отчёта до 1 дня',
    status: 'tracking',
    targetValue: 100,
    currentValue: 35,
    ...now,
  })

  db.initiatives.push({
    id: initiativeId,
    productId,
    quarterId,
    key: 'INI-1',
    title: 'CKI Flow MVP',
    outcome: 'Команда планирует квартал и спринты в CKI Flow',
    status: InitiativeStatus.Committed,
    businessValue: 90,
    ...now,
  })

  db.epics.push({
    id: epicId,
    productId,
    initiativeId,
    key: 'EPIC-1',
    title: 'Планирование и бэклог',
    description: 'Базовые сущности и workflow',
    status: EpicStatus.InDelivery,
    ...now,
  })

  db.sprints.push({
    id: createId(),
    productId,
    quarterId,
    teamId,
    name: 'Sprint 4',
    startDate: '2026-08-04',
    endDate: '2026-08-17',
    status: SprintStatus.Active,
    interruptBufferPercent: 15,
    ...now,
  })

  db.workflowTemplates.push({
    id: templateId,
    productId,
    code: 'WT-API',
    name: 'API Feature',
    description: 'BA → SA → BE → FE → QA → Release Prep',
    status: TemplateStatus.Published,
    currentPublishedVersionId: versionId,
    applicableStoryTypes: [StoryType.Feature, StoryType.Enhancement, StoryType.Integration],
    ...now,
  })

  db.workflowTemplateVersions.push({
    id: versionId,
    workflowTemplateId: templateId,
    versionNumber: 1,
    state: TemplateVersionState.Published,
    creationPolicy: CreationPolicy.Hybrid,
    publishedAt: now.createdAt,
    stages: [
      stage('BA', 'Business Analysis', wtBA, roleBA, 8, 1),
      stage('SA', 'System Analysis', wtSA, roleSA, 12, 2),
      stage('BE', 'Backend Development', wtBE, roleBE, 16, 3),
      stage('FE', 'Frontend Development', wtFE, roleFE, 12, 4),
      stage('QA', 'QA', wtQA, roleQA, 10, 5),
      stage('REL', 'Release Prep', wtREL, rolePM, 2, 6),
    ],
    dependencyRules: [
      rule('BA', 'SA'),
      rule('SA', 'BE'),
      rule('SA', 'FE'),
      rule('BE', 'QA'),
      rule('FE', 'QA'),
      rule('QA', 'REL'),
    ],
    ...now,
  })

  db.workflowTemplates.push({
    id: docsTemplateId,
    productId,
    code: 'WT-DOCS',
    name: 'Documentation',
    status: TemplateStatus.Published,
    currentPublishedVersionId: docsVersionId,
    applicableStoryTypes: [StoryType.Documentation],
    ...now,
  })

  db.workflowTemplateVersions.push({
    id: docsVersionId,
    workflowTemplateId: docsTemplateId,
    versionNumber: 1,
    state: TemplateVersionState.Published,
    creationPolicy: CreationPolicy.Hybrid,
    publishedAt: now.createdAt,
    stages: [
      stage('DRAFT', 'Content Draft', wtBA, roleBA, 6, 1),
      stage('REVIEW', 'Review', wtSA, roleSA, 3, 2),
      stage('PUBLISH', 'Publish', wtREL, rolePM, 2, 3),
    ],
    dependencyRules: [rule('DRAFT', 'REVIEW'), rule('REVIEW', 'PUBLISH')],
    ...now,
  })

  return db
}

function stage(
  key: string,
  name: string,
  workTypeId: ReturnType<typeof createId>,
  roleSkillId: ReturnType<typeof createId>,
  hours: number,
  sortHint: number,
) {
  return {
    id: createId(),
    key,
    name,
    workTypeId,
    requiredRoleSkillId: roleSkillId,
    defaultEstimateHours: hours,
    isMandatory: true,
    assigneeRule: AssigneeRule.Unassigned,
    sortHint,
  }
}

function rule(fromStageKey: string, toStageKey: string) {
  return {
    id: createId(),
    fromStageKey,
    toStageKey,
    kind: DependencyKind.FS,
    strength: DependencyStrength.Hard,
    lagDays: 0,
  }
}
