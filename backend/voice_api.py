import os
import json
from flask import Flask, request, jsonify, render_template, redirect, url_for
from backend import models
from backend.phone import PhoneCallManager

app = Flask(__name__)

# Initialize the phone call manager
phone_manager = PhoneCallManager()

# Celebrity voices data - made available as a global variable for direct initialization
celebrity_voices = [
    {"name": "Morgan Freeman", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -3, "formant": -20, "effect": "none"}},
    {"name": "James Earl Jones", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -4, "formant": -30, "effect": "none"}},
    {"name": "Scarlett Johansson", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": 5, "formant": 20, "effect": "none"}},
    {"name": "Arnold Schwarzenegger", "type": "celebrity", "accent": "austrian", 
     "parameters": {"pitch": -2, "formant": -15, "effect": "none"}},
    {"name": "Oprah Winfrey", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": 3, "formant": 10, "effect": "none"}},
    {"name": "Sean Connery", "type": "celebrity", "accent": "scottish", 
     "parameters": {"pitch": -2, "formant": -10, "effect": "reverb"}},
    {"name": "Marilyn Monroe", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": 6, "formant": 30, "effect": "none"}},
    {"name": "Christopher Walken", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
    {"name": "Ellen DeGeneres", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": 4, "formant": 15, "effect": "none"}},
    {"name": "Patrick Stewart", "type": "celebrity", "accent": "british", 
     "parameters": {"pitch": -2, "formant": -15, "effect": "none"}},
    {"name": "Julia Roberts", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": 4, "formant": 20, "effect": "none"}},
    {"name": "David Attenborough", "type": "celebrity", "accent": "british", 
     "parameters": {"pitch": -1, "formant": -10, "effect": "none"}},
    {"name": "Adele", "type": "celebrity", "accent": "british", 
     "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
    {"name": "Darth Vader", "type": "fictional", "accent": "american", 
     "parameters": {"pitch": -5, "formant": -40, "effect": "reverb"}},
    {"name": "Batman", "type": "fictional", "accent": "american", 
     "parameters": {"pitch": -3, "formant": -25, "effect": "none"}},
    {"name": "Mickey Mouse", "type": "fictional", "accent": "american", 
     "parameters": {"pitch": 8, "formant": 40, "effect": "none"}},
    {"name": "C-3PO", "type": "fictional", "accent": "british", 
     "parameters": {"pitch": 3, "formant": 10, "effect": "robot"}},
    {"name": "Siri", "type": "ai", "accent": "american", 
     "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
    {"name": "Elvis Presley", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -1, "formant": -5, "effect": "echo"}},
    {"name": "Yoda", "type": "fictional", "accent": "alien", 
     "parameters": {"pitch": 2, "formant": 30, "effect": "none"}},
    {"name": "Robert De Niro", "type": "celebrity", "accent": "new_york", 
     "parameters": {"pitch": -2, "formant": -10, "effect": "none"}},
    {"name": "Meryl Streep", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
    {"name": "Barack Obama", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
    {"name": "Donald Trump", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -1, "formant": 5, "effect": "none"}},
    {"name": "The Queen", "type": "celebrity", "accent": "british", 
     "parameters": {"pitch": 2, "formant": 10, "effect": "none"}},
    {"name": "George Clooney", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
    {"name": "Emma Watson", "type": "celebrity", "accent": "british", 
     "parameters": {"pitch": 2, "formant": 15, "effect": "none"}},
    {"name": "Samuel L. Jackson", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -1, "formant": -10, "effect": "none"}},
    {"name": "Jennifer Lawrence", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": 2, "formant": 10, "effect": "none"}},
    {"name": "Tom Hanks", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
    {"name": "Julie Andrews", "type": "celebrity", "accent": "british", 
     "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
    {"name": "Leonardo DiCaprio", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
    {"name": "Beyoncé", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
    {"name": "Morgan Freeman Whisper", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -3, "formant": -20, "effect": "reverb"}},
    {"name": "Hal 9000", "type": "fictional", "accent": "american", 
     "parameters": {"pitch": -2, "formant": -15, "effect": "robot"}},
    {"name": "Dalek", "type": "fictional", "accent": "british", 
     "parameters": {"pitch": -4, "formant": -30, "effect": "robot"}},
    {"name": "The Terminator", "type": "fictional", "accent": "austrian", 
     "parameters": {"pitch": -3, "formant": -20, "effect": "robot"}},
    {"name": "GLaDOS", "type": "fictional", "accent": "american", 
     "parameters": {"pitch": 3, "formant": -5, "effect": "robot"}},
    {"name": "Kermit the Frog", "type": "fictional", "accent": "american", 
     "parameters": {"pitch": 4, "formant": 30, "effect": "none"}},
    {"name": "Alexa", "type": "ai", "accent": "american", 
     "parameters": {"pitch": 3, "formant": 15, "effect": "none"}},
    {"name": "JARVIS", "type": "fictional", "accent": "british", 
     "parameters": {"pitch": -1, "formant": -5, "effect": "robot"}},
    {"name": "Minnie Mouse", "type": "fictional", "accent": "american", 
     "parameters": {"pitch": 9, "formant": 45, "effect": "none"}},
    {"name": "Jay-Z", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -2, "formant": -10, "effect": "none"}},
    {"name": "Snoop Dogg", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -2, "formant": -5, "effect": "echo"}},
    {"name": "Stephen Hawking", "type": "celebrity", "accent": "british", 
     "parameters": {"pitch": -1, "formant": -5, "effect": "robot"}},
    {"name": "Steve Jobs", "type": "celebrity", "accent": "american", 
     "parameters": {"pitch": -1, "formant": -5, "effect": "none"}},
    {"name": "Alien Voice", "type": "fictional", "accent": "alien", 
     "parameters": {"pitch": -3, "formant": -30, "effect": "alien"}},
    {"name": "Robot Voice", "type": "fictional", "accent": "neutral", 
     "parameters": {"pitch": -2, "formant": -15, "effect": "robot"}},
    {"name": "Chipmunk Voice", "type": "fictional", "accent": "neutral", 
     "parameters": {"pitch": 10, "formant": 50, "effect": "none"}},
    {"name": "Deep Voice", "type": "fictional", "accent": "neutral", 
     "parameters": {"pitch": -6, "formant": -40, "effect": "reverb"}}
]

# API Routes
@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Get all voices from the database"""
    voices = models.get_all_voices()
    return jsonify(voices)

@app.route('/api/voices/celebrity', methods=['GET'])
def get_celebrity_voices():
    """Get only celebrity voices from the database"""
    voices = models.get_celebrity_voices()
    return jsonify(voices)

@app.route('/api/voices/custom', methods=['GET'])
def get_custom_voices():
    """Get only custom voices from the database"""
    voices = models.get_custom_voices()
    return jsonify(voices)

@app.route('/api/voices/<int:voice_id>', methods=['GET'])
def get_voice(voice_id):
    """Get a specific voice by ID"""
    voice = models.get_voice_by_id(voice_id)
    if voice:
        return jsonify(voice)
    return jsonify({'error': 'Voice not found'}), 404

@app.route('/api/voices', methods=['POST'])
def add_voice():
    """Add a new voice to the database"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    name = data.get('name')
    voice_type = data.get('type', 'custom')
    accent = data.get('accent', 'neutral')
    is_celebrity = data.get('is_celebrity', False)
    parameters = data.get('parameters', {})
    file_path = data.get('file_path')
    
    if not name:
        return jsonify({'error': 'Voice name is required'}), 400
    
    voice_id = models.add_voice(
        name=name,
        voice_type=voice_type,
        accent=accent,
        is_celebrity=is_celebrity,
        parameters=parameters,
        file_path=file_path
    )
    
    if voice_id:
        return jsonify({
            'id': voice_id,
            'name': name,
            'type': voice_type,
            'accent': accent,
            'is_celebrity': is_celebrity,
            'parameters': parameters,
            'file_path': file_path
        }), 201
    
    return jsonify({'error': 'Failed to add voice'}), 500

@app.route('/api/voices/<int:voice_id>', methods=['PUT'])
def update_voice(voice_id):
    """Update an existing voice"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    name = data.get('name')
    voice_type = data.get('type')
    accent = data.get('accent')
    is_celebrity = data.get('is_celebrity')
    parameters = data.get('parameters')
    file_path = data.get('file_path')
    
    success = models.update_voice(
        voice_id=voice_id,
        name=name,
        voice_type=voice_type,
        accent=accent,
        is_celebrity=is_celebrity,
        parameters=parameters,
        file_path=file_path
    )
    
    if success:
        updated_voice = models.get_voice_by_id(voice_id)
        return jsonify(updated_voice)
    
    return jsonify({'error': 'Failed to update voice'}), 500

@app.route('/api/voices/<int:voice_id>', methods=['DELETE'])
def delete_voice(voice_id):
    """Delete a voice"""
    success = models.delete_voice(voice_id)
    
    if success:
        return jsonify({'success': True})
    
    return jsonify({'error': 'Failed to delete voice'}), 500

# Phone Call Routes
@app.route('/api/asterisk/originate', methods=['POST'])
def start_call():
    """Start a new phone call with voice transformation using Asterisk"""
    if not phone_manager.is_configured():
        return jsonify({
            'success': False,
            'message': 'Asterisk is not properly configured'
        }), 400
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    phone_number = data.get('phone_number')
    voice_id = data.get('voice_id')
    
    if not phone_number:
        return jsonify({'error': 'Phone number is required'}), 400
    
    callback_url = request.url_root.rstrip('/') + '/api/call/voice'
    result = phone_manager.start_call(phone_number, voice_id, callback_url)
    
    if result.get('success'):
        return jsonify(result)
    
    return jsonify(result), 400

@app.route('/api/call/end/<call_sid>', methods=['POST'])
def end_call(call_sid):
    """End an active call"""
    result = phone_manager.end_call(call_sid)
    
    if result.get('success'):
        return jsonify(result)
    
    return jsonify(result), 400

@app.route('/api/call/status/<call_sid>', methods=['GET'])
def get_call_status(call_sid):
    """Get the status of a call"""
    result = phone_manager.get_call_status(call_sid)
    
    if result.get('success'):
        return jsonify(result)
    
    return jsonify(result), 400

@app.route('/api/asterisk/dialplan', methods=['GET'])
def generate_dialplan():
    """Generate Asterisk dialplan for voice transformation"""
    # Get the voice ID from query parameters
    voice_id = request.args.get('voice_id')
    
    # Generate the appropriate dialplan
    dialplan = phone_manager.generate_asterisk_dialplan(voice_id)
    
    return dialplan, 200, {'Content-Type': 'text/plain'}

@app.route('/api/asterisk/dtmf', methods=['POST'])
def handle_dtmf():
    """Process DTMF input during an Asterisk call"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Invalid request data'}), 400
    
    # Get the digit pressed and call ID
    digit = data.get('digit', '')
    call_id = data.get('call_id')
    
    if not call_id:
        return jsonify({'error': 'Call ID is required'}), 400
    
    # Handle the DTMF input
    result = phone_manager.handle_asterisk_dtmf(digit, call_id)
    
    if result.get('success'):
        return jsonify(result)
    
    return jsonify(result), 400

@app.route('/api/call/voice/hangup', methods=['POST'])
def voice_hangup():
    """Handle call hangup"""
    call_sid = request.values.get('CallSid')
    
    # Update the call session in the database
    if call_sid:
        models.update_call_session_status(call_sid, 'completed')
    
    # Generate a simple response for Asterisk
    response = {
        "action": "hangup",
        "message": "Thank you for using our voice changing service. Goodbye!"
    }
    
    return jsonify(response), 200

@app.route('/api/call/voice/status', methods=['POST'])
def voice_status():
    """Handle call status callbacks"""
    call_sid = request.values.get('CallSid')
    call_status = request.values.get('CallStatus')
    
    # Update the call session in the database
    if call_sid and call_status:
        models.update_call_session_status(call_sid, call_status)
    
    return '', 204

# Helper route to initialize celebrity voices
@app.route('/api/init/celebrity-voices', methods=['POST'])
def init_celebrity_voices():
    """Initialize the database with celebrity voices"""
    success = models.add_celebrity_voices(celebrity_voices)
    
    if success:
        return jsonify({'success': True, 'count': len(celebrity_voices)})
    
    return jsonify({'error': 'Failed to initialize celebrity voices'}), 500

# Configuration API endpoints
@app.route('/api/config/asterisk', methods=['POST'])
def set_asterisk_config():
    """Update Asterisk configuration settings"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ['host', 'port', 'username', 'secret']):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # Save to environment variables (for the current process)
        os.environ['ASTERISK_HOST'] = data['host']
        os.environ['ASTERISK_PORT'] = str(data['port'])
        os.environ['ASTERISK_USERNAME'] = data['username']
        os.environ['ASTERISK_SECRET'] = data['secret']
        os.environ['ASTERISK_CONTEXT'] = data.get('context', 'from-internal')
        os.environ['ASTERISK_EXTENSION'] = data.get('extension', '1000')
        
        # Return success
        return jsonify({
            'success': True,
            'message': 'Asterisk configuration updated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error updating Asterisk configuration: {str(e)}'
        }), 500

@app.route('/api/config/asterisk/status', methods=['GET'])
def get_asterisk_status():
    """Get Asterisk connection status"""
    from backend.phone import PhoneCallManager, ASTERISK_HOST, ASTERISK_USERNAME, ASTERISK_SECRET
    
    try:
        # Check if Asterisk credentials are configured
        configured = all([ASTERISK_HOST, ASTERISK_USERNAME, ASTERISK_SECRET])
        
        # If not configured, return early
        if not configured:
            return jsonify({
                'configured': False,
                'connected': False
            })
        
        # Try to connect to Asterisk
        manager = PhoneCallManager()
        connected = manager._connect_to_ami()
        
        return jsonify({
            'configured': True,
            'connected': connected,
            'host': ASTERISK_HOST,
            'message': 'Connected successfully' if connected else 'Failed to connect to Asterisk'
        })
    except Exception as e:
        return jsonify({
            'configured': configured if 'configured' in locals() else False,
            'connected': False,
            'message': f'Error checking Asterisk status: {str(e)}'
        })

@app.route('/api/config/asterisk/test', methods=['POST'])
def test_asterisk_connection():
    """Test a connection to Asterisk with provided credentials"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ['host', 'username', 'secret']):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # Create a socket connection to the Asterisk AMI
        import socket
        import time
        
        # Parse port (default to 5038)
        port = int(data.get('port', 5038))
        
        # Create a socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)  # 5 second timeout
        
        try:
            # Connect to the AMI
            sock.connect((data['host'], port))
            
            # Read the welcome message
            welcome = sock.recv(1024).decode()
            
            # Send login command
            login_cmd = (
                f"Action: Login\r\n"
                f"Username: {data['username']}\r\n"
                f"Secret: {data['secret']}\r\n"
                f"\r\n"
            )
            sock.send(login_cmd.encode())
            
            # Read the response
            response = sock.recv(1024).decode()
            
            # Check if login was successful
            success = "Success" in response
            
            # Always close the socket when done
            sock.close()
            
            if success:
                return jsonify({
                    'success': True,
                    'message': 'Successfully connected to Asterisk'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Authentication failed'
                })
        except socket.timeout:
            return jsonify({
                'success': False,
                'message': 'Connection timed out'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Connection error: {str(e)}'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error testing Asterisk connection: {str(e)}'
        }), 500

@app.route('/api/config/agi', methods=['POST'])
def set_agi_config():
    """Update AGI server configuration settings"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ['host', 'port']):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # Save to environment variables (for the current process)
        os.environ['AGI_HOST'] = data['host']
        os.environ['AGI_PORT'] = str(data['port'])
        
        if 'cacheTimeout' in data:
            os.environ['VOICE_CACHE_TIMEOUT'] = str(data['cacheTimeout'])
        
        # Return success
        return jsonify({
            'success': True,
            'message': 'AGI configuration updated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error updating AGI configuration: {str(e)}'
        }), 500

@app.route('/api/config/agi/status', methods=['GET'])
def get_agi_status():
    """Get AGI server status"""
    try:
        # Get AGI server settings from environment variables
        from backend.agi_server import AGI_HOST, AGI_PORT
        
        # Check if the AGI server is running by attempting to connect to it
        import socket
        
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)  # 1 second timeout
        
        try:
            # Try to connect to the AGI server
            sock.connect((AGI_HOST, AGI_PORT))
            sock.close()
            
            # If we get here, the AGI server is running
            return jsonify({
                'running': True,
                'host': AGI_HOST,
                'port': AGI_PORT
            })
        except:
            # If we can't connect, the AGI server is not running
            return jsonify({
                'running': False,
                'host': AGI_HOST,
                'port': AGI_PORT
            })
    except Exception as e:
        return jsonify({
            'running': False,
            'message': f'Error checking AGI server status: {str(e)}'
        })

@app.route('/api/config/agi/restart', methods=['POST'])
def restart_agi_server():
    """Restart the AGI server"""
    try:
        # In a real implementation, we would restart the AGI server here
        # For this demo, we'll just simulate a restart
        import threading
        from backend.agi_server import run_agi_server
        
        # Start a new AGI server thread
        agi_thread = threading.Thread(target=run_agi_server)
        agi_thread.daemon = True
        agi_thread.start()
        
        # Return success
        return jsonify({
            'success': True,
            'message': 'AGI server restarted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error restarting AGI server: {str(e)}'
        }), 500

@app.route('/api/config/voice', methods=['POST'])
def set_voice_config():
    """Update voice transformation settings"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ['pitchRange', 'formantRange', 'enabledEffects']):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # Save to environment variables (for the current process)
        os.environ['VOICE_PITCH_RANGE'] = str(data['pitchRange'])
        os.environ['VOICE_FORMANT_RANGE'] = str(data['formantRange'])
        os.environ['VOICE_ENABLED_EFFECTS'] = ','.join(data['enabledEffects'])
        
        # Return success
        return jsonify({
            'success': True,
            'message': 'Voice configuration updated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error updating voice configuration: {str(e)}'
        }), 500

# Run the Flask API
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)