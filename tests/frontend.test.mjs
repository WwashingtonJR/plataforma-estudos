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
  hasAttribute(k) { return Object.hasOwn(this.attributes,k); }
  removeAttribute(k) { delete this.attributes[k]; }
  append(...values) { this.children.push(...values); }
  reset() { all(this).filter(e=>['input','textarea'].includes(e.tag)).forEach(e=>{e.value=e.attributes.value??'';}); }
  replaceChildren(...values) { this.children = values; }
  addEventListener(event, fn) { this.listeners[event] = fn; }
  focus() {}
  scrollIntoView(options) { this.scrollOptions=options; }
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
globalThis.location = { hostname:'127.0.0.1', port:'5500', origin:'http://127.0.0.1:5500', get hash(){return hash;}, set hash(value){if (hash !== value) {hash=value;queueMicrotask(changed);}} };
globalThis.matchMedia = () => ({ matches: true });
const calls = [];
let expired = false;
let denied = false;
let user = { nome:'Ana', email:'teste@example.test', instituicao:'Fatec', papel:'ALUNO' };
let finished = [];
let started = [];
let agenda = [];
let stallCourses = false;
const projects = [{titulo:'Fatecanos Academy',descricao:'Plataforma de estudos.',autor:'Washington Junior',
  githubUrl:'https://github.com/WwashingtonJR/plataforma-estudos',demoUrl:'/',destaque:true,status:'APROVADO'}];
let canReview = false;
const completedChapters = new Set();
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
 if (p==='/auth/cadastro' && body.email==='existente@example.test') {
   return Response.json({codigo:'EMAIL_JA_CADASTRADO'}, {status:409});
 }
 if (p==='/auth/cadastro') return Response.json({...user, token:'aaa.bbb.ccc'});
 if (p==='/auth/login') return Response.json({token:'aaa.bbb.ccc',papel:'ALUNO'});
 if (p==='/trilhas') return Response.json([{id:1,nome:'Front-end',descricao:'HTML e CSS'}]);
 if (p==='/trilhas/1') return Response.json({id:1,nome:'Front-end',descricao:'HTML e CSS'});
 if (p==='/modulos/trilha/1') return Response.json([{id:2,nome:'HTML',ordem:1}]);
 if (p==='/videos/trilha/1/introducao') return Response.json([]);
 if (p==='/videos/modulo/2') return Response.json([...videos].reverse());
 if (p==='/progresso/concluidos') return Response.json(finished);
 if (p==='/progresso/video/23/aulas') {
   return Response.json({aulasConcluidas:[...completedChapters],cursoConcluido:false});
 }
 if (p.startsWith('/progresso/video/23/aulas/') && options.method==='PUT') {
   completedChapters.add(p.split('/').at(-1));
   return Response.json({aulasConcluidas:[...completedChapters],cursoConcluido:false});
 }
 if (p==='/progresso/em-andamento') {
   if (stallCourses) {
     return new Promise((_, reject) => {
       options.signal.addEventListener('abort', () => reject(options.signal.reason), { once:true });
     });
   }
   return Response.json(started.filter(course => !finished.includes(course.videoId)));
 }
 if (p==='/agenda' && options.method==='POST') {
   const entry={id:1,...body};
   agenda.push(entry);
   return Response.json(entry, {status:201});
 }
 if (p==='/agenda') return Response.json(agenda);
 if (p==='/agenda/1' && options.method==='DELETE') {
   agenda=[];
   return new Response(null,{status:204});
 }
 const opening = p.match(/^\/progresso\/video\/(\d+)\/iniciar$/);
 if (opening) {
   const videoId=Number(opening[1]);
   started=[{videoId,trilhaId:1,moduloId:2,titulo:videos.find(video=>video.id===videoId).titulo,trilha:'Front-end'},
     ...started.filter(course=>course.videoId!==videoId)];
   return new Response(null,{status:204});
 }
 if (p==='/progresso/video/21/concluir') {finished=[21]; return new Response(null,{status:204});}
 if (p==='/creditos') return Response.json([{autor:'Autora',total:1}]);
 if (p==='/projetos' && options.method==='POST') {
   const project={id:projects.length,...body,autor:user.nome,destaque:false,status:'PENDENTE'};
   projects.splice(1,0,project);
   return Response.json(project,{status:201});
 }
 if (p==='/projetos') return Response.json(projects.filter(project=>project.status==='APROVADO'));
 if (p==='/projetos/meus') return Response.json({podeRevisar:canReview,envios:projects.slice(1)});
 if (p==='/projetos/revisao') return Response.json(projects.filter(project=>project.status==='PENDENTE'));
 if (p.startsWith('/projetos/revisao/') && options.method==='PUT') {
   const id=Number(p.split('/').at(-1));
   projects.find(project=>project.id===id).status=body.status;
   return new Response(null,{status:204});
 }
 if (p==='/usuarios/me') { if (options.method==='PUT') user={...user,...body}; return Response.json(user); }
 throw new Error('Unexpected route '+p);
};
const flush = () => new Promise(resolve=>setImmediate(resolve));
const visit = async route => { location.hash=route; await flush(); };
const find = predicate => all(root).find(predicate);
const assign = (id,value) => {find(e=>e.attributes.id===id).value=value;};
const submit = async () => {await find(e=>e.tag==='form').listeners.submit({preventDefault(){}}); await flush();};
const { academyNews } = await import('../fatecanos-academy/editorial.js');
const currentDay = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
academyNews.splice(0, academyNews.length,
   {title:'Notícia um', category:'Comunidade', summary:'A primeira notícia.', date:currentDay,
    source:'Fonte um', url:'https://example.test/noticia-um', action:'Ver primeira notícia',
    photo:{src:'/assets/cariby-ideathon.jpg',alt:'Foto da notícia'}},
   {title:'Notícia dois', category:'Vestibular', summary:'A segunda notícia.', date:currentDay,
    source:'Fonte dois', url:'https://example.test/noticia-dois', action:'Ver segunda notícia',
    event:{date:currentDay,label:'Dia da prova'}});
