'use client'

import type { ReactNode } from 'react'
import { createBooksRecordStore } from '../createBooksRecordStore'
import { MOCK_PROJECT_ROWS, MOCK_TIME_ENTRY_ROWS, type ProjectRow, type TimeEntryRow } from './seeds'

const projectStore = createBooksRecordStore<ProjectRow>(
  'books.mock-projects.v1',
  'books-projects-storage',
  MOCK_PROJECT_ROWS
)
const timeEntryStore = createBooksRecordStore<TimeEntryRow>(
  'books.mock-time-entries.v1',
  'books-time-entries-storage',
  MOCK_TIME_ENTRY_ROWS
)

export function BooksTimeTrackingStoresProvider({ children }: { children: ReactNode }) {
  return (
    <projectStore.Provider>
      <timeEntryStore.Provider>{children}</timeEntryStore.Provider>
    </projectStore.Provider>
  )
}

export function useBooksProjectsStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = projectStore.useStore()
  return {
    projects: records,
    getById,
    updateProject: updateRecord,
    deleteProject: deleteRecord,
    createProject: createRecord,
    resetProjects: resetRecords,
  }
}

export function useBooksTimeEntriesStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = timeEntryStore.useStore()
  return {
    timeEntries: records,
    getById,
    updateTimeEntry: updateRecord,
    deleteTimeEntry: deleteRecord,
    createTimeEntry: createRecord,
    resetTimeEntries: resetRecords,
  }
}
