/**
 * Voice Transformer for the Real-time Voice Changer
 * Handles voice model loading and transformation
 */

class VoiceTransformer {
    constructor() {
        // Voice models storage
        this.voiceModels = new Map();
        this.celebrityVoices = new Map();
        
        // TensorFlow model for voice transformation (placeholder)
        this.tfModel = null;
        
        // Flag to check if the transformer is ready
        this.isReady = false;
        
        // Default available accents
        this.availableAccents = [
            'neutral', 'british', 'american', 'australian', 
            'french', 'german', 'spanish', 'russian', 'indian', 
            'scottish', 'irish', 'welsh', 'new_york', 'southern',
            'midwestern', 'canadian', 'jamaican', 'italian',
            'japanese', 'korean', 'chinese', 'alien', 'robot'
        ];
    }
    
    /**
     * Initialize the voice transformer
     */
    async initialize() {
        try {
            // In a full implementation, this would load TensorFlow.js and the base voice model
            // For simplicity, we're just setting up a basic structure
            
            // Load custom and celebrity voices
            await Promise.all([
                this.loadCustomVoices(),
                this.loadCelebrityVoices()
            ]);
            
            this.isReady = true;
            return true;
        } catch (error) {
            console.error('Error initializing voice transformer:', error);
            Utils.showError('Failed to initialize voice transformer: ' + error.message);
            return false;
        }
    }
    
