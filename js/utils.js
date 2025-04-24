/**
 * Utility functions for the voice changer application
 */

const Utils = {
    // Success callback function reference
    twilioKeysCallback: null,
    
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
     * Shows a success message in a modal
     * @param {string} message - The success message to display
     */
    showSuccess: function(message) {
        this.showSuccessMessage(message);
    },
    
    /**
     * Shows a success message in a modal (same as showSuccess for compatibility)
     * @param {string} message - The success message to display
     */
    showSuccessMessage: function(message) {
        // Check if success modal exists, create if not
        let successModal = document.getElementById('successModal');
        
        if (!successModal) {
            successModal = document.createElement('div');
            successModal.id = 'successModal';
            successModal.className = 'modal';
            successModal.style.display = 'none';
            
            const successContent = document.createElement('div');
            successContent.className = 'modal-content success';
            
            const closeBtn = document.createElement('span');
            closeBtn.className = 'close-modal';
            closeBtn.innerHTML = '&times;';
            
            const heading = document.createElement('h3');
            heading.textContent = 'Success';
            
            const successMessageEl = document.createElement('p');
            successMessageEl.id = 'successMessage';
            
            successContent.appendChild(closeBtn);
            successContent.appendChild(heading);
            successContent.appendChild(successMessageEl);
            
            successModal.appendChild(successContent);
            document.body.appendChild(successModal);
            
            // Add click handlers
            closeBtn.onclick = function() {
                successModal.style.display = 'none';
            };
            
            window.addEventListener('click', function(event) {
                if (event.target === successModal) {
                    successModal.style.display = 'none';
                }
            });
        }
        
        // Update message and show modal
        const successMessageEl = document.getElementById('successMessage');
        successMessageEl.textContent = message;
        successModal.style.display = 'flex';
        
        // Auto-close after 3 seconds
        setTimeout(function() {
            successModal.style.display = 'none';
        }, 3000);
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
     * Shows the Twilio keys needed modal
     * @param {Function} callback - Function to call when user acknowledges
     */
    showTwilioKeysNeededModal: function(callback) {
        this.twilioKeysCallback = callback;
        
        // Create the modal if it doesn't exist
        let twilioModal = document.getElementById('twilioKeysModal');
        
        if (!twilioModal) {
            twilioModal = document.createElement('div');
            twilioModal.id = 'twilioKeysModal';
            twilioModal.className = 'modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const closeBtn = document.createElement('span');
            closeBtn.className = 'close-modal';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = () => {
                twilioModal.style.display = 'none';
            };
            
            const heading = document.createElement('h2');
            heading.innerHTML = '<i class="fas fa-key"></i> Twilio Account Needed';
            
            const message = document.createElement('p');
            message.innerHTML = 'To make phone calls, you need a Twilio account with the following credentials:';
            
            const keysList = document.createElement('ul');
            keysList.innerHTML = `
                <li><strong>TWILIO_ACCOUNT_SID</strong> - Your Twilio account identifier</li>
                <li><strong>TWILIO_AUTH_TOKEN</strong> - Your Twilio authentication token</li>
                <li><strong>TWILIO_PHONE_NUMBER</strong> - A Twilio phone number to make calls from</li>
            `;
            
            const signupLink = document.createElement('p');
            signupLink.innerHTML = 'You can sign up for a Twilio account at <a href="https://www.twilio.com/try-twilio" target="_blank">www.twilio.com</a>';
            
            const formMessage = document.createElement('p');
            formMessage.textContent = 'After you have these credentials, return here to connect your account.';
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'form-actions';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'secondary-btn';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => {
                twilioModal.style.display = 'none';
            };
            
            const proceedBtn = document.createElement('button');
            proceedBtn.className = 'primary-btn';
            proceedBtn.textContent = 'I have Twilio keys';
            proceedBtn.onclick = () => {
                twilioModal.style.display = 'none';
                // Proceed with the callback
                if (typeof this.twilioKeysCallback === 'function') {
                    this.twilioKeysCallback();
                }
            };
            
            buttonContainer.appendChild(cancelBtn);
            buttonContainer.appendChild(proceedBtn);
            
            modalContent.appendChild(closeBtn);
            modalContent.appendChild(heading);
            modalContent.appendChild(message);
            modalContent.appendChild(keysList);
            modalContent.appendChild(signupLink);
            modalContent.appendChild(formMessage);
            modalContent.appendChild(buttonContainer);
            
            twilioModal.appendChild(modalContent);
            document.body.appendChild(twilioModal);
        }
        
        // Show the modal
        twilioModal.style.display = 'flex';
    },
    
    /**
     * Updates the UI status indicators
     * @param {boolean} isActive - Whether the microphone is active
     */
    updateStatusIndicators: function(isActive) {
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
     * Creates a DOM element for a voice item (custom or celebrity)
     * @param {Object} voice - Voice object with id, name, accent, etc.
     * @param {Function} onUse - Callback when "Use" button is clicked
     * @param {Function} onDelete - Callback when "Delete" button is clicked (can be null)
     * @param {Function} onCall - Callback when "Call" button is clicked
     * @returns {HTMLElement} The voice item element
     */
    createVoiceItem: function(voice, onUse, onDelete, onCall) {
        const voiceItem = document.createElement('div');
        voiceItem.className = 'voice-item';
        voiceItem.dataset.id = voice.id;
        
        // Add a class for celebrity voices
        if (voice.is_celebrity) {
            voiceItem.classList.add('celebrity-voice');
        }
        
        const voiceInfo = document.createElement('div');
        voiceInfo.className = 'voice-info';
        
        const voiceName = document.createElement('h4');
        voiceName.textContent = voice.name;
        
        // Add a badge for the voice type
        const voiceType = document.createElement('span');
        voiceType.className = 'voice-type';
        voiceType.textContent = voice.type || 'custom';
        if (voice.type === 'celebrity') {
            voiceType.classList.add('celebrity');
        } else if (voice.type === 'fictional') {
            voiceType.classList.add('fictional');
        } else if (voice.type === 'ai') {
            voiceType.classList.add('ai');
        }
        
        const voiceAccent = document.createElement('p');
        voiceAccent.textContent = `Accent: ${voice.accent || 'neutral'}`;
        
        voiceInfo.appendChild(voiceName);
        voiceInfo.appendChild(voiceType);
        voiceInfo.appendChild(voiceAccent);
        
        const voiceActions = document.createElement('div');
        voiceActions.className = 'voice-actions';
        
        const useButton = document.createElement('button');
        useButton.innerHTML = '<i class="fas fa-play"></i>';
        useButton.title = 'Use this voice';
        useButton.onclick = () => onUse(voice);
        
        const callButton = document.createElement('button');
        callButton.className = 'call-btn';
        callButton.innerHTML = '<i class="fas fa-phone"></i>';
        callButton.title = 'Call with this voice';
        callButton.onclick = () => onCall(voice.id);
        
        voiceActions.appendChild(useButton);
        voiceActions.appendChild(callButton);
        
        // Only add delete button for custom (non-celebrity) voices
        if (onDelete && !voice.is_celebrity) {
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.title = 'Delete this voice';
            deleteButton.className = 'delete-btn';
            deleteButton.onclick = () => onDelete(voice.id);
            voiceActions.appendChild(deleteButton);
        }
        
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
     * Format a phone number as it's being entered
     * @param {string} input - The raw input phone number
     * @returns {string} The formatted phone number
     */
    formatPhoneNumber: function(input) {
        // Strip non-digit characters
        const numbers = input.replace(/\D/g, '');
        
        // Format based on length
        if (numbers.length < 4) {
            return numbers;
        } else if (numbers.length < 7) {
            return `(${numbers.slice(0,3)}) ${numbers.slice(3)}`;
        } else if (numbers.length < 11) {
            return `(${numbers.slice(0,3)}) ${numbers.slice(3,6)}-${numbers.slice(6)}`;
        } else {
            return `+${numbers.slice(0,1)} (${numbers.slice(1,4)}) ${numbers.slice(4,7)}-${numbers.slice(7,11)}`;
        }
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
