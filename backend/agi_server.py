import os
import sys
import socket
import threading
import re
import logging
import time
from time import sleep
import json
from backend import models

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FastAGI')

# Default AGI server settings
AGI_HOST = os.environ.get('AGI_HOST', '0.0.0.0')
AGI_PORT = int(os.environ.get('AGI_PORT', '4573'))  # Traditional AGI port

# Voice parameter environment variables
VOICE_CACHE_TIMEOUT = int(os.environ.get('VOICE_CACHE_TIMEOUT', '300'))  # 5 minutes


class VoiceProcessor:
    """Class to handle voice processing and transformation"""
    
    def __init__(self):
        self.voice_cache = {}  # Cache for recently used voices
        self.voice_cache_times = {}  # Timestamps for cache entries
    
    def get_voice_parameters(self, voice_id):
        """Get voice parameters from cache or database"""
        # Check if voice is in cache and not expired
        if voice_id in self.voice_cache:
            return self.voice_cache[voice_id]
        
        # If not in cache, fetch from database
        voice = models.get_voice_by_id(voice_id)
        if voice:
            # Cache the voice parameters
            self.voice_cache[voice_id] = voice.get('parameters', {})
            self.voice_cache_times[voice_id] = time.time()
            return self.voice_cache[voice_id]
        
        return {}
    
    def clean_cache(self):
        """Remove expired entries from the voice cache"""
        current_time = time.time()
        expired_keys = []
        
        for voice_id, timestamp in self.voice_cache_times.items():
            if current_time - timestamp > VOICE_CACHE_TIMEOUT:
                expired_keys.append(voice_id)
        
        for key in expired_keys:
            if key in self.voice_cache:
                del self.voice_cache[key]
            if key in self.voice_cache_times:
                del self.voice_cache_times[key]
    
    def transform_voice(self, voice_id, audio_data):
        """Apply voice transformation to the audio data
        
        In a real implementation, this would use audio processing libraries
        to transform the voice according to the voice parameters.
        
        Args:
            voice_id (str): ID of the voice to use
            audio_data (bytes): Raw audio data to transform
            
        Returns:
            bytes: Transformed audio data
        """
        params = self.get_voice_parameters(voice_id)
        
        # This is a placeholder. In a real implementation, we would:
        # 1. Convert the audio data to the appropriate format
        # 2. Apply the voice transformation (pitch shift, formant shift, effects)
        # 3. Return the transformed audio data
        
        # For this demo, we're just returning the original audio
        # In a real AGI implementation, audio processing would be done
        # by an external module or service
        
        logger.info(f"Applied voice transformation with parameters: {params}")
        return audio_data


class AGIServer:
    """FastAGI server for voice transformation in Asterisk"""
    
    def __init__(self, host=AGI_HOST, port=AGI_PORT):
        self.host = host
        self.port = port
        self.socket = None
        self.running = False
        self.clients = []
        self.voice_processor = VoiceProcessor()
    
    def start(self):
        """Start the AGI server"""
        # Create server socket
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.bind((self.host, self.port))
        self.socket.listen(5)
        self.running = True
        
        logger.info(f"FastAGI server started on {self.host}:{self.port}")
        
        try:
            while self.running:
                # Accept client connections
                client, address = self.socket.accept()
                logger.info(f"New AGI connection from {address}")
                
                # Start a new thread to handle the client
                client_thread = threading.Thread(target=self.handle_client, args=(client, address))
                client_thread.daemon = True
                client_thread.start()
                self.clients.append((client, client_thread))
                
                # Clean up any closed client connections
                self._cleanup_clients()
                
                # Clean up voice cache
                self.voice_processor.clean_cache()
        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt, shutting down...")
            self.stop()
        except Exception as e:
            logger.error(f"Error in AGI server: {e}")
            self.stop()
    
    def stop(self):
        """Stop the AGI server"""
        self.running = False
        
        # Close all client connections
        for client, _ in self.clients:
            try:
                client.close()
            except:
                pass
        
        # Close server socket
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
            
        logger.info("AGI server stopped")
    
    def _cleanup_clients(self):
        """Remove connections for closed clients"""
        active_clients = []
        for client, thread in self.clients:
            if thread.is_alive():
                active_clients.append((client, thread))
            else:
                try:
                    client.close()
                except:
                    pass
        self.clients = active_clients
    
    def handle_client(self, client_socket, address):
        """Handle a client connection"""
        try:
            # Read AGI environment variables
            env = {}
            while True:
                line = client_socket.recv(1024).decode().strip()
                if not line or line == '':
                    break
                logger.debug(f"Received: {line}")
                
                if ':' in line:
                    key, value = line.split(':', 1)
                    env[key.strip()] = value.strip()
            
            logger.info(f"AGI environment: {env}")
            
            # Extract voice parameters from environment
            voice_id = env.get('agi_arg_1', '')
            
            # Send AGI response
            self._send_response(client_socket, "200 status=ready")
            
            # Process AGI commands
            while True:
                command = client_socket.recv(1024).decode().strip()
                if not command:
                    break
                
                logger.debug(f"Command: {command}")
                
                if command.startswith("EXEC VoiceTransform"):
                    # Extract arguments from command
                    args = re.findall(r'"([^"]*)"', command)
                    if len(args) >= 1:
                        voice_id = args[0]
                    
                    # Apply voice transformation
                    # In a real implementation, this would be where we'd hook into
                    # the audio stream for processing
                    response = "200 result=1"
                    self._send_response(client_socket, response)
                
                elif command.startswith("STREAM FILE"):
                    # Handle streaming file with voice transformation
                    # This would be where we'd transform the audio in a real implementation
                    response = "200 result=0"
                    self._send_response(client_socket, response)
                
                elif command.startswith("HANGUP"):
                    # Handle hangup command
                    response = "200 result=1"
                    self._send_response(client_socket, response)
                    break
                
                elif command.startswith("GET VARIABLE"):
                    # Extract the variable name
                    var_name = command.split(" ", 2)[2].strip('"')
                    
                    # Provide the appropriate response based on the variable
                    if var_name == "VOICE_ID":
                        response = f'200 result=1 "{voice_id}"'
                    else:
                        response = '200 result=0 ""'
                    
                    self._send_response(client_socket, response)
                
                else:
                    # Default response for unsupported commands
                    response = "200 result=0"
                    self._send_response(client_socket, response)
        
        except Exception as e:
            logger.error(f"Error handling AGI client: {e}")
        finally:
            try:
                client_socket.close()
            except:
                pass
    
    def _send_response(self, client_socket, response):
        """Send a response to the AGI client"""
        logger.debug(f"Sending response: {response}")
        client_socket.send((response + "\n").encode())


def run_agi_server():
    """Run the AGI server"""
    server = AGIServer()
    server.start()


if __name__ == "__main__":
    run_agi_server()