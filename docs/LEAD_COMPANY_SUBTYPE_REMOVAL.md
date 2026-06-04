# Lead Company Sub-type Removal

## Summary

Removed the **Sub-type** field from lead companies. Company type alone is used for classification; the long sub-type picklists (EV OEM, Angel, Incubator, etc.) are no longer stored or shown.

## Scope

- **Backend:** `subType` removed from `lead-company` schema and generated types
- **Utils:** `subTypeOptionsByCompanyType` and `getSubTypeOptionsForType` removed from `@webfudge/utils`
- **CRM:** Add/edit forms, detail inline edit, table column, filter modal, sort config, deal sidebar display
- **Activity log:** `subType` field label removed from CRM activity field map

## Migration

1. Restart Strapi so the schema migration drops the `subType` column.
2. Existing sub-type values on lead companies are no longer returned by the API after restart.
3. Users who had sub-type columns visible in the leads table may need to hide stale column prefs via the column picker (localStorage key unchanged).

## Related

Client accounts had sub-type removed earlier; see [CLIENT_ACCOUNT_INDUSTRY_UPDATE.md](./CLIENT_ACCOUNT_INDUSTRY_UPDATE.md).
