import {Bot} from 'https://bundle.deno.dev/https://raw.githubusercontent.com/grammyjs/grammY/v1.34.1/src/mod.ts';

const valueElement = document.getElementById('value');
const infoElement = document.getElementById('info');
const fileElement = document.getElementById('file');
const testButton = document.getElementById('test');

let serviceWorkerRegistration, telegram, intervalId;

Promise.all([
    Notification.requestPermission(),
    navigator.serviceWorker.register('worker.js')
]).then(function ([permission, r]) {
    serviceWorkerRegistration = r;

    if (permission !== 'granted') {
        return;
    }

    const item = localStorage.getItem('configuration');

    if (item) {
        start(JSON.parse(item));
    }

    fileElement.addEventListener('change', function (event) {
        const reader = new FileReader();

        reader.onload = function (e) {
            start(JSON.parse(e.target.result));

            localStorage.setItem('configuration', e.target.result);
        };

        reader.readAsText(event.target.files[0]);
    }, false);

    fileElement.disabled = false;

    testButton.addEventListener('click', () => notify('Test!'));

    testButton.disabled = false;
});

function notify(message) {
    if (telegram?.bot) {
        telegram.bot.api.sendMessage(telegram.userId, message);
    }

    serviceWorkerRegistration.showNotification(message);
}

function start(configuration) {
    const {url, value, delay, ...channels} = configuration;

    telegram = channels.telegram;

    if (telegram) {
        telegram.bot = new Bot(telegram.token)
    }

    let counter = 0;

    function f() {
        fetch(url).then(r => r.text()).then(text => {
            const time = new Date().toLocaleTimeString();
            const info = `Response ${++counter} received at ${time}`;

            valueElement.textContent = text;
            infoElement.textContent = info;

            if (value !== text) {
                return notify('New response returned!');
            }

            if (counter % 800 === 0) {
                return notify('Test!');
            }
        });
    }

    f();

    clearInterval(intervalId);

    intervalId = setInterval(f, delay);
}
