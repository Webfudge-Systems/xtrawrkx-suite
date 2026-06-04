'use strict';

const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('manual-journals', 'api::manual-journal.manual-journal', [
  { method: 'PUT',  path: '/manual-journals/:id/publish', handler: 'api::manual-journal.manual-journal.publish', config: { auth: false } },
  { method: 'POST', path: '/manual-journals/:id/reverse', handler: 'api::manual-journal.manual-journal.reverse', config: { auth: false } },
]);
