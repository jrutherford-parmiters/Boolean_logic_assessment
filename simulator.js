/* LOGIC GATE SIMULATOR ENGINE (COMPLETE) */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
let gates = [];
let connections = [];
let connectingFrom = null;
let gateIdCounter = 0;
let currentTool = 'select';
let mouseX = 0, mouseY = 0;
let showTruthTable = false;
let isSandboxMode = false;

const simulations = [
    { name: "Motherboard LED", off: "vids/010Led.mp4", on: "vids/011Led.mp4" },
    { name: "PC Case Fan", off: "vids/030Fan.mp4", on: "vids/031Fan.mp4" },
    { name: "Lawn Sprinkler", off: "vids/020Sprinkler.mp4", on: "vids/021Sprinkler.mp4" },
    { name: "Security Light", off: "vids/040Security.mp4", on: "vids/041Security.mp4" }
];

// Modal State
let activeConfigGateId = null;

// --- NEW GAMIFICATION STATE ---
let starScores = {}; // Stores max stars achieved per task ID: {0: 3, 1: 2}
let currentTaskStars = 3; 

// --- AUDIO ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, duration, vol, fade = true) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    if (fade) gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}
function soundSuccess() { playTone(523.25, 'sine', 0.2, 0.1); setTimeout(() => playTone(659.25, 'sine', 0.4, 0.1), 100); }
function soundError() { playTone(110, 'triangle', 0.3, 0.1); }
function soundTaskComplete() {
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        setTimeout(() => playTone(f, 'sine', 0.8, 0.05), i * 120);
    });
}
function playPopSound() { playTone(880, 'sine', 0.1, 0.1, false); }

// --- PERSISTENCE ---
function saveCircuit() {
    const data = {
        gates: gates.map(g => ({ 
            id: g.id, type: g.type, x: g.x, y: g.y, value: g.value,
            thresholdValue: g.thresholdValue, operator: g.operator, currentDataValue: g.currentDataValue 
        })),
        connections: connections.map(c => ({ fromId: c.from.id, toId: c.to.id, toIndex: c.toIndex })),
        labels: Array.from(document.querySelectorAll('.text-label')).map(l => ({ text: l.innerText, x: l.style.left, y: l.style.top }))
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'logic_circuit.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

function loadCircuit() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => { loadCircuitFromData(JSON.parse(event.target.result)); };
        reader.readAsText(file);
    };
    input.click();
}



function loadCircuitFromData(data, isInteractive = true) {
    // 1. Reset state
    clearCanvas();
    gateIdCounter = 0; 
    connections = []; 

    // 2. Create Gates
    data.gates.forEach(g => {
        createGate(g.type, g.x, g.y, true); 
        const newGate = gates[gates.length - 1];
        newGate.id = g.id; 
        newGate.value = g.value || 0;
        newGate.thresholdValue = g.thresholdValue !== undefined ? g.thresholdValue : 50;
        newGate.operator = g.operator || '>';
        newGate.currentDataValue = g.currentDataValue || 0;

        const btn = newGate.element.querySelector('.toggle-btn');
        if (btn) {
            if (g.type === 'INPUT') {
                btn.textContent = newGate.value; 
                btn.style.background = newGate.value === 1 ? '#4ecca3' : '#0f3460';
            }
            btn.style.pointerEvents = isInteractive ? 'auto' : 'none';
            btn.style.opacity = isInteractive ? '1' : '0.7';
        }

        // Keep comparator input always interactive AND fix the event handler
        const compInput = newGate.element.querySelector('.gate-data-input');
        if (compInput) {
            compInput.style.pointerEvents = 'auto';
            compInput.style.opacity = '1';
            // Set the initial value from loaded data
            compInput.value = newGate.currentDataValue || 0;
            // Fix the oninput handler to use the correct gate ID
            compInput.oninput = function() {
                updateComparatorInputValue(newGate.id, this.value);
            };
        }

        // Update comparator SVG element IDs and label to match loaded data
        if (g.type === 'COMPARATOR') {
            // Find the SVG elements with the OLD ID (from gateIdCounter before reassignment)
            const oldId = gates.length - 1; // This was the gateIdCounter value used
            const actualOldId = gateIdCounter - 1; // The actual ID used when createGate ran
            
            // Find elements by looking for comp-label and comp-path in this gate's element
            const label = newGate.element.querySelector('[id^="comp-label-"]');
            const path = newGate.element.querySelector('[id^="comp-path-"]');
            
            if (label) {
                label.id = `comp-label-${newGate.id}`;
                label.textContent = `${newGate.operator} ${newGate.thresholdValue}`;
            }
            if (path) {
                path.id = `comp-path-${newGate.id}`;
            }
        }

        // Update OUTPUT button ID to match loaded data
        if (g.type === 'OUTPUT') {
            const outputBtn = newGate.element.querySelector('[id^="output-"]');
            if (outputBtn) {
                outputBtn.id = `output-${newGate.id}`;
            }
        }
    });
    // 3. Rebuild Labels
    if (data.labels) {
        data.labels.forEach(l => {
            const labelDiv = document.createElement('div'); 
            labelDiv.className = 'text-label'; 
            
            // Handle coordinates (whether they are numbers or "px" strings)
            labelDiv.style.left = typeof l.x === 'number' ? l.x + 'px' : l.x; 
            labelDiv.style.top = typeof l.y === 'number' ? l.y + 'px' : l.y; 
            
            labelDiv.contentEditable = true; 
            labelDiv.innerText = l.text;
            
            container.appendChild(labelDiv); 
            // Register it with the drag system
            makeDraggable(labelDiv, { element: labelDiv, type: 'TEXT' }); 
        });
    }

    // 4. Rebuild Connections
    if (data.connections) {
        data.connections.forEach(c => {
            const fromGate = gates.find(g => g.id === c.fromId);
            const toGate = gates.find(g => g.id === c.toId);
            if (fromGate && toGate) {
                connections.push({ from: fromGate, to: toGate, toIndex: c.toIndex });
            }
        });
    }

    resizeCanvas(); 

    // 6. THE DELAYED DRAW
    setTimeout(() => {
        evaluateCircuit(); // Use full evaluation for investigate tasks
        updateLiveTruthTable();
        draw(); 
    }, 50);
    
    // Additional evaluation passes to ensure comparators display correctly
    setTimeout(() => {
        evaluateCircuit();
        draw();
    }, 150);
    
    setTimeout(() => {
        evaluateCircuit();
        draw();
    }, 300);
}


