import { collectDistinctIndustriesFromList } from '@webfudge/ui';
import clientAccountService from './api/clientAccountService';

/** Distinct industry values already saved on client accounts. */
export async function fetchStoredIndustriesForPm() {
  return collectDistinctIndustriesFromList((page, pageSize) =>
    clientAccountService.getAll({
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
    })
  );
}
