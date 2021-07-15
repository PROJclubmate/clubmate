const buildDevLogger = require('./dev-logger');
const buildProdLogger = require('./prod-logger');

let logger = null;
if(process.env.ENVIRONMENT === 'dev'){
  logger = buildDevLogger()
} else if (process.env.ENVIRONMENT === 'prod'){
  logger = buildProdLogger()
}

module.exports = logger;