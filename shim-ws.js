// Shim for the 'ws' module to use React Native's native WebSocket
module.exports = global.WebSocket;
module.exports.Server = function () {
    throw new Error('WebSocket Server is not supported in React Native');
};
