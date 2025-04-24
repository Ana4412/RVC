/**
 * Utility functions for the voice changer application
 */

const Utils = {
    /**
     * Shows an error modal with a message
     * @param {string} message - The error message to display
     */
    showError: function(message) {
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
        
        // Close modal when clicking the X
        const closeBtn = errorModal.querySelector('.close-modal');
        closeBtn.onclick = function() {
            errorModal.style.display = 'none';
        };
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target === errorModal) {
                errorModal.style.display = 'none';
            }
        };
    },
    
    /**
     * Shows the microphone permission modal
     * @param {Function} callback - Function to call when user acknowledges
     */
    showPermissionModal: function(callback) {
        const permissionModal = document.getElementById('permissionModal');
        const okButton = document.getElementById('permissionOkBtn');
        
        permissionModal.style.display = 'flex';
        
        okButton.onclick = function() {
            permissionModal.style.display = 'none';
            if (typeof callback === 'function') {
                callback();
            }
        };
    },
    
    /**
     * Updates the UI status indicators
     * @param {boolean} isActive - Whether the microphone is active
     */
    updateStatus: function(isActive) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        
        if (isActive) {
            statusDot.classList.remove('inactive');
            statusDot.classList.add('active');
            statusText.textContent = 'Microphone active';
            startButton.disabled = true;
            stopButton.disabled = false;
        } else {
            statusDot.classList.remove('active');
            statusDot.classList.add('inactive');
            statusText.textContent = 'Microphone inactive';
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    },
    
    /**
     * Creates a DOM element for a custom voice
     * @param {Object} voice - Voice object with id, name, and accent
     * @param {Function} onUse - Callback when "Use" button is clicked
     * @param {Function} onDelete - Callback when "Delete" button is clicked
     * @returns {HTMLElement} The voice item element
     */
    createVoiceItem: function(voice, onUse, onDelete) {
        const voiceItem = document.createElement('div');
        voiceItem.className = 'voice-item';
        voiceItem.dataset.id = voice.id;
        
        const voiceInfo = document.createElement('div');
        voiceInfo.className = 'voice-info';
        
        const voiceName = document.createElement('h4');
        voiceName.textContent = voice.name;
        
        const voiceAccent = document.createElement('p');
        voiceAccent.textContent = `Accent: ${voice.accent}`;
        
        voiceInfo.appendChild(voiceName);
        voiceInfo.appendChild(voiceAccent);
        
        const voiceActions = document.createElement('div');
        voiceActions.className = 'voice-actions';
        
        const useButton = document.createElement('button');
        useButton.innerHTML = '<i class="fas fa-play"></i>';
        useButton.title = 'Use this voice';
        useButton.onclick = () => onUse(voice);
        
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = 'Delete this voice';
        deleteButton.onclick = () => onDelete(voice.id);
        
        voiceActions.appendChild(useButton);
        voiceActions.appendChild(deleteButton);
        
        voiceItem.appendChild(voiceInfo);
        voiceItem.appendChild(voiceActions);
        
        return voiceItem;
    },
    
    /**
     * Converts audio data to a compatible format
     * @param {ArrayBuffer} audioData - Raw audio data
     * @returns {Float32Array} Processed audio data
     */
    convertAudioData: function(audioData) {
        // In a real implementation, this would convert audio formats as needed
        // For simplicity, we're just returning a Float32Array
        return new Float32Array(audioData);
    },
    
    /**
     * Checks if the browser supports all required APIs
     * @returns {boolean} Whether the browser is compatible
     */
    checkBrowserCompatibility: function() {
        // Check for Web Audio API
        const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
        
        // Check for getUserMedia API
        const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        
        // Check for Audio Worklet API (for advanced processing)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const hasAudioWorklet = !!(AudioContext && AudioContext.prototype.audioWorklet);
        
        return hasWebAudio && hasGetUserMedia;
    },
    
    /**
     * Throttles a function to limit how often it can be called
     * @param {Function} func - The function to throttle
     * @param {number} limit - The time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle: function(func, limit) {
        let lastFunc;
        let lastRan;
        
        return function() {
            const context = this;
            const args = arguments;
            
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }
};
