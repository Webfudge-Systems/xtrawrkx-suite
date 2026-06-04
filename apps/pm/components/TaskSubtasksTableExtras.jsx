'use client';

import { useMemo, useState } from 'react';
import { Avatar, Button, Select, Table, TableCellCreated, TableCellTaskStatusSelect, PM_TASK_STATUS_OPTIONS, ownerDisplayFromUser } from '@webfudge/ui';
import { ChevronDown, ChevronRight, Copy, Edit3, Eye, Link2, ListTree, Pencil, Plus, Trash2 } from 'lucide-react';
import PMRowActions from './PMRowActions';
import TaskAssigneesPicker from './TaskAssigneesPicker';
import { pmTableSelectFillProps, PRIORITY_OPTIONS } from './PMStatusBadge';
import { usePmTableSort } from '../hooks/usePmTableSort';

function SortableSubtasksTable({ columns, data, ...tableProps }) {
  const sort = usePmTableSort({ entity: 'task', data });
  const sortableColumns = useMemo(
    () => sort.bindSortableColumns(columns),
    [columns, sort.bindSortableColumns]
  );
  return <Table columns={sortableColumns} data={sort.sortedData} {...tableProps} />;
}

/** Chevron-style control next to task title to expand inline subtasks */
export function TaskSubtasksToggleButton({
  row,
  expanded,
  onToggle,
  className = '',
}) {
  const count = Number(row.subtaskCount ?? row.subtasks?.length ?? 0);
  const hasSubs = count > 0;
  return (
    <button
      type="button"
      title={hasSubs ? `${count} subtask${count === 1 ? '' : 's'}` : 'Subtasks (add or view)'}
      aria-expanded={expanded}
      aria-label={hasSubs ? `Toggle ${count} subtasks` : 'Toggle subtasks'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(row.id);
      }}
      className={`relative mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
        expanded || hasSubs
          ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
          : 'border-transparent text-gray-400 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-700'
      } ${className}`}
    >
      <ListTree className="h-3.5 w-3.5" strokeWidth={2} />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-orange-500 px-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>
  );
}

/**
 * Full-width row rendered below a parent task row (use with Table `renderAfterRow`).
 */
