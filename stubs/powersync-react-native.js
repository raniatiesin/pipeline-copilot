'use strict';
/**
 * Web stub for @powersync/react-native.
 * Metro resolves this file for web builds via metro.config.js resolveRequest.
 * Keeps the app renderable on web without the native SQLite dependency.
 */
const React = require('react');

// PowerSyncProvider — passthrough wrapper on web
function PowerSyncProvider({ children }) {
  return children;
}
exports.PowerSyncProvider = PowerSyncProvider;

// PowerSyncDatabase — no-op on web
function PowerSyncDatabase() {}
PowerSyncDatabase.prototype.connect = async function () {};
PowerSyncDatabase.prototype.execute = async function () {};
PowerSyncDatabase.prototype.watch = async function* () { yield []; };
PowerSyncDatabase.prototype.getNextCrudTransaction = async function () { return null; };
exports.PowerSyncDatabase = PowerSyncDatabase;

// Schema helpers — no-ops on web
function Schema() {}
exports.Schema = Schema;

function Table() {}
exports.Table = Table;

exports.column = {
  text: 'text',
  integer: 'integer',
  real: 'real',
};

exports.usePowerSync = function () { return {}; };
exports.useQuery = function () { return { data: [], isLoading: false }; };
exports.useStatus = function () { return { connected: false }; };
