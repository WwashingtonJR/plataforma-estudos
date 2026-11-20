import { api, endSession, finishGoogleSignIn, googleSignInAvailable, isSignedIn, setSessionExpiredHandler, startSession } from './api.js';
import { describeMedia } from './media.js';
import { journeyOrder } from './course-sources.js';
import playlistLessons from './playlist-lessons.json' with { type: 'json' };
import { academyNews, creatorChannels } from './editorial.js';

const app = document.querySelector('#app');
const instagram = 'https://www.instagram.com/fatecanos_/';
const linkedin = 'https://www.linkedin.com/in/washingtonjuni0r/';
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

const logo = (href = '#/') => node('a', { class: 'logo', href, 'aria-label': 'Fatecanos Academy' },
  node('span', {}, 'fatecanos'), node('i', { 'aria-hidden': 'true' }, '/'), node('span', {}, 'academy'));
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
  const menu = [
    ['inicio', 'Início'], ['trilhas', 'Trilhas'], ['comunidade', 'Comunidade'], ['projetos', 'Projetos'], ['perfil', 'Perfil'],
  ];
  return node('div', { class: 'sh' }, node('nav', { class: 'nv', 'aria-label': 'Menu principal' },
    logo('#/inicio'), ...menu.map(([id, label]) => node('a', {
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
  node('span', { class: 'step-name' }, stage.name)));
  const card = node('section', { class: 'route-preview animated-route', 'aria-labelledby': 'roadmap-title' },
    node('div', { class: 'route-ambient', 'aria-hidden': 'true' }),
    node('div', { class: 'route-heading' }, node('p', { class: 'eb' }, 'Prévia da trilha Front-end'), pause),
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

function founderSpotlight() {
  return node('section', { class: 'founder-spotlight', 'aria-labelledby': 'landing-founder', tabindex: '-1' },
    node('div', { class: 'founder-image' },
      node('img', { src: '/assets/washington-junior.jpg', width: '400', height: '400', alt: 'Washington Junior', loading: 'lazy', decoding: 'async' })),
    node('div', { class: 'founder-copy' },
      node('p', { class: 'eb' }, 'Founder · Fatecanos — Ilha Solteira'),
      node('h2', { id: 'landing-founder' }, 'Washington Junior'),
      node('p', { class: 'founder-lead' }, 'Criei a Fatecanos Academy para dar clareza a quem quer seguir na área dev.'),
      node('p', {}, 'A ideia é reunir caminhos de estudo e dar espaço para a comunidade compartilhar o que está construindo.'),
      node('div', { class: 'founder-links' },
        node('a', { class: 'btn', href: linkedin, target: '_blank', rel: 'noopener noreferrer' }, 'Meu LinkedIn'),
        node('a', { class: 'btn', href: instagram, target: '_blank', rel: 'noopener noreferrer' }, 'Fatecanos no Instagram'))));
}

function landingGuide() {
  const steps = [
    ['route', 'Escolha sua trilha', 'Explore áreas como Front-end, Back-end e Ciência de Dados. Cada percurso organiza o que estudar em seguida.'],
    ['progress', 'Continue de onde parou', 'Marque as aulas que terminou e retome o curso na próxima aula pendente.'],
    ['community', 'Mostre o que você fez', 'Compartilhe seu projeto com o GitHub e a demo na galeria da comunidade, após aprovação.'],
  ];
  return node('section', { class: 'landing-guide', 'aria-labelledby': 'landing-guide-title', tabindex: '-1' },
    node('div', { class: 'landing-section-heading' },
      node('h2', { id: 'landing-guide-title' }, 'Da primeira aula ao ', node('span', {}, 'projeto publicado.'))),
    node('div', { class: 'landing-features' }, ...steps.map(([icon, title, description]) =>
      node('article', { class: 'landing-feature' },
        node('span', { class: `feature-icon feature-icon-${icon}`, 'aria-hidden': 'true' }, node('i'), node('i'), node('i')),
        node('h3', {}, title), node('p', {}, description)))));
}

function landingMotion(hero, signal, ...sections) {
  let frame;
  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches || frame != null) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      hero.style.setProperty('--pointer-x', `${x * 100}%`);
      hero.style.setProperty('--pointer-y', `${y * 100}%`);
      hero.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`);
      hero.style.setProperty('--tilt-y', `${(x - 0.5) * 9}deg`);
      hero.classList.add('has-pointer');
    });
  });
  function resetPointer() {
    if (frame != null) cancelAnimationFrame(frame);
    frame = undefined;
    hero.classList.toggle('has-pointer', false);
  }
  hero.addEventListener('pointerleave', resetPointer);
  reducedMotion.addEventListener?.('change', resetPointer, { signal });
  signal.addEventListener('abort', resetPointer, { once: true });

  if (reducedMotion.matches || typeof IntersectionObserver === 'undefined') return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('landing-revealed');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  sections.forEach(section => observer.observe(section));
  signal.addEventListener('abort', () => observer.disconnect(), { once: true });
}

function landing({ signal }) {
  const guide = landingGuide();
  const founder = founderSpotlight();
  const goTo = (label, section, className) => node('button', {
    class: className, type: 'button', onclick: () => {
      section.focus({ preventScroll: true });
      section.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    },
  }, label);

  const hero = node('section', { class: 'landing-main', 'aria-labelledby': 'landing-title' },
    node('div', { class: 'landing-grid-light', 'aria-hidden': 'true' }),
    node('div', { class: 'landing-copy view' },
      node('p', { class: 'eb landing-eyebrow' }, 'Plataforma gratuita para a comunidade dev'),
      node('h1', { id: 'landing-title', tabindex: '-1' }, 'Sua próxima parada é em ', node('span', {}, 'tecnologia.')),
      node('p', { class: 'landing-intro' }, 'Encontre uma trilha, saiba o que estudar em seguida e transforme o que aprendeu em um projeto.'),
      node('div', { class: 'landing-actions' }, link('Começar grátis', '#/cadastro', true),
        goTo('Como funciona', guide, 'btn landing-secondary'))),
    node('div', { class: 'landing-lab view' },
      node('div', { class: 'landing-orbit', 'aria-hidden': 'true' }, node('i'), node('i'), node('i')),
      animatedRoadmap(signal)));

  const cta = node('section', { class: 'landing-cta', 'aria-labelledby': 'landing-cta-title' },
    node('h2', { id: 'landing-cta-title' }, 'Encontre sua primeira trilha.'),
    link('Criar conta grátis', '#/cadastro', true));
  landingMotion(hero, signal, guide, founder, cta);
  return node('div', { class: 'landing' },
    node('header', { class: 'landing-nav' }, logo(),
      node('nav', { class: 'landing-nav-links', 'aria-label': 'Sobre a Academy' },
        goTo('A plataforma', guide, 'landing-nav-link'), goTo('Fundador', founder, 'landing-nav-link')),
      link('Entrar', '#/login')),
    node('main', { class: 'landing-content' }, hero, guide, founder, cta),
    node('footer', { class: 'landing-footer' }, 'Desenvolvido por ',
      node('a', { href: linkedin, rel: 'noopener noreferrer', target: '_blank' }, 'Washington Junior'),
      ' - ',
      node('a', { href: instagram, rel: 'noopener noreferrer', target: '_blank' }, 'Fatecanos - Ilha Solteira')));
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
  const google = node('a', { class: 'btn google-signin', href: '/oauth2/authorization/google', hidden: '' }, 'Entrar com Google');
  googleSignInAvailable(signal).then(available => {
    if (available && !signal.aborted) google.removeAttribute('hidden');
  });
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
      const body = cadastro
        ? { ...credentials, nome, instituicao: school.input.value.trim() || null }
        : credentials;
      const result = await api(cadastro ? '/auth/cadastro' : '/auth/login', {
        method: 'POST', publicRoute: true, signal, body,
      });
      if (signal.aborted) return;
      startSession(result?.token);
      password.input.value = '';
      art.classList.add('go');
      if (!reducedMotion.matches) await new Promise(resolve => setTimeout(resolve, 650));
      if (!signal.aborted) location.hash = '#/inicio';
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
  heading(cadastro ? 'Crie sua conta.' : 'Que bom te ver.'), form, google));
}

async function googleReturn({ signal }, outcome) {
  if (!outcome) {
    try {
      const result = await finishGoogleSignIn(signal);
      if (signal.aborted) return;
      startSession(result.token);
      location.hash = '#/inicio';
      return;
    } catch {
      if (signal.aborted) return;
    }
  }
  signOut(outcome === 'conta-existente'
    ? 'Já existe uma conta com esse e-mail. Entre com seu e-mail e sua senha.'
    : 'Não foi possível entrar com Google. Tente novamente.');
}

function dateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function studyCalendar(today, signal) {
  let month = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = today;
  let events = [];
  let available = false;
  const monthLabel = node('p', { class: 'calendar-month', id: 'calendar-month', 'aria-live': 'polite' });
  const body = node('tbody');
  const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
  const dayFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
  const types = { PROVA: 'Prova', TRABALHO: 'Trabalho', OUTRO: 'Outro' };
  const heading = node('h3', { class: 'calendar-selected' });
  const entries = node('ul', { class: 'calendar-events' });
  const feedback = errorText();
  const status = node('p', { class: 'success', role: 'status' });
  const title = field('agenda-titulo', 'Nome do evento', { maxlength: '120', required: '', placeholder: 'Ex.: Prova de Java' });
  const type = node('select', { class: 'in', id: 'agenda-tipo', name: 'tipo' }, ...Object.entries(types)
    .map(([value, label]) => node('option', { value }, label)));
  const save = node('button', { class: 'btn p', type: 'submit' }, 'Salvar evento');
  const add = node('button', { class: 'btn calendar-add', type: 'button', disabled: '', onclick: () => {
    form.removeAttribute('hidden');
    title.input.focus();
  } }, '+ Adicionar evento');
  const form = node('form', { class: 'calendar-form', hidden: '', onsubmit: async event => {
    event.preventDefault();
    const titulo = title.input.value.trim();
    if (save.disabled || !titulo) return;
    const data = dateKey(selected);
    feedback.textContent = '';
    save.disabled = true;
    try {
      const created = await api('/agenda', { method: 'POST', signal, body: { data, titulo, tipo: type.value } });
      if (signal.aborted) return;
      events.push(created);
      title.input.value = '';
      form.setAttribute('hidden', '');
      status.textContent = 'Evento salvo.';
      draw();
      add.focus();
    } catch (error) {
      if (!signal.aborted) feedback.textContent = error.message;
    } finally {
      save.disabled = false;
    }
  } }, title.element, node('div', { class: 'field' }, node('label', { class: 'eb', for: 'agenda-tipo' }, 'Tipo'), type),
  node('div', { class: 'calendar-actions' }, save, node('button', { class: 'btn', type: 'button', onclick: () => {
    form.setAttribute('hidden', '');
    add.focus();
  } }, 'Cancelar')));
  const weekdays = [
    ['Seg', 'segunda-feira'], ['Ter', 'terça-feira'], ['Qua', 'quarta-feira'], ['Qui', 'quinta-feira'],
    ['Sex', 'sexta-feira'], ['Sáb', 'sábado'], ['Dom', 'domingo'],
  ];

  function draw(focusDay = false) {
    monthLabel.textContent = monthFormatter.format(month);
    heading.textContent = dayFormatter.format(selected);
    const selectedDate = dateKey(selected);
    const todayDate = dateKey(today);
    const markedDates = new Set(events.map(event => event.data));
    const firstDay = (month.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const rows = [];
    let selectedButton;
    for (let start = 1 - firstDay; start <= count; start += 7) {
      const days = Array.from({ length: 7 }, (_, column) => {
        const day = start + column;
        if (day < 1 || day > count) return node('td');
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        const key = dateKey(date);
        const marked = markedDates.has(key);
        const button = node('button', { type: 'button', class: marked ? 'calendar-day has-event' : 'calendar-day',
          'aria-label': dayFormatter.format(date) + (marked ? ', com eventos' : ''),
          'aria-pressed': String(key === selectedDate),
          ...(key === todayDate ? { 'aria-current': 'date' } : {}),
          onclick: () => { selected = date; status.textContent = ''; draw(true); },
        }, String(day));
        if (key === selectedDate) selectedButton = button;
        return node('td', {}, button);
      });
      rows.push(node('tr', {}, ...days));
    }
    body.replaceChildren(...rows);
    if (focusDay) selectedButton?.focus();
    const daily = events.filter(event => event.data === selectedDate);
    entries.replaceChildren(...daily.map(event => {
      const remove = node('button', { type: 'button', 'aria-label': `Excluir ${event.titulo}`,
        onclick: async () => {
          remove.disabled = true;
          feedback.textContent = '';
          try {
            await api(`/agenda/${event.id}`, { method: 'DELETE', signal });
            if (signal.aborted) return;
            events = events.filter(entry => entry.id !== event.id);
            status.textContent = 'Evento excluído.';
            draw();
            add.focus();
          } catch (error) {
            if (!signal.aborted) feedback.textContent = error.message;
            remove.disabled = false;
          }
        },
      }, 'Excluir');
      return node('li', {}, node('div', {}, node('small', {}, types[event.tipo]),
        node('strong', {}, event.titulo)), remove);
    }));
    if (available && !daily.length) entries.append(node('li', { class: 'muted' }, 'Nenhum evento neste dia.'));
  }

  const monthButton = (offset, label, icon) => node('button', {
    type: 'button', class: 'calendar-arrow', 'aria-label': label,
    onclick: () => {
      month = new Date(month.getFullYear(), month.getMonth() + offset, 1);
      selected = month;
      status.textContent = '';
      draw();
    },
  }, icon);

  draw();
  get('/agenda', signal).then(data => {
    if (signal.aborted) return;
    events = data;
    available = true;
    add.disabled = false;
    draw();
  }).catch(() => {
    if (!signal.aborted) feedback.textContent = 'Não foi possível carregar seus eventos.';
  });
  return node('section', { class: 'home-panel study-calendar' }, node('h2', {}, 'Calendário'),
    node('div', { class: 'calendar-nav' }, monthButton(-1, 'Mês anterior', '‹'), monthLabel,
      monthButton(1, 'Próximo mês', '›')),
    node('table', { 'aria-labelledby': 'calendar-month' },
      node('thead', {}, node('tr', {}, ...weekdays.map(([short, full]) =>
        node('th', { scope: 'col', 'aria-label': full }, short)))), body),
    heading, entries, add, form, feedback, status);
}

function visibleNews(today) {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (today.getDay() + 6) % 7);
  const start = dateKey(monday);
  const current = dateKey(today);
  return academyNews.filter(item => item.date <= current && (item.date >= start || item.until >= current));
}

function weeklyNews(news) {
  const title = node('h2', { id: 'news-title' }, 'Notícias da semana');
  if (!news.length) {
    return node('section', { class: 'home-panel weekly-news', 'aria-labelledby': 'news-title' }, title,
      muted('Ainda não há notícias publicadas nesta semana.'));
  }

  let active = 0;
  const stage = node('div', { class: 'news-stage', 'aria-live': 'polite' });
  const pagination = news.map((item, index) => node('button', {
    class: 'news-dot', type: 'button', 'aria-label': `Mostrar notícia: ${item.title}`,
    onclick: () => show(index),
  }));

  function show(index) {
    active = (index + news.length) % news.length;
    const item = news[active];
    const eventDate = item.event ? new Date(item.event.date + 'T12:00:00') : null;
    const art = item.photo
      ? node('figure', { class: 'news-photo' },
        node('img', { src: item.photo.src, alt: item.photo.alt, width: '486', height: '486' }),
        node('figcaption', {}, 'Fonte: ', node('a', {
          href: item.url, target: '_blank', rel: 'noopener noreferrer',
        }, item.source)))
      : node('div', { class: 'news-art', 'aria-hidden': 'true' },
      eventDate
        ? node('div', { class: 'news-date' }, node('small', {}, item.event.label), node('strong', {}, String(eventDate.getDate())),
          node('span', {}, new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(eventDate).replace('.', '')))
        : node('span', { class: 'news-spark' }, '✦'));
    stage.replaceChildren(node('article', { class: item.photo ? 'news-slide has-photo' : 'news-slide',
      role: 'group', 'aria-roledescription': 'slide',
      'aria-label': `${active + 1} de ${news.length}` },
    node('div', { class: 'news-copy' }, node('p', { class: 'eb' }, item.category),
      node('h3', {}, item.title), node('p', { class: 'news-summary' }, item.summary),
      node('a', { class: 'btn p news-link', href: item.url, target: '_blank', rel: 'noopener noreferrer',
        'aria-label': `${item.action} · ${item.source}` },
        item.action, node('span', { 'aria-hidden': 'true' }, '↗'))), art));
    pagination.forEach((dot, index) => dot.setAttribute('aria-pressed', String(index === active)));
  }

  const arrow = (offset, label, icon) => node('button', {
    type: 'button', class: 'news-arrow', 'aria-label': label, onclick: () => show(active + offset),
  }, icon);
  const controls = news.length > 1 ? node('div', { class: 'news-controls' },
    arrow(-1, 'Notícia anterior', '←'), node('div', { class: 'news-pagination' }, ...pagination),
    arrow(1, 'Próxima notícia', '→')) : null;

  show(0);
  return node('section', { class: 'weekly-news', 'aria-labelledby': 'news-title', 'aria-roledescription': 'carrossel',
    onkeydown: event => {
      if (news.length < 2 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      event.preventDefault();
      show(active + (event.key === 'ArrowRight' ? 1 : -1));
    },
  }, title, stage, controls);
}

function avatar({ nome, foto }, className) {
  if (foto) {
    return node('img', { class: className, src: 'data:image/jpeg;base64,' + foto, alt: '' });
  }
  const parts = nome.trim().split(/\s+/);
  const initials = (parts.length > 1 ? [parts[0], parts.at(-1)] : parts)
    .map(part => Array.from(part)[0]).join('').toLocaleUpperCase('pt-BR');
  return node('span', { class: className, 'aria-hidden': 'true' }, initials);
}

function dashboardProfile(profile) {
  return node('section', { class: 'home-panel dashboard-profile' },
    node('div', { class: 'dashboard-profile-head' }, node('h2', {}, 'Perfil'),
      node('a', { href: '#/perfil' }, 'Editar')),
    avatar(profile, 'dashboard-avatar'),
    node('div', {}, node('strong', {}, profile.nome), profile.instituicao ? muted(profile.instituicao) : null));
}

function dashboardCourses(courses) {
  return node('section', { class: 'dashboard-courses' },
    node('div', { class: 'dashboard-section-head' }, node('h2', {}, 'Meus cursos'),
      courses.length ? node('a', { href: '#/trilhas' }, 'Ver trilhas →') : null),
    courses.length
      ? node('div', { class: 'dashboard-course-grid' }, ...courses.map((course, index) => node('article', { class: 'home-panel dashboard-course' },
        muted(course.trilha), node('h3', {}, course.titulo),
        link(index === 0 ? 'Retomar curso →' : 'Continuar →',
          lessonUrl(course.trilhaId, course.moduloId ?? 'i', course.videoId), index === 0))))
      : node('div', { class: 'home-panel dashboard-empty' },
        muted('Os cursos que você começar aparecem aqui.'), link('Explorar trilhas →', '#/trilhas')));
}

function dashboardDates(news, today) {
  const events = news.filter(item => item.event?.date >= dateKey(today))
    .sort((a, b) => a.event.date.localeCompare(b.event.date));
  if (!events.length) return null;
  const format = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
  return node('section', { class: 'home-panel dashboard-dates' }, node('h2', {}, 'Próximas datas'),
    node('ul', {}, ...events.map(item => node('li', {}, node('a', { href: item.url, target: '_blank', rel: 'noopener noreferrer' },
      node('time', { datetime: item.event.date }, format.format(new Date(item.event.date + 'T12:00:00'))),
      node('span', {}, item.event.label, node('small', {}, item.title)))))));
}

async function home({ signal }) {
  const [profile, courses] = await Promise.all([
    get('/usuarios/me', signal), get('/progresso/em-andamento', signal),
  ]);
  const today = new Date();
  const news = visibleNews(today);
  return shell('inicio', node('div', { class: 'home-grid' },
    node('div', { class: 'dashboard-main' },
      node('header', { class: 'home-header' }, heading(`Olá, ${profile.nome.trim().split(/\s+/)[0]}`)),
      weeklyNews(news), dashboardCourses(courses)),
    node('aside', { class: 'dashboard-side', 'aria-label': 'Perfil e calendário' },
      dashboardProfile(profile), studyCalendar(today, signal), dashboardDates(news, today))));
}

async function trails({ signal }) {
  const trails = await get('/trilhas', signal);
  const orderKey = name => name.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]/g, '');
  const order = new Map(journeyOrder.map((name, i) => [orderKey(name), i]));
  trails.sort((a, b) => (order.get(orderKey(a.nome)) ?? 999) - (order.get(orderKey(b.nome)) ?? 999));
  const search = field('busca', 'Buscar trilha', { type: 'search', placeholder: 'Ex.: Front-end' });
  const accents = ['lime', 'aqua', 'purple', 'sky', 'amber'];
  const marks = ['API', '</>', 'FS', 'DATA', 'IA', 'ADV', 'π', 'GAME', 'ETH', 'OPS',
    'SEC', 'I/O', 'AUTO', 'ETL', 'WEB3', 'QA', 'UX', '☁', 'APP'];
  const grid = node('div', { class: 'g trail-grid' });
  const result = node('div', { 'aria-live': 'polite' });
  const normalize = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
  function draw() {
    const query = normalize(search.input.value.trim());
    const visible = trails.filter(trail => normalize(trail.nome).includes(query));
    result.replaceChildren();
    grid.replaceChildren(...visible.map(trail => {
      const index = order.get(orderKey(trail.nome)) ?? 0;
      return node('a', { class: 'c trail-card', 'data-tone': accents[index % accents.length], href: trailUrl(trail.id) },
        node('div', { class: 'trail-mark', 'aria-hidden': 'true' }, marks[index]),
        node('div', {}, node('h2', {}, trail.nome), muted(trail.descricao ?? '')),
        node('span', { class: 'trail-action' }, 'Ver trilha', node('span', { 'aria-hidden': 'true' }, '↗')));
    }));
    if (!visible.length) result.append(empty(query ? 'Nenhuma trilha corresponde à busca.' : 'Nenhuma trilha foi cadastrada ainda.'));
  }
  search.input.addEventListener('input', draw);
  draw();
  return shell('trilhas', node('header', { class: 'catalog-header' },
    node('div', {}, heading('Escolha sua trilha.'), muted('Encontre a área que combina com o que você quer construir.')),
    node('div', { class: 'search' }, search.element)), result, grid);
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
  const collection = media?.list ? playlistLessons[media.list] : null;
  const chapters = collection?.lessons ?? [];
  const playlistPath = `/progresso/video/${video.id}/aulas`;
  const completed = new Set(ids);
  const bar = progressBar(0, chapters.length ? 'Progresso das aulas' : 'Progresso dos cursos');
  const summary = node('p', { class: 'muted', role: 'status' });
  const feedback = errorText();
  const button = node('button', { class: 'btn p', type: 'button' });
  if (media && !completed.has(video.id)) {
    try {
      await api(`/progresso/video/${video.id}/iniciar`, { method: 'POST', signal });
    } catch (error) {
      if (signal.aborted) throw error;
      feedback.textContent = 'Não foi possível salvar este curso no Início.';
    }
  }
  const rows = videos.map((item, indexOfItem) => node('a', {
    class: indexOfItem === index ? 'li on' : 'li', href: lessonUrl(trailId, moduleId, item.id),
    ...(indexOfItem === index ? { 'aria-current': 'page' } : {}),
  }, node('b', { 'aria-hidden': 'true' }), node('span', {}, item.titulo), node('span', { class: 'done-label' })));

  function updateCourse() {
    if (!chapters.length) {
      const status = score(videos, completed);
      bar.value = status.percent;
      summary.textContent = status.label;
    }
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
      updateCourse();
      if (chapters.length) {
        finishedChapters = new Set(chapters.map(chapter => chapter.id));
        updateChapters();
      }
      rows[index].classList.add('just-done');
    } catch (error) {
      if (signal.aborted) return;
      feedback.textContent = error.message;
      button.disabled = false;
    }
  });
  updateCourse();
  const playerFrame = media?.embed ? node('iframe', {
    src: media.embed, title: video.titulo,
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen', allowfullscreen: '',
    referrerpolicy: 'strict-origin-when-cross-origin',
  }) : null;
  const player = playerFrame ? node('div', { class: 'pl' }, playerFrame) : node('section', { class: 'external-course' },
    node('p', { class: 'eb' }, media?.kind === 'external' ? 'Material externo' : 'Conteúdo indisponível'),
    node('h2', {}, media?.kind === 'external' ? 'Continue no site do autor.' : 'Não foi possível montar o player.'),
    muted(media?.kind === 'external' ? 'Este material é oferecido em outra plataforma. O acesso segue as condições do site original.' : 'Confira o link original ou escolha outro curso.'));
  const sourceLink = media?.kind === 'external'
    ? node('a', { class: 'btn', href: media.original, target: '_blank', rel: 'noopener noreferrer' }, 'Acessar material')
    : null;
  let finishedChapters = new Set();
  if (chapters.length) {
    if (completed.has(video.id)) finishedChapters = new Set(chapters.map(chapter => chapter.id));
    try {
      const progress = await get(playlistPath, signal);
      finishedChapters = new Set(progress.aulasConcluidas);
      if (progress.cursoConcluido) {
        completed.add(video.id);
        updateCourse();
      }
    } catch (error) {
      if (signal.aborted) throw error;
      feedback.textContent = 'Não foi possível carregar o progresso das aulas.';
    }
  }
  let activeChapter = 0;
  let savingChapter = false;
  const chapterTitle = node('p', { class: 'chapter-caption', role: 'status' });
  const chapterFeedback = node('p', { class: 'success chapter-feedback', role: 'status' });
  const finishChapter = node('button', { class: 'btn p', type: 'button', onclick: async () => {
    const chapter = chapters[activeChapter];
    if (savingChapter || finishedChapters.has(chapter.id)) return;
    savingChapter = true;
    feedback.textContent = '';
    chapterFeedback.textContent = '';
    updateChapters();
    try {
      const progress = await api(`${playlistPath}/${chapter.id}`, { method: 'PUT', signal });
      if (signal.aborted) return;
      finishedChapters = new Set(progress.aulasConcluidas);
      if (progress.cursoConcluido) {
        completed.add(video.id);
        updateCourse();
      }
      chapterFeedback.textContent = progress.cursoConcluido ? 'Curso concluído.' : 'Aula salva no seu progresso.';
    } catch (error) {
      if (!signal.aborted) feedback.textContent = error.message;
    } finally {
      savingChapter = false;
      if (!signal.aborted) updateChapters();
    }
  } });
  const previousChapter = node('button', { class: 'btn', type: 'button', onclick: () => selectChapter(activeChapter - 1) }, '← Aula anterior');
  const nextChapter = node('button', { class: 'btn', type: 'button', onclick: () => selectChapter(activeChapter + 1) }, 'Próxima aula →');
  const chapterButtons = chapters.map((chapter, i) => node('button', {
    type: 'button', class: 'chapter-button', 'aria-pressed': 'false', onclick: () => selectChapter(i),
  }, node('span', { class: 'chapter-number' }, String(i + 1).padStart(2, '0')), node('span', { class: 'chapter-name' }, chapter.title),
  node('span', { class: 'chapter-check', hidden: '', 'aria-label': 'Concluída' }, '✓')));

  function updateChapters() {
    const done = finishedChapters.has(chapters[activeChapter].id);
    finishChapter.disabled = savingChapter || done;
    finishChapter.textContent = done ? '✓ Aula concluída' : savingChapter ? 'Salvando…' : 'Concluir aula';
    const count = chapters.filter(chapter => finishedChapters.has(chapter.id)).length;
    bar.value = Math.round(count * 100 / chapters.length);
    summary.textContent = `${count} de ${chapters.length} aulas concluídas`;
    chapterButtons.forEach((button, i) => {
      const finished = finishedChapters.has(chapters[i].id);
      button.classList.toggle('chapter-done', finished);
      button.lastElementChild.hidden = !finished;
    });
  }

  function selectChapter(i) {
    if (!playerFrame || !chapters[i]) return;
    activeChapter = i;
    const chapter = chapters[i];
    playerFrame.setAttribute('src', `https://www.youtube-nocookie.com/embed/${chapter.id}?playsinline=1`);
    playerFrame.setAttribute('title', chapter.title);
    chapterTitle.textContent = `${i + 1} / ${chapters.length} · ${chapter.title}`;
    chapterFeedback.textContent = '';
    chapterButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === i)));
    previousChapter.disabled = i === 0;
    nextChapter.disabled = i === chapters.length - 1;
    updateChapters();
  }
  if (chapters.length) selectChapter(Math.max(0, chapters.findIndex(chapter => !finishedChapters.has(chapter.id))));
  const playlistNote = media?.kind === 'playlist' ? node('div', { class: 'playlist-note' },
    node('strong', {}, 'Playlist' + (chapters.length ? ` · ${chapters.length} aulas disponíveis` : media.count ? ' · ' + media.count : '')),
    !chapters.length ? muted('Marque o curso como concluído depois de terminar a playlist.') : null,
    collection?.complete ? null : muted('A listagem desta playlist ainda não foi confirmada por completo. Confira também o link no YouTube.')) : null;
  const adjacent = (offset, label) => {
    const target = videos[index + offset];
    const href = target ? lessonUrl(trailId, moduleId, target.id) : neighborLinks[offset < 0 ? 0 : 1];
    return href ? link(label, href) : null;
  };
  return shell('trilhas', returnLink, heading(video.titulo), video.autor ? muted(video.autor) : null,
    node('div', { class: 'ai lesson' }, node('div', {}, player, chapters.length ? chapterTitle : null,
      chapters.length ? node('div', { class: 'ab chapter-actions' }, finishChapter, previousChapter, nextChapter) : null,
      chapters.length ? chapterFeedback : null, chapters.length ? feedback : null, playlistNote,
      node('div', { class: 'ab' }, chapters.length && collection.complete ? null : button, sourceLink,
        adjacent(-1, '← Anterior'), adjacent(1, 'Próxima →')), chapters.length ? null : feedback),
    node('aside', { class: 'sd', 'aria-label': 'Conteúdos do módulo' }, node('h2', {}, chapters.length ? 'Aulas da playlist' : intro ? 'Conheça a carreira' : module.nome),
      summary, bar, chapters.length ? node('div', { class: 'chapter-list' }, ...chapterButtons) : node('div', {}, ...rows))));
}

