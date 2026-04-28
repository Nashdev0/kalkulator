document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const display = document.getElementById('display');
    const history = document.getElementById('history');
    const buttons = document.querySelectorAll('.btn-pixel');
    const sparklesWrapper = document.getElementById('sparkles-wrapper');

    // Calculator State
    let currentInput = '0';
    let previousInput = '';
    let operator = null;
    let shouldResetScreen = false;

    // --- Aesthetic Features ---
    const emojis = ['✨', '💖', '🎀', '🌸', '⭐', '🦋'];
    
    function createSparkle() {
        if (!sparklesWrapper) return;
        const sparkle = document.createElement('div');
        sparkle.className = 'floating-sparkle';
        sparkle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        
        // Random horizontal position, duration, and slight delays
        sparkle.style.left = `${Math.random() * 100}vw`;
        const duration = 5 + Math.random() * 7;
        sparkle.style.animationDuration = `${duration}s`;
        
        sparklesWrapper.appendChild(sparkle);

        // Cleanup DOM after animation completes
        setTimeout(() => {
            if (sparkle.parentNode === sparklesWrapper) {
                sparkle.remove();
            }
        }, duration * 1000);
    }

    // Generate floating sparkles occasionally
    setInterval(createSparkle, 1000);

    // Initial batch of sparkles
    for(let i = 0; i < 5; i++) {
        setTimeout(createSparkle, i * 200);
    }

    // --- Helper for Number Formatting (Thousands separators) ---
    function formatNumber(numStr) {
        if (numStr === 'Error' || numStr === '-') return numStr;
        const parts = numStr.split('.');
        let intPart = parts[0];
        let isNegative = false;
        
        if (intPart.startsWith('-')) {
            isNegative = true;
            intPart = intPart.substring(1);
        }
        
        let formattedInt = '';
        if (intPart !== '') {
            // Add commas for thousands
            formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        
        let finalStr = (isNegative ? '-' : '') + formattedInt;
        
        if (parts.length > 1) {
            finalStr += '.' + parts[1];
        }
        return finalStr;
    }

    // --- Calculator Logic ---
    function updateScreen() {
        // Prevent extremely long numbers from overflowing completely
        let textToShow = formatNumber(currentInput);
        
        // Dynamic Scaling font size based on length
        if (textToShow.length > 20) {
            display.style.fontSize = '1rem';
        } else if (textToShow.length > 15) {
            display.style.fontSize = '1.25rem';
        } else if (textToShow.length > 11) {
            display.style.fontSize = '1.5rem';
        } else if (textToShow.length > 8) {
            display.style.fontSize = '1.75rem';
        } else {
            display.style.fontSize = '2.25rem'; // Standard
        }

        display.textContent = textToShow;
        
        // Auto-scroll to the end for long inputs
        display.scrollLeft = display.scrollWidth;

        // Update history (the small text above the main display)
        if (operator !== null) {
            let opSymbol = operator;
            if(opSymbol === '*') opSymbol = '×';
            if(opSymbol === '/') opSymbol = '÷';
            history.textContent = `${formatNumber(previousInput)} ${opSymbol}`;
        } else {
            history.textContent = '';
        }
    }

    function handleNumber(num) {
        if (currentInput === '0' || shouldResetScreen || currentInput === 'Error') {
            currentInput = num;
            shouldResetScreen = false;
        } else {
            // Optional: limit max digits to prevent absurd inputs
            if (currentInput.replace('.', '').length < 16) {
                currentInput += num;
            }
        }
        updateScreen();
    }

    function handleOperator(op) {
        if (currentInput === 'Error') return;

        if (operator !== null && !shouldResetScreen) {
            calculate();
        }
        previousInput = currentInput;
        operator = op;
        shouldResetScreen = true;
        updateScreen();
    }

    function calculate() {
        if (operator === null || shouldResetScreen || currentInput === 'Error') return;
        
        let prev = parseFloat(previousInput);
        let current = parseFloat(currentInput);
        let result = 0;

        if (isNaN(prev) || isNaN(current)) return;

        switch(operator) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '*': result = prev * current; break;
            case '/': 
                if (current === 0) {
                    currentInput = 'Error';
                    operator = null;
                    previousInput = '';
                    shouldResetScreen = true;
                    updateScreen();
                    return;
                }
                result = prev / current; 
                break;
        }

        // Handle floating point precision issues (e.g., 0.1 + 0.2)
        // Round to 10 decimal places to eliminate floating point junk
        result = Math.round(result * 10000000000) / 10000000000;
        
        currentInput = result.toString();
        operator = null;
        previousInput = '';
        shouldResetScreen = true;
        updateScreen();
    }

    function clear() {
        currentInput = '0';
        previousInput = '';
        operator = null;
        shouldResetScreen = false;
        updateScreen();
    }

    function handleDecimal() {
        if (shouldResetScreen || currentInput === 'Error') {
            currentInput = '0.';
            shouldResetScreen = false;
            updateScreen();
            return;
        }
        if (!currentInput.includes('.')) {
            currentInput += '.';
            updateScreen();
        }
    }

    function handlePercent() {
        if (currentInput === 'Error') return;
        let val = parseFloat(currentInput);
        if (!isNaN(val)) {
            currentInput = (val / 100).toString();
            updateScreen();
        }
    }

    function handleBackspace() {
        if (!shouldResetScreen && currentInput !== 'Error') {
            currentInput = currentInput.slice(0, -1);
            if (currentInput === '' || currentInput === '-') {
                currentInput = '0';
            }
            updateScreen();
        }
    }

    // Attach Event Listeners cleanly (No inline HTML handlers)
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Haptic Feedback for Mobile Devices (if supported)
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }

            const action = button.dataset.action;
            const value = button.dataset.value;

            switch(action) {
                case 'number':
                    handleNumber(value);
                    break;
                case 'operator':
                    handleOperator(value);
                    break;
                case 'calculate':
                    calculate();
                    break;
                case 'clear':
                    clear();
                    break;
                case 'decimal':
                    handleDecimal();
                    break;
                case 'percent':
                    handlePercent();
                    break;
                case 'backspace':
                    handleBackspace();
                    break;
            }
        });
    });

    // Optional: Add Keyboard Support
    window.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
        if (e.key === '.') handleDecimal();
        if (e.key === '=' || e.key === 'Enter') {
            e.preventDefault(); // prevent triggering focused buttons repeatedly
            calculate();
        }
        if (e.key === 'Backspace') {
            handleBackspace();
        }
        if (e.key === 'Escape') clear();
        if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
            handleOperator(e.key);
        }
        if (e.key === '%') handlePercent();
    });

    // Init Display
    updateScreen();
});
