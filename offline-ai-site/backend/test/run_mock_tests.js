const assert = require('assert');
const { generateMockReply } = require('../mock_reply');

const cases = [
  { in: 'Привет', expectSubstring: 'Привет' },
  { in: 'Что ты умеешь?', expectSubstring: 'Кратко' },
  { in: 'исправь сам себя', expectSubstring: 'Могу помочь' },
  { in: 'сделай все сам!!', expectSubstring: 'Я могу автоматизировать' },
  { in: 'язык Пайтон', expectSubstring: 'Python' },
  { in: 'почему падает сервер?', expectSubstring: 'Краткий ответ' },
];

for (const c of cases){
  const out = generateMockReply(c.in, []);
  console.log('TEST:', c.in, '=>', out.split('\n')[0]);
  assert(out && out.toString().toLowerCase().includes(c.expectSubstring.toLowerCase()), `expected ${c.expectSubstring} in reply for '${c.in}'`);
}

console.log('All mock_reply tests passed');
