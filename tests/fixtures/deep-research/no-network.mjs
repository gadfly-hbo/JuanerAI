import {Socket} from 'node:net';
const connect=Socket.prototype.connect;
Socket.prototype.connect=function(...args){const value=Array.isArray(args[0])?args[0][0]:args[0],host=typeof value==='object'?value.host:args[1];if(typeof value==='object'&&value.path)return connect.apply(this,args);if(!['127.0.0.1','localhost','::1'].includes(host))throw Error('OFFLINE_VALIDATION_NETWORK_DENIED');return connect.apply(this,args);};
