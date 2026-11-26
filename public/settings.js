const key = 'hiplip-open-preferences';
const allowedRates = [0.5, 0.75, 1, 1.2, 1.5];
export const preferences = { language: 'en', explanation: 'en', rate: 1, analytics: false };
try {
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  if (saved.language === 'zh') preferences.language = 'zh';
  if (saved.explanation === 'zh') preferences.explanation = 'zh';
  if (allowedRates.includes(saved.rate)) preferences.rate = saved.rate;
  preferences.analytics = saved.analytics === true;
} catch { /* Storage can be unavailable in private browsers. */ }

const labels = {
  'nav a[href="#learn"]': ['Learn','课程'],
  'nav a[href="#practice"]': ['Practice','练习'],
  'nav a[href="#conversation-panel"]': ['Conversation','对话'],
  'nav a[href="#games"]': ['Games','游戏'],
  '#settings': ['Settings','设置'],
  'label[for="lesson-select"]': ['Sample lesson','示例课'],
  'label[for="answer"]': ['Your reply','你的回答'],
  '#send': ['Send','发送'],
  '#game-reset': ['Play again','再玩一次'],
  '#preferences h2': ['Settings','设置'],
  '#open-api': ['API settings','API 设置'],
};
function translate() {
  document.documentElement.lang = preferences.language === 'zh' ? 'zh-CN' : 'en';
  for (const [selector, options] of Object.entries(labels)) {
    document.querySelector(selector).textContent = options[Number(preferences.language === 'zh')];
  }
}

let analytics;
let firebaseConfig;
async function syncAnalytics() {
  if (analytics) {
    analytics.sdk.setAnalyticsCollectionEnabled(analytics.instance, preferences.analytics);
    return;
  }
  if (!preferences.analytics || !firebaseConfig) return;
  const base = 'https://www.gstatic.com/firebasejs/13.4.0/';
  const [app, sdk] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-analytics.js')]);
  if (!await sdk.isSupported()) return;
  if (analytics || !preferences.analytics) return;
  analytics = { sdk, instance: sdk.getAnalytics(app.initializeApp(firebaseConfig)) };
}
export function track(event) {
  if (preferences.analytics && analytics) analytics.sdk.logEvent(analytics.instance, event);
}
export function bindPreferences() {
  const byId = id => document.getElementById(id);
  for (const [id, field] of Object.entries({
    'interface-language': 'language', 'explanation-language': 'explanation',
    'speech-rate': 'rate', 'analytics-consent': 'analytics',
  })) {
    const input = byId(id);
    if (field === 'analytics') input.checked = preferences.analytics;
    else input.value = preferences[field];
    input.onchange = () => {
      preferences[field] = field === 'analytics' ? input.checked : field === 'rate' ? Number(input.value) : input.value;
      try { localStorage.setItem(key, JSON.stringify(preferences)); } catch { /* Keep preferences for this tab. */ }
      translate();
      syncAnalytics().catch(() => {});
    };
  }
  translate();
  fetch('/public-config.json').then(response => response.json()).then(config => {
    for (const [id, url] of [['subscribe-link',config.paymentLink],['portal-link',config.portalLink]]) {
      if (!url) continue;
      byId(id).href = url;
      byId(id).hidden = false;
      byId('subscription').hidden = false;
    }
    firebaseConfig = config.firebase;
    byId('analytics-setting').hidden = !firebaseConfig;
    return syncAnalytics();
  }).catch(() => {});
}