async function community({ signal }) {
  let credits;
  try { credits = await get('/creditos', signal); } catch (error) {
    if (signal.aborted) throw error;
  }
  return shell('comunidade', heading('Comunidade'), node('div', { class: 'cm' },
    node('div', { class: 'community-main' },
      node('section', { class: 'community-social' },
        node('img', { class: 'community-portrait', src: '/assets/washington-junior.jpg',
          width: '400', height: '400', alt: '' }),
        node('div', {}, node('h2', {}, 'Washington Junior'),
          node('p', { class: 'community-role' }, 'Founder'),
          node('a', { href: instagram, target: '_blank', rel: 'noopener noreferrer' }, 'Fatecanos - Ilha Solteira ↗'))),
      node('section', { class: 'community-channels' }, node('h2', {}, 'Inspirações para a área'),
        node('div', { class: 'channel-grid' }, ...creatorChannels.map(channel =>
          node('article', { class: 'channel-card' }, node('h3', {}, channel.name), muted(channel.description),
            node('a', { href: channel.url, target: '_blank', rel: 'noopener noreferrer',
              'aria-label': `Visitar o canal ${channel.name} no YouTube` }, 'Visitar canal ↗')))))),
    node('section', { class: 'cr' }, node('h2', {}, 'Créditos'),
      node('a', { href: 'https://jornadadevheroi.com', target: '_blank', rel: 'noopener noreferrer' }, 'DevArthur · Jornada Dev Herói'),
      muted('Inspiração para a organização das trilhas.'),
      credits?.length ? node('ul', {}, ...credits.map(author => node('li', {}, node('b', {}, author.autor),
        node('span', {}, `${author.total} ${author.total === 1 ? 'conteúdo' : 'conteúdos'}`)))) :
        muted(credits ? 'Os autores aparecem aqui conforme os vídeos forem cadastrados.' : 'A lista de autores está temporariamente indisponível.'))));
}

