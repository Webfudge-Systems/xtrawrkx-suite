/**
 * Whether to show the “create delivery project?” prompt when moving a deal to Won.
 */
export function shouldPromptDeliveryProjectOnWon(deal, nextStage) {
  const next = String(nextStage || '').toLowerCase();
  if (next !== 'won') return false;
  const prev = String(deal?.stage || '').toLowerCase();
  if (prev === 'won') return false;
  const dp = deal?.deliveryProject;
  const hasProject =
    dp != null && (typeof dp === 'object' ? dp.id != null || dp.documentId != null : Boolean(dp));
  return !hasProject;
}
