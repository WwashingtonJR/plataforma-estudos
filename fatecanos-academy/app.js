import { api, endSession, isSignedIn, setSessionExpiredHandler, startSession } from './api.js';
import { describeMedia } from './media.js';
import { journeyOrder } from './course-sources.js';
import { playlistLessons } from './playlist-lessons.js';

const app = document.querySelector('#app');
const discord = 'https://discord.gg/nuZfTh9JR';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let navigation;
let notice = '';

function node(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (name === 'class') element.className = value;
    else if (name.startsWith('on')) element.addEventListener(name.slice(2), value);
    else element.setAttribute(name, value);
  }
  for (const child of children.flat()) if (child != null) element.append(child);
  return element;
}

const logo = (href = '#/') => node('a', { class: 'logo', href }, 'fatecanos', node('i', {}, '/'), 'academy');
const link = (label, href, primary = false) => node('a', { class: primary ? 'btn p' : 'btn', href }, label);
const heading = text => node('h1', { tabindex: '-1' }, text);
const errorText = () => node('p', { class: 'er', role: 'alert' });
const muted = text => node('p', { class: 'muted' }, text);
const back = (label, href) => node('a', { class: 'eb', href }, `← ${label}`);
const empty = text => node('p', { class: 'empty' }, text);
const sorted = items => [...items].sort((a, b) => a.ordem - b.ordem || a.id - b.id);
const trailUrl = id => `#/trilha/${id}`;
const lessonUrl = (trail, module, video) => `#/aula/${trail}/${module}/${video}`;
const get = (path, signal) => api(path, { signal });

function signOut(message = '') {
  endSession();
  notice = message;
  location.hash = '#/login';
}

setSessionExpiredHandler(() => signOut('Sua sessão terminou. Entre novamente para continuar.'));

function shell(active, ...content) {
  const menu = [ ['trilhas', 'Trilhas'], ['comunidade', 'Comunidade'], ['perfil', 'Perfil'] ];
  return node('div', { class: 'sh' }, node('nav', { class: 'nv', 'aria-label': 'Menu principal' },
    logo('#/trilhas'), ...menu.map(([id, label]) => node('a', {
      href: `#/${id}`, ...(active === id ? { class: 'on', 'aria-current': 'page' } : {}),
    }, label)), node('span', { class: 'sp' }),
    node('button', { type: 'button', onclick: () => signOut() }, 'Sair')),
  node('main', { class: 'mn view', id: 'conteudo' }, ...content));
}