function toggleSimModal() {
    const modal = document.getElementById('sim-modal');
    const btn = document.getElementById('sim-toggle-btn');
    const isShowing = modal.style.display !== 'none';
    
    modal.style.display = isShowing ? 'none' : 'block';
    btn.classList.toggle('active', !isShowing);

    if (!isShowing) {
        initSimulations();
        updateSimulationVideo();
    }
}

function initSimulations() {
    const select = document.getElementById('sim-selector');
    if (select.options.length > 0) return; // Prevent duplicate population

    simulations.forEach((sim, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = sim.name;
        select.appendChild(opt);
    });
    const modalElement = document.getElementById('sim-modal');
    const modalContent = modalElement.querySelector('.modal-content');
    makeDraggableModal(modalContent);
}

function updateSimulationVideo() {
    const modal = document.getElementById('sim-modal');
    if (!modal || modal.style.display === 'none') return;

    const select = document.getElementById('sim-selector');
    const sim = simulations[select.value];
    const video = document.getElementById('sim-video-player');

    // Logic: Look for the first OUTPUT node in the gates array
    const outputGate = gates.find(g => g.type === 'OUTPUT');
    const isOutputOn = outputGate ? outputGate.output === 1 : false;

    const targetSrc = isOutputOn ? sim.on : sim.off;

    // Only update if the source has changed to prevent video stuttering
    if (video.getAttribute('src') !== targetSrc) {
        video.src = targetSrc;
        video.play().catch(e => console.log("Video play interrupted or blocked."));
    }
}


// --- UI MODES ---
function toggleSandboxMode() {
    isSandboxMode = !isSandboxMode;
    const sidebar = document.getElementById('task-sidebar');
    const toggleBtn = document.getElementById('sandbox-toggle');
    const tableBtn = document.getElementById('table-toggle-btn');

    if (isSandboxMode) {
        sidebar.style.display = 'none'; // Hide task list
        toggleBtn.classList.add('active'); 
        toggleBtn.style.color = '#f39c12';
        if (tableBtn) tableBtn.style.display = 'block'; 
    } else {
        sidebar.style.display = 'flex'; // FIXED: Restore the sidebar
        toggleBtn.classList.remove('active'); 
        toggleBtn.style.color = '';
        if (tableBtn) tableBtn.style.display = 'none';
        
        // Hide truth table if it was open in sandbox
        if (showTruthTable) toggleTruthTable(); 
    }
    setTimeout(resizeCanvas, 10); 
}

function toggleTruthTable() {
    showTruthTable = !showTruthTable;
    const tableDiv = document.getElementById('truth-table');
    const tableBtn = document.getElementById('table-toggle-btn');
    tableDiv.style.display = showTruthTable ? 'block' : 'none';
    if (showTruthTable) { 
        tableBtn.classList.add('active'); 
        tableBtn.style.color = '#4ecca3'; 
        generateTruthTable(); 
    }
    else { 
        tableBtn.classList.remove('active'); 
        tableBtn.style.color = ''; 
    }
}

// --- TASK & MODAL MANAGEMENT ---
let currentStepIndex = 0;
let currentActiveTask = null;
let completedTaskIds = new Set();

function showFeedbackModal(type, title, message, btnText, callback) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const modal = document.getElementById('custom-modal');
    const iconEl = document.getElementById('modal-icon');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const btnEl = document.getElementById('modal-btn');
    if (type === 'success') { iconEl.innerText = '😊'; soundSuccess(); } 
    else if (type === 'error') { iconEl.innerText = '😟'; soundError(); if (currentTaskStars > 1) currentTaskStars--; } 
    titleEl.innerText = title; msgEl.innerText = message; btnEl.innerText = btnText;
    btnEl.onclick = () => { modal.style.display = 'none'; if (callback) callback(); };
    modal.style.display = 'block';
}

function openTaskMap() {
    const grid = document.getElementById('task-grid'); 
    grid.innerHTML = '';
    
// Lesson 1: Getting Started (Tasks 0-11)
    const lesson1Header = document.createElement('div');
    lesson1Header.className = 'lesson-header';
    lesson1Header.innerHTML = '<h3>Lesson 1: Getting Started</h3>';
    grid.appendChild(lesson1Header);
    
    challenges.slice(0, 12).forEach((task) => {
        const node = createTaskNode(task);
        grid.appendChild(node);
    });
    
    // Lesson 2: Comparators (Tasks 12-19)
    const lesson2Header = document.createElement('div');
    lesson2Header.className = 'lesson-header';
    lesson2Header.innerHTML = '<h3>Lesson 2: Comparators</h3>';
    grid.appendChild(lesson2Header);
    
    challenges.slice(12, 20).forEach((task) => {
        const node = createTaskNode(task);
        grid.appendChild(node);
    });

    // Lesson 3: Real World Logic (Tasks 20-25)
    const lesson3Header = document.createElement('div');
    lesson3Header.className = 'lesson-header';
    lesson3Header.innerHTML = '<h3>Lesson 3: Real World Logic</h3>';
    grid.appendChild(lesson3Header);
    
    challenges.slice(20, 26).forEach((task) => {
        const node = createTaskNode(task);
        grid.appendChild(node);
    });

    // Lesson 4: Boolean Expressions (Tasks 26+)
    const lesson4Header = document.createElement('div'); // Name changed to lesson4Header
    lesson4Header.className = 'lesson-header';
    lesson4Header.innerHTML = '<h3>Lesson 4: Boolean Expressions</h3>'; // Title updated
    grid.appendChild(lesson4Header);
    
    // slice(26) includes Task 26 and everything after it
    challenges.slice(26).forEach((task) => {
        const node = createTaskNode(task);
        grid.appendChild(node);
    });
    
    document.getElementById('taskMapModal').style.display = 'block';
}

