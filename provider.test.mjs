import test from 'node:test';
import assert from 'node:assert/strict';
import { complete, endpoint } from './public/provider.js';

test('validates and normalizes provider endpoints', () => {
  assert.equal(endpoint('https://example.test/v1/').href,'https://example.test/v1/chat/completions');
  assert.throws(() => endpoint('http://example.test/v1'));
  assert.throws(() => endpoint('https://user:password@example.test/v1'));
});

test('sends the configured model and returns a complete reply', async () => {
  const config = {base:'https://example.test/v1',model:'test-model',key:'fixture'};
  const turns = [{role:'user',content:'I would like a coffee.'}];
  const reply = await complete(config, turns, async (url, options) => {
    assert.equal(url.href,'https://example.test/v1/chat/completions');
    assert.equal(options.headers.Authorization,'Bearer fixture');
    assert.equal(options.redirect,'error');
    assert.equal(JSON.parse(options.body).model,'test-model');
    assert.deepEqual(JSON.parse(options.body).messages.at(-1),turns[0]);
    return Response.json({choices:[{finish_reason:'stop',message:{content:'Hot or iced?'}}]});
  });
  assert.equal(reply,'Hot or iced?');
  await assert.rejects(complete(config, turns, async () =>
    Response.json({choices:[{finish_reason:'length',message:{content:'Hot or'}}]})), /complete reply/);
});