function animatedRoadmap(signal) {
  const stages = [
    { name: 'HTML e CSS', symbol: '</>', description: 'Dê forma às suas ideias.', file: 'index.html', className: 'markup' },
    { name: 'JavaScript', symbol: 'JS', description: 'Faça cada interação acontecer.', file: 'script.js', className: 'javascript' },
    { name: 'React', symbol: '✳', description: 'Crie interfaces com componentes.', file: 'App.jsx', className: 'react' },
    { name: 'Git e GitHub', symbol: 'git', description: 'Conecte seu projeto ao mundo.', file: 'meu-primeiro-projeto', className: 'git' },
  ];
  let selected = 0;
  let paused = reducedMotion.matches;
  let timer;
  let visible = true;
  let hovering = false;
  let focused = false;
  const filename = node('span', { class: 'preview-filename' });
  const description = node('p', { class: 'stage-description' });
  const scene = node('div', { class: 'tech-scene', 'aria-hidden': 'true' });
  const pause = node('button', { class: 'animation-toggle', type: 'button' });
  const frame = node('div', { class: 'tech-window', 'aria-hidden': 'true' },
    node('div', { class: 'tech-titlebar' }, node('span', { class: 'window-lights' },
      node('i'), node('i'), node('i')), filename, node('span', { class: 'window-status' })), scene);

  function makeScene(stage) {
    if (stage === 0) return node('div', { class: 'mini-site' },
      node('div', { class: 'mini-navigation' }, node('i'), node('span'), node('span')),
      node('div', { class: 'mini-hero' }, node('div', { class: 'mini-copy' }, node('i'), node('i'), node('i'), node('b')),
        node('div', { class: 'mini-art' }, node('span', {}, '</>'))),
      node('div', { class: 'mini-cards' }, node('i'), node('i'), node('i')));
    if (stage === 1) return node('div', { class: 'interaction-scene' },
      node('span', { class: 'code-snippet' }, 'button.addEventListener'),
      node('div', { class: 'demo-button' }, node('span', {}, 'Clique'), node('i', { class: 'click-ripple' })),
      node('span', { class: 'demo-cursor' }),
      node('div', { class: 'interaction-result' }, node('i'), node('i'), node('i')));
    if (stage === 2) return node('div', { class: 'component-scene' },
      node('div', { class: 'component-orbit' }, node('i'), node('i'), node('i')),
      node('div', { class: 'component-core' }, node('span', {}, 'App')),
      node('span', { class: 'component-chip chip-header' }, '<Header />'),
      node('span', { class: 'component-chip chip-card' }, '<Card />'),
      node('span', { class: 'component-chip chip-button' }, '<Button />'));
    return node('div', { class: 'commit-scene' }, node('div', { class: 'commit-line' }),
      node('div', { class: 'commit-branch' }), node('i', { class: 'commit-node commit-one' }),
      node('i', { class: 'commit-node commit-two' }), node('i', { class: 'commit-node commit-three' }),
      node('span', { class: 'branch-label' }, 'feature/minha-ideia'),
      node('span', { class: 'commit-label' }, 'git push'), node('div', { class: 'publish-chip' }, '✓ Projeto publicado'));
  }

  const buttons = stages.map((stage, index) => node('button', {
    type: 'button', class: 'roadmap-step', 'aria-pressed': 'false',
    onclick: () => { select(index); updatePlayback(); },
  }, node('span', { class: 'step-symbol', 'aria-hidden': 'true' }, stage.symbol),
  node('span', { class: 'step-name' }, stage.name), node('span', { class: 'step-arrow', 'aria-hidden': 'true' }, '↗')));
  const card = node('section', { class: 'route-preview animated-route', 'aria-labelledby': 'roadmap-title' },
    node('div', { class: 'route-ambient', 'aria-hidden': 'true' }),
    node('div', { class: 'route-heading' }, node('p', { class: 'eb' }, 'Front-end'), pause),
    node('h2', { id: 'roadmap-title' }, 'Do primeiro site ', node('span', {}, 'ao React.')),
    frame, description,
    node('ol', { class: 'roadmap', 'aria-label': 'Explore as etapas da trilha front-end' },
      ...buttons.map(button => node('li', {}, button))));

  function select(index) {
    selected = index;
    card.setAttribute('data-stage', stages[index].className);
    filename.textContent = stages[index].file;
    description.textContent = stages[index].description;
    scene.replaceChildren(makeScene(index));
    buttons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === index));
      button.classList.toggle('is-active', i === index);
    });
  }

  function updatePlayback() {
    clearInterval(timer);
    const stopped = paused || reducedMotion.matches;
    pause.textContent = stopped ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', stopped ? 'Reproduzir animação' : 'Pausar animação');
    pause.setAttribute('title', stopped ? 'Reproduzir animação' : 'Pausar animação');
    card.classList.toggle('motion-paused', stopped || !visible);
    if (!stopped && !hovering && !focused && visible && !signal.aborted) {
      timer = setInterval(() => {
        if (!document.hidden) select((selected + 1) % stages.length);
      }, 4200);
    }
  }

  pause.addEventListener('click', () => { paused = !paused; updatePlayback(); });
  card.addEventListener('pointerenter', event => { hovering = event.pointerType === 'mouse'; updatePlayback(); });
  card.addEventListener('pointerleave', () => { hovering = false; updatePlayback(); });
  card.addEventListener('focusin', () => { focused = true; updatePlayback(); });
  card.addEventListener('focusout', event => { focused = card.contains(event.relatedTarget); updatePlayback(); });
  reducedMotion.addEventListener?.('change', updatePlayback, { signal });
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; updatePlayback(); });
    // Observe after the router has inserted the card into the document.
    requestAnimationFrame(() => { if (!signal.aborted) observer.observe(card); });
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  }
  signal.addEventListener('abort', () => clearInterval(timer), { once: true });
  select(0);
  updatePlayback();
  return card;
}

