import { complete, endpoint } from './provider.js';
import { lessons } from "./sample.js";


import { preferences, bindPreferences, track } from './settings.js';

const byId = id => document.getElementById(id);
const dialog = byId('config');
const api = byId('api');
const answer = byId('answer');
const history = [];
let config;
let busy = false;

function readConfig() {
  if (!api.reportValidity()) throw new Error('Fill in all three fields.');
  const input = new FormData(api);
  const values = Object.fromEntries([...input].map(([key, value]) => [key, value.trim()]));
  if (!values.model || !values.key) throw new Error('Enter the model and API key.');
  endpoint(values.base);
  return values;
}
function openSettings() {
  if (config) {
    api.elements.base.value = config.base;
    api.elements.model.value = config.model;
  }
  api.elements.key.value = '';
  byId('api-status').textContent = '';
  dialog.showModal();
}
byId('settings').onclick = () => byId('preferences').showModal();
byId('open-api').onclick = () => { byId('preferences').close(); openSettings(); };
bindPreferences();
byId('cancel').onclick = () => dialog.close();
dialog.addEventListener('close', () => { api.elements.key.value = ''; });
api.onsubmit = event => {
  event.preventDefault();
  try { config = readConfig(); dialog.close(); }
  catch (error) { byId('api-status').textContent = error.message; }
};
byId('test').onclick = async event => {
  const button = event.currentTarget;
  button.disabled = true;
  byId('api-status').textContent = 'Testing connection…';
  try {
    await complete(readConfig(), [{ role: 'user', content: 'Say hello in one sentence.' }]);
    byId('api-status').textContent = 'Connected. Save to start chatting.';
  } catch (error) { byId('api-status').textContent = error.message; }
  finally { button.disabled = false; }
};

function addMessage(role, content) {
  const row = document.createElement('p');
  row.className = role;
  row.textContent = content;
  if (role === 'assistant' && 'speechSynthesis' in window) {
    const play = document.createElement('button');
    play.textContent = 'Listen';
    play.onclick = () => {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = preferences.explanation === 'zh' ? 'zh-CN' : 'en-US';
      utterance.rate = preferences.rate;
      speechSynthesis.speak(utterance);
    };
    row.append(' ', play);
  }
  byId('messages').append(row);
  row.scrollIntoView({block:'nearest'});
}
byId('conversation').onsubmit = async event => {
  event.preventDefault();
  if (!config) { openSettings(); return; }
  const content = answer.value.trim();
  if (busy || !content) return;
  busy = true;
  byId('send').disabled = true;
  const turn = {role:'user',content};
  byId('status').textContent = 'Plip is thinking…';
  try {
    const reply = await complete({...config, explanation:preferences.explanation}, [...history, turn]);
    history.push(turn, {role:'assistant',content:reply});
    if (history.length > 10) history.splice(0, history.length - 10);
    addMessage('user', content);
    addMessage('assistant', reply);
    track('conversation_reply');
    if (answer.value.trim() === content) answer.value = '';
    byId('status').textContent = '';
  } catch (error) {
    byId('status').textContent = error instanceof TypeError
      ? 'Could not reach the API. Check the endpoint and its browser CORS settings.' : error.message;
  } finally { busy = false; byId('send').disabled = false; }
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const mic = byId('mic');
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  mic.hidden = false;
  mic.onclick = () => {
    if (mic.textContent === 'Stop recording') { recognition.stop(); return; }
    try { recognition.start(); }
    catch { byId('status').textContent = 'Microphone unavailable. You can type your reply.'; }
  };
  recognition.onstart = () => { mic.textContent = 'Stop recording'; };
  recognition.onend = () => { mic.textContent = 'Start recording'; };
  recognition.onresult = event => { answer.value = event.results[0][0].transcript.slice(0,500); };
  recognition.onerror = () => { byId('status').textContent = 'Speech input failed. You can type your reply.'; };
}

