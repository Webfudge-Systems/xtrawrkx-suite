import { fetchProjectDirectoryUsers } from './messageService';

/** Organization roster for @mentions in PM chats. */
export async function fetchChatMentionUsers() {
  return fetchProjectDirectoryUsers();
}
