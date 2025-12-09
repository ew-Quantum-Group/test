// Simulate loading progress
const progressBar = document.getElementById('progressBar');
let progress = 0;

const progressInterval = setInterval(() => {
    progress += Math.random() * 10;
    
    if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        
        // Hide loader and show main content
        setTimeout(() => {
            document.getElementById('loader').classList.add('hidden');
            document.getElementById('mainContainer').classList.add('visible');
        }, 400);
    }
    progressBar.style.width = `${progress}%`;
}, 200);

// Button interaction with original ripple effect
const startButton = document.getElementById('startButton');
const transitionOverlay = document.getElementById('transitionOverlay');
const DESTINATION_URL = "https://edu-well.netlify.app/quizqcm/svtapp";

startButton.addEventListener('click', function(e) {
    // Add ripple effect
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    this.appendChild(ripple);

    // Get click position
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Position ripple
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 600);

    // Button press effect
    startButton.style.transform = 'translateY(0)';
    
    // Show transition overlay
    setTimeout(() => {
        transitionOverlay.classList.add('active');
    }, 300);

    // Navigate after transition
    setTimeout(() => {
        window.location.href = DESTINATION_URL;
    }, 600);
});

// Button hover effects
startButton.addEventListener('mouseenter', () => {
    startButton.style.transform = 'translateY(-2px)';
});

startButton.addEventListener('mouseleave', () => {
    if (!startButton.classList.contains('clicked')) {
        startButton.style.transform = 'translateY(0)';
    }
});

// Nav buttons hover effects
const navButtons = document.querySelectorAll('.nav-button');
navButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-1px)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
    });
});

// Feature card hover effects
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// NEW POP-UP FUNCTIONS
function openPopup(popupId) {
    const overlay = document.getElementById('popupOverlay');
    const popup = document.getElementById(popupId);
    
    overlay.classList.add('active');
    popup.classList.add('active');
    
    // Prevent body scroll when popup is open
    document.body.style.overflow = 'hidden';
}

function closePopup(popupId) {
    const overlay = document.getElementById('popupOverlay');
    const popup = document.getElementById(popupId);
    
    popup.classList.remove('active');
    
    // Close overlay after popup animation
    setTimeout(() => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }, 300);
}

// Close popup when clicking overlay
document.getElementById('popupOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        const activePopup = document.querySelector('.popup.active');
        if (activePopup) {
            closePopup(activePopup.id);
        }
    }
});

// Close popup with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activePopup = document.querySelector('.popup.active');
        if (activePopup) {
            closePopup(activePopup.id);
        }
    }
});

// Responsive adjustments
window.addEventListener('resize', () => {
    const container = document.getElementById('mainContainer');
    if (window.innerWidth < 768) {
        container.style.padding = '15px';
    } else {
        container.style.padding = '24px';
    }
});

// PWA: Add to Homescreen prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    console.log('PWA: Ready to install');
});

// Listen for app installed event
window.addEventListener('appinstalled', (evt) => {
    console.log('PWA: App was installed');
});