function landing({ signal }) {
  return node('div', { class: 'landing' },
    node('header', { class: 'landing-nav' }, logo(), link('Entrar', '#/login')),
    node('main', { class: 'landing-main view' }, node('div', { class: 'landing-copy' },
      node('p', { class: 'eb' }, 'Trilhas de tecnologia'), heading('Sua próxima parada é em tecnologia.'),
      muted('Escolha uma carreira, assista às aulas em ordem e retome seus estudos de onde parou.'),
      link('Criar minha conta', '#/cadastro', true)),
    animatedRoadmap(signal)),
    node('footer', { class: 'landing-footer' }, 'Trilhas inspiradas no trabalho do ',
      node('a', { href: 'https://jornadadevheroi.com', rel: 'noopener noreferrer', target: '_blank' }, 'DevArthur · Jornada Dev Herói')));
}

function field(name, label, options) {
  const input = node('input', { class: 'in', id: name, name, ...options });
  return { input, element: node('div', { class: 'field' }, node('label', { class: 'eb', for: name }, label), input) };
}

function auth(cadastro, signal) {
  const name = field('nome', 'Nome', { required: '', maxlength: '120', autocomplete: 'name' });
  const email = field('email', 'E-mail', { required: '', type: 'email', maxlength: '254', autocomplete: 'username' });
  const password = field('senha', 'Senha', { required: '', type: 'password', autocomplete: cadastro ? 'new-password' : 'current-password', ...(cadastro ? { minlength: '8', maxlength: '72' } : {}) });
  const school = field('instituicao', 'Instituição de ensino', { maxlength: '255', autocomplete: 'organization' });
  const passenger = node('b', {}, 'Seu nome');
  const boarding = node('div', { class: 'tkt', 'aria-hidden': 'true' },
    node('div', { class: 'tt' }, node('small', {}, 'FATECANOS/ACADEMY'), node('small', {}, 'PASSAGEM')),
    node('small', {}, 'PASSAGEIRO'), passenger,
    node('div', { class: 'tr' }, node('div', {}, node('small', {}, 'DESTINO'), node('b', {}, 'Tecnologia'))),
    node('div', { class: 'perf' }), node('div', { class: 'bc' }));
  const art = cadastro ? boarding : node('img', { class: 'dev', src: 'computador.svg', alt: '', width: '420', height: '320' });
  const feedback = errorText();
  feedback.textContent = notice;
  notice = '';
  const submit = node('button', { class: 'btn p', type: 'submit' }, cadastro ? 'Criar conta' : 'Entrar');
  name.input.addEventListener('input', () => { passenger.textContent = name.input.value.trim() || 'Seu nome'; });

  const form = node('form', { onsubmit: async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const credentials = { email: email.input.value.trim(), senha: password.input.value };
    const nome = name.input.value.trim();
    feedback.textContent = '';
    if (cadastro && (!nome || new TextEncoder().encode(credentials.senha).length > 72)) {
      feedback.textContent = !nome ? 'Informe seu nome.' : 'Escolha uma senha com até 72 bytes.';
      return;
    }
    submit.disabled = true;
    try {
      if (cadastro) {
        await api('/auth/cadastro', { method: 'POST', publicRoute: true, signal,
          body: { ...credentials, nome, instituicao: school.input.value.trim() || null } });
        if (signal.aborted) return;
        notice = 'Conta criada. Entre com seu e-mail e sua senha.';
      } else {
        const result = await api('/auth/login', { method: 'POST', publicRoute: true, signal, body: credentials });
        if (signal.aborted) return;
        startSession(result?.token);
      }
      password.input.value = '';
      art.classList.add('go');
      if (!reducedMotion.matches) await new Promise(resolve => setTimeout(resolve, 650));
      if (!signal.aborted) location.hash = cadastro ? '#/login' : '#/trilhas';
    } catch (error) {
      if (signal.aborted) return;
      feedback.textContent = error.message;
      submit.disabled = false;
    }
  } }, cadastro ? name.element : null, email.element, password.element, cadastro ? school.element : null, feedback, submit);

  return node('main', { class: 'auth view' }, node('aside', { class: 'hero' }, logo(), art,
    node('p', { class: 'auth-tagline' }, cadastro ? 'Embarque na sua trilha.' : 'Continue de onde parou.')),
  node('section', { class: 'fm' }, node('nav', { class: 'tg', 'aria-label': 'Acesso' },
    node('a', { href: '#/login', ...(cadastro ? {} : { class: 'on', 'aria-current': 'page' }) }, 'Entrar'),
    node('a', { href: '#/cadastro', ...(cadastro ? { class: 'on', 'aria-current': 'page' } : {}) }, 'Criar conta')),
  heading(cadastro ? 'Crie sua conta.' : 'Que bom te ver.'), form));
}

