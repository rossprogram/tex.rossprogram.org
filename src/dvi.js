import { dvi2vdom } from 'dvi2html';
import './fonts/tex/tex.css';
import { init } from 'snabbdom/build/package/init'
import { classModule } from 'snabbdom/build/package/modules/class'
import { propsModule } from 'snabbdom/build/package/modules/props'
import { styleModule } from 'snabbdom/build/package/modules/style'
import { h } from 'snabbdom/build/package/h' // helper function for creating vnodes

var patch = init([ // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  styleModule, // handles styling on elements with support for animations
])

var desktop;

export function render(dvi) {
  let vdoms = [];

  // This fixes how snabbdom handles svg
  const myCreateElement = function (tagName, options, children) {
    if (options && options.props && options.props.innerHTML) {
      return h(tagName,
	       {
		 ...options,
		 domProps: options.props, 
	       },
	       children);
    } 
    return h(tagName, options, children);
    
  };

  let buffer = new Buffer(dvi);
  
  dvi2vdom(buffer, h,
	   (vdom) => {
	     vdoms.push(vdom);
	   });
  
  let root = h('div', { class: { tex: true } }, vdoms);
  let root2 = h('div', { class: { desktop: true } }, [root]);
  
  patch( desktop, root2 );
  desktop = root2;
}

export function setDesktop(d) {
  desktop = d;
}
