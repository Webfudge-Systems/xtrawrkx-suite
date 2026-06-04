'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, CheckSquare, FolderOpen, ArrowUpRight } from 'lucide-react'
import { LoadingSpinner, WorkspaceSearchModal } from '@webfudge/ui'
import { useRouter } from 'next/navigation'
import taskService from '../lib/api/taskService'
import projectService from '../lib/api/projectService'
import { transformTask, transformProject } from '../lib/api/dataTransformers'
import { PMStatusBadge } from './PMStatusBadge'

function SearchEmpty({ icon: Icon, title, description }) {
  return (
    <div className="px-6 py-12 text-center">
      <Icon className="mx-auto mb-4 h-10 w-10 text-gray-300" strokeWidth={1.25} aria-hidden />
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-1.5 text-sm text-gray-500">{description}</p> : null}
    </div>
  )
}

function SearchSection({ title, children, className = '' }) {
  return (
    <section className={`py-2 ${className}`.trim()}>
      <p className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
      <div className="space-y-0.5 px-2">{children}</div>
    </section>
  )
}

function SearchResultButton({ icon: Icon, title, subtitle, statusBadge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/80"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm ring-1 ring-gray-200/80">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        {subtitle ? <p className="truncate text-xs text-gray-500">{subtitle}</p> : null}
      </div>
      {statusBadge}
      <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
    </button>
  )
}

export default function GlobalSearchModal({ isOpen, onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery)
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
    return undefined
  }, [isOpen, initialQuery])

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setTasks([])
      setProjects([])
      return undefined
    }
    const debounce = setTimeout(async () => {
      try {
        setLoading(true)
        const [taskRes, projRes] = await Promise.allSettled([
          taskService.searchTasks(query, { pageSize: 5 }),
          projectService.searchProjects(query, { pageSize: 5 }),
        ])
        const taskItems =
          taskRes.status === 'fulfilled'
            ? (taskRes.value?.data || taskRes.value || []).map(transformTask)
            : []
        const projItems =
          projRes.status === 'fulfilled'
            ? (projRes.value?.data || projRes.value || []).map(transformProject)
            : []
        setTasks(taskItems.slice(0, 5))
        setProjects(projItems.slice(0, 5))
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(debounce)
  }, [query, isOpen])

  const hasResults = tasks.length > 0 || projects.length > 0
  const trimmed = query.trim()

  let body = null
  if (loading) {
    body = (
      <div className="flex items-center justify-center gap-3 px-6 py-12">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-500">Searching…</span>
      </div>
    )
  } else if (trimmed && !hasResults) {
    body = (
      <SearchEmpty
        icon={Search}
        title="No results found"
        description={`Nothing matched "${trimmed}". Try different keywords.`}
      />
    )
  } else if (!trimmed) {
    body = (
      <SearchEmpty
        icon={Search}
        title="Search tasks and projects"
        description="Type to find tasks and projects across your workspace."
      />
    )
  } else (
    body = (
      <>
        {tasks.length > 0 ? (
          <SearchSection title="Tasks">
            {tasks.map((task) => (
              <SearchResultButton
                key={task.id}
                icon={CheckSquare}
                title={task.name}
                subtitle={task.project || null}
                statusBadge={<PMStatusBadge status={task.strapiStatus} type="task" />}
                onClick={() => {
                  router.push(`/tasks/${task.id}`)
                  onClose()
                }}
              />
            ))}
          </SearchSection>
        ) : null}
        {projects.length > 0 ? (
          <SearchSection
            title="Projects"
            className={tasks.length > 0 ? 'border-t border-gray-200/80' : ''}
          >
            {projects.map((project) => (
              <SearchResultButton
                key={project.id}
                icon={FolderOpen}
                title={project.name}
                subtitle={project.clientName || null}
                statusBadge={<PMStatusBadge status={project.strapiStatus} type="project" />}
                onClick={() => {
                  router.push(`/projects/${project.slug || project.id}`)
                  onClose()
                }}
              />
            ))}
          </SearchSection>
        ) : null}
      </>
    )
  )

  return (
    <WorkspaceSearchModal
      isOpen={isOpen}
      onClose={onClose}
      query={query}
      onQueryChange={setQuery}
      placeholder="Search tasks, projects…"
      inputRef={inputRef}
      footer={
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span>
            <kbd className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 font-sans text-[11px]">↵</kbd>{' '}
            to open
          </span>
          <span>
            <kbd className="rounded-md border border-gray-300 bg-white px-1.5 py-0.5 font-sans text-[11px]">Esc</kbd>{' '}
            to close
          </span>
        </div>
      }
    >
      {body}
    </WorkspaceSearchModal>
  )
}