function createTaskNode(task) {
    const node = document.createElement('div'); 
    node.className = 'task-node';
    const score = starScores[task.id] || 0;
    
    let miniStars = '<div class="mini-stars">';
    for(let i = 0; i < 3; i++) miniStars += `<span style="color: ${i < score ? '#f1c40f' : '#444'}">★</span>`;
    miniStars += '</div>';
    
    if (completedTaskIds.has(task.id)) { 
        node.style.background = '#4ecca3'; 
        node.style.color = '#16213e'; 
    }
    
    node.innerHTML = `<div>${task.id + 1}</div>${miniStars}`;
    
    node.onclick = async () => { 
        if (audioCtx.state === 'suspended') audioCtx.resume(); 

        closeTaskMap();
        
        setTimeout(() => {
            currentTaskStars = 3; 
            loadTask(task); 
        }, 50);
    };
    
    return node;
}

function closeTaskMap() { document.getElementById('taskMapModal').style.display = 'none'; }

function loadTask(task) { 
    currentActiveTask = task; currentStepIndex = 0; clearCanvas(); 
    document.getElementById('active-task-controls').style.display = 'block'; updateStepUI(); 
}

function updateStepUI() {
    const step = currentActiveTask.steps[currentStepIndex];
    const interactionArea = document.getElementById('task-interaction-area');
    const checkBtn = document.getElementById('check-btn');
    const tableToolBtn = document.getElementById('table-toggle-btn');

    // Load circuit if provided
    if (step.circuitData && Object.keys(step.circuitData).length > 0) {
        loadCircuitFromData(step.circuitData, step.interactive); 
        container.style.pointerEvents = 'auto';
        document.querySelectorAll('.palette-item').forEach(p => p.setAttribute('draggable', 'false'));
    } else {
        container.style.pointerEvents = 'auto'; 
        document.querySelectorAll('.palette-item').forEach(p => p.setAttribute('draggable', 'true'));
    }

    if (tableToolBtn) tableToolBtn.style.display = (step.type === 'table-complete') ? 'none' : 'block';

    const starContainer = document.getElementById('star-container'); 
    starContainer.innerHTML = '';
    for (let i = 0; i < currentActiveTask.steps.length; i++) {
        const star = document.createElement('span'); 
        star.className = 'star' + (i < currentStepIndex ? ' gold' : '');
        star.innerText = '★'; 
        starContainer.appendChild(star);
    }

    document.getElementById('task-title').innerText = currentActiveTask.title;
    document.getElementById('task-desc').innerText = step.description;
    interactionArea.innerHTML = '';

    if (step.type === 'table-complete') {
        checkBtn.style.display = 'block';
        const inputs = step.circuitData.gates.filter(g => g.type === 'INPUT');
        const numInputs = inputs.length;
        const numRows = Math.pow(2, numInputs);
        const table = document.createElement('table'); 
        table.className = 'truth-table-input-style';

        let tableHtml = '<thead><tr>';
        for (let i = 0; i < numInputs; i++) tableHtml += `<th>In ${numInputs > 1 ? (i + 1) : ''}</th>`;
        tableHtml += '<th>Output</th></tr></thead><tbody>';

        for (let i = 0; i < numRows; i++) {
            tableHtml += '<tr>';
            for (let j = numInputs - 1; j >= 0; j--) tableHtml += `<td>${(i >> j) & 1}</td>`;
            tableHtml += `<td><button class="table-toggle-pill" data-idx="${i}" data-val="0" onclick="toggleTablePill(this)">0</button></td></tr>`;
        }
        table.innerHTML = tableHtml + `</tbody>`; 
        interactionArea.appendChild(table);

    // FIX: Included 'identify-gate' type here
    } else if (step.type === 'investigate' || step.type === 'identify-gate') {
        checkBtn.style.display = 'none';
        const mcContainer = document.createElement('div'); 
        mcContainer.className = 'mc-container';
        mcContainer.style.width = "100%";
        mcContainer.innerHTML = `<p style="margin-bottom:15px; text-align:center;">${step.question || "Choose the correct answer:"}</p>`;
        
        step.options.forEach((opt, idx) => {
            const btn = document.createElement('button'); 
            btn.className = 'btn'; 
            btn.style.width = "100%"; 
            btn.style.marginBottom = "10px";
            btn.style.textAlign = "center";
            btn.innerText = opt; 

            btn.onclick = () => { 
                // FIX: Check if either the Text (opt) or the Index (idx) matches the answer
                const isCorrect = (opt === step.answer || idx === step.answer);
                
                if (isCorrect) {
                    handleStepSuccess(); 
                } else { 
                    showFeedbackModal('error', 'Oops!', 'That is not correct. Look at the logic behavior again!', 'Try Again'); 
                }
            };
            mcContainer.appendChild(btn);
        });
        interactionArea.appendChild(mcContainer);
    } else { 
        checkBtn.style.display = 'block'; 
    }
}

function toggleTablePill(btn) {
    const newVal = btn.dataset.val === '0' ? '1' : '0';
    btn.dataset.val = newVal; btn.innerText = newVal;
    btn.style.backgroundColor = newVal === '1' ? '#4ecca3' : '#ff6b6b'; 
}