await import('../fatecanos-academy/app.js');
await flush();
assert.match(root.textContent,/Sua próxima parada/);
assert.match(find(e=>e.className==='founder-spotlight').textContent, /Founder.*Washington Junior/);
assert.equal(find(e=>e.tag==='img'&&e.attributes.alt==='Washington Junior').attributes.src,'/assets/washington-junior.jpg');
assert.equal(find(e=>e.tag==='a'&&e.textContent==='Começar grátis').attributes.href,'#/cadastro');
assert.equal(find(e=>e.tag==='a'&&e.textContent==='Entrar').attributes.href,'#/login');
find(e=>e.tag==='button'&&e.textContent==='Como funciona').listeners.click();
assert.equal(find(e=>e.className==='landing-guide').scrollOptions.behavior,'instant');
find(e=>e.tag==='button'&&e.textContent==='Fundador').listeners.click();
assert.ok(find(e=>e.className==='founder-spotlight').scrollOptions);
find(e=>e.tag==='button'&&e.textContent==='JSJavaScript').listeners.click();
assert.equal(find(e=>e.attributes['data-stage']==='javascript').attributes['aria-labelledby'],'roadmap-title');
await visit('#/cadastro');
assign('nome','Ana');
assign('email','existente@example.test');
assign('senha','teste-teste');
assign('instituicao','Fatec');
await submit();
assert.equal(location.hash,'#/cadastro');
assert.match(root.textContent,/Este e-mail já possui uma conta\. Clique em Entrar\./);
assign('email','teste@example.test');
await submit();
assert.equal(location.hash,'#/inicio');
assert.equal(calls[1].body.instituicao,'Fatec');
assert.equal(calls.some(call => call.p==='/auth/login'), false);
assert.match(root.textContent,/Calendário/);
assert.match(root.textContent,/Notícias da semana/);
assert.match(root.textContent,/Meus cursos/);
assert.equal(find(e=>e.className==='founder-spotlight'),undefined);
assert.equal(find(e=>e.textContent.includes('Ver primeira notícia')&&e.tag==='a').attributes.href,
   'https://example.test/noticia-um');
assert.equal(find(e=>e.tag==='img'&&e.attributes.alt==='Foto da notícia').attributes.src, '/assets/cariby-ideathon.jpg');
assert.equal(find(e=>e.tag==='a'&&e.textContent==='Fonte um').attributes.href, 'https://example.test/noticia-um');
find(e=>e.attributes['aria-label']==='Próxima notícia').listeners.click();
assert.equal(find(e=>e.textContent.includes('Ver segunda notícia')&&e.tag==='a').attributes.href,
   'https://example.test/noticia-dois');
