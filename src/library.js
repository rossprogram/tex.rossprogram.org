import path from 'path';

import Kpathsea from '@ximeraproject/kpathsea';
import lsr from './lsr.json';
import { download } from './texlive';

const kpathsea = new Kpathsea({ db: lsr });

async function findMatch(partialPath) {
  if (kpathsea) return kpathsea.findMatch(partialPath);
  return undefined;
}


/****************************************************************/
// fake files

const filesystem = {};
let files = [];
let urlRoot = '';
let currentDirectory = '';
let texput;
let texmf = {};

export function deleteEverything() {
  files = [];
}

export function setTexput(buffer) {
  texput = Buffer.from(buffer);
}

export function setTexmfExtra(t) {
  texmf = t;
}

export function writeFileSync(filename, buffer) {
  files.push({
    filename,
    position: 0,
    erstat: 0,
    buffer: new Uint8Array(Buffer.from(buffer)),
    descriptor: files.length,
  });
}

export function readFileSync(filename) {
  for (const f of files) {
    if (f.filename == filename) {
      if (f.buffer) return f.buffer.slice(0, f.position);
      throw Error(`Missing buffer for filename ${f.filename}`);
    }
  }

  throw Error(`Could not find file ${filename}`);
}

let sleeping = false;
function openSync(filename, mode) {
  console.log('attempting to open', filename, 'in mode', mode);

  // FIXME: this seems like a bug with TeXlive?
  if (filename.startsWith('"')) {
    filename = filename.replace(/"/g, '');
  }

  if ((filename === 'texput.aux') || (filename === 'texput.dvi')) {
    files.push({
      filename,
      position: 0,
      erstat: 0,
      buffer: new Uint8Array(),
      descriptor: files.length,
    });
    return files.length - 1;
  }
  
  if (filename === 'texput.tex') {
    files.push({
      filename,
      position: 0,
      erstat: 0,
      buffer: new Uint8Array(texput),
      descriptor: files.length,
    });
    return files.length - 1;
  }

  if (texmf[filename]) {
    const enc = new TextEncoder(); // always utf-8

    files.push({
      filename,
      position: 0,
      erstat: 0,
      buffer: enc.encode(texmf[filename]),
      descriptor: files.length,
    });
    return files.length - 1;    
  }
  
  if (!sleeping) {
    startUnwind();
    sleeping = true;

    findMatch(filename).then((fullFilename) => {

      if (filename == 'pgfsys-ximera.def') fullFilename = '/local-texmf/tex/latex/ximeraLatex/pgfsys-ximera.def';

      console.log('looking up', fullFilename);
      
      if (fullFilename) {
	console.log('Found it in ', fullFilename);
	download(fullFilename).then((buffer) => {
	  files.push({
            filename,
	    position: 0,
	    erstat: 0,
	    buffer: new Uint8Array(buffer),
	    descriptor: files.length,
	  });
	  startRewind();
	}).catch((error) => {
          console.error(error);
          console.log('Missing file', filename);
	      
	  files.push({
            filename,
	    position: 0,
	    erstat: (mode == 'r') ? 1 : 0,
	    buffer: new Uint8Array(),
	    descriptor: files.length,
	  });
	  startRewind();
        });
      } else {
	console.log('File does not exist:', filename);
	      
	files.push({
          filename,
	  position: 0,
	  erstat: (mode == 'r') ? 1 : 0,
	  buffer: new Uint8Array(),
	  descriptor: files.length,
	});
	startRewind();
      }
    });
  } else {
    stopRewind();
    sleeping = false;

    return files.length - 1;
  }
}

function closeSync(fd) {
  // ignore this.
}

function writeSync(file, buffer, pointer = 0, length = buffer.length - pointer) {
  while (length > file.buffer.length - file.position) {
    const b = new Uint8Array(1 + file.buffer.length * 2);
    b.set(file.buffer);
    file.buffer = b;
  }
  
  file.buffer.subarray(file.position).set(buffer.subarray(pointer, pointer + length));
  file.position += length;
}

function readSync(file, buffer, pointer, length, seek) {
  if (pointer === undefined) pointer = 0;
  if (length === undefined) length = buffer.length - pointer;

  if (length > file.buffer.length - seek) length = file.buffer.length - seek;
  
  buffer.subarray(pointer).set(file.buffer.subarray(seek, seek + length));

  return length;
}

/****************************************************************/
// fake process.write.stdout

let consoleBuffer = '';

function writeToConsole(x) {
  consoleBuffer += x;
  if (consoleBuffer.indexOf('\n') >= 0) {
    const lines = consoleBuffer.split('\n');
    consoleBuffer = lines.pop() || '';
    for (const line of lines) {
      console.log(line);
    }
  }
}

const process = {
  stdout: {
    write: writeToConsole,
  },
};

/****************************************************************/
// setup

let memory;
let inputBuffer = '';
let callback = function () { throw Error('callback undefined'); };
let view;


let wasmExports;

export function setDirectory(d) {
  currentDirectory = d;
}

export function setMemory(m) {
  memory = m;
  view = new Int32Array(m);
}

export function setWasmExports(m) {
  wasmExports = m;
}

export function setUrlRoot(u) {
  urlRoot = u;
}

export function setCallback(cb) {
  callback = cb;
}

export function setConsoleWriter(cb) {
  process.stdout.write = cb;
}

export function setInput(input) {
  inputBuffer = input;
}

const DATA_ADDR = 900 * 1024 * 64;
const END_ADDR = 1000 * 1024 * 64;
let windingDepth = 0;

function startUnwind() {
  if (view) {
    view[DATA_ADDR >> 2] = DATA_ADDR + 8;
    view[DATA_ADDR + 4 >> 2] = END_ADDR;
  }
  
  wasmExports.asyncify_start_unwind(DATA_ADDR);
  windingDepth += 1;
}

function startRewind() {
  wasmExports.asyncify_start_rewind(DATA_ADDR);
  wasmExports.main();
  if (windingDepth == 0) {
    callback();
  }
}

function stopRewind() {
  windingDepth -= 1;  
  wasmExports.asyncify_stop_rewind();
}

/****************************************************************/
// provide time back to tex

export function getCurrentMinutes() {
  const d = (new Date());
  return 60 * (d.getHours()) + d.getMinutes();
}
  
export function getCurrentDay() {
  return (new Date()).getDate();
}
  
export function getCurrentMonth() {
  return (new Date()).getMonth() + 1;
}
  
export function getCurrentYear() {
  return (new Date()).getFullYear();    
}

/****************************************************************/
// print

export function printString(descriptor, x) {
  const file = (descriptor < 0) ? { stdout: true } : files[descriptor];
  const length = new Uint8Array(memory, x, 1)[0];
  const buffer = new Uint8Array(memory, x + 1, length);
  const string = String.fromCharCode.apply(null, Array.from(buffer));

  if (file.stdout) {
    process.stdout.write(string);
    return;
  }
  
  writeSync(file, Buffer.from(string));    
}
  
export function printBoolean(descriptor, x) {
    const file = (descriptor < 0) ? { stdout: true } : files[descriptor];    

    const result = x ? 'TRUE' : 'FALSE';

    if (file.stdout) {
      process.stdout.write(result);
      return;
    }

  writeSync(file, Buffer.from(result));    
}
export function printChar(descriptor, x) {
  const file = (descriptor < 0) ? { stdout: true } : files[descriptor];        
  if (file.stdout) {
    process.stdout.write(String.fromCharCode(x));
    return;
  }
  
  const b = Buffer.alloc(1);
  b[0] = x;
  writeSync(file, b);
}

export function printInteger(descriptor, x) {
  const file = (descriptor < 0) ? { stdout: true } : files[descriptor];            
  if (file.stdout) {
    process.stdout.write(x.toString());
    return;
  }

  writeSync(file, Buffer.from(x.toString()));
}

export function printFloat(descriptor, x) {
  const file = (descriptor < 0) ? { stdout: true } : files[descriptor];                
  if (file.stdout) {
    process.stdout.write(x.toString());
    return;
  }

  writeSync(file, Buffer.from(x.toString()));
}

export function printNewline(descriptor, x) {
  const file = (descriptor < 0) ? { stdout: true } : files[descriptor];
  
  if (file.stdout) {
    process.stdout.write('\n');
    return;
  }

  writeSync(file, Buffer.from('\n'));
}

export function reset(length, pointer) {
  const buffer = new Uint8Array(memory, pointer, length);
  let filename = String.fromCharCode.apply(null, Array.from(buffer));

  filename = filename.replace(/ +$/g, '');
  filename = filename.replace(/^\*/, '');    
  filename = filename.replace(/^TeXfonts:/, '');    

  if (filename == 'TeXformats:TEX.POOL') filename = 'tex.pool';

  if (filename == 'TTY:') {
    files.push({
 filename: 'stdin',
                 stdin: true,
                 position: 0,
                 erstat: 0,
               });
    return files.length - 1;
  }
  
  return openSync(filename, 'r');
}

export function rewrite(length, pointer) {
  const buffer = new Uint8Array(memory, pointer, length);
  let filename = String.fromCharCode.apply(null, Array.from(buffer));    
  
  filename = filename.replace(/ +$/g, '');    
  
  if (filename == 'TTY:') {
    files.push({
 filename: 'stdout',
                 stdout: true,
                 position: 0,
                 erstat: 0,                   
               });
    return files.length - 1;
  }
  
  return openSync(filename, 'w');
}

export function close(descriptor) {
    const file = files[descriptor];

    if (file.descriptor) closeSync(file.descriptor);
}

export function eof(descriptor) {
    const file = files[descriptor];
    
    if (file.eof) return 1;
    return 0;
}

export function erstat(descriptor) {
    const file = files[descriptor];
    return file.erstat;
}

export function eoln(descriptor) {
    const file = files[descriptor];

    if (file.eoln) return 1;
    return 0;
}
    
export function get(descriptor, pointer, length) {
  const file = files[descriptor];

  const buffer = new Uint8Array(memory);
    
  if (file.stdin) {
    if (file.position >= inputBuffer.length) {
      buffer[pointer] = 13;
      file.eof = true;
      file.eoln = true;
    } else buffer[pointer] = inputBuffer[file.position].charCodeAt(0);
  } else if (file.descriptor) {
      if (readSync(file, buffer, pointer, length, file.position) == 0) {
        buffer[pointer] = 0;
        file.eof = true;
        file.eoln = true;
        return;
      }
    } else {
      file.eof = true;
      file.eoln = true;        
      return;
    }
  
  file.eoln = false;
  if (buffer[pointer] == 10) file.eoln = true;
  if (buffer[pointer] == 13) file.eoln = true;
  
  file.position += length;
}

export function put(descriptor, pointer, length) {
  const file = files[descriptor];
  
  const buffer = new Uint8Array(memory);

  writeSync(file, buffer, pointer, length);
}