async function trails({ signal }) {
  const trails = await get('/trilhas', signal);
  const orderKey = name => name.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]/g, '');
  const order = new Map(journeyOrder.map((name, i) => [orderKey(name), i]));
  trails.sort((a, b) => (order.get(orderKey(a.nome)) ?? 999) - (order.get(orderKey(b.nome)) ?? 999));
  const search = field('busca', 'Buscar trilha', { type: 'search', placeholder: 'Ex.: Front-end' });
  const grid = node('div', { class: 'g' });
  const result = node('div', { 'aria-live': 'polite' });
  const normalize = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
  function draw() {
    const query = normalize(search.input.value.trim());
    const visible = trails.filter(trail => normalize(trail.nome).includes(query));
    result.replaceChildren();
    grid.replaceChildren(...visible.map((trail, index) => node('a', { class: index === 0 ? 'c f' : 'c', href: trailUrl(trail.id) },
      node('div', {}, node('h2', {}, trail.nome), muted(trail.descricao ?? '')), node('span', {}, 'Ver trilha →'))));
    if (!visible.length) result.append(empty(query ? 'Nenhuma trilha corresponde à busca.' : 'Nenhuma trilha foi cadastrada ainda.'));
  }
  search.input.addEventListener('input', draw);
  draw();
  return shell('trilhas', heading('Escolha sua trilha.'), node('div', { class: 'search' }, search.element), result, grid);
}

function progressBar(value, label) {
  return node('progress', { class: 'progress', max: '100', value, 'aria-label': label });
}

function score(videos, completed) {
  const count = videos.filter(({ id }) => completed.has(id)).length;
  const percent = videos.length ? Math.round(count * 100 / videos.length) : 0;
  return { count, percent, label: `${count} de ${videos.length} cursos concluídos` };
}

async function trail({ signal }, id) {
  const [details, modules, intro, ids] = await Promise.all([
    get(`/trilhas/${id}`, signal), get(`/modulos/trilha/${id}`, signal),
    get(`/videos/trilha/${id}/introducao`, signal), get('/progresso/concluidos', signal),
  ]);
  const completed = new Set(ids);
  const ordered = sorted(modules);
  const entries = await Promise.all(ordered.map(module => get(`/videos/modulo/${module.id}`, signal)));
  const total = score(entries.flat(), completed);
  return shell('trilhas', back('Trilhas', '#/trilhas'), heading(details.nome), muted(details.descricao ?? ''),
    node('section', { class: 'cd' }, node('div', { class: 'trail-score' },
      node('h2', {}, 'Seu progresso'), muted(total.label), progressBar(total.percent, 'Progresso da trilha')),
    node('strong', {}, `${total.percent}%`)),
    intro.length ? node('section', {}, node('h2', {}, 'Conheça a carreira'), node('div', { class: 'g' },
      ...sorted(intro).map(video => node('a', { class: 'c intro-card', href: lessonUrl(id, 'i', video.id) }, node('h3', {}, video.titulo), muted(video.autor ?? ''))))) : null,
    node('h2', {}, 'Módulos'), ordered.length ? node('div', { class: 'ml' }, ...ordered.map((module, index) => {
      const videos = sorted(entries[index]);
      const status = score(videos, completed);
      const next = videos.find(video => !completed.has(video.id)) ?? videos[0];
      const content = [node('span', { class: 'eb' }, String(index + 1).padStart(2, '0')), node('div', {}, node('h3', {}, module.nome), videos[0] ? muted(videos[0].autor ?? '') : null, videos[0] ? node('small', {}, describeMedia(videos[0].urlYoutube)?.kind === 'playlist' ? 'PLAYLIST' : describeMedia(videos[0].urlYoutube)?.kind === 'external' ? 'MATERIAL EXTERNO' : 'VÍDEO') : null),
        node('div', {}, muted(videos.length ? status.label : 'Cursos em breve'), progressBar(status.percent, `Progresso de ${module.nome}`))];
      return next ? node('a', { class: 'mr', href: lessonUrl(id, module.id, next.id) }, ...content) : node('div', { class: 'mr no-lessons' }, ...content);
    })) : empty('Esta trilha ainda não tem módulos.'));
}

