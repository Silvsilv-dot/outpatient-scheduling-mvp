# api/index.py

import sys
import os

# Adds your project root to the Python path so it can find your app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import your FastAPI app instance. 
# Update this import path if your app is located in a subfolder (e.g., from backend.main import app)
from main import app
