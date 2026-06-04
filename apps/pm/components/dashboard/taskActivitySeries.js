/** Start of local calendar day */
export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameCalendarDay(isoDate, dayStart) {
  if (!isoDate) return false;
  const t = new Date(isoDate);
  if (Number.isNaN(t.getTime())) return false;
  return startOfDay(t).getTime() === dayStart.getTime();
}

/**
 * Last N days of task activity for area chart (created + completed per day).
 */
export function buildTaskActivitySeries(tasks = [], days = 7) {
  const today = startOfDay(new Date());
  const points = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);

    let created = 0;
    let completed = 0;

    for (const task of tasks) {
      if (sameCalendarDay(task.createdAt, day)) created += 1;
      if (
        task.strapiStatus === 'COMPLETED' &&
        sameCalendarDay(task.updatedAt || task.createdAt, day)
      ) {
        completed += 1;
      }
    }

    points.push({
      day,
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      shortLabel: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      created,
      completed,
      total: created + completed,
    });
  }

  const max = Math.max(1, ...points.map((p) => p.total));
  return { points, max, days };
}