function handleStepSuccess() {
    const stars = document.querySelectorAll('.star');
    if (stars[currentStepIndex]) { playPopSound(); stars[currentStepIndex].classList.add('gold'); }
    if (currentStepIndex === currentActiveTask.steps.length - 1) {
        const taskId = currentActiveTask.id;
        if (!starScores[taskId] || currentTaskStars > starScores[taskId]) starScores[taskId] = currentTaskStars;
        completedTaskIds.add(taskId); showCompletionCelebration();
    } else { showFeedbackModal('success', 'Step Completed!', 'Well done!', 'Next Step', nextStep); }
}

function showCompletionCelebration() {
    const modal = document.getElementById('custom-modal');
    const iconEl = document.getElementById('modal-icon');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const btnEl = document.getElementById('modal-btn');
    
    // --- SIDE-FIRE CROSSFIRE EFFECT ---
    // We use a high zIndex (20000) to ensure particles appear above the 
    // modal overlay and the backdrop-filter blur.
    if (typeof confetti === 'function') {
        const duration = 3 * 1000; // Fires for 3 seconds
        const end = Date.now() + duration;

        const frame = () => {
            // Left Cannon: Firing from bottom-left toward the center
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 1 },
                colors: ['#4ecca3', '#00d4ff', '#f1c40f', '#ff6b6b', '#f06292'],
                zIndex: 20000 
            });
            // Right Cannon: Firing from bottom-right toward the center
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 1 },
                colors: ['#4ecca3', '#00d4ff', '#f1c40f', '#ff6b6b', '#f06292'],
                zIndex: 20000
            });

            // Continue the animation loop until duration is reached
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }

    // Modal Content Setup
    iconEl.innerHTML = '';
    let starsHtml = '<div class="celebration-stars">';
    for(let i = 1; i <= 3; i++) {
        starsHtml += `<span class="big-star ${i <= currentTaskStars ? 'gold' : 'gray'}" style="animation-delay: ${i * 0.2}s">★</span>`;
    }
    starsHtml += '</div>';
    
    titleEl.innerText = "Task Complete!";
    msgEl.innerHTML = `${starsHtml}<p style="margin-top:10px;">You earned ${currentTaskStars} Stars!</p>`;
    btnEl.innerText = "Finish";
    
    // Handle finishing the task
    btnEl.onclick = () => { 
        modal.style.display = 'none'; 
        openTaskMap(); 
    };
    
    // Display the modal
    modal.style.display = 'block';
    soundTaskComplete(); // Play the victory sound
}


/* simulator.js */

