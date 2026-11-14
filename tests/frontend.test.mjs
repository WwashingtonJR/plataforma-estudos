import assert from 'node:assert/strict';

class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.className = '';
    this.value = '';
    this.disabled = false;
    this.classList = {
      add: value => this.classList.toggle(value, true),
      toggle: (value, enabled) => {
        this.className = [...this.className.split(' ').filter(item => item && item !== value), ...(enabled ? [value] : [])].join(' ');
      },
    };
  }
  setAttribute(k,v) { this.attributes[k] = String(v); if (k === 'value') this.value = v; }
  append(...values) { this.children.push(...values); }
  replaceChildren(...values) { this.children = values; }
  addEventListener(event, fn) { this.listeners[event] = fn; }
  focus() {}
  querySelector(tag) { return all(this).find(e=>e.tag === tag); }
  get lastElementChild() { return this.children.at(-1); }
  set textContent(value) { this.children = [value]; }
  get textContent() { return this.children.map(x => x instanceof Element ? x.textContent : String(x)).join(''); }
}
function all(e) { return [e, ...e.children.filter(x=>x instanceof Element).flatMap(all)]; }
const root = new Element('div');
let changed;
let hash = '';
globalThis.document = { querySelector: () => root, createElement: tag=>new Element(tag) };
globalThis.window = { addEventListener: (name, callback) => { changed=callback; }, scrollTo() {} };
globalThis.location = { get hash(){return hash;}, set hash(value){if (hash !== value) {hash=value;queueMicrotask(changed);}} };
globalThis.matchMedia = () => ({ matches: true });
const calls = [];
let expired = false;
let denied = false;
let user = { nome:'Ana', email:'teste@example.test', instituicao:'Fatec', papel:'ALUNO' };
let finished = [];
const videos = [
 { id:21, titulo:'Aula inicial', ordem:1, urlYoutube:'https://youtu.be/dQw4w9WgXcQ', autor:'Autora' },
 { id:22, titulo:'Aula seguinte', ordem:2, urlYoutube:'https://example.test/?v=dQw4w9WgXcQ' },
];
globalThis.fetch = async (url, options) => {
 const route=new URL(url);
 assert.equal(route.origin,'http://localhost:8085');
 const {pathname:p}=route;
 const body=options.body && JSON.parse(options.body);
 const headers=options.headers;
 assert.equal(options.credentials,'omit');
 assert.equal(headers.get('Authorization'),p.startsWith('/auth/') ? null : 'Bearer aaa.bbb.ccc');
 calls.push({p, method:options.method, body});
 if (expired) return new Response(null,{status:403});
 if (p==='/trilhas' && denied) return new Response(null,{status:403});
 if (p==='/auth/cadastro') return Response.json(user);
 if (p==='/auth/login') return Response.json({token:'aaa.bbb.ccc',papel:'ALUNO'});
 if (p==='/trilhas') return Response.json([{id:1,nome:'Front-end',descricao:'HTML e CSS'}]);
 if (p==='/trilhas/1') return Response.json({id:1,nome:'Front-end',descricao:'HTML e CSS'});
 if (p==='/modulos/trilha/1') return Response.json([{id:2,nome:'HTML',ordem:1}]);
 if (p==='/videos/trilha/1/introducao') return Response.json([]);
 if (p==='/videos/modulo/2') return Response.json([...videos].reverse());
 if (p==='/progresso/concluidos') return Response.json(finished);
 if (p==='/progresso/video/21/concluir') {finished=[21]; return new Response(null,{status:204});}
 if (p==='/creditos') return Response.json([{autor:'Autora',total:1}]);
 if (p==='/usuarios/me') { if (options.method==='PUT') user={...user,...body}; return Response.json(user); }
 throw new Error('Unexpected route '+p);
};
const flush = () => new Promise(resolve=>setImmediate(resolve));
const visit = async route => { location.hash=route; await flush(); };
const find = predicate => all(root).find(predicate);
const assign = (id,value) => {find(e=>e.attributes.id===id).value=value;};
const submit = async () => {await find(e=>e.tag==='form').listeners.submit({preventDefault(){}}); await flush();};
await import('../fatecanos-academy/app.js');
await flush();
assert.match(root.textContent,/Sua próxima parada/);
await visit('#/cadastro');
assign('nome','Ana');
assign('email','teste@example.test');
assign('senha','teste-teste');
assign('instituicao','Fatec');
await submit();
assert.equal(location.hash,'#/login');
assert.equal(calls[0].body.instituicao,'Fatec');
assign('email','teste@example.test');
assign('senha','teste-teste');
await submit();
assert.equal(location.hash,'#/trilhas');
assert.match(root.textContent,/Front-end/);
await visit('#/trilha/1');
assert.match(root.textContent,/0 de 2 cursos concluídos/);
await visit('#/aula/1/2/21');
assert.equal(find(e=>e.tag==='iframe').attributes.src,'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?playsinline=1');
await find(e=>e.textContent==='Concluir curso'&&e.tag==='button').listeners.click();
assert.match(root.textContent,/1 de 2 cursos concluídos/);
await visit('#/aula/1/2/22');
assert.equal(find(e=>e.tag==='iframe'),undefined);
assert.match(root.textContent,/Conteúdo indisponível/);
await visit('#/trilha/1');
assert.match(root.textContent,/1 de 2 cursos concluídos/);
await visit('#/comunidade');
assert.match(root.textContent,/Autora/);
await visit('#/perfil');
assign('nome','Ana Maria');
await submit();
assert.match(root.textContent,/Perfil atualizado/);
assert.equal(user.nome,'Ana Maria');
videos.push({id:23,titulo:'Playlist teste',ordem:3,urlYoutube:'https://www.youtube.com/playlist?list=PLHz_AreHm4dmSj0MHol_aoNYCSGFqvfXV'});
await visit('#/aula/1/2/23');
assert.match(find(e=>e.tag==='iframe').attributes.src,/8mei6uVttho/);
assert.equal(all(root).filter(e=>e.className==='chapter-button').length,17);
await find(e=>e.tag==='button'&&e.textContent==='Próxima aula →').listeners.click();
assert.match(find(e=>e.tag==='iframe').attributes.src,/M2Af7gkbbro/);
assert.equal(finished.includes(23),false);
videos.push({id:24,titulo:'Material externo',ordem:4,urlYoutube:'https://www.coursera.org/learn/ux-ui-design-de-interface'});
await visit('#/aula/1/2/24');
assert.equal(find(e=>e.tag==='iframe'),undefined);
assert.match(root.textContent,/Continue no site do autor/);
assert.equal(find(e=>e.tag==='a'&&e.textContent==='Acessar material').attributes.rel,'noopener noreferrer');
denied=true;
await visit('#/trilhas');
assert.match(root.textContent,/API recusou/);
assert.equal(location.hash,'#/trilhas');
expired=true;
await visit('#/perfil');
assert.equal(location.hash,'#/login');
assert.match(root.textContent,/Sua sessão terminou/);
console.log('OK: cadastro, login, trilhas, ordenação, iframe, progresso, créditos, perfil e sessão.');

const {describeMedia}=await import("../fatecanos-academy/media.js");
const playlist=describeMedia("https://www.youtube.com/playlist?list=PLHz_AreHm4dmSj0MHol_aoNYCSGFqvfXV");
assert.equal(playlist.kind,"playlist");
assert.equal(new URL(playlist.embed).searchParams.get("list"),"PLHz_AreHm4dmSj0MHol_aoNYCSGFqvfXV");
assert.equal(new URL(playlist.embed).hostname,"www.youtube-nocookie.com");
assert.equal(describeMedia("https://www.coursera.org/learn/ux-ui-design-de-interface").kind,"external");
for(const bad of ["javascript:alert(1)","https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ","https://evil.test/watch?v=dQw4w9WgXcQ","https://user:password@youtube.com/watch?v=dQw4w9WgXcQ","https://www.youtube.com/playlist?list=bad%22%3E"]){assert.equal(describeMedia(bad),null);}
console.log("OK: playlist completa, vídeo avulso, material externo e rejeição de URLs não permitidas.");
