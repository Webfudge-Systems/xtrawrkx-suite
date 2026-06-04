'use client';

import { Input, Select } from '@webfudge/ui';

export const RECURRENCE_FREQUENCY_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

export const RECURRENCE_CUSTOM_UNIT_OPTIONS = [
  { value: 'day', label: 'day(s)' },
  { value: 'week', label: 'week(s)' },
  { value: 'month', label: 'month(s)' },
];

/** Monday-first row; values match JS `Date#getDay()` (0 = Sun … 6 = Sat). */
const WEEKDAY_TOGGLES = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

/**
 * @param {object} props
 * @param {object} props.value — flat fields matching task draft / modal form
 * @param {(patch: object) => void} props.onChange
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 */
export default function TaskRecurrenceFormFields({ value, onChange, disabled, className }) {
  const v = value || {};
  const freq = v.recurrenceFrequency || 'none';
  const weekdays = Array.isArray(v.recurrenceWeekdays) ? v.recurrenceWeekdays.map(Number) : [];

  const patch = (partial) => onChange?.({ ...v, ...partial });

  const toggleWeekday = (day) => {
    const set = new Set(weekdays);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    patch({ recurrenceWeekdays: [...set].sort((a, b) => a - b) });
  };

  return (
    <div className={className ?? 'space-y-4 rounded-xl border border-orange-100 bg-orange-50/40 p-4'}>
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">Repeat</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Repeats"
          value={freq}
          options={RECURRENCE_FREQUENCY_OPTIONS}
          onChange={(recurrenceFrequency) => patch({ recurrenceFrequency })}
          disabled={disabled}
        />
        {freq !== 'none' ? (
          <Input
            label="Every"
            type="number"
            min={1}
            value={String(v.recurrenceInterval ?? 1)}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              patch({ recurrenceInterval: Number.isFinite(n) && n >= 1 ? n : 1 });
            }}
            disabled={disabled}
            placeholder="1"
          />
        ) : null}
      </div>

      {freq === 'weekly' ? (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-600">On days</p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_TOGGLES.map(({ day, label }) => {
              const on = weekdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleWeekday(day)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    on
                      ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-700/30'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50'
                  } ${disabled ? 'opacity-50' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {freq === 'monthly' ? (
        <Input
          label="Day of month (1–31, optional)"
          type="number"
          min={1}
          max={31}
          value={v.recurrenceMonthDay != null && v.recurrenceMonthDay !== '' ? String(v.recurrenceMonthDay) : ''}
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (raw === '') {
              patch({ recurrenceMonthDay: '' });
              return;
            }
            const n = parseInt(raw, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 31) patch({ recurrenceMonthDay: n });
          }}
          disabled={disabled}
          placeholder="Same as start/due"
        />
      ) : null}

      {freq === 'custom' ? (
        <Select
          label="Interval unit"
          value={v.recurrenceCustomUnit || 'day'}
          options={RECURRENCE_CUSTOM_UNIT_OPTIONS}
          onChange={(recurrenceCustomUnit) => patch({ recurrenceCustomUnit })}
          disabled={disabled}
        />
      ) : null}

      {freq !== 'none' ? (
        <Input
          label="End repeat (optional)"
          type="date"
          value={v.recurrenceEndsAt || ''}
          onChange={(e) => patch({ recurrenceEndsAt: e.target.value || '' })}
          disabled={disabled}
        />
      ) : null}

      {freq !== 'none' ? (
        <p className="text-xs text-gray-500">
          Start date below anchors each occurrence.
          When you mark this task complete, the next occurrence is created with updated dates (same assignee, project, and
          repeat settings).
        </p>
      ) : null}
    </div>
  );
}

/** Build API payload fields from flat form state (used by modal + detail save). */
export function recurrencePayloadFromForm(form) {
  const freq = form.recurrenceFrequency || 'none';
  if (freq === 'none') {
    return {
      recurrenceFrequency: 'none',
      recurrenceInterval: 1,
      recurrenceWeekdays: [],
      recurrenceMonthDay: null,
      recurrenceCustomUnit: 'day',
      recurrenceEndsAt: null,
    };
  }
  const interval = Math.max(1, parseInt(String(form.recurrenceInterval ?? 1), 10) || 1);
  return {
    recurrenceFrequency: freq,
    recurrenceInterval: interval,
    recurrenceWeekdays: freq === 'weekly' && Array.isArray(form.recurrenceWeekdays) ? form.recurrenceWeekdays : [],
    recurrenceMonthDay:
      freq === 'monthly' &&
      form.recurrenceMonthDay !== '' &&
      form.recurrenceMonthDay != null &&
      Number(form.recurrenceMonthDay) >= 1 &&
      Number(form.recurrenceMonthDay) <= 31
        ? Number(form.recurrenceMonthDay)
        : null,
    recurrenceCustomUnit: freq === 'custom' ? form.recurrenceCustomUnit || 'day' : 'day',
    recurrenceEndsAt: form.recurrenceEndsAt
      ? new Date(`${form.recurrenceEndsAt}T23:59:59`).toISOString()
      : null,
  };
}
