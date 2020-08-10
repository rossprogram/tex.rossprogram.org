import './base.css';
import ace from 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-min-noconflict/theme-chrome';
import 'ace-builds/src-min-noconflict/mode-latex';
import SharedbAce from 'sharedb-ace';
import Split from 'split.js';
import sharedb from 'sharedb/lib/client';
import packageJson from '../package.json';
import { v4 } from 'uuid';
import * as dvi from './dvi';

import { library, icon } from '@fortawesome/fontawesome-svg-core'
import { faSearchPlus, faSearch, faSearchMinus, faPlayCircle } from '@fortawesome/free-solid-svg-icons'

library.add(faSearchPlus, faSearch, faSearchMinus, faPlayCircle);
let iconZoomIn = icon({ prefix: 'fas', iconName: 'search-plus' });
let iconZoomOut = icon({ prefix: 'fas', iconName: 'search-minus' });
let iconZoomReset = icon({ prefix: 'fas', iconName: 'search' });
let iconCompile = icon({ prefix: 'fas', iconName: 'play-circle' });

import Worker from './tex.worker.js';
const worker = new Worker();

let zoom = 1;

let terminalLog = function() { };
worker.onmessage = function (event) {
  if (event.data.text) {
    terminalLog(event.data.text);
  }
  if (event.data.dvi) {
    dvi.render( event.data.dvi );
  }
};

let WsUrl = 'ws://' + window.location.host;
if (window.location.protocol === 'https:') {
  WsUrl = 'wss://' + window.location.host;
}

function compile(source) {
  terminalLog('\n');
  worker.postMessage({ source });
}

function main(docid) {
  let ShareAce = new SharedbAce(docid, { namespace: 'tex',
                                         WsUrl });

  ////////////////////////////////////////////////////////////////
  
  const desktop = document.createElement('div');
  desktop.style = 'background-color: #666;';
  const terminal = document.createElement('div');
  const view = document.createElement('div');
  view.appendChild(desktop);
  view.appendChild(terminal);
  terminal.className = 'terminal';

  dvi.setDesktop(desktop);
  
  let pre = document.createElement('pre');
  terminal.appendChild(pre);
  
  terminalLog = function(x) {
    pre.appendChild(document.createTextNode(x));
    terminal.scrollTop = terminal.scrollHeight;
    //pre.innerText = pre.innerText + x;
  };
  
  terminalLog('This is ' + packageJson.name + ' version ' + packageJson.version + ',\n');
  terminalLog('created by Jim Fowler.\n\n');
  
  
  Split([desktop, terminal], {
    sizes: [75, 25],
    direction: 'vertical',
  });
  
  
  ////////////////////////////////////////////////////////////////

  const element = document.createElement('div');
    
  let editor = ace.edit(element);
  editor.setTheme('ace/theme/chrome');
  editor.session.setMode('ace/mode/latex');
  editor.resize();
  editor.getSession().setUseWrapMode(true);
  editor.setShowPrintMargin(false);
    
  let resizeObserver = new ResizeObserver(() => {
    editor.resize();
  });
  resizeObserver.observe(element);
    
  editor.focus();
    
  ShareAce.on('ready', function() {
    ShareAce.add(editor, ['data'],
                 []);
  });
  
  let editorElement = element;
  
  const split = document.createElement('div');
  split.style = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; flex-direction: row;';

  split.appendChild(editorElement);

  split.appendChild(view);

  document.body.appendChild(split);

  Split([editorElement, view], {
    minSize: 0,
    sizes: [75, 25],
    elementStyle: function(dimension, size, gutterSize) {
      return {
        'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)',
        'min-width': 0,
      }
    },
    gutterStyle: function(dimension, gutterSize) {
      return {
        'flex-basis': gutterSize + 'px',
      }
    },
  });

  ////////////////////////////////////////////////////////////////

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  document.body.appendChild(toolbar);
    
  const zoomOut = document.createElement('button');
  zoomOut.className = 'zoom-out';
  zoomOut.innerHTML = iconZoomOut.html;
  zoomOut.setAttribute('title','Zoom out');
  toolbar.appendChild(zoomOut);
  zoomOut.addEventListener("click", function(e) {
    zoom = zoom / 1.1;
    desktop.style.zoom = zoom;
  });

  const zoomReset = document.createElement('button');
  zoomReset.className = 'zoom-reset';
  zoomReset.setAttribute('title','Zoom to 100%');
  zoomReset.innerHTML = iconZoomReset.html;
  toolbar.appendChild(zoomReset);
  zoomReset.addEventListener("click", function(e) {
    zoom = 1.0;
    desktop.style.zoom = zoom;
  });

  const zoomIn = document.createElement('button');
  zoomIn.className = 'zoom-in';
  zoomIn.setAttribute('title','Zoom in');
  zoomIn.innerHTML = iconZoomIn.html;
  toolbar.appendChild(zoomIn);
  zoomIn.addEventListener("click", function(e) {
    zoom = zoom * 1.1;
    desktop.style.zoom = zoom;
  });

  const button = document.createElement('button');
  button.className = 'compile';
  button.setAttribute('title','Compile');
  button.innerHTML = iconCompile.html;
  toolbar.appendChild(button);

  button.addEventListener("click", function(e) {
    compile(editor.getValue());
    e.preventDefault();
  });

  editorElement.onmouseenter = function(e) {
    toolbar.style.opacity = 0;
  };
  editorElement.onmouseleave = function(e) {
    toolbar.style.opacity = 1;
  };
  
  document.addEventListener('keyup', function(e) {
    if (e.keyCode === 13) {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        compile(editor.getValue());
        e.preventDefault();
      }
    }
  });
}

////////////////////////////////////////////////////////////////
// get a random document id

let docid = window.location.pathname;
if (docid === '/') {
  docid = v4();
  window.history.replaceState(null, '', docid);
} else {
  docid = docid.replace(/^\//, '');
  if (docid.match(/\//)) {
    docid = docid.replace(/\//, '-');
    window.history.replaceState(null, '', docid);
  }
}

////////////////////////////////////////////////////////////////
// Open WebSocket connection to ShareDB server

var socket = new WebSocket(WsUrl);
var connection = new sharedb.Connection(socket);

var doc = connection.get('tex', docid);

doc.fetch(function(err) {
  if (err) throw err;
  if (doc.type === null) {
    let comment = '% Collaborate by asking your friends to visit \n' +
        '% ' + (window.location.toString());

    comment = comment + "\n\n% compile your file by pushing control + enter"
    
    let emptyContents = '\\documentclass{article}\n\n' +
        comment + 
        '\n\n\\begin{document}\n\nYou can type \\TeX\\ here.\n\n\\end{document}';

    doc.create({data:emptyContents}, function(err) {
      if (err) throw err;
      main(docid);
    });
  } else {
    main(docid);
  }
});
