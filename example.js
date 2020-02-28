"use strict";
const hapi = require("@hapi/hapi");

const server = new hapi.Server({
  port: 3001
});

async function validate(request, credentials) {
  if (credentials.user && credentials.userGroups) {
    return { credentials, isValid: true };
  }

  return { credentials: null, isValid: false };
}

async function start() {
  await server.register([
    {
      plugin: require("./"),
      options: {
        authoritative: true,
        retrieveGroups: true,
        offerBasic: false,
        perRequestAuth: false
      }
    }
  ]);

  server.auth.strategy("windows", "sspi", { validate });

  server.route({
    method: "GET",
    path: "/",
    handler: function(req) {
      return { auth: req.auth };
    },
    config: {
      auth: "windows"
    }
  });

  await server.start();
}

start();