async function lesson({ signal }, trailId, moduleId, videoId) {
  const intro = moduleId === 'i';
  const [modules, ids] = await Promise.all([
    intro ? [] : get(`/modulos/trilha/${trailId}`, signal), get('/progresso/concluidos', signal),
  ]);
  const module = modules.find(item => String(item.id) === moduleId);
  const returnLink = back('Voltar para a trilha', trailUrl(trailId));
  if (!intro && !module) return shell('trilhas', returnLink, heading('Módulo indisponível.'));
  const videos = sorted(await get(intro ? `/videos/trilha/${trailId}/introducao` : `/videos/modulo/${moduleId}`, signal));
  const index = videos.findIndex(item => String(item.id) === videoId);
  if (index === -1) return shell('trilhas', returnLink, heading('Conteúdo indisponível.'));

  const orderedModules = sorted(modules);
  const moduleIndex = orderedModules.findIndex(item => String(item.id) === moduleId);
  const neighborLinks = await Promise.all([-1, 1].map(async offset => {
    const neighbor = orderedModules[moduleIndex + offset];
    if (intro || !neighbor) return null;
    const items = sorted(await get(`/videos/modulo/${neighbor.id}`, signal));
    const target = offset < 0 ? items.at(-1) : items[0];
    return target ? lessonUrl(trailId, neighbor.id, target.id) : null;
  }));

  const video = videos[index];
  const media = describeMedia(video.urlYoutube);
  const completed = new Set(ids);
  const bar = progressBar(0, 'Progresso dos cursos');
  const summary = node('p', { class: 'muted', role: 'status' });
  const feedback = errorText();
  const button = node('button', { class: 'btn p', type: 'button' });
  const rows = videos.map((item, indexOfItem) => node('a', {
    class: indexOfItem === index ? 'li on' : 'li', href: lessonUrl(trailId, moduleId, item.id),
    ...(indexOfItem === index ? { 'aria-current': 'page' } : {}),
  }, node('b', { 'aria-hidden': 'true' }), node('span', {}, item.titulo), node('span', { class: 'done-label' })));

  function update() {
    const status = score(videos, completed);
    bar.value = status.percent;
    summary.textContent = status.label;
    button.disabled = completed.has(video.id);
    button.textContent = button.disabled ? 'Curso concluído' : 'Concluir curso';
    rows.forEach((row, i) => {
      const done = completed.has(videos[i].id);
      row.classList.toggle('ok', done);
      row.lastElementChild.textContent = done ? 'Concluída' : '';
    });
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    feedback.textContent = '';
    try {
      await api(`/progresso/video/${video.id}/concluir`, { method: 'POST', signal });
      if (signal.aborted) return;
      completed.add(video.id);
      update();
      rows[index].classList.add('just-done');
    } catch (error) {
      if (signal.aborted) return;
      feedback.textContent = error.message;
      button.disabled = false;
    }
  });
  update();
  const playerFrame = media?.embed ? node('iframe', {
    src: media.embed, title: video.titulo,
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen', allowfullscreen: '',
    referrerpolicy: 'strict-origin-when-cross-origin',
  }) : null;
  const player = playerFrame ? node('div', { class: 'pl' }, playerFrame) : node('section', { class: 'external-course' },
    node('p', { class: 'eb' }, media?.kind === 'external' ? 'Material externo' : 'Conteúdo indisponível'),
    node('h2', {}, media?.kind === 'external' ? 'Continue no site do autor.' : 'Não foi possível montar o player.'),
    muted(media?.kind === 'external' ? 'Este material é oferecido em outra plataforma. O acesso segue as condições do site original.' : 'Confira o link original ou escolha outro curso.'));
  const sourceLink = media ? node('a', { class: 'btn', href: media.original, target: '_blank', rel: 'noopener noreferrer' },
    media.kind === 'external' ? 'Acessar material' : 'Abrir no YouTube') : null;
  const collection = media?.list ? playlistLessons[media.list] : null;
  const chapters = collection?.lessons ?? [];
  let activeChapter = 0;
  const chapterTitle = node('p', { class: 'chapter-caption', role: 'status' });
  const previousChapter = node('button', { class: 'btn', type: 'button', onclick: () => selectChapter(activeChapter - 1) }, '← Aula anterior');
  const nextChapter = node('button', { class: 'btn', type: 'button', onclick: () => selectChapter(activeChapter + 1) }, 'Próxima aula →');
  const chapterButtons = chapters.map((chapter, i) => node('button', {
    type: 'button', class: 'chapter-button', 'aria-pressed': 'false', onclick: () => selectChapter(i),
  }, node('span', { class: 'chapter-number' }, String(i + 1).padStart(2, '0')), node('span', {}, chapter.title)));
  function selectChapter(i) {
    if (!playerFrame || !chapters[i]) return;
    activeChapter = i;
    const chapter = chapters[i];
    playerFrame.setAttribute('src', `https://www.youtube-nocookie.com/embed/${chapter.id}?playsinline=1`);
    playerFrame.setAttribute('title', chapter.title);
    chapterTitle.textContent = `${i + 1} / ${chapters.length} · ${chapter.title}`;
    chapterButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === i)));
    previousChapter.disabled = i === 0;
    nextChapter.disabled = i === chapters.length - 1;
  }
  if (chapters.length) selectChapter(0);
  const playlistNote = media?.kind === 'playlist' ? node('div', { class: 'playlist-note' },
    node('strong', {}, 'Playlist' + (chapters.length ? ` · ${chapters.length} aulas disponíveis` : media.count ? ' · ' + media.count : '')),
    muted('Escolha uma aula na lista desta página. Marque o curso como concluído depois de terminar a playlist.'),
    collection?.complete ? null : muted('A listagem desta playlist ainda não foi confirmada por completo. Confira também o link no YouTube.')) : null;
  const adjacent = (offset, label) => {
    const target = videos[index + offset];
    const href = target ? lessonUrl(trailId, moduleId, target.id) : neighborLinks[offset < 0 ? 0 : 1];
    return href ? link(label, href) : null;
  };
  return shell('trilhas', returnLink, heading(video.titulo), video.autor ? muted(video.autor) : null,
    node('div', { class: 'ai lesson' }, node('div', {}, player, chapters.length ? chapterTitle : null,
      chapters.length ? node('div', { class: 'ab' }, previousChapter, nextChapter) : null,
      playlistNote, node('div', { class: 'ab' }, button, sourceLink,
      adjacent(-1, '← Anterior'), adjacent(1, 'Próxima →')), feedback),
    node('aside', { class: 'sd', 'aria-label': 'Conteúdos do módulo' }, node('h2', {}, chapters.length ? 'Aulas da playlist' : intro ? 'Conheça a carreira' : module.nome),
      summary, bar, chapters.length ? node('div', { class: 'chapter-list' }, ...chapterButtons) : node('div', {}, ...rows))));
}

