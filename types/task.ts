export type TaskStatus = "pending" | "done"

export interface Task {
  id: string
  title: string
  dueDate: string
  status: TaskStatus
  createdAt: number
}

export type TaskFilter = "all" | "pending" | "done"
export type TaskSort = "date" | "name"