export function TaskSubtasksAfterRow({
  row,
  expanded,
  colSpan,
  onAddSubtask,
  users = [],
  savingId = null,
  memberScopedTasks = false,
  onUpdateTask,
  onEditTask,
  onDeleteTask,
  onCopyTaskLink,
  onOpenTask,
  childrenByParentId = {},
}) {
  const [expandedNestedIds, setExpandedNestedIds] = useState(() => new Set());
  const list = useMemo(() => {
    const fromMap = childrenByParentId?.[row.id];
    if (Array.isArray(fromMap) && fromMap.length > 0) return fromMap;
    return Array.isArray(row.subtasks) ? row.subtasks : [];
  }, [childrenByParentId, row.id, row.subtasks]);

  const nestedChildrenFor = (task) => {
    const fromMap = childrenByParentId?.[task?.id];
    if (Array.isArray(fromMap) && fromMap.length > 0) return fromMap;
    return Array.isArray(task?.subtasks) ? task.subtasks : [];
  };

  const toggleNestedExpand = (taskId) => {
    setExpandedNestedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const subtaskColumns = useMemo(
    () => [
    {
      key: 'name',
      label: 'SUBTASK',
      className: 'max-w-[16rem] align-top',
      render: (_, st) => (
        <div className="flex min-w-0 items-start gap-2">
          {(() => {
            const nestedChildren = nestedChildrenFor(st);
            const hasNested = nestedChildren.length > 0;
            if (!hasNested) {
              return <span className="mt-1 inline-block h-4 w-4 shrink-0" aria-hidden />;
            }
            const nestedOpen = expandedNestedIds.has(st.id);
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNestedExpand(st.id);
                }}
                className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title={`${nestedOpen ? 'Hide' : 'Show'} nested subtasks`}
                aria-expanded={nestedOpen}
              >
                {nestedOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            );
          })()}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTask?.(st);
            }}
            className="min-w-0 max-w-full flex-1 text-left hover:text-orange-600"
          >
            <div className="truncate font-medium text-gray-900">{st.name || 'Untitled subtask'}</div>
            <div className="truncate text-xs text-gray-500">{st.description || 'No description'}</div>
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (_, st) => (
        <TableCellTaskStatusSelect
          status={st.strapiStatus}
          onStatusChange={(status) => onUpdateTask?.(st, { status })}
          saving={savingId === st.id}
          options={PM_TASK_STATUS_OPTIONS}
          fillStyle="pm"
          containerClassName="min-w-[140px]"
        />
      ),
    },
    {
      key: 'priority',
      label: 'PRIORITY',
      render: (_, st) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={st.priority}
            options={PRIORITY_OPTIONS}
            onChange={(priority) => onUpdateTask?.(st, { priority })}
            disabled={memberScopedTasks || savingId === st.id}
            {...pmTableSelectFillProps(st.priority, 'priority')}
            containerClassName="min-w-[120px]"
            placeholder="Priority"
          />
        </div>
      ),
    },
    {
      key: 'assigner',
      label: 'ASSIGNER',
      render: (_, st) => {
        const assignerUser = st.assigner || null;
        const derived = ownerDisplayFromUser(assignerUser);
        const label =
          st.assignerName?.trim() ||
          assignerUser?.name?.trim() ||
          assignerUser?.email?.trim() ||
          (st.assignerId != null ? `User ${st.assignerId}` : '');
        const empty = !label;
        return (
          <div className="flex min-w-[165px] items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Avatar
              src={assignerUser?.avatar || undefined}
              fallback={empty ? '?' : derived.avatarFallback}
              alt={label || 'Assigner'}
              size="sm"
              className={`text-white ${empty ? 'bg-gray-300 text-gray-600' : 'bg-gray-600'}`}
            />
            <span className={`truncate text-xs font-semibold ${empty ? 'text-gray-400' : 'text-gray-900'}`}>
              {empty ? '—' : label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'assignees',
      label: 'ASSIGNEES',
      render: (_, st) => (
        <div className="min-w-[120px] py-0.5" onClick={(e) => e.stopPropagation()}>
          <TaskAssigneesPicker
            userIds={st.assigneeUserIds || []}
            assignees={st.assignees}
            users={users || []}
            onChange={(assigneeUserIds) => onUpdateTask?.(st, { assigneeUserIds })}
            disabled={memberScopedTasks || savingId === st.id}
            compact
          />
        </div>
      ),
    },
    {
      key: 'startDate',
      label: 'START DATE',
      render: (_, st) => <TableCellCreated dateString={st.startDate} dateMode="calendar" />,
    },
    {
      key: 'dueDate',
      label: 'DUE DATE',
      render: (_, st) => (
        <div>
          <TableCellCreated dateString={st.dueDate} dateMode="calendar" />
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      className: 'w-[200px]',
      render: (_, st) => (
        <div className="flex min-w-[200px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <PMRowActions
            wrapperClassName="flex shrink-0 items-center"
            triggerClassName="inline-flex h-9 w-9 items-center justify-center rounded-md p-2 text-teal-600 transition hover:bg-teal-50"
            items={[
              { label: 'View', icon: Eye, onClick: () => onOpenTask?.(st) },
              ...(memberScopedTasks
                ? []
                : [{ label: 'Edit', icon: Edit3, onClick: () => onEditTask?.(st) }]),
              { label: 'Copy link', icon: Copy, onClick: () => onCopyTaskLink?.(st) },
              ...(memberScopedTasks
                ? []
                : [{ label: 'Delete', icon: Trash2, danger: true, onClick: () => onDeleteTask?.(st) }]),
            ]}
          />
          {!memberScopedTasks ? (
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-emerald-600 hover:bg-emerald-50"
            title="Edit subtask"
            onClick={(e) => {
              e.stopPropagation();
              onEditTask?.(st);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-orange-600 hover:bg-orange-50"
            title="Copy link"
            onClick={(e) => {
              e.stopPropagation();
              onCopyTaskLink?.(st);
            }}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          {!memberScopedTasks ? (
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-red-600 hover:bg-red-50"
            title="Delete subtask"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask?.(st);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          ) : null}
        </div>
      ),
    },
  ],
    [
      childrenByParentId,
      row.id,
      row.subtasks,
      expandedNestedIds,
      memberScopedTasks,
      onCopyTaskLink,
      onDeleteTask,
      onEditTask,
      onOpenTask,
      onUpdateTask,
      savingId,
      toggleNestedExpand,
      users,
    ]
  );

  if (!expanded) return null;

  const renderNestedAfterRow = (parent) => {
    const nestedChildren = nestedChildrenFor(parent);
    if (!expandedNestedIds.has(parent.id) || nestedChildren.length === 0) return null;
    return (
      <tr className="bg-white">
        <td
          colSpan={subtaskColumns.length}
          className="border-t border-gray-100 px-4 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="ml-5 rounded-lg border border-gray-200 bg-gray-50/70 p-2.5">
            <SortableSubtasksTable
              columns={subtaskColumns}
              data={nestedChildren}
              keyField="id"
              variant="modernEmbedded"
              onRowClick={(st) => onOpenTask?.(st)}
              renderAfterRow={renderNestedAfterRow}
            />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <tr className="bg-gradient-to-b from-gray-50/95 to-white">
      <td colSpan={colSpan} className="border-t border-gray-100 px-6 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="ml-9 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subtasks</p>
          {list.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500">
              No subtasks yet. Add one to break this work into smaller steps.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <SortableSubtasksTable
                columns={subtaskColumns}
                data={list}
                keyField="id"
                variant="modernEmbedded"
                onRowClick={(st) => onOpenTask?.(st)}
                renderAfterRow={renderNestedAfterRow}
              />
            </div>
          )}
          {!memberScopedTasks ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 border-orange-200 text-orange-800 hover:bg-orange-50"
            onClick={() => onAddSubtask?.(row)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add subtask
          </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
