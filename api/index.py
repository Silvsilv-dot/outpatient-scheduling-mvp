import sys
import os

# Add the parent/root directory to sys.path so 'main.py' can be imported successfully
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