async function prepareAvatar(file) {
  if (file.size > 12 * 1024 * 1024) throw new Error('Escolha uma imagem de até 12 MB.');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Abra uma foto válida em JPEG, PNG ou WebP.');
  }
  try {
    const canvas = node('canvas', { width: '256', height: '256' });
    const context = canvas.getContext('2d', { alpha: false });
    const size = Math.min(bitmap.width, bitmap.height);
    context.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 256, 256);
    return canvas.toDataURL('image/jpeg', .75).split(',')[1];
  } finally {
    bitmap.close();
  }
}

function projectCard(project, review = null) {
  const projectLink = (label, href) => node('a', {
    class: 'btn', href, target: '_blank', rel: 'noopener noreferrer',
  }, label, node('span', { 'aria-hidden': 'true' }, '↗'));

  return node('article', { class: project.destaque ? 'project-card project-featured' : 'project-card', tabindex: '-1' },
    node('div', { class: 'project-copy' },
      node('h2', {}, project.titulo),
      node('p', { class: 'project-author' }, project.autor),
      node('p', { class: 'project-description' }, project.descricao)),
    node('div', { class: 'project-links' }, projectLink('GitHub', project.githubUrl),
      project.demoUrl ? projectLink('Ver demo', project.demoUrl) : null),
    review);
}

