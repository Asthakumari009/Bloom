document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM ELEMENT SELECTION ---
    const timeDisplay = document.getElementById('time-display');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const workModeBtn = document.getElementById('work-mode-btn');
    const shortBreakModeBtn = document.getElementById('short-break-mode-btn');
    const longBreakModeBtn = document.getElementById('long-break-mode-btn');
    const sessionCounterDisplay = document.getElementById('session-counter');
    
    // Safety check in case elements are not found
    if (!timeDisplay || !startBtn || !pauseBtn || !resetBtn || !workModeBtn || !shortBreakModeBtn || !longBreakModeBtn || !sessionCounterDisplay) {
        console.error("Pomodoro script could not find all required HTML elements.");
        return;
    }

    // --- 2. CONFIGURATION & STATE ---
    const WORK_TIME = 25 * 60;
    const SHORT_BREAK_TIME = 5 * 60;
    const LONG_BREAK_TIME = 15 * 60;
    const SESSIONS_BEFORE_LONG_BREAK = 4;

    let currentMode = 'work';
    let timeLeft = WORK_TIME;
    let isRunning = false;
    let intervalId = null;
    let sessionCount = 0;

    const notificationSound = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');

    // --- 3. CORE FUNCTIONS ---

    /**
     * Updates the time on the page. The document title is NOT changed.
     */
    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        timeDisplay.textContent = formattedTime;
        
        // THE LINE THAT CHANGED document.title HAS BEEN REMOVED.
    }

    /**
     * Starts the timer countdown.
     */
    function startTimer() {
        if (isRunning) return;
        
        isRunning = true;
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';

        intervalId = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(intervalId);
                isRunning = false;
                notificationSound.play();
                handleTimerEnd();
                return;
            }
            timeLeft--;
            updateDisplay();
        }, 1000);
    }

    /**
     * Pauses the timer.
     */
    function pauseTimer() {
        if (!isRunning) return;
        
        isRunning = false;
        clearInterval(intervalId);
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        updateDisplay();
    }

    /**
     * Resets the timer to the current mode's default time, but keeps session count.
     */
    function resetTimer() {
        pauseTimer();
        setMode(currentMode, false);
    }

    /**
     * Sets the current mode and updates the timer accordingly.
     * @param {string} mode - The new mode ('work', 'short-break', 'long-break').
     * @param {boolean} shouldPause - Whether to pause the timer after switching.
     */
    function setMode(mode, shouldPause = true) {
        if (shouldPause) {
            pauseTimer();
        }
        
        currentMode = mode;
        switch (mode) {
            case 'work':
                timeLeft = WORK_TIME;
                break;
            case 'short-break':
                timeLeft = SHORT_BREAK_TIME;
                break;
            case 'long-break':
                timeLeft = LONG_BREAK_TIME;
                break;
        }
        updateDisplay();
        updateModeButtons();
    }

    /**
     * Visually updates which mode button is active.
     */
    function updateModeButtons() {
        document.querySelectorAll('.pomodoro-mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.pomodoro-mode-btn[data-mode="${currentMode}"]`).classList.add('active');
    }

    /**
     * Updates the session counter display.
     */
    function updateSessionCounterDisplay() {
        sessionCounterDisplay.textContent = `Sessions: ${sessionCount}`;
    }

    /**
     * Handles the logic for when a timer session finishes.
     */
    function handleTimerEnd() {
        if (currentMode === 'work') {
            sessionCount++;
            updateSessionCounterDisplay();

            if (sessionCount > 0 && sessionCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
                setMode('long-break', false);
            } else {
                setMode('short-break', false);
            }
        } else { // It was a break
            setMode('work', false); // Go back to work mode
        }
        startTimer(); // Automatically start the next phase
    }

    // --- 4. EVENT LISTENERS ---
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    workModeBtn.addEventListener('click', () => {
        setMode('work');
        sessionCount = 0; // Reset sessions ONLY when manually clicking work
        updateSessionCounterDisplay();
    });

    shortBreakModeBtn.addEventListener('click', () => {
        setMode('short-break');
    });

    longBreakModeBtn.addEventListener('click', () => {
        setMode('long-break');
    });

    // --- 5. INITIAL SETUP ---
    setMode('work'); // Initialize to work mode
    updateSessionCounterDisplay(); // Set initial session count display
});