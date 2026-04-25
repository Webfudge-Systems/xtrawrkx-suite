'use strict';

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/test/hello',
            handler: 'test.hello',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/extension/linkedin-profile-html',
            handler: 'test.receiveLinkedInProfileHtml',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};
