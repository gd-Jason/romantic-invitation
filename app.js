const panels = [...document.querySelectorAll('[data-step]')];
const state = { date: '', time: '', food: '' };
const declineLines = ['再想一秒，也许答案就是心动。', '这封信只接受“我愿意”哦。', '晚风说，它很期待见到你。', '偷偷告诉你：答应会有惊喜。'];
let declineIndex = 0;
let declineScale = 1;
let acceptScale = 1;
let countdownTimer;
let secretClicks = 0;
let secretClickTimer;

const dateInput = document.querySelector('#date');
dateInput.min = new Date().toISOString().slice(0, 10);

const timeSelect = document.querySelector('#time');
for (let hour = 10; hour <= 21; hour += 1) {
  for (const minute of ['00', '30']) {
    if (hour === 21 && minute === '30') continue;
    const value = `${String(hour).padStart(2, '0')}:${minute}`;
    timeSelect.add(new Option(value, value));
  }
}

function show(step) {
  panels.forEach(panel => {
    const active = panel.dataset.step === step;
    panel.classList.toggle('active', active);
    panel.setAttribute('aria-hidden', String(!active));
  });
  if (step === 'final') {
    celebrate();
    startCountdown();
  }
}

function startCountdown() {
  clearInterval(countdownTimer);
  const target = new Date(`${state.date}T${state.time}:00`);
  const numbers = document.querySelector('#countdownNumbers');
  const reached = document.querySelector('#countdownReached');
  const render = () => {
    const remaining = target.getTime() - Date.now();
    if (remaining <= 0) {
      numbers.hidden = true;
      reached.hidden = false;
      clearInterval(countdownTimer);
      return;
    }
    numbers.hidden = false;
    reached.hidden = true;
    const totalSeconds = Math.floor(remaining / 1000);
    document.querySelector('#countDays').textContent = String(Math.floor(totalSeconds / 86400)).padStart(2, '0');
    document.querySelector('#countHours').textContent = String(Math.floor(totalSeconds % 86400 / 3600)).padStart(2, '0');
    document.querySelector('#countMinutes').textContent = String(Math.floor(totalSeconds % 3600 / 60)).padStart(2, '0');
    document.querySelector('#countSeconds').textContent = String(totalSeconds % 60).padStart(2, '0');
  };
  render();
  countdownTimer = setInterval(render, 1000);
}

function createPetals() {
  const petals = document.querySelector('#petals');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 18; i += 1) {
    const petal = document.createElement('i');
    petal.style.setProperty('--x', `${Math.random() * 100}vw`);
    petal.style.setProperty('--delay', `${Math.random() * -14}s`);
    petal.style.setProperty('--duration', `${10 + Math.random() * 9}s`);
    petal.style.setProperty('--drift', `${Math.random() * 160 - 80}px`);
    petals.append(petal);
  }
}

function celebrate() {
  const box = document.querySelector('#sparkles');
  box.replaceChildren();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 30; i += 1) {
    const star = document.createElement('i');
    star.textContent = i % 4 ? '✦' : '♥';
    star.style.setProperty('--angle', `${(360 / 30) * i}deg`);
    star.style.setProperty('--distance', `${90 + Math.random() * 170}px`);
    star.style.setProperty('--delay', `${Math.random() * .4}s`);
    box.append(star);
  }
}

