/**
 * Quiz Engine
 * Handles navigation, state saving, and progress bar.
 */

const STATE = {
    currentStep: 0,
    answers: {},
    data: {
        pesoAtual: 75,
        altura: 165,
        pesoDesejado: 65
    },
    totalSteps: 27 // Added final sales pages
};

// Start DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup back button
    document.getElementById('btnBack').addEventListener('click', () => {
        if (STATE.currentStep > 0) {
            nextStep(STATE.currentStep - 1, true);
        }
    });

    // Checkbox logic for step 4
    const checkboxes = document.querySelectorAll('input[name="area"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const anyChecked = Array.from(checkboxes).some(i => i.checked);
            const btnContinue = document.getElementById('btnContinueTarget');
            btnContinue.disabled = !anyChecked;
        });
    });
});

/**
 * Navigate to a specific step
 * @param {number} step - Step index to navigate to 
 * @param {boolean} isBack - Direction flag for animation
 */
function nextStep(step, isBack = false) {
    const currentSection = document.getElementById(`step-${STATE.currentStep}`);
    const nextSection = document.getElementById(`step-${step}`);
    
    if (!nextSection) {
        console.warn(`Step ${step} does not exist yet.`);
        return;
    }

    // Hide header on splash, show on inner steps
    const header = document.getElementById('mainHeader');
    if (step === 0) {
        header.classList.add('d-none');
    } else {
        header.classList.remove('d-none');
    }

    // Hide current
    currentSection.classList.add('d-none');
    
    // Show next
    nextSection.classList.remove('d-none');
    
    // Update state
    STATE.currentStep = step;
    
    // Hooks for specific steps
    if (step === 15) {
        renderGoalConfirmation();
    }
    
    // Auto-advance loader
    if (step === 20) {
        simulateLoading(22);
    }
    
    // Setup dynamic goals info
    if (step === 21) {
        setupDynamicGoals();
    }
    
    // Setup IMC
    if (step === 22) {
        setupIMC();
    }
    
    // Auto-advance offer builder
    if (step === 26) {
        simulateOfferBuilding(27);
    }
    
    // Setup Sales Page content
    if (step === 27) {
        setupSalesPage();
        startTimer();
    }
    
    // Update progress bar
    updateProgress();

    // Scroll to top
    window.scrollTo(0, 0);
    document.querySelector('.app-container').scrollTo(0,0);
}

/**
 * Update progress bar width
 */
function updateProgress() {
    if (STATE.currentStep === 0) return;
    
    // Calculate progress (step 1 is 10%, etc)
    const percentage = Math.min(((STATE.currentStep) / STATE.totalSteps) * 100, 100);
    
    // Adjust DOM
    const bar = document.getElementById('progressBar');
    if (bar) {
        bar.style.width = `${percentage}%`;
    }
}

/**
 * Save selection to state
 * @param {string} key - Question identifier 
 * @param {string} value - Selected answer 
 */
function selectOption(key, value) {
    STATE.answers[key] = value;
    console.log('Current Answers:', STATE.answers);
    
    // visual feedback could be added here before going next via the html onclick
}

/**
 * Helper for checkbox toggle visual
 */
function toggleCheckbox(element) {
    // Add logic if exclusive option like "Corpo todo" should uncheck others
    if (element.value === 'corpo-todo' && element.checked) {
        const checkboxes = document.querySelectorAll('input[name="area"]');
        checkboxes.forEach(cb => {
            if (cb !== element) cb.checked = false;
        });
    } else if (element.checked) {
        const corpoTodo = document.querySelector('input[name="area"][value="corpo-todo"]');
        if (corpoTodo) corpoTodo.checked = false;
    }
}

/**
 * Handle barriers step (Step 9) validation
 */
function toggleBarrier() {
    const checkboxes = document.querySelectorAll('input[name="barrier"]');
    const anyChecked = Array.from(checkboxes).some(i => i.checked);
    const btnContinue = document.getElementById('btnContinueBarrier');
    if(btnContinue) {
        btnContinue.disabled = !anyChecked;
    }
}

/**
 * Save user name and navigate
 * @param {number} step - next step index
 */
function saveNameAndContinue(step) {
    const nameInput = document.getElementById('userNameLine');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert("Por favor, digite seu nome primeiro.");
        return;
    }
    
    // Save to state
    STATE.answers.name = name;
    
    // Update displays showing name
    const nameDisplays = document.querySelectorAll('.display-name');
    nameDisplays.forEach(el => {
        el.textContent = name;
    });
    
    nextStep(step);
}

