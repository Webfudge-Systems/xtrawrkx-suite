'use strict';

const { makeBooksCrudController } = require('../../../utils/books-crud');
const UID = 'api::item.item';

module.exports = makeBooksCrudController(UID, {
  defaultPopulate: ['organization'],
  extraFilters: (q) => {
    const f = {};
    if (q.type) f.type = q.type;
    if (q.isActive !== undefined) f.isActive = q.isActive === 'false' ? false : true;
    if (q.search) {
      delete f.$or;
      return { ...f, $or: [{ name: { $containsi: q.search } }, { sku: { $containsi: q.search } }] };
    }
    return f;
  },
});
