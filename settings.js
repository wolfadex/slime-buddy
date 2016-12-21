const { ipcRenderer } = require('electron');
// const optionsButton = document.getElementById('optionsButton');
const infoButton = document.getElementById('infoButton');
const creditsButton = document.getElementById('creditsButton');
const closeButton = document.getElementById('closeButton');
// const options = document.getElementById('options');
const info = document.getElementById('info');
const credits = document.getElementById('credits');

// optionsButton.addEventListener('click', () => {
//     optionsButton.classList.add('focus');
//     infoButton.classList.remove('focus');
//     creditsButton.classList.remove('focus');
//     options.classList.remove('hidden');
//     info.classList.add('hidden');
//     credits.classList.add('hidden');
// });
infoButton.addEventListener('click', () => {
    // optionsButton.classList.remove('focus');
    infoButton.classList.add('focus');
    creditsButton.classList.remove('focus');
    // options.classList.add('hidden');
    info.classList.remove('hidden');
    credits.classList.add('hidden');
});
creditsButton.addEventListener('click', () => {
    // optionsButton.classList.remove('focus');
    infoButton.classList.remove('focus');
    creditsButton.classList.add('focus');
    // options.classList.add('hidden');
    info.classList.add('hidden');
    credits.classList.remove('hidden');
});
closeButton.addEventListener('click', () => {
    ipcRenderer.send('hideSettings');
});
