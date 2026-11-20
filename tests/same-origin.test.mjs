import assert from 'node:assert/strict';
globalThis.location = {hostname:'academy.example.test',port:'',origin:'https://academy.example.test'};
globalThis.fetch = async (url, options) => {
  if (url === 'https://academy.example.test/auth/google/session') {
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    return Response.json({token:'google-session'});
  }
  assert.equal(options.credentials, 'omit');
  if (url === 'https://academy.example.test/auth/metodos') return Response.json({google:true});
  assert.equal(url, 'https://academy.example.test/auth/login');
  return Response.json({token:'test'});
};
const {api, googleSignInAvailable, finishGoogleSignIn} = await import('../fatecanos-academy/api.js');
assert.deepEqual(await api('/auth/login',{method:'POST',body:{},publicRoute:true}),{token:'test'});
assert.equal(await googleSignInAvailable(), true);
assert.deepEqual(await finishGoogleSignIn(), {token:'google-session'});
console.log('OK: front hospedado usa a API HTTPS da mesma origem e envia cookies apenas na troca do login Google.');
