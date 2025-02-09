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
    const {url, value, delay, thresholds, ...channels} = configuration;

    telegram = channels.telegram;

    if (telegram) {
        telegram.bot = new Bot(telegram.token)
    }

    const {error: errorThreshold, test: testThreshold} = thresholds || {};

    let successCounter = 0, errorCounter = 0;

    function fetchAndCompare() {
        fetch(url).then(r => r.text()).then(text => {
            errorCounter = 0;

            valueElement.textContent = text;
            infoElement.textContent = `Response ${++successCounter} received at ${getTimestamp()}`;

            if (value !== text) {
                return notify('New response returned!');
            }

            if (successCounter % testThreshold === 0) {
                return notify('Test!');
            }
        }).catch(e => {
            if (++errorCounter === errorThreshold) {
                notify('Error!');
            }

            throw e;
        });
    }

    function getTimestamp() {
        return new Date().toLocaleTimeString();
    }

    fetchAndCompare();

    clearInterval(intervalId);

    intervalId = setInterval(fetchAndCompare, delay);
}
