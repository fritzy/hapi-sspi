# Hapi-SSPI

**Looking for new maintainer**

Implements Windows SSPI authentication for Hapi.

## Example

```js
'use strict';
const hapi = require('hapi');

const server = new hapi.Server({
  port: 3001
});

async function validate(request, credentials) {
  if (credentials.user && credentials.userGroups) {
    return {credentials, isValid: true};
  }

  return {credentials: null, isValid: false};
}

async function start() {
  await server.register([
    {
      plugin: require('./'),
      options: {
        authoritative: true,
        retrieveGroups: true,
        offerBasic: false,
        perRequestAuth: false
      }
    }
  ]);

  server.auth.strategy('windows', 'sspi', {validate});

  server.route({
    method: 'GET',
    path: '/',
    handler: function (req) {
      return {auth: req.auth};
    },
    config: {
      auth: 'windows'
    }
  });

  await server.start();
}

start();
```

## Options

Base options are the same as implemented in [node-sspi](https://npmjs.org/package/node-sspi) plus a validate function that takes hapiRequest, credentials (user and userGroups if enabled), and a callback. The callback should be called with error, isValid, credentials object.

These values will be set on hapiRequest.auth.credentials.

You can set the options upon registration and/or setting of the strategy. The validate function is optional.

## Notes

This will only work in Windows as restricted by node-sspi.

## License

MIT as provided in LICENSE file
