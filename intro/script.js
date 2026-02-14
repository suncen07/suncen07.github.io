document.addEventListener('DOMContentLoaded', () => {
    const clockDisplay = document.querySelector('.clock');

    // Constants for time calculation
    // Extended cycle: 6:00 (Start) -> 30:00 (Next Day 6:00)
    const START_HOUR = 6;
    const END_HOUR = 30;

    // Interactive Elements
    const facts = [
        "I once debugged a loop for 6 hours only to find a missing '='.",
        "I drink approximately 3 teas for every 100 lines of code.",
        "My favorite place to code is at outside under the sunshine.",
        "I can solve a Rubik's cube in under 2 minutes (slow, I know).",
        "I spend my days optimizing algorithms for milliseconds and my nights waiting for market volatility that happens in microseconds."
    ];
    let currentFactIndex = 0;
    const factText = document.getElementById('fact-text');
    const factNumber = document.getElementById('fact-number');
    const nextFactBtn = document.getElementById('next-fact-btn');

    if (nextFactBtn) {
        nextFactBtn.addEventListener('click', () => {
            currentFactIndex = (currentFactIndex + 1) % facts.length;
            factText.style.opacity = 0;
            setTimeout(() => {
                factText.textContent = facts[currentFactIndex];
                factNumber.textContent = currentFactIndex + 1;
                factText.style.opacity = 1;
            }, 200);
        });
    }

    function updateTime() {
        const scrollTop = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const scrollProgress = Math.max(0, Math.min(1, scrollTop / maxScroll));

        const totalHours = END_HOUR - START_HOUR;
        const currentHour = START_HOUR + (scrollProgress * totalHours);

        // Clock Display
        let displayHour = Math.floor(currentHour) % 24;
        let displayMinute = Math.floor((currentHour % 1) * 60);
        clockDisplay.textContent = `${String(displayHour).padStart(2, '0')}:${String(displayMinute).padStart(2, '0')}`;

        updateVisuals(currentHour);
    }

    function updateVisuals(hour) {
        let h, s, l;
        let sunBottom = -20;
        let moonBottom = -20;
        let starOpacity = 0;
        let textCol = '#333';
        let cardBg = 'rgba(255, 255, 255, 0.8)';

        // Define phases more granularly
        if (hour >= 6 && hour < 12) {
            // MORNING (6-12)
            // Orange -> Blue
            const progress = (hour - 6) / 6;
            h = 20 + (180 * progress);
            s = 80;
            l = 60 + (20 * progress);

            sunBottom = -10 + (progress * 80); // Rise
            moonBottom = -20;
        }
        else if (hour >= 12 && hour < 17) {
            // AFTERNOON (12-17)
            // Blue -> Late Afternoon Blue
            const progress = (hour - 12) / 5;
            h = 200;
            s = 80;
            l = 80;

            sunBottom = 70 - (progress * 20); // High -> Lower
            moonBottom = -20;
        }
        else if (hour >= 17 && hour < 20) {
            // SUNSET (17-20)
            // Blue -> Purple/Orange
            const progress = (hour - 17) / 3;
            h = 200 + (60 * progress);
            s = 80 - (20 * progress);
            l = 80 - (60 * progress);

            sunBottom = 50 - (progress * 70); // Set
            moonBottom = -20;

            if (progress > 0.5) {
                textCol = '#eee';
                cardBg = 'rgba(30, 30, 30, 0.8)';
            }
        }
        else {
            // NIGHT (20-30)
            const progress = (hour - 20) / 10;
            h = 260;
            s = 60;
            l = 10;

            sunBottom = -20;
            // Moon Arc
            if (progress < 0.5) {
                moonBottom = -10 + (progress * 2 * 80);
            } else {
                moonBottom = 70 - ((progress - 0.5) * 2 * 80);
            }

            starOpacity = 1;
            textCol = '#eee';
            cardBg = 'rgba(30, 30, 30, 0.8)';
        }

        document.documentElement.style.setProperty('--sky-color', `hsl(${h}, ${s}%, ${l}%)`);
        document.documentElement.style.setProperty('--sun-pos-y', `${sunBottom}vh`);
        document.documentElement.style.setProperty('--moon-pos-y', `${moonBottom}vh`);
        document.documentElement.style.setProperty('--star-opacity', starOpacity);
        document.documentElement.style.setProperty('--text-color', textCol);
        document.documentElement.style.setProperty('--card-bg', cardBg);
    }

    // Listeners
    window.addEventListener('scroll', updateTime);
    window.addEventListener('resize', updateTime);

    // Wake up button
    const wakeUpBtn = document.querySelector('.wake-up-btn');
    if (wakeUpBtn) {
        wakeUpBtn.addEventListener('click', () => {
            // Simple interaction, scroll to next section
            document.getElementById('late-morning').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Init
    updateTime();
});
