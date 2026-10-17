// Exact form-only type excerpt from fixed c11f8da src/useBoardStore.ts. Runtime hook is not used.
export interface ManualSuggestInput {
  title: string
  rationale: string
  scene?: string
  lifecycle?: string
  priority?: string
  effort?: string
}

export interface TaskCreateFormInput {
  title: string
  owner?: string
  dueDate?: string
  priority?: string
  note?: string
}

export interface TaskPatchFormInput {
  title?: string
  owner?: string
  dueDate?: string
  priority?: string
  note?: string
  status?: import('./data').ActionTaskView['status']
}

export interface FeedbackFormInput {
  adopted: boolean
  outcome: string
  metricDelta?: string
  review?: string
  score: number
}