function projectReview(initial, signal, onReview) {
  let pending = initial;
  let reviewing = false;
  const list = node('div', { class: 'projects-grid' });
  const feedback = errorText();
  const status = node('p', { class: 'success', role: 'status' });

  function draw() {
    list.replaceChildren(...pending.map(project => {
      const approve = node('button', { class: 'btn p', type: 'button',
        onclick: () => decide(project, 'APROVADO', approve, reject) }, 'Aprovar');
      const reject = node('button', { class: 'btn', type: 'button',
        onclick: () => decide(project, 'RECUSADO', approve, reject) }, 'Recusar');
      return projectCard(project, node('div', { class: 'project-review-actions' }, approve, reject));
    }));
    if (!pending.length) list.append(muted('Nenhum projeto aguardando revisão.'));
  }

  async function decide(project, decision, ...buttons) {
    if (reviewing) return;
    reviewing = true;
    buttons.forEach(button => { button.disabled = true; });
    feedback.textContent = '';
    status.textContent = '';
    try {
      await api(`/projetos/revisao/${project.id}`, { method: 'PUT', signal, body: { status: decision } });
      if (signal.aborted) return;
      pending = pending.filter(item => item.id !== project.id);
      onReview({ ...project, status: decision });
      draw();
      status.textContent = decision === 'APROVADO' ? 'Projeto aprovado e publicado.' : 'Projeto recusado.';
      status.focus();
    } catch (error) {
      if (signal.aborted) return;
      feedback.textContent = error.status === 409 ? 'Este projeto já foi revisado. Atualize a página para ver a fila.' : error.message;
    } finally {
      reviewing = false;
      buttons.forEach(button => { button.disabled = false; });
    }
  }

  status.setAttribute('tabindex', '-1');
  draw();
  return {
    element: node('section', { class: 'project-review' }, node('h2', {}, 'Revisar projetos'), feedback, status, list),
    enqueue(project) {
      pending = [...pending, project];
      draw();
    },
  };
}