const modules = ['learn', 'practice', 'conversation-panel', 'games'];
function showModule() {
  const hash = location.hash.slice(1);
  const active = modules.includes(hash) ? hash : 'learn';
  byId('lesson-picker').hidden = active === 'conversation-panel';
  for (const id of modules) {
    byId(id).hidden = id !== active;
    const link = document.querySelector('nav a[href="#' + id + '"]');
    if (id === active) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
}
window.addEventListener('hashchange', showModule);
showModule();

const questionSets = [[
  ['You walk into class at 9 a.m. What do you say?', ['Good evening','Good morning','Good afternoon'], 1, 'Use “Good morning” before noon.'],
  ['Someone introduces you to Maya for the first time. What do you say?', ['Nice to meet you','Goodbye','Good evening'], 0, '“Nice to meet you” is a polite first greeting.'],
  ['You are leaving after a short chat. What do you say?', ['Hello','Good afternoon','Goodbye'], 2, '“Goodbye” ends a conversation when you leave.'],
], [
  ['What are you asking when you say “What do you do?”', ['Occupation','Nationality','Age'], 0, 'This question usually asks about someone’s job.'],
  ['Someone asks where you are from. Which answer fits?', ['I am 20.','I’m from Canada.','I like reading.'], 1, 'Use “I’m from” to say where you come from.'],
  ['Which sentence tells someone about a hobby?', ['I’m a student.','I’m Maya’s classmate.','I enjoy painting.'], 2, 'A hobby is something you enjoy doing.'],
], [
  ['Which sentence orders coffee politely?', ['The coffee is hot.','I’d like a coffee, please.','Here is your coffee.'], 1, '“I’d like” is a polite way to order.'],
  ['You want to take your sandwich away. What do you say?', ['For here, please.','Could we have the bill?','To go, please.'], 2, '“To go” means you will take your order away.'],
  ['You have finished eating and want to pay. What do you ask for?', ['The bill','The menu','A table'], 0, 'Ask for the bill when you are ready to pay.'],
]];
const quiz = byId('quiz');
function renderLesson(index) {
  const lesson = lessons[index];
  const questions = questionSets[index];
  byId('lesson-goals').replaceChildren();
  byId('lesson-words').replaceChildren();
  byId('quiz-result').textContent = '';
  quiz.replaceChildren();
  startGame(lesson.words);

  byId('lesson-title').textContent = lesson.title;
  for (const goal of lesson.goals) {
    const item = document.createElement('li');
    item.textContent = goal;
    byId('lesson-goals').append(item);
  }
  for (const {term, meaning, example} of lesson.words) {
    const card = document.createElement('article');
    const title = document.createElement('h3');
    title.textContent = term;
    const definition = document.createElement('p');
    definition.textContent = meaning;
    const sample = document.createElement('p');
    sample.textContent = example;
    card.append(title,definition,sample);
    byId('lesson-words').append(card);
  }

  questions.forEach(([prompt, options], index) => {
    const group = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = prompt;
    group.append(legend);
    options.forEach((option, value) => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      Object.assign(radio,{type:'radio',name:'q'+index,value,required:true});
      label.append(radio,option);
      group.append(label);
    });
    const feedback = document.createElement('p');
    feedback.id = 'feedback-'+index;
    group.append(feedback);
    quiz.append(group);
  });
  const check = document.createElement('button');
  check.textContent = 'Check answers';
  quiz.append(check);
  quiz.onsubmit = event => {
    event.preventDefault();
    const choices = new FormData(quiz);
    const score = questions.reduce((total, [,,correct, explanation], index) => {
      const right = Number(choices.get('q'+index)) === correct;
      byId('feedback-'+index).textContent = (right ? 'Correct. ' : 'Try again. ') + explanation;
      return total + Number(right);
    }, 0);
    track('sample_quiz_completed');
    byId('quiz-result').textContent = score + ' / ' + questions.length + ' correct';
  };

}
const lessonSelect = byId('lesson-select');
lessons.forEach(({title}, index) => lessonSelect.add(new Option(title, index)));
lessonSelect.onchange = () => renderLesson(Number(lessonSelect.value));
renderLesson(0);


function startGame(words) {
  const deck = words.slice(0, 4);
  let index = 0;
  let score = 0;
  const options = byId('game-options');
  const status = byId('game-status');
  status.textContent = '';
  function next() {
    options.replaceChildren();
    const word = deck[index];
    byId('game-prompt').textContent = word?.term || 'Round complete';
    if (!word) {
      status.textContent = score + ' / ' + deck.length + ' correct on the first try';
      track('word_match_completed');
      return;
    }
    let missed = false;
    const offset = (index + 1) % deck.length;
    for (const candidate of [...deck.slice(offset), ...deck.slice(0, offset)]) {
      const button = document.createElement('button');
      button.textContent = candidate.meaning;
      button.onclick = () => {
        if (candidate !== word) {
          missed = true;
          button.disabled = true;
          status.textContent = 'Try another meaning.';
          return;
        }
        if (!missed) score++;
        status.textContent = 'Correct!';
        index++;
        next();
      };
      options.append(button);
    }
  }
  byId('game-reset').onclick = () => startGame(words);
  next();
}