function toggleFullscreen() {
    if (!document.fullscreenElement &&    // standard
        !document.mozFullScreenElement && // Firefox
        !document.webkitFullscreenElement && // Chrome, Safari and Opera
        !document.msFullscreenElement) {  // IE/Edge
        
        // ENTER FULLSCREEN
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        // EXIT FULLSCREEN
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}



function checkCurrentStep() {
    const step = currentActiveTask.steps[currentStepIndex];
    let success = false;

    // 1. Existing functionality for 'table-complete'
    if (step.type === 'table-complete') {
        const values = Array.from(document.querySelectorAll('.table-toggle-pill')).map(p => parseInt(p.dataset.val));
        if (JSON.stringify(values) === JSON.stringify(step.targetOutputs)) success = true;
    } 

    // 2. Existing functionality for 'label' with distance check
    else if (step.type === 'label') {
        const labels = Array.from(document.querySelectorAll('.text-label'));
        const target = step.targetText.toLowerCase().trim();
        const targetGate = gates.find(g => g.type === step.targetGateType);
        
        if (targetGate) {
            success = labels.some(l => {
                const labelText = l.innerText.toLowerCase().trim();
                const labelX = parseFloat(l.style.left);
                const labelY = parseFloat(l.style.top);
                
                const distance = Math.sqrt(
                    Math.pow(labelX - targetGate.x, 2) + 
                    Math.pow(labelY - targetGate.y, 2)
                );
                
                return labelText === target && distance < 120;
            });
        }
    }

    // 3. UPDATED functionality for 'build' to support multiple truth tables
    else if (step.type === 'build') {
        const inps = gates.filter(g => g.type === 'INPUT');
        const outs = gates.filter(g => g.type === 'OUTPUT');

        if (inps.length === step.requiredInputs && outs.length === step.requiredOutputs) {
            let userResults = [];
            // Generate user truth table
            for (let i = 0; i < Math.pow(2, inps.length); i++) {
                inps.forEach((inp, j) => inp.value = (i >> (inps.length - 1 - j)) & 1); 
                evaluateSimulationOnly();
                const conn = connections.find(c => c.to.id === (outs[0] ? outs[0].id : -1)); 
                userResults.push(conn ? conn.from.output : 0);
            }

            // --- MULTIPLE TARGET TABLE CHECK ---
            // Check if targetTruthTable is an array of arrays [[0,1],[1,1]]
            if (Array.isArray(step.targetTruthTable[0])) {
                success = step.targetTruthTable.some(validTable => 
                    JSON.stringify(userResults) === JSON.stringify(validTable)
                );
            } else {
                // Standard check for a single target array [0,1,0,1]
                success = JSON.stringify(userResults) === JSON.stringify(step.targetTruthTable);
            }
        }
    }

    // Final Validation and Feedback
    if (success) {
        handleStepSuccess();
    } else {
        soundError();
        const errorMsg = step.type === 'label' 
            ? `Place the label "${step.targetText}" closer to the ${step.targetGateType} gate.` 
            : 'Requirement not met yet.';
        showFeedbackModal('error', 'Incomplete!', errorMsg, 'Let me check...');
    }
}



function nextStep() { currentStepIndex++; updateStepUI(); }

// --- CORE SIMULATION LOGIC ---
const gateLogic = { 
    AND: (ins) => ins.every(v => v === 1) ? 1 : 0, 
    OR: (ins) => ins.some(v => v === 1) ? 1 : 0, 
    NOT: (ins) => ins[0] === 1 ? 0 : 1, 
    NAND: (ins) => ins.every(v => v === 1) ? 0 : 1, 
    NOR: (ins) => ins.some(v => v === 1) ? 0 : 1, 
    XOR: (ins) => ins.filter(v => v === 1).length === 1 ? 1 : 0,
    COMPARATOR: (ins, gate) => evaluateComparator(gate)
};
const gateInputCount = { AND: 2, OR: 2, NOT: 1, NAND: 2, NOR: 2, XOR: 2, COMPARATOR: 0 };

function evaluateComparator(gate) {
    const liveValue = gate.currentDataValue !== undefined ? parseFloat(gate.currentDataValue) : 0;
    const threshold = gate.thresholdValue !== undefined ? parseFloat(gate.thresholdValue) : 50;
    const operator = gate.operator || '>';
    switch(operator) {
        case '>':  return liveValue > threshold ? 1 : 0;
        case '<':  return liveValue < threshold ? 1 : 0;
        case '==': return liveValue === threshold ? 1 : 0;
        case '!=': return liveValue !== threshold ? 1 : 0; // Added "Not Equal To"
        default:   return 0;
    }
}

function updateComparatorInputValue(id, val) {
    const gate = gates.find(x => x.id === id);
    if (gate) {
        gate.currentDataValue = val;
        evaluateCircuit();
    }
}

// --- NEW THEMED MODAL LOGIC ---
function configureComparator(gateId) {
    const gate = gates.find(g => g.id === gateId);
    if (!gate) return;
    activeConfigGateId = gateId;
    
    document.getElementById('comp-threshold-input').value = gate.thresholdValue || 50;
    document.getElementById('comp-operator-input').value = gate.operator || '>';
    
    document.getElementById('comp-modal').style.display = 'flex';
}

function saveComparatorSettings() {
    const gate = gates.find(g => g.id === activeConfigGateId);
    if (gate) {
        const newThreshold = document.getElementById('comp-threshold-input').value;
        const newOperator = document.getElementById('comp-operator-input').value;
        
        gate.thresholdValue = parseFloat(newThreshold);
        gate.operator = newOperator;

        const label = document.getElementById(`comp-label-${activeConfigGateId}`);
        if (label) label.textContent = `${gate.operator} ${gate.thresholdValue}`;
        
        evaluateCircuit();
    }
    document.getElementById('comp-modal').style.display = 'none';
    activeConfigGateId = null;
    playPopSound();
}

function setTool(tool) {
    currentTool = tool;
    document.getElementById('select-tool').classList.toggle('active', tool === 'select');
    document.getElementById('delete-tool').classList.toggle('active', tool === 'delete');
    document.getElementById('text-tool').classList.toggle('active', tool === 'text');

    container.style.cursor = tool === 'delete' ? 'not-allowed' : (tool === 'text' ? 'text' : 'default');

    if (tool === 'delete') {
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'not-allowed';
    } else {
        canvas.style.pointerEvents = 'none';
        canvas.style.cursor = 'default';
    }
}

function createGate(type, x, y, skipModal = false) {
    const gate = document.createElement('div'); gate.className = 'gate'; gate.style.left = x + 'px'; gate.style.top = y + 'px';
    const gateId = gateIdCounter++; gate.dataset.id = gateId; gate.dataset.type = type;

    const step = (currentActiveTask && currentActiveTask.steps[currentStepIndex]);
    const isMystery = step && step.hideGateId === gateId;
    if (isMystery) {
        gate.classList.add('mystery-mode');
    }

    if (type === 'INPUT') {
        gate.classList.add('input-node');
        gate.innerHTML = `<span>Input ${gates.filter(g => g.type === 'INPUT').length + 1}</span><button class="toggle-btn" onclick="toggleInput(${gateId})">0</button><div class="connection-point output" style="right:-5px;top:50%;transform:translateY(-50%)" data-gate="${gateId}" data-type="output" data-index="0"></div>`;
    } else if (type === 'OUTPUT') {
        gate.classList.add('output-node');
        gate.innerHTML = `<div class="connection-point input" style="left:-5px;top:50%;transform:translateY(-50%)" data-gate="${gateId}" data-type="input" data-index="0"></div><span>Output ${gates.filter(g => g.type === 'OUTPUT').length + 1}: </span><button class="toggle-btn" id="output-${gateId}">0</button>`;
    } else { gate.innerHTML = getGateSVG(type, gateId); }
    container.appendChild(gate);
    const data = { 
        id: gateId, element: gate, type: type, x: x, y: y, output: null, 
        value: type === 'INPUT' ? 0 : null, currentDataValue: 0, thresholdValue: 50, operator: '>' 
    };
    gates.push(data); makeDraggable(gate, data); setupConnectionPoints(gate, data);
    
    if (type === 'COMPARATOR') {
        gate.ondblclick = () => configureComparator(gateId);
        if (!skipModal) setTimeout(() => configureComparator(gateId), 100);
    }
    evaluateCircuit();
}

function getGateSVG(type, gateId) {
    const inputCount = gateInputCount[type];
    let svg = '';
    if (type === 'AND') svg = '<svg width="120" height="80"><path d="M 20 10 L 60 10 Q 100 10 100 40 Q 100 70 60 70 L 20 70 Z" fill="#16213e" stroke="#00d4ff" stroke-width="3"/></svg>';
    else if (type === 'OR') svg = '<svg width="120" height="80"><path d="M 20 10 Q 30 40 20 70 L 50 70 Q 90 70 110 40 Q 90 10 50 10 L 20 10" fill="#16213e" stroke="#00d4ff" stroke-width="3"/></svg>';
    else if (type === 'NOT') svg = '<svg width="100" height="60"><path d="M 20 10 L 20 50 L 70 30 Z" fill="#16213e" stroke="#00d4ff" stroke-width="3"/><circle cx="78" cy="30" r="6" fill="#16213e" stroke="#00d4ff" stroke-width="3"/></svg>';
    else if (type === 'NAND') svg = '<svg width="130" height="80"><path d="M 20 10 L 60 10 Q 100 10 100 40 Q 100 70 60 70 L 20 70 Z" fill="#16213e" stroke="#00d4ff" stroke-width="3"/><circle cx="108" cy="40" r="6" fill="#16213e" stroke="#00d4ff" stroke-width="3"/></svg>';
    else if (type === 'NOR') svg = '<svg width="130" height="80"><path d="M 20 10 Q 30 40 20 70 L 50 70 Q 90 70 110 40 Q 90 10 50 10 L 20 10" fill="#16213e" stroke="#00d4ff" stroke-width="3"/><circle cx="118" cy="40" r="6" fill="#16213e" stroke="#00d4ff" stroke-width="3"/></svg>';
    else if (type === 'XOR') svg = '<svg width="120" height="80"><path d="M 12 10 Q 22 40 12 70" fill="none" stroke="#00d4ff" stroke-width="3"/><path d="M 20 10 Q 30 40 20 70 L 50 70 Q 90 70 110 40 Q 90 10 50 10 L 20 10" fill="#16213e" stroke="#00d4ff" stroke-width="3"/></svg>';
    else if (type === 'COMPARATOR') {
        svg = `<svg width="160" height="80">
            <foreignObject x="0" y="20" width="55" height="40">
                <input type="number" class="gate-data-input" value="0" 
                    style="width:100%; height:100%; border:2px solid #0f3460; background:#fff; color:#16213e; text-align:center; font-size:20px; font-weight:bold; border-radius:4px;"
                    oninput="updateComparatorInputValue(${gateId}, this.value)">
            </foreignObject>
            <path id="comp-path-${gateId}" d="M 60 10 L 150 40 L 60 70 Z" fill="#ff4d4d" stroke="#16213e" stroke-width="2"/>
            <text id="comp-label-${gateId}" x="85" y="47" fill="white" font-size="16" font-weight="bold" style="pointer-events:none;">> 50</text>
        </svg>`;
    }

    let points = '';
    if (type === 'COMPARATOR') {
        points = `<div class="connection-point output" style="left:150px;top:35px" data-gate="${gateId}" data-type="output" data-index="0"></div>`;
    } else {
        points = (inputCount === 1) ? `<div class="connection-point input" style="left:15px;top:25px" data-gate="${gateId}" data-type="input" data-index="0"></div>` : `<div class="connection-point input" style="left:15px;top:22px" data-gate="${gateId}" data-type="input" data-index="0"></div><div class="connection-point input" style="left:15px;top:48px" data-gate="${gateId}" data-type="input" data-index="1"></div>`;
        points += `<div class="connection-point output" style="left:${(type === 'NAND' || type === 'NOR') ? 115 : (type === 'NOT' ? 85 : 105)}px;top:${type === 'NOT' ? 25 : 35}px" data-gate="${gateId}" data-type="output" data-index="0"></div>`;
    }
    return svg + points;
}

function evaluateCircuit() {
    evaluateSimulationOnly();
    gates.forEach(g => { 
        if (g.type === 'OUTPUT') { 
            const b = document.getElementById(`output-${g.id}`); 
            if (b) { b.textContent = g.output; b.style.background = g.output === 1 ? '#4ecca3' : '#0f3460'; } 
        } 
        if (g.type === 'COMPARATOR') {
            const path = document.getElementById(`comp-path-${g.id}`);
            if (path) path.setAttribute('fill', g.output === 1 ? '#4ecca3' : '#ff4d4d');
        }
    });
    drawConnections(); 
    if (showTruthTable) generateTruthTable();
}

function evaluateSimulationOnly() {
    gates.forEach(g => { if (g.type !== 'INPUT') g.output = null; });
    function ev(gate) {
        if (gate.type === 'INPUT') return gate.output = gate.value;
        if (gate.type === 'OUTPUT') { const c = connections.find(x => x.to.id === gate.id); return gate.output = c ? ev(c.from) : 0; }
        if (gate.output !== null) return gate.output;
        const ins = []; 
        for (let i = 0; i < (gateInputCount[gate.type] || 1); i++) { 
            const c = connections.find(x => x.to.id === gate.id && x.toIndex === i); 
            ins[i] = c ? ev(c.from) : 0; 
        }
        return gate.output = gateLogic[gate.type](ins, gate);
    }
    gates.forEach(g => ev(g));
    if (typeof updateSimulationVideo === 'function') {
        updateSimulationVideo();
    }
    if (typeof updateSimulationVideo === 'function') updateSimulationVideo();
}

function drawConnections() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    connections.forEach(conn => {
        const r1 = conn.from.element.querySelector('.output').getBoundingClientRect(), 
              r2 = conn.to.element.querySelectorAll('.input')[conn.toIndex].getBoundingClientRect(), 
              rc = container.getBoundingClientRect();
        const x1 = r1.left+5-rc.left, y1 = r1.top+5-rc.top, x2 = r2.left+5-rc.left, y2 = r2.top+5-rc.top;
        
        // Check if mouse is near this connection in delete mode
        let isHovered = false;
        if (currentTool === 'delete' && mouseX && mouseY) {
            // Check if mouse is near the bezier curve
            const steps = 20;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const cx1 = x1 + (x2 - x1) / 2;
                const cy1 = y1;
                const cx2 = x1 + (x2 - x1) / 2;
                const cy2 = y2;
                
                // Bezier curve calculation
                const bx = Math.pow(1-t, 3) * x1 + 3 * Math.pow(1-t, 2) * t * cx1 + 3 * (1-t) * Math.pow(t, 2) * cx2 + Math.pow(t, 3) * x2;
                const by = Math.pow(1-t, 3) * y1 + 3 * Math.pow(1-t, 2) * t * cy1 + 3 * (1-t) * Math.pow(t, 2) * cy2 + Math.pow(t, 3) * y2;
                
                const dist = Math.sqrt(Math.pow(mouseX - bx, 2) + Math.pow(mouseY - by, 2));
                if (dist < 10) {
                    isHovered = true;
                    conn.hovered = true;
                    break;
                }
            }
        }
        
        ctx.lineWidth = isHovered ? 5 : 3;
        ctx.strokeStyle = isHovered ? '#ff6b6b' : (conn.from.output === 1 ? '#4ecca3' : '#666');
        ctx.beginPath(); 
        ctx.moveTo(x1, y1); 
        ctx.bezierCurveTo(x1+(x2-x1)/2, y1, x1+(x2-x1)/2, y2, x2, y2); 
        ctx.stroke();
        
        if (!isHovered) conn.hovered = false;
    });
}

