import { collectDistinctIndustriesFromList } from '@webfudge/ui';
import clientAccountService from './api/clientAccountService';
import leadCompanyService from './api/leadCompanyService';

async function industriesFromEndpoint(getAll) {
  return collectDistinctIndustriesFromList((page, pageSize) =>
    getAll({
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
    })
  );
}

/** Distinct industry values already saved on client accounts and lead companies. */
export async function fetchStoredIndustriesForCrm() {
  const [fromAccounts, fromLeads] = await Promise.all([
    industriesFromEndpoint((params) => clientAccountService.getAll(params)).catch(() => []),
    industriesFromEndpoint((params) => leadCompanyService.getAll(params)).catch(() => []),
  ]);
  return [...new Set([...fromAccounts, ...fromLeads])];
}
