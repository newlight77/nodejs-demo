
'use strict';

const cassandra = require('cassandra-driver');
let config = require('./config.js');

let authProvider;

if (config.user && config.password) {
    authProvider = new cassandra.auth.PlainTextAuthProvider(config.user, config.password);
}

let systemClient = new cassandra.Client({
    contactPoints: [config.host],
    authProvider: authProvider,
    protocolOptions: {port: [config.port]}
});

let listTables = function () {
  return systemClient.connect()
      .then(function (){
          let systemQuery = "SELECT columnfamily_name as table_name FROM system.schema_columnfamilies WHERE keyspace_name = ?";
          if (systemClient.metadata.keyspaces.system_schema) {
              systemQuery = "SELECT table_name FROM system_schema.tables WHERE keyspace_name = ?";
          }

          console.log('Finding tables in keyspace: ' + config.keyspace);
          return systemClient.execute(systemQuery, [config.keyspace]);
      })
      .then(function (result){
          console.log('Completed exporting all tables from keyspace: ' + config.keyspace);

          return new Promise(resolve => {
              let tables = [];
              for(let i = 0; i < result.rows.length; i++) {
                  tables.push(result.rows[i].table_name);
              }
              console.log('resolve tables : ', tables.join(', '));
              console.log('Retrieved tables from keyspace : ' + config.keyspace);
              resolve(tables);
          });
      })
      .catch(function (err){
          console.log(err);
      });
};

let getTableInfo = function (table) {
  console.log("getTableInfo : ", table);
  return systemClient.metadata.getTable(config.keyspace, table);
  // .then(function (tableInfo) {
  //   // console.log("tableInfo : ", tableInfo);
  //   if (!tableInfo) {
  //     // console.log("tableInfo : ", tableInfo);
  //       return tableInfo;
  //   }
  //   return new Promise(resolve => {
  //       console.log(`Retrieved tableInfo ${tableInfo} from keyspace ${config.keyspace} `);
  //       resolve(tableInfo);
  //   });
  // })
  // .catch(function (err){
  //     reject(err);
  // });
};

let gracefulShutdown = function() {
  systemClient.shutdown()
      .then(function (){
          process.exit();
      })
      .catch(function (err){
          console.log(err);
          process.exit(1);
      });
};

module.exports.listTables = listTables;
module.exports.getTableInfo = getTableInfo;
module.exports.gracefulShutdown = gracefulShutdown;