canvas.addEventListener('mousemove', (e) => {
    const rc = container.getBoundingClientRect();
    mouseX = e.clientX - rc.left;
    mouseY = e.clientY - rc.top;
    
    if (currentTool === 'delete') {
        drawConnections(); // Redraw to show hover effect
    }
});

// Add click handler for deleting connections
canvas.addEventListener('click', (e) => {
    if (currentTool === 'delete') {
        const rc = container.getBoundingClientRect();
        const clickX = e.clientX - rc.left;
        const clickY = e.clientY - rc.top;
        
        // Find and delete hovered connection
        const toDelete = connections.findIndex(conn => conn.hovered);
        if (toDelete !== -1) {
            connections.splice(toDelete, 1);
            evaluateCircuit();
            playPopSound(); // Optional: add feedback sound
        }
    }
});


function resizeCanvas() { canvas.width = container.clientWidth; canvas.height = container.clientHeight; drawConnections(); }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

container.addEventListener('drop', (e) => { 
    e.preventDefault(); 
    const type = e.dataTransfer.getData('gateType');
    const rc = container.getBoundingClientRect();
    createGate(type, e.clientX - rc.left - 60, e.clientY - rc.top - 40); 
});
container.addEventListener('dragover', (e) => e.preventDefault());

function createLabel(x, y) {
    const l = document.createElement('div'); 
    l.className = 'text-label'; 
    l.style.left = x + 'px'; 
    l.style.top = y + 'px'; 
    l.contentEditable = true; 
    l.innerText = "Label";
    
    container.appendChild(l); 
    makeDraggable(l, { element: l, type: 'TEXT' }); 
    setTool('select');

    // NEW: Automatically focus so the user can type immediately
    setTimeout(() => {
        l.focus();
        document.execCommand('selectAll', false, null);
    }, 0);
}

