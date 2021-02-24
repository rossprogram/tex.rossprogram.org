import './spinner.css';
import Snabbdom from 'snabbdom-pragma';

export function view( {state, dispatch} ) {
  return <div class={{spinner:true}}>Loading...</div>;
}

export default view;
