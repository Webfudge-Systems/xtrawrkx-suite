'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/chat-messages/clientAccount/:id',
      handler: 'chat-message.listForClientAccount',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/chat-messages',
      handler: 'chat-message.find',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/chat-messages',
      handler: 'chat-message.create',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
