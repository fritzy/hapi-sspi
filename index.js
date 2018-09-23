'use strict';

const Boom = require('boom');

const internals = {};

exports.plugin = {
  pkg: require('./package.json'),
  register: function (server) {
    server.auth.scheme('sspi', internals.implementation);
  }
};

internals.implementation = function (server, runOptions) {
  return {
    authenticate: async function (request, h) {
      const req = request.raw.req;
      const res = request.raw.res;
      const options = {
        retrieveGroups: true,
        authoritative: true,
        ...runOptions
      };

      const nodeSSPI = require('node-sspi');
      const nodeSSPIObj = new nodeSSPI(options);

      return new Promise((resolve, reject) => {
        nodeSSPIObj.authenticate(req, res, async function (sspiError) {
          if (sspiError) {
            return reject(Boom.badImplementation(sspiError));
          }

          if (!res.finished) {
            const baseCredentials = {
              user: req.connection.user,
              userGroups: req.connection.userGroups
            };

            if (typeof options.validate === 'function') {
              const {err, isValid, credentials} = await options.validate(request, baseCredentials);

              if (err) {
                return reject(Boom.badImplementation(err));
              }
              if (!isValid) {
                return reject(Boom.forbidden("You do not have access to this resource"));
              }
              if (typeof credentials !== 'object') {
                return reject(Boom.badImplementation("validate function did not return an object"));
              }

              return resolve(h.authenticated({credentials}));
            }

            resolve(h.authenticated({credentials: baseCredentials}));
          }
        });
      });
    }
  };
};