async function community({ signal }) {
  let credits;
  try { credits = await get('/creditos', signal); } catch (error) {
    if (signal.aborted) throw error;
  }
  return shell('comunidade', heading('Comunidade'), node('div', { class: 'cm' },
    node('section', { class: 'dc' }, node('h2', {}, 'Encontre quem estuda com você.'),
      node('a', { class: 'btn', href: discord, target: '_blank', rel: 'noopener noreferrer' }, 'Entrar no Discord')),
    node('section', { class: 'cr' }, node('h2', {}, 'Créditos'),
      node('a', { href: 'https://jornadadevheroi.com', target: '_blank', rel: 'noopener noreferrer' }, 'DevArthur · Jornada Dev Herói'),
      muted('Inspiração para a organização das trilhas.'),
      credits?.length ? node('ul', {}, ...credits.map(author => node('li', {}, node('b', {}, author.autor),
        node('span', {}, `${author.total} ${author.total === 1 ? 'conteúdo' : 'conteúdos'}`)))) :
        muted(credits ? 'Os autores aparecem aqui conforme os vídeos forem cadastrados.' : 'A lista de autores está temporariamente indisponível.'))));
}

async function profile({ signal }) {
  const user = await get('/usuarios/me', signal);
  const name = field('nome', 'Nome', { required: '', maxlength: '120', autocomplete: 'name', value: user.nome });
  const school = field('instituicao', 'Instituição de ensino', { maxlength: '255', autocomplete: 'organization', value: user.instituicao ?? '' });
  const email = field('email', 'E-mail', { type: 'email', value: user.email, readonly: '' });
  const feedback = errorText();
  const saved = node('p', { class: 'success', role: 'status' });
  const submit = node('button', { class: 'btn p', type: 'submit' }, 'Salvar alterações');
  const form = node('form', { class: 'profile-form', onsubmit: async event => {
    event.preventDefault();
    if (submit.disabled) return;
    feedback.textContent = '';
    saved.textContent = '';
    const nome = name.input.value.trim();
    if (!nome) {
      feedback.textContent = 'Informe seu nome.';
      return;
    }
    submit.disabled = true;
    try {
      const updated = await api('/usuarios/me', { method: 'PUT', signal, body: { nome, instituicao: school.input.value.trim() || null } });
      if (signal.aborted) return;
      name.input.value = updated.nome;
      school.input.value = updated.instituicao ?? '';
      saved.textContent = 'Perfil atualizado.';
    } catch (error) {
      if (!signal.aborted) feedback.textContent = error.message;
    } finally {
      if (!signal.aborted) submit.disabled = false;
    }
  } }, name.element, email.element, school.element, feedback, saved, submit);
  return shell('perfil', heading('Seu perfil'), form);
}

