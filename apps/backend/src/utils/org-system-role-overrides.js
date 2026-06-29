'use strict';

const rbac = require('../constants/rbac-app-matrix');

function normalizeCode(code) {
  return String(code || '').trim().toLowerCase();
}

function readOverrides(org) {
  const raw = org?.systemRolePermissions;
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

function resolveSystemRolePermissions(role, orgOverrides) {
  const code = normalizeCode(role?.code || role?.name);
  const override = readOverrides({ systemRolePermissions: orgOverrides })[code];
  if (override?.permissions && typeof override.permissions === 'object') {
    return rbac.normalizePermissions(override.permissions);
  }

  const raw = role?.permissions;
  const hasStored = raw && typeof raw === 'object' && Object.keys(raw).length > 0;
  if (hasStored) {
    return rbac.normalizePermissions(raw);
  }

  return rbac.defaultPermissionsForSystemCode(code);
}

function resolveSystemRoleDescription(role, orgOverrides) {
  const code = normalizeCode(role?.code || role?.name);
  const override = readOverrides({ systemRolePermissions: orgOverrides })[code];
  if (typeof override?.description === 'string' && override.description.trim()) {
    return override.description.trim();
  }
  return role?.description || '';
}

function buildSystemRoleOverrideEntry(existingEntry, { permissions, description }) {
  const next = existingEntry && typeof existingEntry === 'object' ? { ...existingEntry } : {};

  if (permissions && typeof permissions === 'object') {
    next.permissions = rbac.normalizePermissions(permissions);
  }

  if (typeof description === 'string') {
    next.description = description;
  }

  return next;
}

module.exports = {
  readOverrides,
  resolveSystemRolePermissions,
  resolveSystemRoleDescription,
  buildSystemRoleOverrideEntry,
};
