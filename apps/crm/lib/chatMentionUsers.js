import strapiClient from './strapiClient';

/** Organization roster for @mentions in CRM chats. */
export async function fetchChatMentionUsers() {
  const res = await strapiClient.getXtrawrkxUsers({
    pageSize: 200,
  });
  const raw = res?.data;
  return Array.isArray(raw) ? raw : [];
}
