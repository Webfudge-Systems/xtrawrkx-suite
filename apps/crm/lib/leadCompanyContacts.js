/** Primary contact row for lead company tables (list + dashboard). */
export function primaryContactForLeadCompany(company) {
  const contact =
    company?.contacts?.find((c) => c.isPrimaryContact) || company?.contacts?.[0] || null;
  const name = contact
    ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
    : '';
  return {
    contact,
    name,
    email: contact?.email || company?.email || '',
    phone: contact?.phone || company?.phone || '',
  };
}
