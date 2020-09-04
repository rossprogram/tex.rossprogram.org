import texCorePath from '../tex/core.4b580e5b16c4.dump.gz';
import texBinaryPath from '../tex/out.8c3fe3450cb5.wasm';
import * as library from './library';

import pako from 'pako';
import { ReadableStream } from "web-streams-polyfill";
import fetchStream from 'fetch-readablestream';

let pages = 1500;

var coredump;
var code;
let compiled;

var theTerminal;
var editor;

async function load() {
  let tex = await fetch(texBinaryPath);
  code = await tex.arrayBuffer();

  let response = await fetchStream(texCorePath);
  const reader = response.body.getReader();
  const inf = new pako.Inflate();
  
  try {
    while (true) {
      const {done, value} = await reader.read();
      inf.push(value, done);
      if (done) break;
    }
  }
  finally {
    reader.releaseLock();
  }

  compiled = new WebAssembly.Module(code);
  coredump = new Uint8Array( inf.result, 0, pages*65536 );
}

load();

function copy(src)  {
  var dst = new Uint8Array(src.length);
  dst.set(src);
  return dst;
}

async function compile(callback) {
  const memory = new WebAssembly.Memory({ initial: pages, maximum: pages });
  
  const buffer = new Uint8Array(memory.buffer, 0, pages * 65536);
  buffer.set(copy(coredump));
  
  library.setMemory(memory.buffer);

  library.setDirectory('');
  
  library.setInput(' texput.tex');
  
  library.setCallback(() => {
    const filename = 'texput.dvi';
    //let data = library.readFileSync( filename )
    const data = library.readFileSync('texput.dvi');
    //self.postMessage({ dvi: data }, [data.buffer]);
    console.log('**** DONE');
    callback( null, data.buffer );
  });
  
  let instance;

  try {
    instance = await WebAssembly.instantiate(compiled, {
      library,
      env: { memory },
    });
  } catch (err) {
    console.log(err);
    // reject(err);
  }
    
  const wasmExports = instance.exports;
  library.setWasmExports(wasmExports);
    
  wasmExports.main();
}

onmessage = async function(e) {
  console.log('Message received from main script');
  let source = e.data.source;
  console.log(source);
  //var workerResult = 'Result: ' + (e.data[0] * e.data[1]);
  //console.log('Posting message back to main script');
  //postMessage(workerResult);

  let texmf = {};
  library.deleteEverything();
  library.setTexput(source);
  library.setTexmfExtra(texmf);
  library.setTexputAux(new Uint8Array());
  
  library.setConsoleWriter((x) => {
    postMessage({text: x});
  });

  compile( function (err, dvi) {
    if (err) {
    } else {
      const aux = library.readFileSync('texput.aux');
      library.deleteEverything();
      library.setTexput(source);
      library.setTexputAux(aux);
      compile( function (err, dvi) {
        if (err) {
        } else {
          postMessage({dvi: dvi});
        }
      });
    }
  });
}