find(e=>e.attributes['aria-label']==='Notícia anterior').listeners.click();
assert.ok(find(e=>e.textContent.includes('Ver primeira notícia')&&e.tag==='a'));
find(e=>e.attributes['aria-label']==='Mostrar notícia: Notícia dois').listeners.click();
assert.equal(find(e=>e.attributes['aria-label']==='Mostrar notícia: Notícia dois').attributes['aria-pressed'],'true');
assert.match(root.textContent,/Próximas datas/);
const calendarLabel=find(e=>e.attributes.id==='calendar-month');
const currentMonth=calendarLabel.textContent;
assert.equal(find(e=>e.className==='calendar-day' && e.attributes['aria-pressed']==='true').attributes['aria-current'], 'date');
find(e=>e.textContent==='+ Adicionar evento' && e.tag==='button').listeners.click();
assign('agenda-titulo','Prova de Java');
assign('agenda-tipo','PROVA');
await submit();
assert.match(root.textContent,/Prova de Java/);
assert.equal(agenda[0].data, currentDay);
assert.match(find(e=>e.attributes['aria-current']==='date').className, /has-event/);
await find(e=>e.attributes['aria-label']==='Excluir Prova de Java').listeners.click();
assert.equal(agenda.length, 0);
find(e=>e.attributes['aria-label']==='Mês anterior').listeners.click();
assert.notEqual(calendarLabel.textContent,currentMonth);
await find(e=>e.tag==='button' && e.textContent==='Sair').listeners.click();
await flush();
assert.equal(location.hash,'#/login');
assert.doesNotMatch(root.textContent,/Conta criada/);
assign('email','teste@example.test');
assign('senha','teste-teste');
await submit();
assert.equal(location.hash,'#/inicio');
await visit('#/trilhas');
assert.match(root.textContent,/Front-end/);
await visit('#/trilha/1');
assert.match(root.textContent,/0 de 2 cursos concluídos/);
await visit('#/aula/1/2/21');
assert.equal(find(e=>e.tag==='iframe').attributes.src,'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?playsinline=1');
assert.doesNotMatch(root.textContent,/Abrir no YouTube/);
const originalTimeout = AbortSignal.timeout;
const deadline = new AbortController();
AbortSignal.timeout = () => deadline.signal;
stallCourses = true;
try {
  await visit('#/inicio');
  assert.match(root.textContent,/Olá, Ana/);
  assert.match(root.textContent,/Notícias da semana/);
  assert.match(root.textContent,/Calendário/);
  assert.match(root.textContent,/Carregando seus cursos/);
  assert.equal(find(e=>e.attributes.href==='#/inicio'&&e.textContent==='Início').attributes['aria-current'],'page');
  deadline.abort(new DOMException('Tempo esgotado', 'TimeoutError'));
  await flush();
  assert.match(root.textContent,/Não foi possível carregar seus cursos/);
  assert.match(root.textContent,/Calendário/);
} finally {
  AbortSignal.timeout = originalTimeout;
  stallCourses = false;
}
find(e=>e.tag==='button'&&e.textContent==='Tentar novamente').listeners.click();
await flush();
assert.equal(find(e=>e.tag==='a'&&e.textContent.includes('Retomar curso')).attributes.href,'#/aula/1/2/21');
await visit('#/aula/1/2/21');
await find(e=>e.textContent==='Concluir curso'&&e.tag==='button').listeners.click();
assert.match(root.textContent,/1 de 2 cursos concluídos/);
await visit('#/aula/1/2/22');
assert.equal(find(e=>e.tag==='iframe'),undefined);
assert.match(root.textContent,/Conteúdo indisponível/);
await visit('#/trilha/1');
assert.match(root.textContent,/1 de 2 cursos concluídos/);
await visit('#/comunidade');
assert.match(root.textContent,/Autora/);
assert.match(root.textContent,/DevArthur/);
assert.equal(find(e=>e.tag==='a'&&e.textContent.includes('Fatecanos - Ilha Solteira')).attributes.href,'https://www.instagram.com/fatecanos_/');
assert.match(root.textContent,/Inspirações para a área/);
assert.equal(find(e=>e.className==='community-role').textContent,'Founder');
assert.equal(find(e=>e.tag==='img'&&e.className==='community-portrait').attributes.src,'/assets/washington-junior.jpg');
assert.ok(find(e=>e.attributes.href==='https://www.youtube.com/@souzaadev'));
assert.ok(find(e=>e.attributes.href==='https://www.youtube.com/@pctheone'));
assert.doesNotMatch(root.textContent,/Discord/);
await visit('#/projetos');
assert.equal(find(e=>e.attributes.href==='#/projetos').attributes['aria-current'],'page');
assert.match(find(e=>e.tag==='article').textContent,/Fatecanos Academy.*Washington Junior/);
assert.equal(find(e=>e.textContent==='Ver demo↗'&&e.tag==='a').attributes.href,'/');
find(e=>e.textContent==='Enviar meu projeto').listeners.click();
assert.equal(find(e=>e.tag==='form').hasAttribute('hidden'),false);
assign('projeto-titulo','Agenda de estudos');
assign('projeto-descricao','Uma agenda para organizar as aulas.');
assign('projeto-github','https://github.com/aluna/agenda');
assign('projeto-demo','https://agenda.example.test/');
await submit();
assert.match(root.textContent,/Projeto enviado.*após aprovação/);
assert.match(root.textContent,/Agenda de estudos.*Aguardando aprovação/);
assert.equal(all(root).filter(e=>e.tag==='article').length,1);
assert.equal(find(e=>e.attributes.href==='https://github.com/aluna/agenda'),undefined);
assert.equal(find(e=>e.textContent==='Aprovar'),undefined);
assert.ok(find(e=>e.tag==='form').hasAttribute('hidden'));
await visit('#/inicio');
canReview=true;
await visit('#/projetos');
assert.match(root.textContent,/Revisar projetos/);
await find(e=>e.tag==='button'&&e.textContent==='Aprovar').listeners.click();
assert.match(root.textContent,/Projeto aprovado e publicado/);
assert.equal(find(e=>e.attributes.href==='https://github.com/aluna/agenda').attributes.rel,'noopener noreferrer');
assert.ok(find(e=>e.attributes.href==='https://agenda.example.test/'));
find(e=>e.textContent==='Enviar meu projeto').listeners.click();
assign('projeto-titulo','Projeto para revisar');
assign('projeto-descricao','Mais um envio.');
assign('projeto-github','https://github.com/aluna/revisar');
await submit();
await find(e=>e.tag==='button'&&e.textContent==='Recusar').listeners.click();
assert.match(root.textContent,/Projeto recusado/);
assert.match(root.textContent,/Projeto para revisar.*Recusado/);
assert.equal(find(e=>e.attributes.href==='https://github.com/aluna/revisar'),undefined);
await visit('#/perfil');
assert.equal(find(e=>e.attributes.id==='foto').attributes.type,'file');
assign('nome','Ana Maria');
await submit();
assert.match(root.textContent,/Perfil atualizado/);
assert.equal(user.nome,'Ana Maria');
videos.push({id:23,titulo:'Playlist teste',ordem:3,urlYoutube:'https://www.youtube.com/playlist?list=PLHz_AreHm4dmSj0MHol_aoNYCSGFqvfXV'});
await visit('#/aula/1/2/23');
assert.match(find(e=>e.tag==='iframe').attributes.src,/8mei6uVttho/);
assert.equal(all(root).filter(e=>e.className==='chapter-button').length,17);
await find(e=>e.tag==='button'&&e.textContent==='Concluir aula').listeners.click();
assert.match(root.textContent,/1 de 17 aulas concluídas/);
assert.ok(find(e=>e.tag==='button'&&e.textContent==='✓ Aula concluída').disabled);
assert.deepEqual([...completedChapters], ['8mei6uVttho']);
await find(e=>e.tag==='button'&&e.textContent==='Próxima aula →').listeners.click();
assert.match(find(e=>e.tag==='iframe').attributes.src,/M2Af7gkbbro/);
assert.equal(finished.includes(23),false);
await visit('#/inicio');
assert.ok(find(e=>e.attributes.href==='#/aula/1/2/23'));
await visit('#/aula/1/2/23');
assert.match(find(e=>e.tag==='iframe').attributes.src,/M2Af7gkbbro/);
assert.match(root.textContent,/1 de 17 aulas concluídas/);
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
