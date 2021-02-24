////////////////////////////////////////////////////////////////
// Load our CSS
import './base.css';

////////////////////////////////////////////////////////////////
// Display a banner
import { version } from '../package.json';
console.log("This is\n" +
"  ▀██▄   ▄██▀ ██ █████     █████ ▄███████████████████▄    ███\n" + 
"    ▀██▄██▀   ██▐██ ▐██   ██▌ ██▌██                 ██▌  ██▀██\n" + 
"      ███     ██▐██  ██▌ ▐██  ██▌▐█████████ ▄████████▀  ██▀ ▀██\n" + 
"    ▄██▀██▄   ██▐██  ▐██ ██▌  ██▌██        ▐█▌  ▀██▄   ██▀   ▀██\n" + 
"  ▄██▀   ▀██▄ ██▐██   ▀███▀   ██▌▀█████████▐█▌    ▀██▄██▀     ▀██\n" +
"version",version);

////////////////////////////////////////////////////////////////
// my riff on the elm architecture, via snabbdom
import Snabbdom from 'snabbdom-pragma';

import { init } from 'snabbdom/init';
import { classModule } from 'snabbdom/modules/class';
import { propsModule } from 'snabbdom/modules/props';
import { attributesModule } from 'snabbdom/modules/attributes';
import { styleModule } from 'snabbdom/modules/style';
import { eventListenersModule } from 'snabbdom/modules/eventlisteners';

var patch = init([ // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  attributesModule, // for setting attributes on DOM elements  
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
]);

var vnode; // the initial container
let state;

function repaint() {
  if (vnode === undefined)
    vnode = patch(document.body, app.view({state, dispatch}));
  else
    vnode = patch(vnode, app.view({state, dispatch}));
}

window.onpopstate = function() {
  dispatch( ['navigate-to', window.location.pathname] );
};

window.onresize = function() {
  dispatch( ['window-resize', window.innerWidth, window.innerHeight] );
};

import app from './app';

/* I am using requestAnimationFrame instead
function debounce(func, wait) {
  var timeout;
  return function() {
    var later = function() {
      timeout = null;
      func();
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const repaintSlowly = debounce( repaint, 10 );
*/

function update(newState) {
  state = newState;
  //repaintSlowly();
  window.requestAnimationFrame( repaint );
}

export function dispatch(message) {
  update( app.update(message, state, dispatch) );
}

update( app.init(state, dispatch) );