    /**
     * Load custom voices from the server
     */
    async loadCustomVoices() {
        try {
            // First try the new API endpoint
            try {
                const response = await fetch('/api/voices/custom');
                if (response.ok) {
                    const voiceData = await response.json();
                    
                    // Store each voice model
                    voiceData.forEach(voice => {
                        this.voiceModels.set(voice.id.toString(), {
                            id: voice.id.toString(),
                            name: voice.name,
                            type: voice.type || 'custom',
                            accent: voice.accent,
                            is_celebrity: false,
                            parameters: voice.parameters || {
                                pitch: 0,
                                formant: 0,
                                effect: 'none'
                            }
                        });
                    });
                    
                    return true;
                }
            } catch (apiError) {
                console.log('New API endpoint not available, falling back to PHP endpoint');
            }
            
            // Fall back to the original PHP endpoint
            const response = await fetch('backend/getVoices.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const voiceData = await response.json();
            
            // Store each voice model
            voiceData.forEach(voice => {
                this.voiceModels.set(voice.id, {
                    id: voice.id,
                    name: voice.name,
                    type: 'custom',
                    accent: voice.accent,
                    is_celebrity: false,
                    parameters: voice.parameters || {
                        pitch: 0,
                        formant: 0,
                        effect: 'none'
                    }
                });
            });
            
            return true;
        } catch (error) {
            console.error('Error loading custom voices:', error);
            // Not showing an error to the user here, as this is not critical
            // Just return an empty list
            return false;
        }
    }
    
    /**
     * Load celebrity voices from the server
     */
    async loadCelebrityVoices() {
        try {
            // Try the API endpoint
            try {
                const response = await fetch('/api/voices/celebrity');
                if (response.ok) {
                    const voiceData = await response.json();
                    
                    // Store each voice model
                    voiceData.forEach(voice => {
                        this.celebrityVoices.set(voice.id.toString(), {
                            id: voice.id.toString(),
                            name: voice.name,
                            type: voice.type || 'celebrity',
                            accent: voice.accent,
                            is_celebrity: true,
                            parameters: voice.parameters || {
                                pitch: 0,
                                formant: 0,
                                effect: 'none'
                            }
                        });
                    });
                    
                    return true;
                }
            } catch (apiError) {
                console.log('Celebrity API endpoint not available, falling back to local data');
            }
            
            // If API endpoint is not available, load from hardcoded data
            this.loadDefaultCelebrityVoices();
            return true;
        } catch (error) {
            console.error('Error loading celebrity voices:', error);
            // Fall back to hardcoded data
            this.loadDefaultCelebrityVoices();
            return false;
        }
    }
    
    /**
     * Load default celebrity voices from hardcoded data
     */
    loadDefaultCelebrityVoices() {
        const celebrityVoices = [
            {"id": "c1", "name": "Morgan Freeman", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -3, "formant": -20, "effect": "none"}},
            {"id": "c2", "name": "James Earl Jones", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -4, "formant": -30, "effect": "none"}},
            {"id": "c3", "name": "Scarlett Johansson", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": 5, "formant": 20, "effect": "none"}},
            {"id": "c4", "name": "Arnold Schwarzenegger", "type": "celebrity", "accent": "austrian", 
             "parameters": {"pitch": -2, "formant": -15, "effect": "none"}},
            {"id": "c5", "name": "Oprah Winfrey", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": 3, "formant": 10, "effect": "none"}},
            {"id": "c6", "name": "Sean Connery", "type": "celebrity", "accent": "scottish", 
             "parameters": {"pitch": -2, "formant": -10, "effect": "reverb"}},
            {"id": "c7", "name": "Marilyn Monroe", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": 6, "formant": 30, "effect": "none"}},
            {"id": "c8", "name": "Christopher Walken", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
            {"id": "c9", "name": "Ellen DeGeneres", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": 4, "formant": 15, "effect": "none"}},
            {"id": "c10", "name": "Patrick Stewart", "type": "celebrity", "accent": "british", 
             "parameters": {"pitch": -2, "formant": -15, "effect": "none"}},
            {"id": "c11", "name": "Julia Roberts", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": 4, "formant": 20, "effect": "none"}},
            {"id": "c12", "name": "David Attenborough", "type": "celebrity", "accent": "british", 
             "parameters": {"pitch": -1, "formant": -10, "effect": "none"}},
            {"id": "c13", "name": "Adele", "type": "celebrity", "accent": "british", 
             "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
            {"id": "c14", "name": "Darth Vader", "type": "fictional", "accent": "american", 
             "parameters": {"pitch": -5, "formant": -40, "effect": "reverb"}},
            {"id": "c15", "name": "Batman", "type": "fictional", "accent": "american", 
             "parameters": {"pitch": -3, "formant": -25, "effect": "none"}},
            {"id": "c16", "name": "Mickey Mouse", "type": "fictional", "accent": "american", 
             "parameters": {"pitch": 8, "formant": 40, "effect": "none"}},
            {"id": "c17", "name": "C-3PO", "type": "fictional", "accent": "british", 
             "parameters": {"pitch": 3, "formant": 10, "effect": "robot"}},
            {"id": "c18", "name": "Siri", "type": "ai", "accent": "american", 
             "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
            {"id": "c19", "name": "Elvis Presley", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -1, "formant": -5, "effect": "echo"}},
            {"id": "c20", "name": "Yoda", "type": "fictional", "accent": "alien", 
             "parameters": {"pitch": 2, "formant": 30, "effect": "none"}},
            {"id": "c21", "name": "Robert De Niro", "type": "celebrity", "accent": "new_york", 
             "parameters": {"pitch": -2, "formant": -10, "effect": "none"}},
            {"id": "c22", "name": "Meryl Streep", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
            {"id": "c23", "name": "Barack Obama", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
            {"id": "c24", "name": "Donald Trump", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -1, "formant": 5, "effect": "none"}},
            {"id": "c25", "name": "The Queen", "type": "celebrity", "accent": "british", 
             "parameters": {"pitch": 2, "formant": 10, "effect": "none"}},
            {"id": "c26", "name": "George Clooney", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
            {"id": "c27", "name": "Emma Watson", "type": "celebrity", "accent": "british", 
             "parameters": {"pitch": 2, "formant": 15, "effect": "none"}},
            {"id": "c28", "name": "Samuel L. Jackson", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -1, "formant": -10, "effect": "none"}},
            {"id": "c29", "name": "Jennifer Lawrence", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": 2, "formant": 10, "effect": "none"}},
            {"id": "c30", "name": "Tom Hanks", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
            {"id": "c31", "name": "Julie Andrews", "type": "celebrity", "accent": "british", 
             "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
            {"id": "c32", "name": "Leonardo DiCaprio", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
            {"id": "c33", "name": "Beyoncé", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
            {"id": "c34", "name": "Morgan Freeman Whisper", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -3, "formant": -20, "effect": "reverb"}},
            {"id": "c35", "name": "Hal 9000", "type": "fictional", "accent": "american", 
             "parameters": {"pitch": -2, "formant": -15, "effect": "robot"}},
            {"id": "c36", "name": "Dalek", "type": "fictional", "accent": "british", 
             "parameters": {"pitch": -4, "formant": -30, "effect": "robot"}},
            {"id": "c37", "name": "The Terminator", "type": "fictional", "accent": "austrian", 
             "parameters": {"pitch": -3, "formant": -20, "effect": "robot"}},
            {"id": "c38", "name": "GLaDOS", "type": "fictional", "accent": "american", 
             "parameters": {"pitch": 3, "formant": -5, "effect": "robot"}},
            {"id": "c39", "name": "Kermit the Frog", "type": "fictional", "accent": "american", 
             "parameters": {"pitch": 4, "formant": 30, "effect": "none"}},
            {"id": "c40", "name": "Alexa", "type": "ai", "accent": "american", 
             "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
            {"id": "c41", "name": "JARVIS", "type": "fictional", "accent": "british", 
             "parameters": {"pitch": -1, "formant": -5, "effect": "robot"}},
            {"id": "c42", "name": "Minnie Mouse", "type": "fictional", "accent": "american", 
             "parameters": {"pitch": 9, "formant": 45, "effect": "none"}},
            {"id": "c43", "name": "Jay-Z", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -2, "formant": -10, "effect": "none"}},
            {"id": "c44", "name": "Snoop Dogg", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -2, "formant": -5, "effect": "echo"}},
            {"id": "c45", "name": "Stephen Hawking", "type": "celebrity", "accent": "british", 
             "parameters": {"pitch": -1, "formant": -5, "effect": "robot"}},
            {"id": "c46", "name": "Steve Jobs", "type": "celebrity", "accent": "american", 
             "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
            {"id": "c47", "name": "Alien Voice", "type": "fictional", "accent": "alien", 
             "parameters": {"pitch": -3, "formant": -30, "effect": "alien"}},
            {"id": "c48", "name": "Robot Voice", "type": "fictional", "accent": "neutral", 
             "parameters": {"pitch": -2, "formant": -15, "effect": "robot"}},
            {"id": "c49", "name": "Chipmunk Voice", "type": "fictional", "accent": "neutral", 
             "parameters": {"pitch": 10, "formant": 50, "effect": "none"}},
            {"id": "c50", "name": "Deep Voice", "type": "fictional", "accent": "neutral", 
             "parameters": {"pitch": -6, "formant": -40, "effect": "reverb"}}
        ];
        
        // Store each voice model
        celebrityVoices.forEach(voice => {
            this.celebrityVoices.set(voice.id, voice);
        });
    }
    
    /**
     * Add a new custom voice
     * @param {FormData} formData - Form data with voice file and metadata
     * @returns {Promise<Object>} Result of the upload operation
     */
    async addCustomVoice(formData) {
        try {
            // First try the new API endpoint
            try {
                const name = formData.get('voiceName');
                const accent = formData.get('accentType');
                
                const apiData = {
                    name: name,
                    type: 'custom',
                    accent: accent,
                    is_celebrity: false,
                    parameters: {
                        pitch: 0,
                        formant: 0,
                        effect: 'none'
                    }
                };
                
                const response = await fetch('/api/voices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(apiData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    // Also upload the file using the PHP endpoint for now
                    try {
                        await fetch('backend/upload.php', {
                            method: 'POST',
                            body: formData
                        });
                    } catch (fileError) {
                        console.error('Error uploading voice file:', fileError);
                    }
                    
                    // Add to our local collection
                    this.voiceModels.set(result.id.toString(), {
                        id: result.id.toString(),
                        name: result.name,
                        type: result.type || 'custom',
                        accent: result.accent,
                        is_celebrity: false,
                        parameters: result.parameters || {
                            pitch: 0,
                            formant: 0,
                            effect: 'none'
                        }
                    });
                    
                    return {
                        success: true,
                        voice: result
                    };
                }
            } catch (apiError) {
                console.log('New API endpoint not available, falling back to PHP endpoint');
            }
            
            // Fall back to the original PHP endpoint
            const response = await fetch('backend/upload.php', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Add to our local collection
                this.voiceModels.set(result.voice.id, {
                    id: result.voice.id,
                    name: result.voice.name,
                    type: 'custom',
                    accent: result.voice.accent,
                    is_celebrity: false,
                    parameters: result.voice.parameters || {
                        pitch: 0,
                        formant: 0,
                        effect: 'none'
                    }
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error adding custom voice:', error);
            throw error;
        }
    }
    
    /**
     * Delete a custom voice
     * @param {string} voiceId - ID of the voice to delete
     * @returns {Promise<Object>} Result of the delete operation
     */
    async deleteCustomVoice(voiceId) {
        try {
            // First try the new API endpoint
            try {
                const response = await fetch(`/api/voices/${voiceId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    // Also try to delete using PHP endpoint for backward compatibility
                    try {
                        const formData = new FormData();
                        formData.append('id', voiceId);
                        
                        await fetch('backend/deleteVoice.php', {
                            method: 'POST',
                            body: formData
                        });
                    } catch (phpError) {
                        console.error('Error with PHP delete endpoint:', phpError);
                    }
                    
                    // Remove from our local collection
                    this.voiceModels.delete(voiceId.toString());
                    
                    return {
                        success: true
                    };
                }
            } catch (apiError) {
                console.log('New API endpoint not available, falling back to PHP endpoint');
            }
            
            // Fall back to the original PHP endpoint
            const formData = new FormData();
            formData.append('id', voiceId);
            
            const response = await fetch('backend/deleteVoice.php', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Remove from our local collection
                this.voiceModels.delete(voiceId);
            }
            
            return result;
        } catch (error) {
            console.error('Error deleting custom voice:', error);
            throw error;
        }
    }
    
    /**
     * Start a phone call with the current voice settings
     * @param {string} phoneNumber - The phone number to call
     * @param {string} voiceId - The ID of the voice to use
     * @returns {Promise<Object>} Result of the call operation
     */
    async startPhoneCall(phoneNumber, voiceId) {
        try {
            const response = await fetch('/api/call/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    voice_id: voiceId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error starting phone call:', error);
            throw error;
        }
    }
    
    /**
     * Get all voices (both custom and celebrity)
     * @returns {Array} Array of voice objects
     */
    getAllVoices() {
        const customVoices = Array.from(this.voiceModels.values());
        const celebrityVoices = Array.from(this.celebrityVoices.values());
        return [...celebrityVoices, ...customVoices];
    }
    
    /**
     * Get only custom voices
     * @returns {Array} Array of custom voice objects
     */
    getCustomVoices() {
        return Array.from(this.voiceModels.values());
    }
    
    /**
     * Get only celebrity voices
     * @returns {Array} Array of celebrity voice objects
     */
    getCelebrityVoices() {
        return Array.from(this.celebrityVoices.values());
    }
    
    /**
     * Get a specific voice by ID
     * @param {string} voiceId - ID of the voice to get
     * @returns {Object|null} Voice object or null if not found
     */
    getVoice(voiceId) {
        // First check custom voices
        if (this.voiceModels.has(voiceId)) {
            return this.voiceModels.get(voiceId);
        }
        
        // Then check celebrity voices
        if (this.celebrityVoices.has(voiceId)) {
            return this.celebrityVoices.get(voiceId);
        }
        
        return null;
    }
    
    /**
     * Apply a specific accent
     * This is a placeholder for more complex accent processing
     * @param {string} accentType - Type of accent to apply
     * @returns {Object} Parameters for the accent
     */
    getAccentParameters(accentType) {
        // In a real implementation, this would return specific parameters for each accent
        // For now, we'll return some basic parameters
        
        const accentParams = {
            pitch: 0,
            formant: 0,
            effect: 'none'
        };
        
        switch (accentType) {
            case 'british':
                accentParams.pitch = 1;
                accentParams.formant = 20;
                break;
                
            case 'american':
                accentParams.pitch = 0;
                accentParams.formant = 0;
                break;
                
            case 'australian':
                accentParams.pitch = -1;
                accentParams.formant = 10;
                break;
                
            case 'french':
                accentParams.pitch = 2;
                accentParams.formant = 30;
                break;
                
            case 'german':
                accentParams.pitch = -2;
                accentParams.formant = -20;
                break;
                
            case 'spanish':
                accentParams.pitch = 1;
                accentParams.formant = -10;
                break;
                
            case 'russian':
                accentParams.pitch = -3;
                accentParams.formant = -40;
                break;
                
            case 'indian':
                accentParams.pitch = 2;
                accentParams.formant = 40;
                break;
                
            case 'scottish':
                accentParams.pitch = -1;
                accentParams.formant = 15;
                break;
                
            case 'irish':
                accentParams.pitch = 1;
                accentParams.formant = 25;
                break;
                
            case 'welsh':
                accentParams.pitch = 0;
                accentParams.formant = 20;
                break;
                
            case 'new_york':
                accentParams.pitch = -1;
                accentParams.formant = -5;
                break;
                
            case 'southern':
                accentParams.pitch = -2;
                accentParams.formant = 5;
                break;
                
            case 'midwestern':
                accentParams.pitch = -1;
                accentParams.formant = 0;
                break;
                
            case 'canadian':
                accentParams.pitch = 0;
                accentParams.formant = 5;
                break;
                
            case 'jamaican':
                accentParams.pitch = 1;
                accentParams.formant = 15;
                break;
                
            case 'italian':
                accentParams.pitch = 2;
                accentParams.formant = 20;
                break;
                
            case 'japanese':
                accentParams.pitch = 3;
                accentParams.formant = 25;
                break;
                
            case 'korean':
                accentParams.pitch = 2;
                accentParams.formant = 30;
                break;
                
            case 'chinese':
                accentParams.pitch = 3;
                accentParams.formant = 35;
                break;
                
            case 'alien':
                accentParams.pitch = -4;
                accentParams.formant = -40;
                accentParams.effect = 'alien';
                break;
                
            case 'robot':
                accentParams.pitch = -2;
                accentParams.formant = -15;
                accentParams.effect = 'robot';
                break;
                
            default:
                // Neutral accent
                accentParams.pitch = 0;
                accentParams.formant = 0;
        }
        
        return accentParams;
    }
    
    /**
     * Get the list of available accents
     * @returns {Array<string>} List of accent names
     */
    getAvailableAccents() {
        return this.availableAccents;
    }
    
    /**
     * Check if the transformer is ready
     * @returns {boolean} Whether the transformer is ready
     */
    isTransformerReady() {
        return this.isReady;
    }
}
