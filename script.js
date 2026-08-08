document.addEventListener('DOMContentLoaded', function() {
    function updateClocks() {
        const currentTime = new Date();
        const hrs = String(currentTime.getHours()).padStart(2, '0');
        const mins = String(currentTime.getMinutes()).padStart(2, '0');
        const secs = String(currentTime.getSeconds()).padStart(2, '0');
        const timeString = hrs + ':' + mins + ':' + secs;

        document.getElementById('clock').textContent = timeString;
        document.getElementById('lockscreen-clock').textContent = timeString;
    }
    updateClocks();
    setInterval(updateClocks, 1000);

    document.getElementById('unlock-btn').addEventListener('click', function() {
        document.getElementById('lockscreen').classList.add('hidden');
    });

    let topLayerIndex = 10;
    let positionOffset = 0;
    let windowCounter = 0;
    const activeWindowsMap = new Map();

    function updateTaskManagerUI() {
        const listContainers = document.querySelectorAll('.task-list-container');
        listContainers.forEach(container => {
            container.innerHTML = '';
            if (activeWindowsMap.size === 0) {
                container.innerHTML = '<div style="color:var(--text-muted)">No active processes.</div>';
                return;
            }
            activeWindowsMap.forEach((winObj, id) => {
                const item = document.createElement('div');
                item.className = 'task-list-item';
                item.innerHTML = '<span>' + winObj.title + ' (PID: ' + id.split('-') + ')</span><button class="kill-btn" data-id="' + id + '">KILL</button>';
                item.querySelector('.kill-btn').addEventListener('click', function() {
                    winObj.element.remove();
                    const tab = document.getElementById('tab-' + id);
                    if (tab) tab.remove();
                    activeWindowsMap.delete(id);
                    updateTaskManagerUI();
                });
                container.appendChild(item);
            });
        });
    }

    function createNewWindow(titleText, innerHTMLContent, setupCallback) {
        const desktop = document.getElementById('desktop');
        const template = document.getElementById('window-template');
        const runningApps = document.getElementById('running-apps');

        const windowClone = template.content.cloneNode(true);
        const boxElement = windowClone.querySelector('.box');
        const headerElement = windowClone.querySelector('.box-header');
        const titleElement = windowClone.querySelector('.box-title');
        const minimizeButton = windowClone.querySelector('.minimize');
        const closeButton = windowClone.querySelector('.close');
        const bodyElement = windowClone.querySelector('.box-body');

        windowCounter++;
        const winId = 'win-' + windowCounter;
        boxElement.id = winId;

        titleElement.textContent = titleText;
        bodyElement.innerHTML = innerHTMLContent;
        boxElement.style.top = (100 + positionOffset) + 'px';
        boxElement.style.left = (150 + positionOffset) + 'px';
        positionOffset = (positionOffset + 30) % 180;

        topLayerIndex++;
        boxElement.style.zIndex = topLayerIndex;

        activeWindowsMap.set(winId, { title: titleText, element: boxElement });

        const tabButton = document.createElement('button');
        tabButton.className = 'taskbar-tab active-tab';
        tabButton.id = 'tab-' + winId;
        tabButton.textContent = titleText;
        runningApps.appendChild(tabButton);

        function focusWindow() {
            document.querySelectorAll('.taskbar-tab').forEach(t => t.classList.remove('active-tab'));
            tabButton.classList.add('active-tab');
            if (boxElement.classList.contains('minimized')) {
                boxElement.classList.remove('minimized');
            }
            topLayerIndex++;
            boxElement.style.zIndex = topLayerIndex;
        }

        tabButton.addEventListener('click', function() {
            if (!boxElement.classList.contains('minimized') && boxElement.style.zIndex == topLayerIndex) {
                boxElement.classList.add('minimized');
                tabButton.classList.remove('active-tab');
            } else {
                focusWindow();
            }
        });

        boxElement.addEventListener('mousedown', focusWindow);

        let activeDrag = false;
        let clickX, clickY;

        headerElement.addEventListener('mousedown', function(event) {
            activeDrag = true;
            clickX = event.clientX - boxElement.offsetLeft;
            clickY = event.clientY - boxElement.offsetTop;
            focusWindow();
        });

        document.addEventListener('mousemove', function(event) {
            if (!activeDrag) return;
            boxElement.style.left = (event.clientX - clickX) + 'px';
            boxElement.style.top = (event.clientY - clickY) + 'px';
        });

        document.addEventListener('mouseup', function() { activeDrag = false; });

        minimizeButton.addEventListener('click', function(e) {
            e.stopPropagation();
            boxElement.classList.add('minimized');
            tabButton.classList.remove('active-tab');
        });

        closeButton.addEventListener('click', function(e) {
            e.stopPropagation();
            boxElement.remove();
            tabButton.remove();
            activeWindowsMap.delete(winId);
            updateTaskManagerUI();
        });

        desktop.appendChild(windowClone);
        if (setupCallback) { setupCallback(boxElement); }

        focusWindow();
        updateTaskManagerUI();
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
                    const winId = windowElement.id;
                    windowElement.remove();
                    document.getElementById('tab-' + winId).remove();
                    activeWindowsMap.delete(winId);
                    updateTaskManagerUI();
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
                    response = 'bash: command not found: ' + command;
                }

                outputArea.textContent += 'guest@stardance:~$ ' + originalInput + '\n' + response + '\n\n';
                inputField.value = '';
                outputArea.scrollTop = outputArea.scrollHeight;
            }
        });
    }

    function initCalcLogic(windowElement) {
        const screen = windowElement.querySelector('.calc-screen');
        const buttons = windowElement.querySelectorAll('.calc-btn');
        let expr = '';

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.textContent;
                if (val === 'C') {
                    expr = '';
                    screen.value = '';
                } else if (val === '=') {
                    try {
                        if (expr !== '') {
                            let safeExpr = expr.replace(/x/g, '*');
                            let result = Function('"use strict";return (' + safeExpr + ')')();
                            screen.value = result;
                            expr = String(result);
                        }
                    } catch (err) {
                        screen.value = 'ERROR';
                        expr = '';
                    }
                } else {
                    expr += val;
                    screen.value = expr;
                }
            });
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
        createNewWindow('Profile', '<h3>Workspace v1.0</h3><p>Built for the Stardance challenge.</p>');
    });

    document.getElementById('menu-open-notes').addEventListener('click', () => {
        createNewWindow('Scratchpad', '<textarea placeholder="Write notes..."></textarea>');
    });

    document.getElementById('menu-open-calc').addEventListener('click', () => {
        createNewWindow('Calculator', '<input type="text" class="calc-screen" readonly><div class="calc-grid"><button class="calc-btn op">C</button><button class="calc-btn op">(</button><button class="calc-btn op">)</button><button class="calc-btn op">/</button><button class="calc-btn">7</button><button class="calc-btn">8</button><button class="calc-btn">9</button><button class="calc-btn op">x</button><button class="calc-btn">4</button><button class="calc-btn">5</button><button class="calc-btn">6</button><button class="calc-btn op">-</button><button class="calc-btn">1</button><button class="calc-btn">2</button><button class="calc-btn">3</button><button class="calc-btn op">+</button><button class="calc-btn">0</button><button class="calc-btn">.</button><button class="calc-btn op" style="grid-column: span 2;">=</button></div>', initCalcLogic);
    });

    document.getElementById('menu-open-term').addEventListener('click', () => {
        createNewWindow('Terminal', '<div class="term-container"><div class="term-output">Welcome to the Stardance shell.\nType "help" to start.\n\n</div><div class="term-input-line"><span class="term-prompt">guest@stardance:~$</span><input type="text" class="term-input" autofocus></div></div>', initTerminalLogic);
    });

    document.getElementById('menu-open-tasks').addEventListener('click', () => {
        createNewWindow('Task Manager', '<h3 style="margin-bottom:12px;">Active Running Processes</h3><div class="task-list-container"></div>', function(winEl) {
            updateTaskManagerUI();
        });
    });
    });
