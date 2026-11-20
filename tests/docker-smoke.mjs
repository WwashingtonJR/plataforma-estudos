import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const run = 'fatecanos-smoke-' + randomBytes(6).toString('hex');
const image = run + ':test';
const db = run + '-postgres';
const app = run + '-app';
const database = 'plataforma_estudos_test';
const password = randomBytes(24).toString('hex');
const env = {
  ...process.env,
  POSTGRES_DB: database,
  POSTGRES_USER: 'fatecanos_test',
  POSTGRES_PASSWORD: password,
  DB_URL: 'jdbc:postgresql://db:5432/' + database,
  DB_USER: 'fatecanos_test',
  DB_PASSWORD: password,
  JWT_SECRET: randomBytes(32).toString('hex'),
  INIT_CATALOG: 'true',
};

function docker(args, timeout = 30_000, stdio = ['ignore', 'pipe', 'pipe']) {
  return execFileSync('docker', args, { env, timeout, stdio, encoding: 'utf8' })?.trim();
}

async function waitFor(label, ready) {
  const deadline = Date.now() + 120_000;
  do {
    if (await ready()) return;
    await delay(1000);
  } while (Date.now() < deadline);
  throw new Error('Tempo esgotado esperando ' + label);
}

function cleanup(args) {
  try {
    docker(args);
  } catch (error) {
    if (!/no such|not found/i.test(error.stderr ?? '')) {
      console.error('Falha na limpeza do teste:', error.message);
      process.exitCode = 1;
    }
  }
}

let os;
try {
  os = docker(['info', '--format', '{{.OSType}}']);
} catch (error) {
  throw new Error('Inicie um Docker Engine acessível antes de rodar este teste.', { cause: error });
}
assert.equal(os, 'linux', 'Este teste requer Docker em modo Linux.');
try {
  docker(['build', '--pull', '--tag', image, '.'], 600_000, 'inherit');
  docker(['network', 'create', run]);
  docker([
    'run', '-d', '--name', db, '--network', run, '--network-alias', 'db',
    '-e', 'POSTGRES_DB', '-e', 'POSTGRES_USER', '-e', 'POSTGRES_PASSWORD', 'postgres:18',
  ], 240_000);
  await waitFor('PostgreSQL', () => {
    try {
      docker(['exec', db, 'pg_isready', '-h', '127.0.0.1',
        '-U', env.POSTGRES_USER, '-d', database], 3000);
      return true;
    } catch {
      return false;
    }
  });
  docker([
    'run', '-d', '--name', app, '--network', run, '-p', '127.0.0.1::8085',
    '-e', 'DB_URL', '-e', 'DB_USER', '-e', 'DB_PASSWORD', '-e', 'JWT_SECRET',
    '-e', 'INIT_CATALOG', image,
  ]);
  const address = docker(['port', app, '8085/tcp']);
  assert.match(address, /^127\.0\.0\.1:\d+$/);
  const base = 'http://' + address;

  async function request(path, expected, { method = 'GET', token, body } = {}) {
    const headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(base + path, {
      method, headers, body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, expected, method + ' ' + path);
    return response.headers.get('content-type')?.includes('json') ? response.json() : response.text();
  }

  async function waitForApp() {
    await waitFor('API', async () => {
      try {
        const response = await fetch(base + '/health', { signal: AbortSignal.timeout(2000) });
        return response.ok && (await response.json()).status === 'UP';
      } catch {
        return false;
      }
    });
  }

  async function createStudent() {
    const email = randomUUID() + '@example.test';
    const senha = randomBytes(16).toString('hex');
    const created = await request('/auth/cadastro', 200, {
      method: 'POST', body: { nome: 'Aluno de teste', email, senha },
    });
    assert.equal(created.papel, 'ALUNO');
    assert.equal(Object.hasOwn(created, 'senha'), false);
    const session = await request('/auth/login', 200, { method: 'POST', body: { email, senha } });
    assert.equal(typeof session.token, 'string');
    return session.token;
  }

  await waitForApp();
  assert.equal(docker(['exec', app, 'id', '-u']), '10001');
  assert.match(await request('/', 200), /Fatecanos Academy/);
  assert.match(await request('/api.js', 200), /location\.origin/);
  await request('/trilhas', 401);

  const token = await createStudent();
  const otherToken = await createStudent();
  let trails;
  await waitFor('catálogo', async () => {
    trails = await request('/trilhas', 200, { token });
    return trails.length > 0;
  });
  assert.equal(trails.length, 19);
  const trail = trails.find(item => item.nome === 'Back End');
  assert.ok(trail);
  await request('/trilhas', 403, { method: 'POST', token, body: {} });
  const [module] = await request('/modulos/trilha/' + trail.id, 200, { token });
  const [course] = await request('/videos/modulo/' + module.id, 200, { token });
  await request('/progresso/video/' + course.id + '/concluir', 200, { method: 'POST', token });
  assert.deepEqual(await request('/progresso/concluidos', 200, { token }), [course.id]);
  assert.deepEqual(await request('/progresso/concluidos', 200, { token: otherToken }), []);

  docker(['restart', app]);
  await waitForApp();
  assert.equal((await request('/trilhas', 200, { token })).length, 19);
  assert.deepEqual(await request('/progresso/concluidos', 200, { token }), [course.id]);
  const counts = docker(['exec', db, 'psql', '-U', env.POSTGRES_USER, '-d', database, '-XAt',
    '-c', 'SELECT (SELECT count(*) FROM trilhas), (SELECT count(*) FROM videos)']);
  assert.equal(counts, '19|201');
  console.log('OK: Docker, usuário sem privilégios, catálogo e progresso persistido no PostgreSQL descartável.');
} catch (error) {
  for (const name of [db, app]) {
    try { console.error(docker(['logs', '--tail', '30', name])); } catch {}
  }
  throw error;
} finally {
  cleanup(['rm', '-fv', app]);
  cleanup(['rm', '-fv', db]);
  cleanup(['network', 'rm', run]);
  cleanup(['image', 'rm', image]);
}
