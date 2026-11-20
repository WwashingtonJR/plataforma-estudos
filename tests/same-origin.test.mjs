import assert from 'node:assert/strict';
globalThis.location = {hostname:'academy.example.test',port:'',origin:'https://academy.example.test'};
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://academy.example.test/auth/login');
  assert.equal(options.credentials, 'omit');
  return Response.json({token:'test'});
};
const {api} = await import('../fatecanos-academy/api.js');
assert.deepEqual(await api('/auth/login',{method:'POST',body:{},publicRoute:true}),{token:'test'});
console.log('OK: front hospedado usa a API da mesma origem HTTPS.');
