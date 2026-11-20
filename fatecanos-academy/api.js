// Live Server no desenvolvimento; no deploy, o Java serve front e API juntos.
const apiOrigin = ['localhost', '127.0.0.1'].includes(location.hostname) && location.port === '5500'
  ? 'http://localhost:8085'
  : location.origin;
let session = null;
let sessionExpired = () => {};

class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

export function setSessionExpiredHandler(handler) {
  sessionExpired = handler;
}

export function startSession(token) {
  if (typeof token !== 'string' || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) {
    throw new ApiError('A API devolveu uma sessão inválida. Tente entrar novamente.');
  }
  session = { token };
}

export function endSession() {
  session = null;
}

export function isSignedIn() {
  return session !== null;
}

async function request(path, { method = 'GET', body, signal, token } = {}) {
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  try {
    return await fetch(`${apiOrigin}${path}`, {
      method, headers, signal, body: JSON.stringify(body),
      cache: 'no-store', credentials: 'omit', redirect: 'error',
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Não foi possível conectar à API. Confira se o servidor Java está rodando.');
  }
}

export async function api(path, { method, body, signal, publicRoute = false } = {}) {
  const current = publicRoute ? null : session;
  if (!publicRoute && !current) throw new ApiError('Entre na sua conta para continuar.', 401);

  const response = await request(path, { method, body, signal, token: current?.token });
  if (current && current !== session) throw new DOMException('Sessão encerrada', 'AbortError');

  if (current && response.status === 403 && !(path === '/usuarios/me' && !method)) {
    // Esta versão do Java também usa 403 para erros de outros controllers.
    // Confirma a sessão numa rota que todo aluno autenticado pode acessar.
    const check = await request('/usuarios/me', { signal, token: current.token });
    if (current === session && [401, 403].includes(check.status)) {
      endSession();
      sessionExpired();
    }
  } else if (current && [401, 403].includes(response.status)) {
    endSession();
    sessionExpired();
  }

  if (!response.ok) {
    const messages = {
      400: 'Confira os dados informados e tente novamente.',
      401: 'Entre novamente para continuar.',
      403: 'A API recusou esta operação.',
      404: 'Este conteúdo não foi encontrado.',
      429: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    };
    let message = messages[response.status] ?? 'A API encontrou um erro. Tente novamente.';
    if (publicRoute && response.status === 400) {
      message = path === '/auth/login' ? 'E-mail ou senha inválidos.' : 'Não foi possível criar a conta com os dados informados.';
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204 || !response.headers.get('content-type')?.includes('json')) return null;
  return response.json();
}
