#!/usr/bin/env -S node --experimental-modules

import http from 'http';
import express from 'express';
import * as github from './github.js';

import dotenv from 'dotenv'
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

var app = express();

app.use(express.static(path.resolve(__dirname, '../dist')));

app.use(`/${process.env.TEXLIVE_VERSION}/texmf`,
	(req, res, next) => {
	  const oneYear = 365 * 24 * 60 * 60;
	  res.setHeader('Cache-Control', 'max-age=' + oneYear + ', immutable');
	  next();
	},
	express.static(process.env.TEXMF) );

app.use('/texmf-local', express.static(path.resolve(__dirname, '../texmf-local')));

app.get('/:owner/:repo/:path(*.tex)', github.getRepository, github.get );
app.get('/:owner/:repo/:path(*.dvi)', github.getRepository, github.get );
app.get('/:owner/:repo/:path(*.png)', github.getRepository, github.get );

app.get('/', function (request, response) {
  response.sendFile(path.resolve(__dirname, '../dist/index.html'));
  
});

app.get('*', function (request, response) {
  response.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

let port = process.env.PORT;
var server = http.createServer(app);
server.listen(port);
console.log('Listening on http://localhost:' + port.toString());
