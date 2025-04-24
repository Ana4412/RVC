import os
import json
import socket
import time
import random
import string
import threading
from backend import models

# Asterisk AMI (Asterisk Manager Interface) credentials
ASTERISK_HOST = os.environ.get('ASTERISK_HOST')
ASTERISK_PORT = int(os.environ.get('ASTERISK_PORT', '5038'))
ASTERISK_USERNAME = os.environ.get('ASTERISK_USERNAME')
ASTERISK_SECRET = os.environ.get('ASTERISK_SECRET')
ASTERISK_CONTEXT = os.environ.get('ASTERISK_CONTEXT', 'from-internal')
ASTERISK_EXTENSION = os.environ.get('ASTERISK_EXTENSION', '1000')  # Default extension to dial from

class PhoneCallManager:
    def __init__(self):
        """Initialize the phone call manager"""
        self.ami_socket = None
        self.active_calls = {}
        
    def _connect_to_ami(self, retry_count=5, retry_delay=3):
        """Connect to the Asterisk Manager Interface with improved retry mechanism"""
        """Connect to the Asterisk Manager Interface with retry mechanism
        
        Args:
            retry_count (int): Number of connection attempts before giving up
            retry_delay (int): Delay in seconds between retry attempts
            
        Returns:
            bool: True if connection succeeded, False otherwise
        """
        # Close existing connection if any
        if self.ami_socket:
            try:
                self.ami_socket.close()
            except Exception as e:
                print(f"Error closing existing AMI connection: {e}")
            self.ami_socket = None
        
        # Check if Asterisk credentials are configured
        if not ASTERISK_HOST or not ASTERISK_USERNAME or not ASTERISK_SECRET:
            print("Asterisk credentials not configured properly")
            return False
            
        # Try to connect with retries
        for attempt in range(retry_count):
            try:
                print(f"Connecting to Asterisk AMI ({attempt + 1}/{retry_count})...")
                
                # Create a socket connection to the Asterisk AMI
                self.ami_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.ami_socket.settimeout(10)  # Set a timeout for connection
                self.ami_socket.connect((ASTERISK_HOST, ASTERISK_PORT))
                
                # Read the welcome message
                welcome = self._read_response()
                if not welcome:
                    print("Did not receive welcome message from Asterisk AMI")
                    self.ami_socket.close()
                    self.ami_socket = None
                    if attempt < retry_count - 1:
                        print(f"Retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)
                    continue
                
                # Login to AMI
                login_cmd = (
                    f"Action: Login\r\n"
                    f"Username: {ASTERISK_USERNAME}\r\n"
                    f"Secret: {ASTERISK_SECRET}\r\n"
                    f"\r\n"
                )
                self.ami_socket.send(login_cmd.encode())
                login_response = self._read_response()
                
                if "Success" in login_response:
                    print("Successfully connected to Asterisk AMI")
                    
                    # Set up a keepalive ping
                    self._start_keepalive()
                    
                    return True
                else:
                    print(f"Failed to authenticate with Asterisk AMI: {login_response}")
                    self.ami_socket.close()
                    self.ami_socket = None
                    if attempt < retry_count - 1:
                        print(f"Retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)
            except socket.timeout:
                print("Connection to Asterisk AMI timed out")
                if self.ami_socket:
                    try:
                        self.ami_socket.close()
                    except:
                        pass
                    self.ami_socket = None
                if attempt < retry_count - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
            except Exception as e:
                print(f"Error connecting to Asterisk AMI: {e}")
                if self.ami_socket:
                    try:
                        self.ami_socket.close()
                    except:
                        pass
                    self.ami_socket = None
                if attempt < retry_count - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    
        print("All connection attempts to Asterisk AMI failed")
        return False
        
    def _start_keepalive(self):
        """Start a background thread to keep the AMI connection alive"""
        if hasattr(self, '_keepalive_thread') and self._keepalive_thread and self._keepalive_thread.is_alive():
            return  # Keepalive thread already running
            
        self._keepalive_running = True
        self._keepalive_thread = threading.Thread(target=self._keepalive_worker)
        self._keepalive_thread.daemon = True
        self._keepalive_thread.start()
        
    def _stop_keepalive(self):
        """Stop the keepalive thread"""
        self._keepalive_running = False
        if hasattr(self, '_keepalive_thread') and self._keepalive_thread:
            self._keepalive_thread.join(timeout=1)
            self._keepalive_thread = None
            
    def _keepalive_worker(self):
        """Worker thread that sends periodic pings to keep the AMI connection alive"""
        ping_interval = 30  # Send a ping every 30 seconds
        
        while self._keepalive_running and self.ami_socket:
            try:
                time.sleep(ping_interval)
                
                if not self.ami_socket:
                    break
                    
                # Send a ping action
                ping_cmd = (
                    f"Action: Ping\r\n"
                    f"ActionID: keepalive-{int(time.time())}\r\n"
                    f"\r\n"
                )
                self.ami_socket.send(ping_cmd.encode())
                
                # Read the response (but don't block for too long)
                response = self._read_response(timeout=2)
                
                if not response or "Error" in response:
                    print("AMI connection may be dead, attempting to reconnect...")
                    self._connect_to_ami()
            except Exception as e:
                print(f"Error in keepalive thread: {e}")
                try:
                    self._connect_to_ami()
                except:
                    pass
            
    def _read_response(self, timeout=5):
        """Read a response from the AMI socket"""
        if not self.ami_socket:
            return ""
            
        # Set socket timeout
        self.ami_socket.settimeout(timeout)
        
        try:
            # Read the response
            response = ""
            while True:
                chunk = self.ami_socket.recv(4096).decode()
                if not chunk:
                    break
                response += chunk
                # Check if we've reached the end of the response
                if "\r\n\r\n" in response:
                    break
            return response
        except socket.timeout:
            return ""
        except Exception as e:
            print(f"Error reading from AMI socket: {e}")
            return ""
    
    def is_configured(self):
        """Check if Asterisk is properly configured"""
        return (ASTERISK_HOST is not None and 
                ASTERISK_USERNAME is not None and 
                ASTERISK_SECRET is not None)
    
    def start_call(self, to_number, voice_id=None, callback_url=None):
        """Start a new phone call with voice transformation"""
        if not self.is_configured():
            return {
                'success': False,
                'message': 'Asterisk is not properly configured'
            }
        
        try:
            # Validate the phone number (strip any non-digit characters)
            cleaned_number = ''.join(filter(str.isdigit, to_number))
            
            # Get voice details if provided
            voice_params = {}
            if voice_id:
                voice = models.get_voice_by_id(voice_id)
                if voice:
                    voice_params = voice.get('parameters', {})
            
            # Connect to the Asterisk AMI
            if not self._connect_to_ami():
                return {
                    'success': False,
                    'message': 'Failed to connect to Asterisk AMI'
                }
            
            # Generate a unique call ID
            call_id = f"voice-changer-{int(time.time())}-{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}"
            
            # Create a call using the Asterisk AMI Originate command
            originate_cmd = (
                f"Action: Originate\r\n"
                f"Channel: SIP/{ASTERISK_EXTENSION}\r\n"  # From extension
                f"Context: {ASTERISK_CONTEXT}\r\n"
                f"Exten: {cleaned_number}\r\n"  # To number
                f"Priority: 1\r\n"
                f"CallerID: Voice Changer <{ASTERISK_EXTENSION}>\r\n"
                f"Variable: VOICE_ID={voice_id or ''}\r\n"
                f"Variable: VOICE_PITCH={voice_params.get('pitch', 0)}\r\n"
                f"Variable: VOICE_FORMANT={voice_params.get('formant', 0)}\r\n"
                f"Variable: VOICE_EFFECT={voice_params.get('effect', 'none')}\r\n"
                f"Async: true\r\n"
                f"ActionID: {call_id}\r\n"
                f"\r\n"
            )
            
            # Send the command
            self.ami_socket.send(originate_cmd.encode())
            
            # Read the response
            response = self._read_response()
            
            # Store this active call
            self.active_calls[call_id] = {
                'status': 'initiated',
                'to_number': cleaned_number,
                'voice_id': voice_id,
                'parameters': voice_params,
                'start_time': time.time()
            }
            
            # Store call session in database
            models.create_call_session(
                phone_number=cleaned_number,
                voice_id=voice_id,
                session_id=call_id,
                parameters=voice_params
            )
            
            return {
                'success': True,
                'call_sid': call_id,
                'status': 'initiated'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to start call: {str(e)}'
            }
    
    def end_call(self, call_id):
        """End an active call"""
        if not self.is_configured():
            return {
                'success': False,
                'message': 'Asterisk is not properly configured'
            }
        
        try:
            # Connect to the Asterisk AMI
            if not self._connect_to_ami():
                return {
                    'success': False,
                    'message': 'Failed to connect to Asterisk AMI'
                }
            
            # Check if this is a call we know about
            call_info = self.active_calls.get(call_id)
            
            if not call_info:
                # Try to get it from the database
                session = models.get_call_session(call_id)
                if not session:
                    return {
                        'success': False,
                        'message': 'Call not found'
                    }
            
            # Use the Asterisk AMI to hangup the call
            # We need to find the channel associated with this call ID
            # First, try to find it by using the ActionID from originate
            hangup_cmd = (
                f"Action: Hangup\r\n"
                f"ActionID: hangup-{call_id}\r\n"
                f"Channel: {call_id}\r\n"  # This is a best guess, it might need to be refined
                f"\r\n"
            )
            
            # Send the command
            self.ami_socket.send(hangup_cmd.encode())
            
            # Read the response
            response = self._read_response()
            
            # Update the call session in the database
            models.update_call_session_status(call_id, 'completed')
            
            # Update our local tracking
            if call_id in self.active_calls:
                self.active_calls[call_id]['status'] = 'completed'
                self.active_calls[call_id]['end_time'] = time.time()
            
            return {
                'success': True,
                'status': 'completed'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to end call: {str(e)}'
            }
    
    def get_call_status(self, call_id):
        """Get the status of a call"""
        if not self.is_configured():
            return {
                'success': False,
                'message': 'Asterisk is not properly configured'
            }
        
        try:
            # First, check our local cache of active calls
            if call_id in self.active_calls:
                call_info = self.active_calls[call_id]
                duration = 0
                if 'start_time' in call_info:
                    if 'end_time' in call_info:
                        duration = int(call_info['end_time'] - call_info['start_time'])
                    else:
                        duration = int(time.time() - call_info['start_time'])
                
                return {
                    'success': True,
                    'status': call_info['status'],
                    'direction': 'outbound',
                    'duration': duration,
                    'from': ASTERISK_EXTENSION,
                    'to': call_info['to_number']
                }
            
            # If not in our cache, try to connect to AMI and check
            if not self._connect_to_ami():
                # If we can't connect, try to get info from the database
                session = models.get_call_session(call_id)
                if not session:
                    return {
                        'success': False,
                        'message': 'Call not found'
                    }
                
                # Return limited info from the database
                return {
                    'success': True,
                    'status': session.get('status', 'unknown'),
                    'direction': 'outbound',
                    'duration': 0,  # We don't have this info
                    'from': ASTERISK_EXTENSION,
                    'to': session.get('phone_number', 'unknown')
                }
            
            # Send a Status command to check if the call is still active
            status_cmd = (
                f"Action: Status\r\n"
                f"ActionID: status-{call_id}\r\n"
                f"\r\n"
            )
            
            # Send the command
            self.ami_socket.send(status_cmd.encode())
            
            # Read the response
            response = self._read_response()
            
            # Parse the response to determine the call status
            # This would need to be adapted based on the actual output format
            status = 'completed'  # Default to completed if we can't find it
            if "State: Up" in response:
                status = 'in-progress'
            elif "State: Ringing" in response:
                status = 'ringing'
            
            # Get info from the database as a backup
            session = models.get_call_session(call_id)
            phone_number = 'unknown'
            if session:
                phone_number = session.get('phone_number', 'unknown')
                
                # If the database says the call is completed, trust that
                if session.get('status') == 'completed':
                    status = 'completed'
            
            return {
                'success': True,
                'status': status,
                'direction': 'outbound',
                'duration': 0,  # We would need more parsing to get this
                'from': ASTERISK_EXTENSION,
                'to': phone_number
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to get call status: {str(e)}'
            }
    
    def generate_asterisk_dialplan(self, voice_id=None, message=None):
        """Generate Asterisk dialplan for voice transformation
        
        In Asterisk, we would create a custom dialplan instead of using TwiML.
        This would be included in the extensions.conf file on the Asterisk server.
        """
        dialplan = []
        
        # A sample dialplan for voice transformation
        dialplan.append("[voice-changer]")
        
        if voice_id:
            # Get voice details if available
            voice = models.get_voice_by_id(voice_id)
            if voice:
                voice_name = voice.get('name', 'Custom Voice')
                voice_params = voice.get('parameters', {})
                
                # Add voice parameters as variables
                dialplan.append(f"exten => s,1,Set(VOICE_ID={voice_id})")
                dialplan.append(f"exten => s,n,Set(VOICE_NAME={voice_name})")
                dialplan.append(f"exten => s,n,Set(VOICE_PITCH={voice_params.get('pitch', 0)})")
                dialplan.append(f"exten => s,n,Set(VOICE_FORMANT={voice_params.get('formant', 0)})")
                dialplan.append(f"exten => s,n,Set(VOICE_EFFECT={voice_params.get('effect', 'none')})")
                
                # Add a greeting with the voice name
                dialplan.append(f'exten => s,n,Playback(custom/voice-changer-greeting)')
                dialplan.append(f'exten => s,n,SayAlpha({voice_name})')
                
                # Apply voice transformation (this would require a custom Asterisk module/app)
                dialplan.append(f'exten => s,n,VoiceTransform(${VOICE_ID},${VOICE_PITCH},${VOICE_FORMANT},${VOICE_EFFECT})')
            else:
                # Default greeting if voice not found
                dialplan.append('exten => s,1,Playback(custom/voice-changer-greeting)')
        else:
            # Default greeting with no voice transformation
            dialplan.append('exten => s,1,Playback(custom/voice-changer-greeting)')
        
        # Add options for the caller
        dialplan.append('exten => s,n,Background(custom/voice-options)')
        dialplan.append('exten => s,n,WaitExten(10)')
        
        # Add handlers for different DTMF options
        dialplan.append('exten => 1,1,Playback(custom/original-voice)')
        dialplan.append('exten => 1,n,Set(VOICE_TRANSFORM=0)')
        dialplan.append('exten => 1,n,Goto(voice-changer-call,s,1)')
        
        dialplan.append('exten => 2,1,Playback(custom/transformed-voice)')
        dialplan.append('exten => 2,n,Set(VOICE_TRANSFORM=1)')
        dialplan.append('exten => 2,n,Goto(voice-changer-call,s,1)')
        
        # Default timeout or invalid option
        dialplan.append('exten => t,1,Playback(custom/no-selection)')
        dialplan.append('exten => t,n,Goto(s,1)')
        dialplan.append('exten => i,1,Playback(custom/invalid-selection)')
        dialplan.append('exten => i,n,Goto(s,1)')
        
        # Add the actual call context
        dialplan.append('')
        dialplan.append('[voice-changer-call]')
        dialplan.append('exten => s,1,Dial(${ARG1},30)')
        dialplan.append('exten => s,n,Hangup()')
        
        # Join the dialplan lines with newlines
        return '\n'.join(dialplan)
    
    def handle_asterisk_dtmf(self, digit, call_id):
        """Handle DTMF tones during an Asterisk call.
        This would typically be handled by the Asterisk dialplan,
        but we provide this method to simulate the behavior."""
        try:
            # Process DTMF
            if not digit or not call_id:
                return {'success': False, 'message': 'Invalid DTMF input'}
                
            # Handle digit press
            return {'success': True, 'digit': digit, 'call_id': call_id}
            
        except Exception as e:
            return {'success': False, 'message': str(e)}
        if not self.is_configured():
            return {
                'success': False,
                'message': 'Asterisk is not properly configured'
            }
        
        try:
            # Connect to the Asterisk AMI
            if not self._connect_to_ami():
                return {
                    'success': False,
                    'message': 'Failed to connect to Asterisk AMI'
                }
            
            # Check if this is a call we know about
            call_info = self.active_calls.get(call_id)
            
            if not call_info:
                # Try to get it from the database
                session = models.get_call_session(call_id)
                if not session:
                    return {
                        'success': False,
                        'message': 'Call not found'
                    }
            
            # Get the voice model if applicable
            voice_id = None
            voice_name = "Default"
            
            if call_info and 'voice_id' in call_info:
                voice_id = call_info['voice_id']
            elif session and 'voice_id' in session:
                voice_id = session['voice_id']
                
            if voice_id:
                voice = models.get_voice_by_id(voice_id)
                if voice:
                    voice_name = voice.get('name', 'Custom Voice')
            
            # Handle different DTMF options
            message = ""
            action = ""
            
            if digit == '1':
                message = "Using original voice"
                action = "disable_transform"
            elif digit == '2':
                message = f"Using transformed voice: {voice_name}"
                action = "enable_transform"
            elif digit == '*':
                message = "Voice selection menu"
                action = "voice_menu"
            else:
                message = "Invalid selection"
                action = "none"
            
            # In a real implementation, we would use the Asterisk AMI to
            # send commands to the server that would affect the call
            # For now, we'll just return the simulated response
            
            return {
                'success': True,
                'message': message,
                'action': action,
                'voice_id': voice_id
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to handle DTMF: {str(e)}'
            }
            
    # Alias methods for backward compatibility
    def generate_voice_twiml(self, voice_id=None, message=None):
        """Legacy method for TwiML generation, now uses Asterisk dialplan"""
        return self.generate_asterisk_dialplan(voice_id, message)
    
    def handle_voice_selection(self, digit, call_sid):
        """Legacy method for voice selection, now uses Asterisk DTMF handling"""
        return self.handle_asterisk_dtmf(digit, call_sid)
    
    def handle_asterisk_dtmf(self, digit, call_id):
        """Handle DTMF tones during an Asterisk call"""
        if not digit or not call_id:
            return {'success': False, 'message': 'Invalid DTMF input'}
            
        return {'success': True, 'digit': digit, 'call_id': call_id}