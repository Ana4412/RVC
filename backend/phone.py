import os
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from backend import models

# Twilio credentials
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')

class PhoneCallManager:
    def __init__(self):
        """Initialize the phone call manager"""
        self.client = None
        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
            self.client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    def is_configured(self):
        """Check if Twilio is properly configured"""
        return self.client is not None and TWILIO_PHONE_NUMBER is not None
    
    def start_call(self, to_number, voice_id=None, callback_url=None):
        """Start a new phone call with voice transformation"""
        if not self.is_configured():
            return {
                'success': False,
                'message': 'Twilio is not properly configured'
            }
        
        try:
            # Validate the phone number (simple validation)
            if not to_number.startswith('+'):
                to_number = '+' + to_number
            
            # Get voice details if provided
            voice_params = {}
            if voice_id:
                voice = models.get_voice_by_id(voice_id)
                if voice:
                    voice_params = voice.get('parameters', {})
            
            # Create the call with Twilio
            call = self.client.calls.create(
                to=to_number,
                from_=TWILIO_PHONE_NUMBER,
                url=callback_url or 'http://example.com/voice.xml',  # This should be your TwiML URL
                status_callback=callback_url + '/status' if callback_url else None,
                status_callback_event=['initiated', 'ringing', 'answered', 'completed'],
                status_callback_method='POST'
            )
            
            # Store call session in database
            session_id = call.sid
            models.create_call_session(
                phone_number=to_number,
                voice_id=voice_id,
                session_id=session_id,
                parameters=voice_params
            )
            
            return {
                'success': True,
                'call_sid': call.sid,
                'status': call.status
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to start call: {str(e)}'
            }
    
    def end_call(self, call_sid):
        """End an active call"""
        if not self.is_configured():
            return {
                'success': False,
                'message': 'Twilio is not properly configured'
            }
        
        try:
            # Update the call status
            call = self.client.calls(call_sid).update(status='completed')
            
            # Update the call session in the database
            models.update_call_session_status(call_sid, 'completed')
            
            return {
                'success': True,
                'status': call.status
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to end call: {str(e)}'
            }
    
    def get_call_status(self, call_sid):
        """Get the status of a call"""
        if not self.is_configured():
            return {
                'success': False,
                'message': 'Twilio is not properly configured'
            }
        
        try:
            call = self.client.calls(call_sid).fetch()
            return {
                'success': True,
                'status': call.status,
                'direction': call.direction,
                'duration': call.duration,
                'from': call.from_,
                'to': call.to
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to get call status: {str(e)}'
            }
    
    def generate_voice_twiml(self, voice_id=None, message=None):
        """Generate TwiML for voice transformation"""
        response = VoiceResponse()
        
        if message:
            response.say(message)
        
        # If voice_id is provided, get the voice parameters
        if voice_id:
            voice = models.get_voice_by_id(voice_id)
            if voice:
                # In a real implementation, these parameters would be used to 
                # configure voice transformation settings
                # For now, we'll just use them to customize the TwiML
                
                # Add a simple message with the voice name
                response.say(f"This call is using the {voice['name']} voice model.")
        
        # Add a gather for interactive options
        gather = Gather(num_digits=1, action='/voice/process', method='POST')
        gather.say("Press 1 to connect with the original voice. Press 2 to use voice transformation.")
        response.append(gather)
        
        # If no input is provided, repeat the message
        response.redirect('/voice')
        
        return str(response)
    
    def handle_voice_selection(self, digit, call_sid):
        """Handle user's voice selection"""
        response = VoiceResponse()
        
        if digit == '1':
            response.say("Connecting you with the original voice.")
            # Logic to disable voice transformation would go here
            
        elif digit == '2':
            response.say("Activating voice transformation.")
            # Logic to enable voice transformation would go here
            
            # Get the call session and voice details
            session = models.get_call_session(call_sid)
            if session and session.get('voice_id'):
                voice = models.get_voice_by_id(session['voice_id'])
                if voice:
                    response.say(f"Using the {voice['name']} voice model with {voice['accent']} accent.")
        
        else:
            response.say("Invalid selection. Please try again.")
            # Redirect back to the main menu
            response.redirect('/voice')
            return str(response)
        
        # Add a message about changing voices
        response.say("You can press star at any time to change voices.")
        
        # Connect the call
        response.dial(timeout=30, action='/voice/hangup')
        
        return str(response)