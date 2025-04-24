/**
 * Main application for the Real-time Voice Changer
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create main components
    const audioProcessor = new AudioProcessor();
    const voiceTransformer = new VoiceTransformer();
    
    // UI elements
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const pitchSlider = document.getElementById('pitchSlider');
    const pitchValue = document.getElementById('pitchValue');
    const formantSlider = document.getElementById('formantSlider');
    const formantValue = document.getElementById('formantValue');
    const accentSelect = document.getElementById('accentSelect');
    const effectSelect = document.getElementById('effectSelect');
    const voiceUploadForm = document.getElementById('voiceUploadForm');
    const voiceFile = document.getElementById('voiceFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const customVoicesList = document.getElementById('customVoicesList');
    const celebrityVoicesList = document.getElementById('celebrityVoicesList');
    const phoneCallForm = document.getElementById('phoneCallForm');
    
    let selectedVoiceId = null; // Track the currently selected voice for calls
    
    // Check browser compatibility
    if (!Utils.checkBrowserCompatibility()) {
        Utils.showError('Your browser does not support all required features. Please use a modern browser like Chrome, Firefox, or Edge.');
        startButton.disabled = true;
        return;
    }
    
    // Initialize components
    async function init() {
        // Initialize audio processor
        const audioInitSuccess = await audioProcessor.initialize();
        
        // Initialize voice transformer
        const transformerInitSuccess = await voiceTransformer.initialize();
        
        if (!audioInitSuccess || !transformerInitSuccess) {
            Utils.showError('Failed to initialize voice changer. Please refresh the page and try again.');
            startButton.disabled = true;
            return;
        }
        
        // Load voices to UI
        loadVoicesToUI();
        
        // Initialize accent select dropdown
        initializeAccentOptions();
        
        // Enable start button
        startButton.disabled = false;
    }
    
    // Initialize accent options in the dropdown
    function initializeAccentOptions() {
        // Get available accents from voice transformer
        const accents = voiceTransformer.getAvailableAccents();
        
        // Clear existing options (except the first one)
        while (accentSelect.options.length > 1) {
            accentSelect.remove(1);
        }
        
        // Add each accent to the dropdown
        accents.forEach(accent => {
            const option = document.createElement('option');
            option.value = accent;
            option.textContent = accent.charAt(0).toUpperCase() + accent.slice(1);
            accentSelect.appendChild(option);
        });
        
        // Also update the accent type select in the upload form
        const accentType = document.getElementById('accentType');
        
        // Clear existing options (except the first one)
        while (accentType.options.length > 1) {
            accentType.remove(1);
        }
        
        // Add each accent to the dropdown
        accents.forEach(accent => {
            const option = document.createElement('option');
            option.value = accent;
            option.textContent = accent.charAt(0).toUpperCase() + accent.slice(1);
            accentType.appendChild(option);
        });
    }
    
    // Start the voice changer
    async function startVoiceChanger() {
        try {
            // Check if we already have permission
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            
            if (permissionStatus.state === 'denied') {
                Utils.showError('Microphone access is blocked. Please allow access in your browser settings.');
                return;
            }
            
            // Show permission modal first if not granted
            if (permissionStatus.state === 'prompt') {
                Utils.showPermissionModal(async () => {
                    await initializeAudioSystem();
                });
            } else {
                await initializeAudioSystem();
            }
        } catch (error) {
            console.error('Permission check failed:', error);
            Utils.showError('Failed to check microphone permissions: ' + error.message);
        }
    }
    
    async function initializeAudioSystem() {
        try {
            // Initialize Tone.js
            await Tone.start();
            
            // Resume audio context (needed due to autoplay policies)
            await audioProcessor.resumeAudioContext();
            
            // Start microphone
            const success = await audioProcessor.startMicrophone();
            
            if (success) {
                console.log('Voice changer started successfully');
                
                // Apply initial settings
                audioProcessor.setPitch(parseInt(pitchSlider.value));
                audioProcessor.setFormant(parseInt(formantSlider.value));
                audioProcessor.applyAccent(accentSelect.value);
                audioProcessor.setEffect(effectSelect.value);
                
                // Update UI
                Utils.updateStatusIndicators(true);
                startButton.classList.add('hidden');
                stopButton.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error initializing audio:', error);
            Utils.showError('Failed to initialize audio system: ' + error.message);
        }
    }
    
    // Stop the voice changer
    function stopVoiceChanger() {
        audioProcessor.stopMicrophone();
        console.log('Voice changer stopped');
        
        // Update UI
        Utils.updateStatusIndicators(false);
        startButton.classList.remove('hidden');
        stopButton.classList.add('hidden');
    }
    
    // Load voices to the UI
    function loadVoicesToUI() {
        // Load custom voices
        loadCustomVoicesToUI();
        
        // Load celebrity voices
        loadCelebrityVoicesToUI();
    }
    
    // Load custom voices to the UI
    function loadCustomVoicesToUI() {
        // Clear the list
        if (customVoicesList) {
            customVoicesList.innerHTML = '';
            
            // Get custom voices
            const voices = voiceTransformer.getCustomVoices();
            
            if (voices.length === 0) {
                customVoicesList.innerHTML = '<div class="no-voices">No custom voices available. Upload one to get started!</div>';
                return;
            }
            
            // Add each voice to the list
            voices.forEach(voice => {
                const voiceItem = Utils.createVoiceItem(
                    voice,
                    (voice) => useVoice(voice),
                    (voiceId) => deleteCustomVoice(voiceId),
                    (voiceId) => startPhoneCall(voiceId)
                );
                
                customVoicesList.appendChild(voiceItem);
            });
        }
    }
    
    // Load celebrity voices to the UI
    function loadCelebrityVoicesToUI() {
        // Clear the list
        if (celebrityVoicesList) {
            celebrityVoicesList.innerHTML = '';
            
            // Get celebrity voices
            const voices = voiceTransformer.getCelebrityVoices();
            console.log(`Loading ${voices.length} celebrity voices to UI`);
            
            if (voices.length === 0) {
                console.log('No celebrity voices found, showing message');
                celebrityVoicesList.innerHTML = '<div class="no-voices">No celebrity voices available.</div>';
                return;
            }
            
            // Add each voice to the list
            voices.forEach(voice => {
                console.log(`Creating UI for celebrity voice: ${voice.name} (${voice.type})`);
                voice.is_celebrity = true; // Ensure this property is set
                
                const voiceItem = Utils.createVoiceItem(
                    voice,
                    (voice) => useVoice(voice),
                    null, // No delete option for celebrity voices
                    (voiceId) => startPhoneCall(voiceId)
                );
                
                celebrityVoicesList.appendChild(voiceItem);
            });
            
            console.log('Finished loading celebrity voices to UI');
        } else {
            console.error('Celebrity voices list element not found in the DOM');
        }
    }
    
    // Use a voice (custom or celebrity)
    function useVoice(voice) {
        if (!audioProcessor.isActive) {
            Utils.showError('Please start the microphone first before applying a voice.');
            return;
        }
        
        // Remember selected voice for call
        selectedVoiceId = voice.id;
        
        // Apply the voice
        audioProcessor.applyCustomVoice(voice);
        
        // Update UI to match voice parameters
        if (voice.parameters) {
            // Update pitch
            if (voice.parameters.pitch !== undefined) {
                pitchSlider.value = voice.parameters.pitch;
                pitchValue.textContent = voice.parameters.pitch;
            }
            
            // Update formant
            if (voice.parameters.formant !== undefined) {
                formantSlider.value = voice.parameters.formant;
                formantValue.textContent = voice.parameters.formant;
            }
            
            // Update effect
            if (voice.parameters.effect !== undefined) {
                effectSelect.value = voice.parameters.effect;
            }
        }
        
        // Update accent
        if (voice.accent) {
            // Check if the accent is in our list
            if (accentSelect.querySelector(`option[value="${voice.accent}"]`)) {
                accentSelect.value = voice.accent;
            }
        }
        
        // Update selected voice in phone call form
        if (phoneCallForm) {
            const selectedVoiceDisplay = document.getElementById('selectedVoiceDisplay');
            if (selectedVoiceDisplay) {
                selectedVoiceDisplay.textContent = voice.name;
                selectedVoiceDisplay.classList.remove('text-muted');
            }
        }
    }
    
    // Start a phone call with the selected voice
    async function startPhoneCall(voiceId) {
        // If a specific voice ID was provided, use that
        if (voiceId) {
            selectedVoiceId = voiceId;
            
            // Update selected voice in phone call form
            if (phoneCallForm) {
                const voice = voiceTransformer.getVoice(voiceId);
                if (voice) {
                    const selectedVoiceDisplay = document.getElementById('selectedVoiceDisplay');
                    if (selectedVoiceDisplay) {
                        selectedVoiceDisplay.textContent = voice.name;
                        selectedVoiceDisplay.classList.remove('text-muted');
                    }
                }
            }
            
            // If the phone call dialog is not open, open it
            const phoneCallModal = document.getElementById('phoneCallModal');
            if (phoneCallModal && phoneCallModal.style.display !== 'block') {
                phoneCallModal.style.display = 'block';
            }
            
            return;
        }
        
        // Check if a phone number is provided
        const phoneNumber = document.getElementById('phoneNumber').value;
        if (!phoneNumber) {
            Utils.showError('Please enter a phone number to call.');
            return;
        }
        
        // Check if a voice is selected
        if (!selectedVoiceId) {
            Utils.showError('Please select a voice to use for the call.');
            return;
        }
        
        try {
            // Show loading state
            const callBtn = document.getElementById('callBtn');
            const originalBtnText = callBtn.innerHTML;
            callBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calling...';
            callBtn.disabled = true;
            
            // Start the call
            const result = await voiceTransformer.startPhoneCall(phoneNumber, selectedVoiceId);
            
            // Reset button
            callBtn.innerHTML = originalBtnText;
            callBtn.disabled = false;
            
            if (result.success) {
                // Show success message
                Utils.showSuccessMessage(`Call started successfully! Call ID: ${result.call_sid}`);
                
                // Close the phone call modal
                const phoneCallModal = document.getElementById('phoneCallModal');
                if (phoneCallModal) {
                    phoneCallModal.style.display = 'none';
                }
            } else {
                Utils.showError(result.message || 'Failed to start call.');
            }
        } catch (error) {
            document.getElementById('callBtn').innerHTML = originalBtnText;
            document.getElementById('callBtn').disabled = false;
            Utils.showError('Failed to start call: ' + error.message);
        }
    }
    
    // Delete a custom voice
    async function deleteCustomVoice(voiceId) {
        try {
            const result = await voiceTransformer.deleteCustomVoice(voiceId);
            
            if (result.success) {
                // Reload voices list
                loadCustomVoicesToUI();
            } else {
                Utils.showError(result.message || 'Failed to delete voice.');
            }
        } catch (error) {
            Utils.showError('Failed to delete voice: ' + error.message);
        }
    }
    
    // Update file name display
    function updateFileNameDisplay() {
        if (voiceFile.files.length > 0) {
            fileNameDisplay.textContent = voiceFile.files[0].name;
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    }
    
    // Event listeners
    
    // Start button
    if (startButton) {
        startButton.addEventListener('click', startVoiceChanger);
    }
    
    // Stop button
    if (stopButton) {
        stopButton.addEventListener('click', stopVoiceChanger);
    }
    
    // Pitch slider
    if (pitchSlider) {
        pitchSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            pitchValue.textContent = value;
            audioProcessor.setPitch(value);
        });
    }
    
    // Formant slider
    if (formantSlider) {
        formantSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            formantValue.textContent = value;
            audioProcessor.setFormant(value);
        });
    }
    
    // Accent select
    if (accentSelect) {
        accentSelect.addEventListener('change', function() {
            audioProcessor.applyAccent(this.value);
        });
    }
    
    // Effect select
    if (effectSelect) {
        effectSelect.addEventListener('change', function() {
            audioProcessor.setEffect(this.value);
        });
    }
    
    // Voice file selection
    if (voiceFile) {
        voiceFile.addEventListener('change', updateFileNameDisplay);
    }
    
    // Voice upload form
    if (voiceUploadForm) {
        voiceUploadForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            if (!voiceFile.files.length) {
                Utils.showError('Please select a voice file to upload.');
                return;
            }
            
            const voiceName = document.getElementById('voiceName').value;
            const accentType = document.getElementById('accentType').value;
            
            if (!voiceName || !accentType) {
                Utils.showError('Please provide both a name and accent type for the voice.');
                return;
            }
            
            // Create form data
            const formData = new FormData();
            formData.append('voiceFile', voiceFile.files[0]);
            formData.append('voiceName', voiceName);
            formData.append('accentType', accentType);
            
            try {
                // Show loading state
                const uploadBtn = document.getElementById('uploadBtn');
                const originalBtnText = uploadBtn.innerHTML;
                uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                uploadBtn.disabled = true;
                
                // Upload the voice
                const result = await voiceTransformer.addCustomVoice(formData);
                
                // Reset form
                voiceUploadForm.reset();
                fileNameDisplay.textContent = 'No file chosen';
                
                // Reset button
                uploadBtn.innerHTML = originalBtnText;
                uploadBtn.disabled = false;
                
                if (result.success) {
                    // Reload voices list
                    loadCustomVoicesToUI();
                } else {
                    Utils.showError(result.message || 'Failed to upload voice.');
                }
            } catch (error) {
                document.getElementById('uploadBtn').innerHTML = originalBtnText;
                document.getElementById('uploadBtn').disabled = false;
                Utils.showError('Failed to upload voice: ' + error.message);
            }
        });
    }
    
    // Phone call form
    if (phoneCallForm) {
        phoneCallForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            startPhoneCall();
        });
    }
    
    // Call cancel button
    const callCancelBtn = document.getElementById('callCancelBtn');
    if (callCancelBtn) {
        callCancelBtn.addEventListener('click', function() {
            const phoneCallModal = document.getElementById('phoneCallModal');
            if (phoneCallModal) {
                phoneCallModal.style.display = 'none';
            }
        });
    }
    
    // Voice selector buttons
    const voiceSelectorBtns = document.querySelectorAll('.voice-selector-btn');
    voiceSelectorBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            voiceSelectorBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show the corresponding voice list
            const targetId = this.getAttribute('data-target');
            const voiceLists = document.querySelectorAll('.voice-list');
            
            voiceLists.forEach(list => {
                if (list.id === targetId) {
                    list.classList.remove('hidden');
                } else {
                    list.classList.add('hidden');
                }
            });
        });
    });
    
    // Call button outside of form (for voice list)
    const callVoiceBtn = document.getElementById('callVoiceBtn');
    if (callVoiceBtn) {
        callVoiceBtn.addEventListener('click', function() {
            const phoneCallModal = document.getElementById('phoneCallModal');
            if (phoneCallModal) {
                phoneCallModal.style.display = 'block';
            }
        });
    }
    
    // Initialize the application
    init();
});