async function projects({ signal }) {
  const [[featured, ...items], mine] = await Promise.all([get('/projetos', signal), get('/projetos/meus', signal)]);
  let gallery = items;
  let submissions = mine.envios;
  const grid = node('div', { class: 'projects-grid' });
  const emptyGallery = node('p', { class: 'project-empty muted' }, 'Os projetos aprovados aparecem aqui.');
  const submitted = node('ul', { class: 'project-submitted-list' });
  const submissionSection = node('section', { class: 'project-submissions' }, node('h2', {}, 'Meus envios'), submitted);
  const labels = { PENDENTE: 'Aguardando aprovação', APROVADO: 'Publicado', RECUSADO: 'Recusado' };

  function drawGallery() {
    grid.replaceChildren(...gallery.map(project => projectCard(project)));
    emptyGallery.hidden = gallery.length > 0;
  }

  function drawSubmissions() {
    submitted.replaceChildren(...submissions.map(project => node('li', {},
      node('span', {}, project.titulo), node('strong', { 'data-status': project.status }, labels[project.status]))));
    submissionSection.hidden = submissions.length === 0;
  }

  function applyReview(project) {
    if (project.status === 'APROVADO') {
      gallery = [project, ...gallery.filter(item => item.id !== project.id)].sort((a, b) => b.id - a.id);
      drawGallery();
    }
    submissions = submissions.map(item => item.id === project.id ? project : item);
    drawSubmissions();
  }

  drawGallery();
  drawSubmissions();
  const review = mine.podeRevisar ? projectReview(await get('/projetos/revisao', signal), signal, applyReview) : null;
  const title = field('projeto-titulo', 'Nome do projeto', { required: '', maxlength: '100' });
  const description = node('textarea', { class: 'in', id: 'projeto-descricao', name: 'descricao', required: '', maxlength: '400', rows: '3' });
  const github = field('projeto-github', 'Link do GitHub', { type: 'url', required: '', maxlength: '500',
    placeholder: 'https://github.com/seu-usuario/seu-projeto' });
  const demo = field('projeto-demo', 'Link da demo (opcional)', { type: 'url', maxlength: '500',
    placeholder: 'https://seu-projeto.com' });
  const feedback = errorText();
  const status = node('p', { class: 'success', role: 'status' });
  const open = node('button', { class: 'btn p', type: 'button', 'aria-controls': 'project-form',
    'aria-expanded': 'false', onclick: () => setFormVisible(form.hasAttribute('hidden')) }, 'Enviar meu projeto');
  const publish = node('button', { class: 'btn p', type: 'submit' }, 'Enviar para análise');
  const cancel = node('button', { class: 'btn', type: 'button', onclick: () => setFormVisible(false) }, 'Cancelar');
  const form = node('form', { class: 'project-form', id: 'project-form', hidden: '', onsubmit: async event => {
    event.preventDefault();
    if (publish.disabled) return;
    const titulo = title.input.value.trim();
    const descricao = description.value.trim();
    const githubUrl = github.input.value.trim();
    const demoUrl = demo.input.value.trim() || null;
    feedback.textContent = '';
    if (!titulo || !descricao || !githubUrl) {
      feedback.textContent = 'Preencha o nome, a descrição e o link do GitHub.';
      return;
    }

    publish.disabled = true;
    cancel.disabled = true;
    open.disabled = true;
    try {
      const created = await api('/projetos', { method: 'POST', signal, body: { titulo, descricao, githubUrl, demoUrl } });
      if (signal.aborted) return;
      submissions = [created, ...submissions];
      drawSubmissions();
      review?.enqueue(created);
      form.reset();
      setFormVisible(false);
      status.textContent = 'Projeto enviado. Ele aparecerá na galeria após aprovação.';
      status.focus();
    } catch (error) {
      if (!signal.aborted) feedback.textContent = error.status === 400
        ? 'Confira o nome, a descrição e os links. Use um repositório do GitHub e uma demo em HTTPS.'
        : error.message;
    } finally {
      if (!signal.aborted) {
        publish.disabled = false;
        cancel.disabled = false;
        open.disabled = false;
      }
    }
  } }, title.element, node('div', { class: 'field project-description-field' },
    node('label', { class: 'eb', for: 'projeto-descricao' }, 'O que você fez?'), description),
  github.element, demo.element, node('div', { class: 'project-form-actions' }, publish, cancel), feedback);

  function setFormVisible(visible) {
    open.setAttribute('aria-expanded', String(visible));
    if (visible) {
      status.textContent = '';
      form.removeAttribute('hidden');
      title.input.focus();
    } else {
      form.setAttribute('hidden', '');
      feedback.textContent = '';
      if (!open.disabled) open.focus();
    }
  }

  status.setAttribute('tabindex', '-1');
  return shell('projetos', node('header', { class: 'projects-header' },
    node('div', {}, heading('Projetos da Comunidade'), muted('Mostre o que você construiu e explore os projetos dos alunos.')), open),
  form, status, review?.element, featured ? projectCard(featured) : null, emptyGallery, grid, submissionSection);
}

