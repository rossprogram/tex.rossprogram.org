import Snabbdom from 'snabbdom-pragma';
import Cmd from './cmd';

function Award( { id } ) {
  return <a href={`http://www.nsf.gov/awardsearch/showAward?AWD_ID=${id}`}>DUE-{id}</a>;
}

function Responsive( { long, short } ) {
  return <span><span class={{"d-none":true, "d-md-inline":true}}>{ long }</span><span class={{"d-inline":true, "d-md-none":true}}>{ short }</span></span>;
}

export function view( { state, dispatch } ) {
  return <footer class={{"footer":true, "mt-auto":true, "py-3":true, "bg-dark":true, "text-white":true}}>
    <div class={{"container":true}}>
    <span class={{"text-muted":true}}>Built with <a href="/about/support">support from</a>&nbsp;the <Responsive long="National Science Foundation" short="NSF"/> (<Award id="1245433"/>, <Award id="1915294"/>, <Award id="1915363"/>, <Award id="1915438"/>), <span class={{"d-none":true, "d-md-inline":true}}>the</span> <a href="/about/support"><Responsive long="Shuttleworth Foundation" short="Shuttleworth"/></a>, <Responsive long="the" short=""/> <a href="http://math.osu.edu/"><Responsive long="Department of Mathematics" short="Math Department"/></a>, and <Responsive long="the" short=""/> <a href="https://affordablelearning.osu.edu/"><Responsive long="Affordable Learning Exchange" short="ALX"/></a>.  Any opinions, findings, and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the National Science Foundation.</span>
       </div>
    </footer>;
}

export default view;
