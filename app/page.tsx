"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Plus, Search, Trash2, Edit2, CheckCircle2, Circle, ArrowUpDown } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import type { Task, TaskFilter, TaskSort } from "@/types/task"
import { cn } from "@/lib/utils"

const MOCK_API = {
  getTasks: (): Task[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("task_tracker_data")
    return stored ? JSON.parse(stored) : []
  },
  saveTasks: (tasks: Task[]) => {
    localStorage.setItem("task_tracker_data", JSON.stringify(tasks))
  },
}

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<TaskFilter>("all")
  const [sortBy, setSortBy] = useState<TaskSort>("date")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    setTasks(MOCK_API.getTasks())
  }, [])

  useEffect(() => {
    if (tasks.length > 0) MOCK_API.saveTasks(tasks)
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesSearch = task.title.toLowerCase().includes(debouncedSearch.toLowerCase())
        const matchesFilter = filter === "all" || task.status === filter
        return matchesSearch && matchesFilter
      })
      .sort((a, b) => {
        if (sortBy === "date") return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        return a.title.localeCompare(b.title)
      })
  }, [tasks, debouncedSearch, filter, sortBy])

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const dueDate = formData.get("dueDate") as string

    if (editingTask) {
      setTasks(tasks.map((t) => (t.id === editingTask.id ? { ...t, title, dueDate } : t)))
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        dueDate,
        status: "pending",
        createdAt: Date.now(),
      }
      setTasks([newTask, ...tasks])
    }
    closeModal()
  }

  const toggleStatus = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: t.status === "pending" ? "done" : "pending" } : t)))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id))
  }

  const openModal = (task?: Task) => {
    if (task) setEditingTask(task)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTask(null)
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans p-6 md:p-12" suppressHydrationWarning>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-primary font-mono text-sm uppercase tracking-widest mb-2">Workspace</p>
            <h1 className="text-5xl md:text-7xl font-light tracking-tight text-balance">Task Tracker</h1>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:opacity-90 transition-all font-medium"
          >
            <Plus size={20} />
            <span>Add Task</span>
          </button>
        </header>

        {/* Controls */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex bg-card border border-border rounded-xl p-1">
            {(["all", "pending", "done"] as TaskFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                  filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortBy(sortBy === "date" ? "name" : "date")}
            className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 hover:bg-accent/50 transition-all"
          >
            <ArrowUpDown size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium">Sort by {sortBy === "date" ? "Date" : "Name"}</span>
          </button>
        </section>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-4 bg-card border border-border p-5 rounded-2xl hover:border-primary/50 transition-all"
              >
                <button
                  onClick={() => toggleStatus(task.id)}
                  className={cn(
                    "shrink-0 transition-colors",
                    task.status === "done" ? "text-primary" : "text-muted-foreground hover:text-primary",
                  )}
                >
                  {task.status === "done" ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>

                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "text-lg font-medium truncate transition-all",
                      task.status === "done" && "text-muted-foreground line-through opacity-50",
                    )}
                  >
                    {task.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    Due{" "}
                    {new Date(task.dueDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openModal(task)}
                    className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-card/50 border border-dashed border-border rounded-3xl">
              <p className="text-muted-foreground">No tasks found. Time to focus!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-light mb-6">{editingTask ? "Edit Task" : "New Task"}</h2>
            <form onSubmit={handleSaveTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-muted-foreground">Title</label>
                <input
                  autoFocus
                  name="title"
                  defaultValue={editingTask?.title}
                  required
                  placeholder="What needs to be done?"
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-muted-foreground">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={editingTask?.dueDate}
                  required
                  className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-accent transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all font-medium"
                >
                  {editingTask ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
