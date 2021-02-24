import Snabbdom from 'snabbdom-pragma';
import Navbar from './navbar';
import Footer from './footer';

import router from './router';
const Router = router.view;

export function view( { state, dispatch } ) {
  return <body class={{"d-flex":true, "flex-column":true, "h-100":true}}>
    <header>
    <Navbar state={state} dispatch={dispatch} />
    </header>
    <main role="main" class={{"flex-shrink-0":true}}>
    <Router state={state} dispatch={dispatch}/>
    </main>
    <Footer state={state} dispatch={dispatch} />    
    </body>;
}

export function update( message, state, dispatch ) {
  return router.update( message, state, dispatch );
}

export function init(state, dispatch) {
  return router.init(state, dispatch);  
}

export default { init, update, view };
