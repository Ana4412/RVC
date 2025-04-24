import requests
import json
import os
import sys
import time
import threading
from backend.voice_api import app as voice_api_app
from backend import models
from backend.agi_server import run_agi_server

def init_database():
    """Initialize the database with celebrity voices"""
    try:
        # First, test if the database connection is working
        print("Testing database connection...")
        try:
            models.get_all_voices()
            print("✅ Database connection successful")
        except Exception as db_error:
            print(f"❌ Database connection failed: {str(db_error)}")
            return False
        
        # Load the celebrity voices directly from the API module
        print("Loading celebrity voices...")
        
        # Get list of celebrity voices defined in the API
        from backend.voice_api import celebrity_voices
        
        # Add the celebrity voices directly to the database
        success = models.add_celebrity_voices(celebrity_voices)
        
        # Check if successful
        if success:
            print(f"✅ Successfully initialized database with {len(celebrity_voices)} celebrity voices")
            return True
        else:
            print(f"❌ Failed to initialize database directly")
            return False
            
    except Exception as e:
        print(f"❌ Failed to initialize database: {str(e)}")
        return False

if __name__ == '__main__':
    # Start AGI server in a separate thread
    agi_thread = threading.Thread(target=run_agi_server)
    agi_thread.daemon = True
    agi_thread.start()

    # Run the Flask API
    voice_api_app.run(host='0.0.0.0', port=5001, debug=True)