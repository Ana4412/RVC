/**
 * Audio Processor for the Real-time Voice Changer
 * Handles microphone input, audio processing, and output
 */

class AudioProcessor {
    constructor() {
        // Audio context and nodes
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.processor = null;
        this.outputNode = null;
        
        // Stream references
        this.microphoneStream = null;
        this.destinationStream = null;
        
        // Canvas for visualization
        this.canvas = null;
        this.canvasCtx = null;
        
        // Visualization state
        this.isVisualizing = false;
        this.visualizationData = null;
        
        // Custom voice parameters
        this.pitch = 0;
        this.formant = 0;
        this.accent = 'neutral';
        this.effect = 'none';
        
        // Custom voice model (if loaded)
        this.customVoiceModel = null;
        
        // Flag to check if processor is active
        this.isActive = false;
        
        // Initialize visualization array
        this.initVisualization();
    }
    
    /**
     * Initialize the audio context and set up nodes
     */
    async initialize() {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Set up analyser for visualization
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.visualizationData = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Create output node (where processed audio will be sent)
            this.outputNode = this.audioContext.createGain();
            this.outputNode.gain.value = 1.0;
            
            // Connect analyser to output
            this.outputNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Get canvas reference for visualization
            this.canvas = document.getElementById('audioVisualizer');
            this.canvasCtx = this.canvas.getContext('2d');
            
            // Set canvas dimensions based on container size
            this.resizeCanvas();
            window.addEventListener('resize', this.resizeCanvas.bind(this));
            
            return true;
        } catch (error) {
            console.error('Error initializing audio processor:', error);
            Utils.showError('Failed to initialize audio system: ' + error.message);
            return false;
        }
    }
    
    /**
     * Resize the canvas to match its container
     */
    resizeCanvas() {
        if (this.canvas) {
            const containerWidth = this.canvas.parentElement.clientWidth;
            this.canvas.width = containerWidth;
            this.canvas.height = 150;
        }
    }
    
    /**
     * Start capturing audio from the microphone
     */
    async startMicrophone() {
        if (this.isActive) return;
        
        try {
            // Request access to the microphone
            this.microphoneStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            // Create microphone source
            this.microphone = this.audioContext.createMediaStreamSource(this.microphoneStream);
            
            // Create and connect voice transformer node
            await this.setupVoiceTransformer();
            
            // Start visualization
            this.startVisualization();
            
            // Update state
            this.isActive = true;
            Utils.updateStatus(true);
            
            return true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            Utils.showError('Could not access microphone: ' + error.message);
            return false;
        }
    }
    
    /**
     * Set up the voice transformer processing
     */
    async setupVoiceTransformer() {
        try {
            // Set up Tone.js processing
            const pitchShift = new Tone.PitchShift({
                pitch: this.pitch,
                windowSize: 0.1,
                delayTime: 0.05,
                feedback: 0
            }).toDestination();
            
            // Connect microphone to pitch shifter
            this.microphone.connect(pitchShift);
            
            // Connect to output node
            Tone.connect(pitchShift, this.outputNode);
            
            // Create destination stream for use with call apps
            this.destinationStream = this.audioContext.createMediaStreamDestination();
            this.outputNode.connect(this.destinationStream);
            
            return true;
        } catch (error) {
            console.error('Error setting up voice transformer:', error);
            Utils.showError('Failed to set up voice processing: ' + error.message);
            return false;
        }
    }
    
    /**
     * Apply effects based on current settings
     */
    applyEffects() {
        if (!this.isActive) return;
        
        try {
            // Clear existing connections
            this.microphone.disconnect();
            
            // Create new effects chain based on current settings
            let effectsChain = [];
            
            // Add pitch shifter
            const pitchShift = new Tone.PitchShift({
                pitch: this.pitch,
                windowSize: 0.1,
                delayTime: 0.05,
                feedback: 0
            });
            effectsChain.push(pitchShift);
            
            // Apply formant shifting (simplified)
            // In a real app, this would use more sophisticated processing
            const formantFilter = this.audioContext.createBiquadFilter();
            formantFilter.type = "bandpass";
            formantFilter.frequency.value = 1000 + (this.formant * 10);
            formantFilter.Q.value = 1.0;
            
            // Add additional effects based on selection
            switch(this.effect) {
                case 'reverb':
                    const reverb = new Tone.Reverb({
                        decay: 2.0,
                        wet: 0.4
                    });
                    effectsChain.push(reverb);
                    break;
                    
                case 'echo':
                    const delay = new Tone.FeedbackDelay({
                        delayTime: 0.25,
                        feedback: 0.4,
                        wet: 0.5
                    });
                    effectsChain.push(delay);
                    break;
                    
                case 'robot':
                    const bitcrusher = new Tone.BitCrusher({
                        bits: 4
                    });
                    effectsChain.push(bitcrusher);
                    break;
                    
                case 'alien':
                    const phaser = new Tone.Phaser({
                        frequency: 15,
                        octaves: 5,
                        baseFrequency: 1000
                    });
                    const chorus = new Tone.Chorus({
                        frequency: 4,
                        delayTime: 2.5,
                        depth: 0.9
                    });
                    effectsChain.push(phaser, chorus);
                    break;
            }
            
            // Connect all nodes in the chain
            // Start with microphone
            let previousNode = this.microphone;
            
            // Native Web Audio API node for formant
            previousNode.connect(formantFilter);
            previousNode = formantFilter;
            
            // Connect all Tone.js effects in chain
            for (let effect of effectsChain) {
                Tone.connect(previousNode, effect);
                previousNode = effect;
            }
            
            // Connect the last effect to our output
            Tone.connect(previousNode, this.outputNode);
            
            // Ensure we're still connected to the destination stream
            this.outputNode.connect(this.destinationStream);
            
            return true;
        } catch (error) {
            console.error('Error applying effects:', error);
            Utils.showError('Failed to apply audio effects: ' + error.message);
            return false;
        }
    }
    
    /**
     * Apply the selected accent to the voice
     * @param {string} accentType - The type of accent to apply
     */
    applyAccent(accentType) {
        this.accent = accentType;
        
        // In a full implementation, this would load specific accent transformations
        // For this demo, we'll adjust basic parameters based on accent
        
        switch (accentType) {
            case 'british':
                this.setPitch(1);
                this.setFormant(20);
                break;
                
            case 'american':
                this.setPitch(0);
                this.setFormant(0);
                break;
                
            case 'australian':
                this.setPitch(-1);
                this.setFormant(10);
                break;
                
            case 'french':
                this.setPitch(2);
                this.setFormant(30);
                break;
                
            case 'german':
                this.setPitch(-2);
                this.setFormant(-20);
                break;
                
            case 'spanish':
                this.setPitch(1);
                this.setFormant(-10);
                break;
                
            case 'russian':
                this.setPitch(-3);
                this.setFormant(-40);
                break;
                
            case 'indian':
                this.setPitch(2);
                this.setFormant(40);
                break;
                
            default:
                // Reset to neutral
                this.setPitch(0);
                this.setFormant(0);
        }
        
        // Apply the changes
        this.applyEffects();
    }
    
    /**
     * Set the pitch transformation amount
     * @param {number} value - Pitch shift value (-12 to 12 semitones)
     */
    setPitch(value) {
        this.pitch = value;
        if (this.isActive) {
            this.applyEffects();
        }
    }
    
    /**
     * Set the formant transformation amount
     * @param {number} value - Formant shift value (-100 to 100)
     */
    setFormant(value) {
        this.formant = value;
        if (this.isActive) {
            this.applyEffects();
        }
    }
    
    /**
     * Set the audio effect to apply
     * @param {string} effectName - Name of the effect to apply
     */
    setEffect(effectName) {
        this.effect = effectName;
        if (this.isActive) {
            this.applyEffects();
        }
    }
    
    /**
     * Apply a custom voice model
     * @param {Object} voiceModel - Custom voice model data
     */
    applyCustomVoice(voiceModel) {
        console.log(`Applying voice: ${voiceModel ? voiceModel.name : 'unknown'}`);
        this.customVoiceModel = voiceModel;
        
        // If no voice model provided, reset to defaults
        if (!voiceModel) {
            this.setPitch(0);
            this.setFormant(0);
            this.setEffect('none');
            this.applyAccent('neutral');
            return;
        }
        
        // Apply accent first (if available)
        if (voiceModel.accent) {
            console.log(`Applying accent: ${voiceModel.accent}`);
            this.applyAccent(voiceModel.accent);
        }
        
        // Apply voice type specific modifications
        if (voiceModel.type) {
            switch(voiceModel.type) {
                case 'celebrity':
                    // Celebrity voices typically need more clarity
                    this.applyEQ(1.2, 0.8, 1.1); // Boost highs, reduce mids, slight boost lows
                    break;
                case 'fictional':
                    // Fictional voices often need more character
                    this.applyEQ(1.3, 0.7, 1.2); // Higher boost to highs and lows
                    break;
                case 'ai':
                    // AI voices typically need a cleaner, more precise sound
                    this.applyEQ(1.1, 0.9, 0.9); // Slight boost to highs, reduce lows
                    break;
                default:
                    // For custom voices, use a balanced EQ
                    this.applyEQ(1.0, 1.0, 1.0);
            }
        }
        
        // Apply specific voice parameters
        if (voiceModel.parameters) {
            console.log(`Applying parameters: pitch=${voiceModel.parameters.pitch}, formant=${voiceModel.parameters.formant}, effect=${voiceModel.parameters.effect}`);
            
            if (voiceModel.parameters.pitch !== undefined) {
                this.setPitch(voiceModel.parameters.pitch);
            }
            
            if (voiceModel.parameters.formant !== undefined) {
                this.setFormant(voiceModel.parameters.formant);
            }
            
            if (voiceModel.parameters.effect !== undefined) {
                this.setEffect(voiceModel.parameters.effect);
            }
        }
        
        // Apply the combined effects
        this.applyEffects();
    }
    
    /**
     * Apply EQ settings to shape the voice
     * @param {number} highGain - Gain for high frequencies
     * @param {number} midGain - Gain for mid frequencies
     * @param {number} lowGain - Gain for low frequencies
     */
    applyEQ(highGain, midGain, lowGain) {
        // In a full implementation, this would adjust a multi-band EQ
        // For now, we'll just log the values
        console.log(`Applied EQ: highs=${highGain}, mids=${midGain}, lows=${lowGain}`);
        
        // Simulate EQ by adjusting existing parameters
        const currentFormant = parseFloat(this.formantValue);
        if (highGain > 1.0) {
            // Boosting highs often means raising formant
            this.setFormant(currentFormant + ((highGain - 1.0) * 10));
        } else if (lowGain > 1.0) {
            // Boosting lows often means lowering formant
            this.setFormant(currentFormant - ((lowGain - 1.0) * 10));
        }
    }
    
    /**
     * Stop the microphone input and processing
     */
    stopMicrophone() {
        if (!this.isActive) return;
        
        // Stop all tracks in the microphone stream
        if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(track => track.stop());
            this.microphoneStream = null;
        }
        
        // Disconnect audio nodes
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        
        // Stop visualization
        this.stopVisualization();
        
        // Update state
        this.isActive = false;
        Utils.updateStatusIndicators(false);
    }
    
    /**
     * Initialize visualization data array
     */
    initVisualization() {
        if (this.analyser) {
            this.visualizationData = new Uint8Array(this.analyser.frequencyBinCount);
        }
    }
    
    /**
     * Start audio visualization
     */
    startVisualization() {
        if (this.isVisualizing) return;
        
        this.isVisualizing = true;
        this.drawVisualization();
    }
    
    /**
     * Stop audio visualization
     */
    stopVisualization() {
        this.isVisualizing = false;
        
        // Clear the canvas
        if (this.canvasCtx && this.canvas) {
            this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    /**
     * Draw the audio visualization
     */
    drawVisualization() {
        if (!this.isVisualizing || !this.analyser || !this.canvasCtx) return;
        
        // Get time domain data
        this.analyser.getByteTimeDomainData(this.visualizationData);
        
        // Clear canvas
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.canvasCtx.fillStyle = '#0f172a';
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw waveform
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = '#4f46e5';
        this.canvasCtx.beginPath();
        
        const sliceWidth = this.canvas.width / this.visualizationData.length;
        let x = 0;
        
        for (let i = 0; i < this.visualizationData.length; i++) {
            const v = this.visualizationData[i] / 128.0;
            const y = v * this.canvas.height / 2;
            
            if (i === 0) {
                this.canvasCtx.moveTo(x, y);
            } else {
                this.canvasCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.canvasCtx.stroke();
        
        // Request next frame
        if (this.isVisualizing) {
            requestAnimationFrame(this.drawVisualization.bind(this));
        }
    }
    
    /**
     * Get the processed audio stream for use with call applications
     * @returns {MediaStream|null} The processed audio stream
     */
    getOutputStreamForCalls() {
        if (!this.isActive || !this.destinationStream) {
            return null;
        }
        
        return this.destinationStream.stream;
    }
    
    /**
     * Get current audio context state
     * @returns {string} Audio context state
     */
    getAudioContextState() {
        return this.audioContext ? this.audioContext.state : 'closed';
    }
    
    /**
     * Resume audio context if suspended
     */
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
}
