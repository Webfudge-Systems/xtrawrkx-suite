module.exports = ({ env }) => {
  const useS3 =
    env('AWS_ACCESS_KEY_ID') &&
    env('AWS_SECRET_ACCESS_KEY') &&
    env('AWS_REGION') &&
    env('AWS_S3_BUCKET');

  const plugins = {
    // Keep users-permissions enabled for user model, but use custom auth
    'users-permissions': {
      config: {
        register: {
          allowedFields: ['firstName', 'lastName'],
        },
      },
    },
  };

  if (useS3) {
    plugins.upload = {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          baseUrl: env('CDN_URL'),
          rootPath: env('CDN_ROOT_PATH', ''),
          s3Options: {
            credentials: {
              accessKeyId: env('AWS_ACCESS_KEY_ID'),
              secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
            },
            region: env('AWS_REGION'),
            params: {
              Bucket: env('AWS_S3_BUCKET'),
            },
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    };
  }

  return plugins;
};
