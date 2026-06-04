'use strict';

function isPlatformAdminUser(user) {
  return Boolean(user?.isPlatformAdmin);
}

function requirePlatformAdmin(ctx) {
  if (!ctx.state.user) {
    return ctx.unauthorized('Missing or invalid credentials');
  }
  if (!isPlatformAdminUser(ctx.state.user)) {
    return ctx.forbidden('Platform administrator access required');
  }
  return null;
}

module.exports = {
  isPlatformAdminUser,
  requirePlatformAdmin,
};
