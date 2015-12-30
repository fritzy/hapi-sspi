'use strict';

const Boom = require('boom');
const _ = require('lodash');

const internals = {};
let baseOptions = {};

module.exports = function (plugin, options, next) {
  plugin.auth.scheme('sspi', internals.implementation);
  baseOptions = options || {};
  next();
};

module.exports.attributes = {
  pkg: require('./package.json')
};

internals.implementation = function (server, runOptions) {

  return {
    authenticate: function (request, reply) {

      const req = request.raw.req;
      const res = request.raw.res;
      const options = {
        retrieveGroups: true,
        authoritative: true,
      };

      _.extend(options, baseOptions, runOptions);

      const nodeSSPI = require('node-sspi');
      const nodeSSPIObj = new nodeSSPI(options);
      nodeSSPIObj.authenticate(req, res, function(err){
        if (!res.finished) {
          const credentials = {
            user: req.connection.user,
            userGroups: req.connection.userGroups
          };
          if (typeof options.validate === 'function') {
            options.validate(request, credentials, (err, isValid, credentials) => {
                if (err) {
                  return reply(Boom.badImplementation(err));
                }
                if (!isValid) {
                  return reply(Boom.forbidden("You do not have access to this resource"));
                }
                if (typeof credentials !== 'object') {
                  return reply(Boom.badImplementation("validate function did not return an object"));
                }
                reply.continue({credentials});
            });
          } else {
            reply.continue({credentials});
          }
        }
      });
    }
  };
}

