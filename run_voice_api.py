import requests
import json
import os
import sys
from backend.voice_api import app

def init_database():
    """Initialize the database with celebrity voices"""
    try:
        # Call the API endpoint to initialize celebrity voices
        response = requests.post('http://localhost:5001/api/init/celebrity-voices')
        data = response.json()
        
        if response.status_code == 200:
            print(f"✅ Successfully initialized database with {data.get('count', 0)} celebrity voices")
        else:
            print(f"❌ Failed to initialize database: {data.get('error', 'Unknown error')}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Failed to initialize database: {str(e)}")
        return False

if __name__ == '__main__':
    # Check if we should initialize the database
    if len(sys.argv) > 1 and sys.argv[1] == 'init':
        print("Initializing database with celebrity voices...")
        init_database()
    
    # Start the Flask API
    print("Starting Voice API on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)