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
        const errorMessageEl = document.getElementById('errorMessage');
        errorMessageEl.textContent = message;
        errorModal.style.display = 'flex';

        // Auto-hide after 5 seconds for non-critical errors
        if (!message.includes('blocked') && !message.includes('denied')) {
            setTimeout(() => {
                errorModal.style.display = 'none';
            }, 5000);
        }
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
     * Shows the Asterisk connection modal
     * @param {Function} callback - Function to call when user acknowledges
     */
    showAsteriskKeysNeededModal: function(callback) {
        this.asteriskKeysCallback = callback;

        // Create the modal if it doesn't exist
        let asteriskModal = document.getElementById('asteriskKeysModal');

        if (!asteriskModal) {
            asteriskModal = document.createElement('div');
            asteriskModal.id = 'asteriskKeysModal';
            asteriskModal.className = 'modal';

            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';

            const closeBtn = document.createElement('span');
            closeBtn.className = 'close-modal';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = () => {
                asteriskModal.style.display = 'none';
            };

            const heading = document.createElement('h2');
            heading.innerHTML = '<i class="fas fa-key"></i> Asterisk Connection Details';

            const message = document.createElement('p');
            message.innerHTML = 'To make phone calls using Asterisk, you need the following connection details:';

            const keysList = document.createElement('ul');
            keysList.innerHTML = `
                <li><strong>ASTERISK_HOST</strong> - The hostname or IP address of your Asterisk server</li>
                <li><strong>ASTERISK_PORT</strong> - The AMI (Asterisk Manager Interface) port (default: 5038)</li>
                <li><strong>ASTERISK_USERNAME</strong> - Your Asterisk manager username</li>
                <li><strong>ASTERISK_SECRET</strong> - Your Asterisk manager secret/password</li>
                <li><strong>ASTERISK_CONTEXT</strong> - The Asterisk dialplan context to use (default: from-internal)</li>
            `;

            const setupLink = document.createElement('p');
            setupLink.innerHTML = 'You need to have access to an Asterisk PBX server. Learn how to set up Asterisk at <a href="https://www.asterisk.org/get-started/" target="_blank">asterisk.org</a>';

            const formMessage = document.createElement('p');
            formMessage.textContent = 'After you have your Asterisk server configured, return here to connect to it.';

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'form-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'secondary-btn';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => {
                asteriskModal.style.display = 'none';
            };

            const proceedBtn = document.createElement('button');
            proceedBtn.className = 'primary-btn';
            proceedBtn.textContent = 'I have Asterisk connection details';
            proceedBtn.onclick = () => {
                asteriskModal.style.display = 'none';
                // Proceed with the callback
                if (typeof this.asteriskKeysCallback === 'function') {
                    this.asteriskKeysCallback();
                }
            };

            buttonContainer.appendChild(cancelBtn);
            buttonContainer.appendChild(proceedBtn);

            modalContent.appendChild(closeBtn);
            modalContent.appendChild(heading);
            modalContent.appendChild(message);
            modalContent.appendChild(keysList);
            modalContent.appendChild(setupLink);
            modalContent.appendChild(formMessage);
            modalContent.appendChild(buttonContainer);

            asteriskModal.appendChild(modalContent);
            document.body.appendChild(asteriskModal);
        }

        // Show the modal
        asteriskModal.style.display = 'flex';
    },

    /**
     * Alias for the Asterisk modal (for backward compatibility)
     * @param {Function} callback - Function to call when user acknowledges
     */
    showTwilioKeysNeededModal: function(callback) {
        this.showAsteriskKeysNeededModal(callback);
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
        try {
            // Check for Web Audio API
            const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;

            // Check for getUserMedia API
            const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

            // Check for required audio processing features
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContext();
            const hasRequiredNodes = !!(
                context.createGain &&
                context.createAnalyser &&
                context.createBiquadFilter
            );
            context.close();

            // Check for modern browser features
            const hasRequiredAPIs = !!(
                window.Float32Array &&
                window.Uint8Array &&
                window.requestAnimationFrame
            );

            return hasWebAudio && hasGetUserMedia && hasRequiredNodes && hasRequiredAPIs;
        } catch (e) {
            console.error('Browser compatibility check failed:', e);
            return false;
        }
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