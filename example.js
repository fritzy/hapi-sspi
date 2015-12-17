'use strict';
const hapi = require('hapi');

const server = new hapi.Server();
server.connection({
  port: 3001
});

function validate(request, credentials, callback) {
  if (credentials.user && credentials.userGroups) {
    callback(null, true, credentials);
  } else {
    callback(null, false);
  }
}

server.register([
  {
    register: require('./'),
    options: {
        authoritative: true,
        retrieveGroups: true,
        offerBasic: false,
        perRequestAuth: false
      }
  }
], (err) => {
  server.auth.strategy('windows', 'sspi', {validate});

  server.route({
    method: 'GET',
    path: '/',
    handler: function (req, reply) {
      reply({auth: req.auth});
    },
    config: {
      auth: 'windows'
    }
  });

  if (err) throw err;
  server.start((err) => {
    if (err) throw err;
  });

});
