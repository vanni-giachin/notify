const valueElement = document.getElementById('value');
const infoElement = document.getElementById('info');
const inputElement = document.getElementById('input');
const testButton = document.getElementById('test');

inputElement.addEventListener('change', function (e) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const {url, value, delay} = JSON.parse(e.target.result);
        console.log(url, value, delay);
        startInterval(url, value, delay);
    };
    const file = e.target.files?.[0];
    file && reader.readAsText(file);
}, false);

testButton.addEventListener('click', () => notify('Test!'));

let serviceWorkerRegistration, counter = 0;

Promise.all([
    navigator.serviceWorker.register('worker.js'),
    Notification.requestPermission()
]).then(([r]) => serviceWorkerRegistration = r);

const notify = (message) => serviceWorkerRegistration.showNotification(message);

const startInterval = (url, value, delay) => setInterval((function f() {
    fetch(url).then(r => r.text()).then(text => {
        const time = new Date().toLocaleTimeString();
        const info = `Response ${++counter} received at ${time}`;
        valueElement.textContent = text;
        infoElement.textContent = info;

        if (text !== value) {
            return notify('New response returned!');
        }
        if (counter % 100 === 0) {
            return notify('Test!');
        }
    });
    return f;
})(), Math.max(1000, delay));