async function profile({ signal }) {
  const user = await get('/usuarios/me', signal);
  const name = field('nome', 'Nome', { required: '', maxlength: '120', autocomplete: 'name', value: user.nome });
  const school = field('instituicao', 'Instituição de ensino', { maxlength: '255', autocomplete: 'organization', value: user.instituicao ?? '' });
  const email = field('email', 'E-mail', { type: 'email', value: user.email, readonly: '' });
  const photo = field('foto', 'Foto de perfil', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
  const preview = node('div', { class: 'profile-photo' }, avatar(user, 'profile-avatar'));
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
      const file = photo.input.files?.[0];
      const foto = file ? await prepareAvatar(file) : undefined;
      const updated = await api('/usuarios/me', { method: 'PUT', signal,
        body: { nome, instituicao: school.input.value.trim() || null, foto } });
      if (signal.aborted) return;
      name.input.value = updated.nome;
      school.input.value = updated.instituicao ?? '';
      photo.input.value = '';
      preview.replaceChildren(avatar(updated, 'profile-avatar'));
      saved.textContent = 'Perfil atualizado.';
    } catch (error) {
      if (!signal.aborted) feedback.textContent = error.message;
    } finally {
      if (!signal.aborted) submit.disabled = false;
    }
  } }, preview, photo.element, name.element, email.element, school.element, feedback, saved, submit);
  return shell('perfil', heading('Seu perfil'), form);
}

