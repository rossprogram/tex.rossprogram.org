#!/usr/bin/env node

require('dotenv').config();
var http = require('http');
var path = require('path');
var ShareDB = require('sharedb');
var express = require('express');
var WebSocketJSONStream = require('@teamwork/websocket-json-stream');
var WebSocket = require('ws');

// Start ShareDB
const db = require('sharedb-mongo')('mongodb://localhost:' +
                                    process.env.MONGODB_PORT + '/' +
                                    process.env.MONGODB_DATABASE,
                                    {mongoOptions: { useUnifiedTopology: true } });
const share = new ShareDB({db});

var connection = share.connect();

// Create a WebSocket server
var app = express();

app.use(express.static(path.resolve(__dirname, '../dist')));
app.use('/texmf', express.static(process.env.TEXMF));
app.use('/local-texmf', express.static(path.resolve(__dirname, '../local-texmf')));

var server = http.createServer(app);
var wss = new WebSocket.Server({server: server});

app.get('*', function (request, response) {
  response.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

let port = process.env.PORT;

server.listen(port);
console.log('Listening on http://localhost:' + port.toString());

// Connect any incoming WebSocket connection with ShareDB
wss.on('connection', function(ws) {
  var stream = new WebSocketJSONStream(ws);
  share.listen(stream);
});
