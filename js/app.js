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
    const voicesList = document.getElementById('voicesList');
    
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
        
        // Load custom voices to UI
        loadCustomVoicesToUI();
        
        // Enable start button
        startButton.disabled = false;
    }
    
    // Start the voice changer
    async function startVoiceChanger() {
        // Show permission modal first
        Utils.showPermissionModal(async () => {
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
            }
        });
    }
    
    // Stop the voice changer
    function stopVoiceChanger() {
        audioProcessor.stopMicrophone();
        console.log('Voice changer stopped');
    }
    
    // Load custom voices to the UI
    function loadCustomVoicesToUI() {
        // Clear the list
        voicesList.innerHTML = '';
        
        // Get all voices
        const voices = voiceTransformer.getAllVoices();
        
        if (voices.length === 0) {
            voicesList.innerHTML = '<div class="no-voices">No custom voices available. Upload one to get started!</div>';
            return;
        }
        
        // Add each voice to the list
        voices.forEach(voice => {
            const voiceItem = Utils.createVoiceItem(
                voice,
                (voice) => useCustomVoice(voice),
                (voiceId) => deleteCustomVoice(voiceId)
            );
            
            voicesList.appendChild(voiceItem);
        });
    }
    
    // Use a custom voice
    function useCustomVoice(voice) {
        if (!audioProcessor.isActive) {
            Utils.showError('Please start the microphone first before applying a custom voice.');
            return;
        }
        
        // Apply the custom voice
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
    startButton.addEventListener('click', startVoiceChanger);
    
    // Stop button
    stopButton.addEventListener('click', stopVoiceChanger);
    
    // Pitch slider
    pitchSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        pitchValue.textContent = value;
        audioProcessor.setPitch(value);
    });
    
    // Formant slider
    formantSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        formantValue.textContent = value;
        audioProcessor.setFormant(value);
    });
    
    // Accent select
    accentSelect.addEventListener('change', function() {
        audioProcessor.applyAccent(this.value);
    });
    
    // Effect select
    effectSelect.addEventListener('change', function() {
        audioProcessor.setEffect(this.value);
    });
    
    // Voice file selection
    voiceFile.addEventListener('change', updateFileNameDisplay);
    
    // Voice upload form
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
    
    // Initialize the application
    init();
});
