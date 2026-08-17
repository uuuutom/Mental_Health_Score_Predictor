document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const form = document.getElementById('prediction-form');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnSubmit = document.getElementById('btn-submit');
    const progressBar = document.getElementById('progress-bar');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    
    const views = {
        form: form,
        loading: document.getElementById('loading-view'),
        result: document.getElementById('result-view'),
        error: document.getElementById('error-view')
    };

    let currentStep = 1;
    const totalSteps = steps.length;

    // ---- Range Slider Sync ----
    const ranges = [
        { id: 'avg_daily_usage_hours', display: 'val-usage' },
        { id: 'study_hours', display: 'val-study' },
        { id: 'physical_activity_hours', display: 'val-physical' },
        { id: 'sleep_hours_per_night', display: 'val-sleep' }
    ];

    ranges.forEach(range => {
        const input = document.getElementById(range.id);
        const display = document.getElementById(range.display);
        input.addEventListener('input', (e) => {
            display.textContent = parseFloat(e.target.value).toFixed(1);
        });
    });

    // ---- Navigation Logic ----
    function updateUI() {
        // Show/Hide steps
        steps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
        });

        // Buttons
        if (currentStep === 1) {
            btnPrev.classList.add('hidden');
        } else {
            btnPrev.classList.remove('hidden');
        }

        if (currentStep === totalSteps) {
            btnNext.classList.add('hidden');
            btnSubmit.classList.remove('hidden');
        } else {
            btnNext.classList.remove('hidden');
            btnSubmit.classList.add('hidden');
        }

        // Progress Bar
        const percentage = ((currentStep) / totalSteps) * 100;
        progressBar.style.width = `${percentage}%`;

        // Step Indicators
        stepIndicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index < currentStep);
        });
    }

    // ---- Validation ----
    function validateCurrentStep() {
        const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        const inputs = currentStepEl.querySelectorAll('input, select');
        let isValid = true;

        inputs.forEach(input => {
            const group = input.closest('.input-group');
            if (group) group.classList.remove('input-error');

            if (!input.checkValidity()) {
                isValid = false;
                if (group) group.classList.add('input-error');
            }

            // Custom checks
            if (input.id === 'age') {
                const val = parseInt(input.value);
                if (val < 10 || val > 100) {
                    isValid = false;
                    if (group) group.classList.add('input-error');
                }
            }
            if (input.id === 'daily_unlocks') {
                const val = parseInt(input.value);
                if (val < 0) {
                    isValid = false;
                    if (group) group.classList.add('input-error');
                }
            }
        });

        return isValid;
    }

    // ---- Events ----
    btnNext.addEventListener('click', () => {
        if (validateCurrentStep()) {
            currentStep++;
            updateUI();
        }
    });

    btnPrev.addEventListener('click', () => {
        currentStep--;
        updateUI();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateCurrentStep()) return;

        // Gather Data exactly as Backend expects
        const formData = {
            age: parseInt(document.getElementById('age').value, 10),
            gender: document.getElementById('gender').value,
            country: document.getElementById('country').value,
            academic_level: document.getElementById('academic_level').value,
            most_used_platform: document.getElementById('most_used_platform').value,
            purpose_of_use: document.getElementById('purpose_of_use').value,
            avg_daily_usage_hours: parseFloat(document.getElementById('avg_daily_usage_hours').value),
            daily_unlocks: parseInt(document.getElementById('daily_unlocks').value, 10),
            study_hours: parseFloat(document.getElementById('study_hours').value),
            physical_activity_hours: parseFloat(document.getElementById('physical_activity_hours').value),
            sleep_hours_per_night: parseFloat(document.getElementById('sleep_hours_per_night').value),
            stress_level: document.getElementById('stress_level').value
        };

        // Switch View
        switchView('loading');

        try {
            const response = await fetch('https://mental-health-score-predictor-a029.onrender.com/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

const responseText = await response.text();

console.log("API Status:", response.status);
console.log("API Response:", responseText);

if (!response.ok) {
    throw new Error(
        responseText || `Server returned HTTP ${response.status}`
    );
}

if (!responseText.trim()) {
    throw new Error("The prediction server returned an empty response.");
}

const result = JSON.parse(responseText);

if (typeof result.predicted_mental_health_score !== 'number') {
    throw new Error("The server response does not contain a valid prediction.");
}

showResult(result.predicted_mental_health_score);



            // if (!response.ok) {
            //     if (response.status === 422) {
            //         throw new Error("Some of the submitted information was invalid according to the server.");
            //     }
            //     throw new Error(`Server returned HTTP ${response.status}`);
            // }

            // const result = await response.json();
            // showResult(result.predicted_mental_health_score);

        } catch (error) {
            console.error('Prediction Error:', error);
            showError(error.message);
        }
    });

    // ---- View Controllers ----
    function switchView(viewName) {
        Object.keys(views).forEach(key => {
            views[key].classList.add('hidden');
        });
        views[viewName].classList.remove('hidden');
    }

    function showResult(score) {
        switchView('result');
        const scoreEl = document.getElementById('final-score');
        const scorePath = document.getElementById('score-path');
        
        // Ensure valid score
        const safeScore = parseFloat(score) || 0;
        
        // Count Up Animation
        let currentCount = 0;
        const duration = 1500; // ms
        const steps = 60;
        const increment = safeScore / steps;
        const stepTime = Math.abs(Math.floor(duration / steps));
        
        const timer = setInterval(() => {
            currentCount += increment;
            if (currentCount >= safeScore) {
                currentCount = safeScore;
                clearInterval(timer);
            }
            scoreEl.textContent = currentCount.toFixed(2);
        }, stepTime);

        // Circular Gauge Animation (Assuming a theoretical max conceptual score of 10 for visual representation)
        // If your model has a different max, you can adjust `maxExpected`
        const maxExpected = 10; 
        let percent = (safeScore / maxExpected) * 100;
        if (percent > 100) percent = 100;
        if (percent < 0) percent = 0;
        
        // Delay slighty for visual effect
        setTimeout(() => {
            scorePath.style.strokeDasharray = `${percent}, 100`;
        }, 100);
    }

    function showError(message) {
        switchView('error');
        const descEl = document.getElementById('error-desc');
        
        if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
            descEl.textContent = "Unable to connect to the prediction server. Please make sure the FastAPI backend is running and CORS is properly configured.";
        } else {
            descEl.textContent = message;
        }
    }

    // Expose to window for inline onclick handlers
    window.resetForm = () => {
        form.reset();
        currentStep = 1;
        
        // Reset ranges display
        ranges.forEach(range => {
            document.getElementById(range.display).textContent = "0";
        });
        
        document.getElementById('score-path').style.strokeDasharray = `0, 100`;
        updateUI();
        switchView('form');
        document.getElementById('assessment').scrollIntoView({behavior: 'smooth'});
    };

    window.editResponses = () => {
        switchView('form');
        document.getElementById('assessment').scrollIntoView({behavior: 'smooth'});
    };

    // Initialize UI
    updateUI();
});