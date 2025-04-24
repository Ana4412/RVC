import requests
import json
import os
import sys
import time
import threading
import logging
from backend.voice_api import app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

if __name__ == '__main__':
    # Run the Flask app with static file handling
    try:
        app.static_folder = '.'
        app.static_url_path = ''
        app.run(host='0.0.0.0', port=5001, debug=False)
    except Exception as e:
        logging.error(f"Failed to start API server: {e}")