module.exports = ({ env }) => ({
  // Keep users-permissions enabled for user model, but use custom auth
  'users-permissions': {
    config: {
      register: {
        allowedFields: ['firstName', 'lastName']
      }
    }
  },
});
