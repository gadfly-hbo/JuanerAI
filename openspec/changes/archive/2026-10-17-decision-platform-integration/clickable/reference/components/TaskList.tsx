import { useId, useState } from 'react'
import { PRIORITY_LABELS } from '../data'
import type { ActionItemView, ActionTaskStatus, ActionTaskView } from '../data'
import type { FeedbackFormInput, TaskCreateFormInput, TaskPatchFormInput } from '../useBoardStore'
import { FeedbackForm, FeedbackReadonly } from './FeedbackForm'

interface TaskListProps {
  item: ActionItemView
  onCreateTask(item: ActionItemView, input: TaskCreateFormInput): Promise<boolean>
  onPatchTask(item: ActionItemView, task: ActionTaskView, patch: TaskPatchFormInput): Promise<boolean>
  onSaveFeedback(item: ActionItemView, task: ActionTaskView, input: FeedbackFormInput): Promise<boolean>
}

/** S4 任务列表与编辑：仅已采纳行动项展开区渲染（挂载由 ActionItemCard 控制） */
export function TaskList({ item, onCreateTask, onPatchTask, onSaveFeedback }: TaskListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  return (
    <section className="evidence-block task-block" aria-label="任务">
      <div className="task-block-head">
        <h4 className="block-title">任务</h4>
        <button type="button" className="task-add-btn" aria-expanded={formOpen} onClick={() => setFormOpen((open) => !open)}>
          添加任务
        </button>
      </div>
      {item.tasks.length === 0 && <p className="empty-lite">暂无任务，添加第一个执行任务</p>}
      <ul className="task-list">
        {item.tasks.map((task) => (
          <li key={task.id} className="task-item">
            <TaskRow
              item={item}
              task={task}
              editing={editingTaskId === task.id}
              onEditToggle={() => setEditingTaskId((current) => (current === task.id ? null : task.id))}
              onPatchTask={onPatchTask}
              onSaveFeedback={onSaveFeedback}
            />
          </li>
        ))}
      </ul>
      {formOpen && (
        <TaskForm
          mode="create"
          onSubmit={async (input) => {
            const ok = await onCreateTask(item, input)
            if (ok) setFormOpen(false)
            return ok
          }}
          onCancel={() => setFormOpen(false)}
        />
      )}
    </section>
  )
}

const TASK_STATUS_OPTIONS: Array<{ value: ActionTaskStatus; label: string }> = [
  { value: 'todo', label: '待办' },
  { value: 'doing', label: '进行' },
  { value: 'done', label: '完成' },
]

interface TaskRowProps {
  item: ActionItemView
  task: ActionTaskView
  editing: boolean
  onEditToggle(): void
  onPatchTask(item: ActionItemView, task: ActionTaskView, patch: TaskPatchFormInput): Promise<boolean>
  onSaveFeedback(item: ActionItemView, task: ActionTaskView, input: FeedbackFormInput): Promise<boolean>
}

function TaskRow({ item, task, editing, onEditToggle, onPatchTask, onSaveFeedback }: TaskRowProps) {
  const [feedbackEditing, setFeedbackEditing] = useState(false)
  const meta = [
    task.owner ? `负责人 ${task.owner}` : null,
    task.dueDate ? `截止 ${task.dueDate}` : null,
    `优先级 ${PRIORITY_LABELS[task.priority] ?? task.priority}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="task-row-wrap">
      <div className="task-row">
        <span className="task-status" role="group" aria-label="任务状态">
          {TASK_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`status-btn st-${option.value}`}
              aria-pressed={task.status === option.value}
              onClick={() => {
                if (task.status !== option.value) void onPatchTask(item, task, { status: option.value })
              }}
            >
              {option.label}
            </button>
          ))}
        </span>
        <span className="task-main">
          <span className="task-title">{task.title}</span>
          <span className="task-note">{task.note || '（未填备注）'}</span>
        </span>
        <span className="task-meta">{meta}</span>
        <button type="button" className="task-edit-btn" aria-expanded={editing} onClick={onEditToggle}>
          编辑
        </button>
      </div>
      {editing && (
        <TaskForm
          mode="edit"
          initial={task}
          onSubmit={async (input) => {
            const ok = await onPatchTask(item, task, input)
            if (ok) onEditToggle()
            return ok
          }}
          onCancel={onEditToggle}
        />
      )}
      {task.feedback && !feedbackEditing ? (
        <FeedbackReadonly feedback={task.feedback} onUpdate={() => setFeedbackEditing(true)} />
      ) : (
        <FeedbackForm
          initial={task.feedback}
          showCancel={Boolean(task.feedback)}
          onSubmit={async (input) => {
            const ok = await onSaveFeedback(item, task, input)
            if (ok) setFeedbackEditing(false)
            return ok
          }}
          onCancel={() => setFeedbackEditing(false)}
        />
      )}
    </div>
  )
}

interface TaskFormProps {
  mode: 'create' | 'edit'
  /** 编辑时预填现值 */
  initial?: Pick<ActionTaskView, 'title' | 'owner' | 'dueDate' | 'priority' | 'note'>
  onSubmit(input: TaskCreateFormInput): Promise<boolean>
  onCancel(): void
}

/** 任务新增/编辑共用 inline 表单（同构，非弹层）；标题必填，其余可选 */
function TaskForm({ mode, initial, onSubmit, onCancel }: TaskFormProps) {
  const uid = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [owner, setOwner] = useState(initial?.owner ?? '')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [priority, setPriority] = useState(initial?.priority ?? 'medium')
  const [note, setNote] = useState(initial?.note ?? '')
  const [titleError, setTitleError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (title.trim() === '') {
      setTitleError(true)
      return
    }
    setSubmitting(true)
    const ok = await onSubmit({
      title: title.trim(),
      ...(owner.trim() ? { owner: owner.trim() } : {}),
      ...(dueDate ? { dueDate } : {}),
      ...(priority ? { priority } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    })
    setSubmitting(false)
    if (ok && mode === 'create') {
      setTitle('')
      setOwner('')
      setDueDate('')
      setPriority('medium')
      setNote('')
      setTitleError(false)
    }
  }

  return (
    <form
      className="task-form"
      aria-label={mode === 'create' ? '新增任务' : '编辑任务'}
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="form-row">
        <label className="form-label" htmlFor={`${uid}-title`}>
          标题 *
        </label>
        <input
          id={`${uid}-title`}
          className="form-input"
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            if (titleError) setTitleError(false)
          }}
        />
        {titleError && (
          <p role="alert" className="form-error">
            请填写标题
          </p>
        )}
      </div>
      <div className="form-row form-row-inline">
        <label className="form-label" htmlFor={`${uid}-owner`}>
          负责人
        </label>
        <input id={`${uid}-owner`} className="form-input" type="text" value={owner} onChange={(event) => setOwner(event.target.value)} />
        <label className="form-label" htmlFor={`${uid}-due`}>
          截止日
        </label>
        <input id={`${uid}-due`} className="form-input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        <label className="form-label" htmlFor={`${uid}-priority`}>
          优先级
        </label>
        <select id={`${uid}-priority`} className="form-select" value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </div>
      <div className="form-row">
        <label className="form-label" htmlFor={`${uid}-note`}>
          备注
        </label>
        <input id={`${uid}-note`} className="form-input" type="text" value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
      <div className="form-actions">
        <button type="submit" className="primary-btn" disabled={submitting}>
          {mode === 'create' ? '添加任务' : '保存'}
        </button>
        <button type="button" disabled={submitting} onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  )
}
