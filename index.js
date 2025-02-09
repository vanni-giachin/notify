import {Bot} from 'https://bundle.deno.dev/https://raw.githubusercontent.com/grammyjs/grammY/v1.34.1/src/mod.ts';

const valueElement = document.getElementById('value');
const infoElement = document.getElementById('info');
const fileElement = document.getElementById('file');
const testButton = document.getElementById('test');

let serviceWorkerRegistration, telegram, counter = 0;

Promise.all([
    navigator.serviceWorker.register('worker.js'),
    Notification.requestPermission()
]).then(function ([r]) {
    serviceWorkerRegistration = r;
    testButton.addEventListener('click', () => notify('Test!'));
    fileElement.addEventListener('change', start, false);
});

function start(event) {
    const reader = new FileReader();
    reader.onload = function (loadEvent) {
        const {url, value, delay, ...channels} = JSON.parse(loadEvent.target.result);
        ({telegram} = channels);
        telegram.bot = new Bot(telegram.token);
        startInterval(url, value, delay);
    };
    reader.readAsText(event.target.files[0]);
}

function notify(message) {
    if (telegram) {
        telegram.bot.api.sendMessage(telegram.userId, message);
    }
    serviceWorkerRegistration.showNotification(message);
}

const startInterval = (url, value, delay) => setInterval((function f() {
    fetch(url).then(r => r.text()).then(text => {
        const time = new Date().toLocaleTimeString();
        const info = `Response ${++counter} received at ${time}`;
        valueElement.textContent = text;
        infoElement.textContent = info;

        if (text !== value) {
            return notify('New response returned!');
        }
        if (counter % 1000 === 0) {
            return notify('Test!');
        }
    });
    return f;
})(), Math.max(1000, delay));