document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'open') show('invite');
  if (action === 'accept') show('surprise');
  if (action === 'surprise-confirm') show('schedule');
  if (action === 'decline') {
    const declineButton = event.target.closest('[data-action="decline"]');
    const acceptButton = document.querySelector('[data-action="accept"]');
    document.querySelector('#declineNote').textContent = declineLines[declineIndex % declineLines.length];
    declineIndex += 1;
    declineScale = Math.max(.38, declineScale - .12);
    acceptScale = Math.min(2.05, acceptScale + .14);
    declineButton.style.setProperty('--button-scale', declineScale);
    acceptButton.style.setProperty('--button-scale', acceptScale);
    declineButton.classList.add('shake');
    setTimeout(() => declineButton.classList.remove('shake'), 450);
  }
  if (action === 'close-secret') closeSecretMessage();
  if (action === 'restart') {
    clearInterval(countdownTimer);
    Object.assign(state, { date: '', time: '', food: '' });
    declineIndex = 0;
    declineScale = 1;
    acceptScale = 1;
    document.querySelector('[data-action="decline"]').style.removeProperty('--button-scale');
    document.querySelector('[data-action="accept"]').style.removeProperty('--button-scale');
    document.querySelector('#declineNote').textContent = '';
    document.querySelector('#customFood').value = '';
    document.querySelectorAll('[data-food]').forEach(item => item.classList.remove('selected'));
    updateFoodConfirmation();
    document.querySelectorAll('.schedule-field').forEach(field => field.classList.remove('invalid'));
    closeSecretMessage();
    secretClicks = 0;
    document.querySelector('#scheduleForm').reset();
    show('envelope');
  }
});

function closeSecretMessage() {
  const message = document.querySelector('#secretMessage');
  message.classList.remove('revealed');
  message.setAttribute('aria-hidden', 'true');
  document.querySelector('.finale').classList.remove('secret-open');
  secretClicks = 0;
}

document.querySelector('#secretHeart').addEventListener('click', event => {
  secretClicks += 1;
  clearTimeout(secretClickTimer);
  event.currentTarget.classList.remove('secret-tap');
  void event.currentTarget.offsetWidth;
  event.currentTarget.classList.add('secret-tap');
  if (secretClicks >= 3) {
    secretClicks = 0;
    const message = document.querySelector('#secretMessage');
    message.classList.add('revealed');
    message.setAttribute('aria-hidden', 'false');
    document.querySelector('.finale').classList.add('secret-open');
    celebrate();
    return;
  }
  secretClickTimer = setTimeout(() => { secretClicks = 0; }, 1300);
});

document.querySelector('#scheduleForm').addEventListener('submit', event => {
  event.preventDefault();
  const missingDate = !dateInput.value;
  const missingTime = !timeSelect.value;
  if (missingDate) showFieldNudge(document.querySelector('.date-field'));
  if (missingTime) showFieldNudge(document.querySelector('.time-field'));
  if (missingDate || missingTime) return;
  state.date = dateInput.value;
  state.time = timeSelect.value;
  show('food');
});

function showFieldNudge(field) {
  field.classList.remove('invalid');
  void field.offsetWidth;
  field.classList.add('invalid');
  clearTimeout(field.nudgeTimer);
  field.nudgeTimer = setTimeout(() => field.classList.remove('invalid'), 2200);
}

dateInput.addEventListener('change', () => document.querySelector('.date-field').classList.remove('invalid'));
timeSelect.addEventListener('change', () => document.querySelector('.time-field').classList.remove('invalid'));

document.querySelector('#foodGrid').addEventListener('click', event => {
  const choice = event.target.closest('[data-food]');
  if (!choice) return;
  state.food = choice.dataset.food;
  document.querySelectorAll('[data-food]').forEach(item => item.classList.toggle('selected', item === choice));
  document.querySelector('#customFood').value = '';
  updateFoodConfirmation();
});

document.querySelector('#customFood').addEventListener('input', event => {
  const value = event.target.value.trim();
  if (value) {
    state.food = value;
    document.querySelectorAll('[data-food]').forEach(item => item.classList.remove('selected'));
  } else {
    state.food = '';
  }
  updateFoodConfirmation();
});

function updateFoodConfirmation() {
  const button = document.querySelector('#confirmFood');
  button.disabled = !state.food;
  button.textContent = state.food ? `就选「${state.food}」` : '请选择或填写';
}

document.querySelector('#confirmFood').addEventListener('click', () => {
  if (!state.food) return;
  const date = new Date(`${state.date}T00:00:00`);
  document.querySelector('#finalDate').textContent = `${date.getMonth() + 1}月${date.getDate()}日`;
  document.querySelector('#finalTime').textContent = state.time;
  document.querySelector('#finalFood').textContent = state.food;
  setTimeout(() => show('final'), 280);
});

createPetals();