function setupConnectionPoints(el, data) {
    el.querySelectorAll('.connection-point').forEach(p => p.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!connectingFrom && p.dataset.type === 'output') { connectingFrom = { gate: data, element: p }; p.classList.add('active'); }
        else if (connectingFrom && p.dataset.type === 'input') {
            connections = connections.filter(c => !(c.to.id === data.id && c.toIndex === parseInt(p.dataset.index)));
            connections.push({ from: connectingFrom.gate, to: data, toIndex: parseInt(p.dataset.index) });
            connectingFrom.element.classList.remove('active'); connectingFrom = null; evaluateCircuit();
        } else { if (connectingFrom) connectingFrom.element.classList.remove('active'); connectingFrom = null; }
    }));
}

function makeDraggable(el, data) {
    let d = false, ox, oy;
    el.onmousedown = (e) => {
        if (e.target.classList.contains('connection-point') || e.target.classList.contains('toggle-btn') || e.target.classList.contains('gate-data-input')) return;
        if (currentTool === 'delete') {
            if (data.type === 'TEXT') el.remove();
            else { gates = gates.filter(g => g.id !== data.id); connections = connections.filter(c => c.from.id !== data.id && c.to.id !== data.id); el.remove(); }
            evaluateCircuit(); return;
        }
        d = true; const r = el.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top;
        const move = (e) => { 
            if (!d) return; 
            const rc = container.getBoundingClientRect();
            el.style.left = (e.clientX - rc.left - ox) + 'px'; 
            el.style.top = (e.clientY - rc.top - oy) + 'px'; 
            if (data.type !== 'TEXT') { data.x = parseInt(el.style.left); data.y = parseInt(el.style.top); } 
            drawConnections(); 
        };
        const up = () => { d = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    };
}

function makeDraggableModal(el) {
    let d = false, ox, oy;
    el.onmousedown = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'VIDEO') return;
        
        d = true; 
        const r = el.getBoundingClientRect();
        ox = e.clientX - r.left;
        oy = e.clientY - r.top;
        
        const move = (e) => { 
            if (!d) return; 
            el.style.left = (e.clientX - ox) + 'px'; 
            el.style.top = (e.clientY - oy) + 'px';
            el.style.transform = 'none'; // Remove centering transform
        };
        
        const up = () => { 
            d = false; 
            document.removeEventListener('mousemove', move); 
            document.removeEventListener('mouseup', up); 
        };
        
        document.addEventListener('mousemove', move); 
        document.addEventListener('mouseup', up);
    };
}

function toggleInput(id) {
    const g = gates.find(x => x.id === id);
    g.value = g.value === 0 ? 1 : 0;
    const b = g.element.querySelector('.toggle-btn');
    b.textContent = g.value; b.style.background = g.value === 1 ? '#4ecca3' : '#0f3460';
    playPopSound(); evaluateCircuit();
}

