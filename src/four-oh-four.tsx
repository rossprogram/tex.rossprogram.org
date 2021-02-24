import Snabbdom from 'snabbdom-pragma';

export function update( message, state, dispatch ) {
  return state;
}

export function init( state, dispatch ) {
  return state;
}

export function view( {state, dispatch} ) {
  return <div class={{container:true}}>    
    <h1>404</h1> 
    <p>I could not find your page.</p>
    <p>I am so sorry.</p>
    </div>;    
}

export default { view, init, update };