const routes = [
  [/^#\/$/, landing, true],
  [/^#\/login$/, ({ signal }) => auth(false, signal), true],
  [/^#\/cadastro$/, ({ signal }) => auth(true, signal), true],
  [/^#\/google(?:\/(erro|conta-existente))?$/, googleReturn, true],
  [/^#\/inicio$/, home],
  [/^#\/trilhas$/, trails],
  [/^#\/trilha\/([1-9]\d{0,9})$/, trail],
  [/^#\/aula\/([1-9]\d{0,9})\/(i|[1-9]\d{0,9})\/([1-9]\d{0,9})$/, lesson],
  [/^#\/comunidade$/, community],
  [/^#\/projetos$/, projects],
  [/^#\/perfil$/, profile],
];

async function navigate() {
  navigation?.abort();
  navigation = new AbortController();
  const { signal } = navigation;
  const hash = location.hash || '#/';
  const route = routes.find(([pattern]) => pattern.test(hash));
  if (!route || (!route[2] && !isSignedIn()) || (route[2] && isSignedIn())) {
    location.hash = isSignedIn() ? '#/inicio' : route ? '#/login' : '#/';
    return;
  }

  try {
    if (!route[2]) app.replaceChildren(shell('', node('p', { class: 'loading', role: 'status' }, 'Carregando…')));
    const page = await route[1]({ signal }, ...hash.match(route[0]).slice(1));
    if (signal.aborted || !page) return;
    app.replaceChildren(page);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