function clearCanvas() {
    gates.forEach(g => {
        if (g.element) g.element.remove();
    });
    const labels = document.querySelectorAll('.text-label');
    labels.forEach(label => label.remove());
    gates = []; 
    connections = []; 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --- PROGRESS CODE SYSTEM ---

function generateProgressCode() {
    let starString = "";
    challenges.forEach(task => {
        starString += (starScores[task.id] || 0).toString();
    });

    const maxPossiblePoints = challenges.length; // Each task worth 1.0 when complete
    let earnedPoints = 0;
    
    challenges.forEach(task => {
        const stars = starScores[task.id] || 0;
        if (stars === 1) earnedPoints += 0.5;
        else if (stars === 2) earnedPoints += 0.75;
        else if (stars === 3) earnedPoints += 1.0;
    });
    
    const progressPercent = Math.round((earnedPoints / maxPossiblePoints) * 100);
    const progressFormatted = progressPercent.toString().padStart(3, '0');

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const prefix = chars.charAt(Math.floor(Math.random() * 26)) + 
                   chars.charAt(Math.floor(Math.random() * 26));

    let disguisedStars = "";
    const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    
    for (let i = 0; i < starString.length; i++) {
        const starValue = parseInt(starString[i]);
        const hash1 = alphanumeric[(starValue * 7 + i * 3) % 36];
        const hash2 = alphanumeric[(starValue * 11 + i * 5) % 36];
        disguisedStars += hash1 + hash2;
    }

    const rawCode = prefix + progressFormatted + disguisedStars;
    
    const checksum = btoa(Math.round(earnedPoints * 100).toString()).substring(0, 3);
    
    return (rawCode + checksum).toUpperCase();
}

function loadProgressCode(code) {
    try {
        if (code.length < 8) return false; // Minimum: 2 prefix + 3 progress + 2 chars + 3 checksum
        
        // Remove Prefix(2) and Progress(3) and Checksum(3)
        const checksumStart = code.length - 3;
        const dataPart = code.substring(5, checksumStart);
        
        // Reverse the enhanced hash
        let newStarScores = {};
        const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        
        // Process in pairs (2 chars per star)
        for (let i = 0; i < dataPart.length; i += 2) {
            const taskIndex = Math.floor(i / 2);
            if (taskIndex >= challenges.length) break;
            
            const hash1 = dataPart[i];
            const hash2 = dataPart[i + 1];
            
            if (!hash1 || !hash2) break; // Safety check
            
            // Reverse engineer the star value by trying all possibilities (0-3)
            let foundStar = 0;
            for (let testStar = 0; testStar <= 3; testStar++) {
                const expectedHash1 = alphanumeric[(testStar * 7 + taskIndex * 3) % 36];
                const expectedHash2 = alphanumeric[(testStar * 11 + taskIndex * 5) % 36];
                
                if (hash1 === expectedHash1 && hash2 === expectedHash2) {
                    foundStar = testStar;
                    break;
                }
            }
            
            newStarScores[challenges[taskIndex].id] = foundStar;
            if (foundStar > 0) {
                completedTaskIds.add(challenges[taskIndex].id);
            }
        }

        starScores = newStarScores;
        
        // Update the task map if it's open
        const taskGrid = document.getElementById('task-grid');
        if (taskGrid && taskGrid.children.length > 0) {
            openTaskMap(); // Refresh the display
        }
        
        return true;
    } catch (e) {
        console.error("Invalid Code Format", e);
        return false;
    }
}

function generateTruthTable() {
    const inps = gates.filter(g => g.type === 'INPUT'), outs = gates.filter(g => g.type === 'OUTPUT');
    if (!inps.length) return document.getElementById('truth-table-content').innerHTML = '<p>Add inputs</p>';
    const cur = inps.map(i => i.value); let html = '<table><thead><tr>';
    inps.forEach((_, i) => html += `<th>In ${i + 1}</th>`); outs.forEach((_, i) => html += `<th>Out ${i + 1}</th>`);
    html += '</tr></thead><tbody>';
    for (let i = 0; i < Math.pow(2, inps.length); i++) {
        const rv = []; for (let j = 0; j < inps.length; j++) rv.push((i >> (inps.length - 1 - j)) & 1);
        html += JSON.stringify(rv) === JSON.stringify(cur) ? '<tr class="tr-active">' : '<tr>';
        inps.forEach((inp, j) => inp.value = rv[j]); evaluateSimulationOnly();
        rv.forEach(v => html += `<td>${v}</td>`); outs.forEach(o => html += `<td>${o.output}</td>`);
        html += '</tr>';
    }
    inps.forEach((inp, idx) => inp.value = cur[idx]); evaluateSimulationOnly();
    document.getElementById('truth-table-content').innerHTML = html + '</tbody></table>';
}

document.querySelectorAll('.palette-item').forEach(item => {
    item.addEventListener('dragstart', (e) => e.dataTransfer.setData('gateType', e.target.dataset.gate));
});

container.addEventListener('mousedown', (e) => {
    // Only trigger if clicking the background container itself, not a gate
    if (e.target === container) {
        if (currentTool === 'text') {
            const rc = container.getBoundingClientRect();
            createLabel(e.clientX - rc.left, e.clientY - rc.top);
        }
    }
});

function openProgressModal() {
    const modal = document.getElementById('progressModal');
    const textArea = document.getElementById('progress-code-area');
    
    // Generate the progress code (not circuit data)
    const progressCode = generateProgressCode();
    textArea.value = progressCode;
    
    modal.style.display = 'block';
}

function loadProgressFromArea() {
    const code = document.getElementById('progress-code-area').value.trim();
    if (!code) {
        alert('Please enter a progress code.');
        return;
    }

    if (loadProgressCode(code)) {
        closeProgressModal();
        alert('Progress loaded successfully!');
    } else {
        alert('Invalid Progress Code. Please check the code and try again.');
    }
}


function closeProgressModal() {
    document.getElementById('progressModal').style.display = 'none';
}

function copyProgressCode() {
    const textArea = document.getElementById('progress-code-area');
    textArea.select();
    document.execCommand('copy');
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = originalText, 2000);
}

window.onclick = function(event) {
    const modal = document.getElementById('progressModal');
    if (event.target == modal) {
        closeProgressModal();
    }
}

// Initial canvas size
resizeCanvas();