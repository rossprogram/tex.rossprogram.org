import Snabbdom from 'snabbdom-pragma';
import Spinner from './spinner';
import Prism from 'prismjs/components/prism-core';
import 'prismjs/components/prism-latex';
import 'prismjs/themes/prism.css';

export function update( message, state, dispatch ) {
  if (message[0] === 'view-source') {
    if (message[1] === state.loading) {
      return {...state, loading: false, source: message[2] };
    }
  }
      
  return state;
}

export function init( params, state, dispatch ) {
  let url = `/github/${params.owner}/${params.repo}/${params.filename}.tex`;
  console.log('init',url);
  
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.text();
    })
    .then(data => dispatch( ['view-source', url, data] ))
    .catch((error) => {
      dispatch( ['error', error.toString()] );
    });

  return {...state,
          owner: params.owner,
          repo: params.repo,
          texFilename: `${params.filename}.tex`,
          loading: url
         };
}

export function view( {state, dispatch} ) {
  console.log(state);
  
  if (state.loading)
    return <Spinner state={state} dispatch={dispatch}/>;

  if (state.source) {
    const html = Prism.highlight(state.source, Prism.languages.latex, 'latex');

    return <div class={{container:true}}>    
      <pre><code innerHTML={html}></code></pre>
      </div>;
  }
  
  return  <div class={{container:true}}>    
    <p>Could not load code.</p>
    </div>;
}
  
export default { view, init, update };