/**
 * Handle Goals step (Step 10) validation
 */
function toggleGoals() {
    const checkboxes = document.querySelectorAll('input[name="goal"]');
    const anyChecked = Array.from(checkboxes).some(i => i.checked);
    const btnContinue = document.getElementById('btnContinueGoals');
    if(btnContinue) {
        btnContinue.disabled = !anyChecked;
    }
}

/**
 * Handle Numerical Inputs (Weight, Height)
 */
function updateNumber(field, change) {
    const limits = {
        pesoAtual: { min: 45, max: 150 },
        altura: { min: 140, max: 200 },
        pesoDesejado: { min: 40, max: 150 }
    };
    
    let newVal = STATE.data[field] + change;
    
    if (newVal < limits[field].min) newVal = limits[field].min;
    if (newVal > limits[field].max) newVal = limits[field].max;
    
    // For expected weight, it cannot be greater than or equal to current weight
    if (field === 'pesoDesejado' && newVal >= STATE.data.pesoAtual) {
        newVal = STATE.data.pesoAtual - 1;
    }
    
    STATE.data[field] = newVal;
    document.getElementById(`val-${field}`).textContent = newVal;
    
    // Auto adjust desired weight if current weight becomes lower than or equal to desired
    if (field === 'pesoAtual' && STATE.data.pesoDesejado >= STATE.data.pesoAtual) {
        STATE.data.pesoDesejado = STATE.data.pesoAtual - 1;
        document.getElementById(`val-pesoDesejado`).textContent = STATE.data.pesoDesejado;
    }

    // Adjust max label constraint for peso desejado based on peso atual
    if (field === 'pesoAtual') {
        const labelPesoMax = document.getElementById('label-pesoMax');
        if (labelPesoMax) {
            labelPesoMax.textContent = (STATE.data.pesoAtual - 1) + ' kg';
        }
    }
    
    updateMetaBadge();
}

/**
 * Update the Meta Perder badge dynamically
 */
function updateMetaBadge() {
    const badge = document.getElementById('meta-badge-text');
    if (!badge) return;
    
    const diff = STATE.data.pesoAtual - STATE.data.pesoDesejado;
    badge.textContent = `Meta: perder ${diff} kg 🎯`;
}

/**
 * Render Goal Confirmation Text in Step 15
 */
function renderGoalConfirmation() {
    const el = document.getElementById('goal-confirmation-text');
    if (el) {
        const pA = STATE.data.pesoAtual;
        const pD = STATE.data.pesoDesejado;
        const diff = pA - pD;
        el.textContent = `Meta: ${pA}kg → ${pD}kg (${diff}kg)`;
    }
}

/**
 * Handle Routine step (Step 16) validation
 */
function toggleRotina() {
    const checkboxes = document.querySelectorAll('input[name="rotina"]');
    const anyChecked = Array.from(checkboxes).some(i => i.checked);
    const btnContinue = document.getElementById('btnContinueRotina');
    if(btnContinue) {
        btnContinue.disabled = !anyChecked;
    }
}

/**
 * Simulate the percent loader and checklist on Step 20
 */
function simulateLoading(nextStepId) {
    let percent = 0;
    const percentEl = document.getElementById('loading-percent');
    const radialBg = document.getElementById('loader-radial-bg');
    
    const items = [
        document.getElementById('check-1'),
        document.getElementById('check-2'),
        document.getElementById('check-3'),
        document.getElementById('check-4')
    ];
    
    // reset items
    items.forEach(el => {
        if(el) el.classList.remove('checked');
    });
    
    const interval = setInterval(() => {
        percent += 1;
        if (percent >= 100) {
            percent = 100;
        }
        
        if(percentEl) percentEl.textContent = percent;
        if(radialBg) radialBg.style.background = `conic-gradient(var(--highlight) ${percent}%, #E2E8F0 ${percent}%)`;
        
        // Checklist logic
        if (percent >= 15 && items[0]) items[0].classList.add('checked');
        if (percent >= 45 && items[1]) items[1].classList.add('checked');
        if (percent >= 75 && items[2]) items[2].classList.add('checked');
        
        if (percent >= 100) {
            if (items[3]) items[3].classList.add('checked');
            clearInterval(interval);
            setTimeout(() => {
                nextStep(nextStepId);
            }, 800);
        }
    }, 70);
}

