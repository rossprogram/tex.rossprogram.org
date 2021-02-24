import Snabbdom from 'snabbdom-pragma';
import Route from 'route-parser';

//import Home from './home';
import FourOhFour from './four-oh-four';
import ViewSource from './view-source';
import Spinner from './spinner';

function findRoute( pathname, state, dispatch ) {
  // FIXME: ugh this is such an ugly hack
  if (pathname === '/') {
    let href = '/ximeraproject/about/overview.tex';
    setTimeout( () => history.replaceState(null, '', href), 100);
    setTimeout( () => dispatch(['navigate-to', href]), 100);
    return { ...state, component: {view: Spinner} };
  }
  
  let r = new Route('/:owner/:repo/(*filename).tex');
  if (r.match(pathname))
    return {...ViewSource.init(r.match(pathname), state, dispatch), component: ViewSource };

  // No route found!
  return { ...state, component: FourOhFour };
}

function ErrorComponent(text) {
  return { view: function ({state, dispatch}) {
    return  <div class={{"container":true}}>
      <h1>Error 500</h1>
      <p>{ text }</p>
      </div>;
  }
         };
}

export function update( message, state, dispatch ) {
  if (message[0] == 'error') {
    console.log('error!');
    return {...state, component: ErrorComponent(message[1]) };
  }
  
  if (message[0] == 'navigate-to') {
    return findRoute( message[1], {...state, dropdown: false, flashDanger: false}, dispatch );
  }
  
  if (state && state.component) 
    return state.component.update( message, state, dispatch );
  
  return state;
}

export function init(state, dispatch) {
  return findRoute( window.location.pathname, state, dispatch );
}

function DisplayError(text) {
  return  <div class={{"container":true}}>
    <h1>Error 500</h1>
    <p>{ text }</p>
    </div>;
}

export function view( { state, dispatch } ) {
  if (state && state.component) 
    return state.component.view( {state, dispatch} );
  else
    return DisplayError('No route found.');
}

const stopPropagation = function(ev) { ev.stopPropagation() };
const preventDefault = function(ev) { ev.preventDefault() };

function onClick( dispatch, href ) {
  return function(ev) {
    ev.preventDefault()

    dispatch(['navigate-to', href]);
    history.pushState(null, '', href);
    
    ev.stopPropagation();
  };
}

export function Link( props, children ) {
  return <a {...props} on-click={onClick(props.dispatch, props.href)}>{ children }</a>;
}

export default { view, init, update, Link };
