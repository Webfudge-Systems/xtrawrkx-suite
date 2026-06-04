import projectService from './projectService';

/** Map API client-account options rows to Select options. */
export function mapProjectClientSelectOptions(rows = []) {
  return rows.map((row) => ({
    value: String(row.id),
    label: row.label || row.companyName || `Client ${row.id}`,
  }));
}

export async function fetchProjectClientOptions() {
  return projectService.getProjectClientOptions();
}
