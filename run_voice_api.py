import requests
import json
import os
import sys
import time
from backend.voice_api import app
from backend import models

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
    # Check if we should initialize the database
    if len(sys.argv) > 1 and sys.argv[1] == 'init':
        print("Initializing database with celebrity voices...")
        # Start the app
        print("Starting Voice API on port 5001...")
        # Run the Flask app in a separate thread
        import threading
        def run_app():
            app.run(host='0.0.0.0', port=5001, debug=False)
        
        app_thread = threading.Thread(target=run_app)
        app_thread.daemon = True
        app_thread.start()
        
        # Wait for the app to start
        print("Waiting for API to start...")
        time.sleep(2)
        
        # Then initialize the database
        init_success = False
        try:
            # Try to call the API endpoint
            response = requests.post('http://localhost:5001/api/init/celebrity-voices')
            data = response.json()
            
            if response.status_code == 200:
                print(f"✅ Successfully initialized database with {data.get('count', 0)} celebrity voices")
                init_success = True
            else:
                print(f"❌ Failed to initialize database: {data.get('error', 'Unknown error')}")
        except Exception as e:
            print(f"❌ Failed to initialize database via API: {str(e)}")
            print("Trying direct database initialization...")
            init_success = init_database()
        
        if init_success:
            print("✅ Celebrity voices initialized successfully")
        else:
            print("❌ Failed to initialize celebrity voices")
        
        # Keep the main thread running
        while True:
            try:
                time.sleep(1)
            except KeyboardInterrupt:
                print("Shutting down...")
                break
    else:
        # Just start the Flask API normally
        print("Starting Voice API on port 5001...")
        app.run(host='0.0.0.0', port=5001, debug=True)