const routes = [
  [/^#\/$/, landing, true],
  [/^#\/login$/, ({ signal }) => auth(false, signal), true],
  [/^#\/cadastro$/, ({ signal }) => auth(true, signal), true],
  [/^#\/trilhas$/, trails],
  [/^#\/trilha\/([1-9]\d{0,9})$/, trail],
  [/^#\/aula\/([1-9]\d{0,9})\/(i|[1-9]\d{0,9})\/([1-9]\d{0,9})$/, lesson],
  [/^#\/comunidade$/, community],
  [/^#\/perfil$/, profile],
];

async function navigate() {
  navigation?.abort();
  navigation = new AbortController();
  const { signal } = navigation;
  const hash = location.hash || '#/';
  const route = routes.find(([pattern]) => pattern.test(hash));
  if (!route || (!route[2] && !isSignedIn()) || (route[2] && isSignedIn())) {
    location.hash = isSignedIn() ? '#/trilhas' : route ? '#/login' : '#/';
    return;
  }

  try {
    if (!route[2]) app.replaceChildren(shell('', node('p', { class: 'loading', role: 'status' }, 'Carregando…')));
    const page = await route[1]({ signal }, ...hash.match(route[0]).slice(1));
    if (signal.aborted) return;
    app.replaceChildren(page);
    window.scrollTo(0, 0);
    page.querySelector('h1')?.focus({ preventScroll: true });
  } catch (error) {
    if (signal.aborted || error.name === 'AbortError' || !isSignedIn()) return;
    app.replaceChildren(shell('', heading('Não foi possível carregar a página.'), muted(error.message),
      node('button', { class: 'btn p retry', type: 'button', onclick: navigate }, 'Tentar novamente')));
    app.querySelector('h1')?.focus();
  }
}

window.addEventListener('hashchange', navigate);
navigate();
