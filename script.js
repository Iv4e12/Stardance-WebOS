function runClock() {
    const clockDisplay = document.getElementById('clock');
    const currentTime = new Date();
    const hrs = String(currentTime.getHours()).padStart(2, '0');
    const mins = String(currentTime.getMinutes()).padStart(2, '0');
    const secs = String(currentTime.getSeconds()).padStart(2, '0');
    clockDisplay.textContent = hrs + ':' + mins + ':' + secs;
}
runClock();
setInterval(runClock, 1000);

let topLayerIndex = 10;
let positionOffset = 0;

function createNewWindow(titleText, innerHTMLContent, setupCallback) {
    const desktop = document.getElementById('desktop');
    const template = document.getElementById('window-template');
    const windowClone = template.content.cloneNode(true);
    const boxElement = windowClone.querySelector('.box');
    const headerElement = windowClone.querySelector('.box-header');
    const titleElement = windowClone.querySelector('.box-title');
    const closeButton = windowClone.querySelector('.close');
    const bodyElement = windowClone.querySelector('.box-body');

    titleElement.textContent = titleText;
    bodyElement.innerHTML = innerHTMLContent;
    boxElement.style.top = (100 + positionOffset) + 'px';
    boxElement.style.left = (150 + positionOffset) + 'px';
    positionOffset = (positionOffset + 30) % 180;

    topLayerIndex++;
    boxElement.style.zIndex = topLayerIndex;

    let activeDrag = false;
    let clickX, clickY;

    headerElement.addEventListener('mousedown', function(event) {
        activeDrag = true;
        clickX = event.clientX - boxElement.offsetLeft;
        clickY = event.clientY - boxElement.offsetTop;
        topLayerIndex++;
        boxElement.style.zIndex = topLayerIndex;
    });

    document.addEventListener('mousemove', function(event) {
        if (!activeDrag) return;
        boxElement.style.left = (event.clientX - clickX) + 'px';
        boxElement.style.top = (event.clientY - clickY) + 'px';
    });

    document.addEventListener('mouseup', function() { activeDrag = false; });
    closeButton.addEventListener('click', function() { boxElement.remove(); });

    desktop.appendChild(windowClone);
    if (setupCallback) { setupCallback(boxElement); }
}

function initTerminalLogic(windowElement) {
    const inputField = windowElement.querySelector('.term-input');
    const outputArea = windowElement.querySelector('.term-output');

    inputField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const originalInput = inputField.value;
            const command = originalInput.trim().toLowerCase();
            let response = '';

            if (command === 'exit') {
                windowElement.remove();
                return;
            } else if (command.startsWith('sudo')) {
                response = "You don't have access to root here, but nice try ;3";
            } else if (command === 'neofetch') {
                response = 'OS: Stardance Linux Workspace\nKernel: HackClub-v1.0\nShell: JS-WebOS\nWM: Custom Drag Factory';
            } else if (command === 'help') {
                response = 'Available commands: help, clear, neofetch, exit, sudo';
            } else if (command === 'clear') {
                outputArea.textContent = '';
                inputField.value = '';
                return;
            } else if (command !== '') {
                response = `bash: command not found: ${command}`;
            }

            outputArea.textContent += `guest@stardance:~$ ${originalInput}\n${response}\n\n`;
            inputField.value = '';
            outputArea.scrollTop = outputArea.scrollHeight;
        }
    });
}

const startButton = document.querySelector('.start-btn');
const startMenu = document.getElementById('start-menu');

startButton.addEventListener('click', function(e) {
    e.stopPropagation();
    startMenu.style.display = startMenu.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', () => { startMenu.style.display = 'none'; });

document.getElementById('menu-open-about').addEventListener('click', () => {
    createNewWindow('System Profile', `<h3>Workspace v1.0</h3><p>Built for the Stardance challenge.</p>`);
});

document.getElementById('menu-open-notes').addEventListener('click', () => {
    createNewWindow('Scratchpad', `<textarea placeholder="Write notes..."></textarea>`);
});

document.getElementById('menu-open-term').addEventListener('click', () => {
    createNewWindow('Terminal Instance', `
    <div class="term-container">
    <div class="term-output">Welcome to the Stardance shell.\nType "help" to start.\n\n</div>
    <div class="term-input-line">
    <span class="term-prompt">guest@stardance:~$</span>
    <input type="text" class="term-input" autofocus>
    </div>
    </div>`, initTerminalLogic);
});