/**
 * Adjust the dynamic kilos logic for Step 21
 */
function setupDynamicGoals() {
    const minEl = document.getElementById('dyn-kilos-min');
    const maxEl = document.getElementById('dyn-kilos-max');
    if (!minEl || !maxEl) return;
    
    const diff = STATE.data.pesoAtual - STATE.data.pesoDesejado;
    const min = Math.max(1, diff - 2);
    const max = diff + 1;
    
    minEl.textContent = min;
    maxEl.textContent = max;
}

/**
 * Calculate IMC and setup colors dynamically for Step 22
 */
function setupIMC() {
    const heightM = STATE.data.altura / 100;
    const imc = (STATE.data.pesoAtual / (heightM * heightM)).toFixed(1);
    
    const imcVal = document.getElementById('dyn-imc-val');
    const imcStatus = document.getElementById('dyn-imc-status');
    
    if (imcVal) imcVal.textContent = imc;
    
    if (imcStatus) {
        let status = "Normal";
        let color = "#38A169";
        
        if (imc >= 25 && imc < 30) { 
            status = "Sobrepeso"; 
            color = "#DD6B20"; 
        } else if (imc >= 30) { 
            status = "Obesidade"; 
            color = "#E53E3E"; 
        } else if (imc < 18.5) { 
            status = "Abaixo do peso"; 
            color = "#D69E2E"; 
        }
        
        imcStatus.textContent = status;
        imcStatus.style.color = color;
    }
}

/**
 * Simulate the offer building checklist on Step 26
 */
function simulateOfferBuilding(nextStepId) {
    let percent = 0;
    const bar = document.getElementById('offer-progress-bar');
    
    const items = [
        document.getElementById('offer-check-1'),
        document.getElementById('offer-check-2'),
        document.getElementById('offer-check-3'),
        document.getElementById('offer-check-4'),
        document.getElementById('offer-check-5'),
        document.getElementById('offer-check-6')
    ];
    
    items.forEach(el => {
        if(el) el.classList.remove('checked');
    });
    
    const interval = setInterval(() => {
        percent += 1;
        if (percent >= 100) percent = 100;
        
        if(bar) bar.style.width = `${percent}%`;
        
        if (percent >= 16 && items[0]) items[0].classList.add('checked');
        if (percent >= 32 && items[1]) items[1].classList.add('checked');
        if (percent >= 48 && items[2]) items[2].classList.add('checked');
        if (percent >= 64 && items[3]) items[3].classList.add('checked');
        if (percent >= 80 && items[4]) items[4].classList.add('checked');
        
        if (percent >= 100) {
            if (items[5]) items[5].classList.add('checked');
            clearInterval(interval);
            setTimeout(() => {
                nextStep(nextStepId);
            }, 800);
        }
    }, 70);
}

/**
 * Setup Timeline based on user inputs
 */
function setupSalesPage() {
    // Dynamic Meta Setup
    const diff = STATE.data.pesoAtual - STATE.data.pesoDesejado;
    
    // Logic for weeks (arbitrary but realistic expectations based on diff)
    const w2 = Math.max(1, Math.round(diff * 0.3));
    const w3Min = Math.max(2, Math.round(diff * 0.5));
    const w3Max = Math.round(diff * 0.7);
    const w4Min = Math.round(diff * 0.9);
    const w4Max = Math.round(diff * 1.2);
    
    const els = {
        'tl-w2': w2,
        'tl-w3-min': w3Min,
        'tl-w3-max': w3Max,
        'tl-w4-min': w4Min,
        'tl-w4-max': w4Max,
        'tl-total-min': w4Min,
        'tl-total-max': w4Max
    };
    
    for (const [id, val] of Object.entries(els)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }
}

/**
 * Timer logic for 10 minutes
 */
function startTimer() {
    // Only start once
    if(window._timerStarted) return;
    window._timerStarted = true;
    
    let timeInSeconds = 9 * 60 + 34; // 09:34
    const timerEl = document.getElementById('countdown-timer');
    
    setInterval(() => {
        if(timeInSeconds <= 0) return; // stays at 0
        timeInSeconds--;
        const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const s = (timeInSeconds % 60).toString().padStart(2, '0');
        if(timerEl) timerEl.textContent = `${m}:${s}`;
    }, 1000);
}

/**
 * FAQ Accordion Toggler
 */
function toggleFaq(element) {
    element.classList.toggle('active');
}
