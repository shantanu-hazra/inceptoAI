import os
import sys
from datetime import datetime
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import logging

import config
from utils.logging_setup import setup_logging
from utils.json_encoder import NumpyEncoder
from utils import json_encoder
from routes.http_routes import register_http_routes
from routes.socket_routes import register_socket_routes

# Setup logging
logger = setup_logging()


def create_app():
    # Initialize Flask app
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Set Flask to use the custom JSON encoder
    app.json_encoder = NumpyEncoder
    
    # Initialize SocketIO with our custom JSON module
    socketio = SocketIO(app, cors_allowed_origins="*", json=json_encoder, async_mode='eventlet')
    app.socketio = socketio  # Store reference to socketio in app
    
    # Create session stores
    config.session_data_stores = {}
    
    # Generate unique session ID based on timestamp if not already set
    if not hasattr(config, 'SESSION_ID'):
        config.SESSION_ID = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Register routes
    register_http_routes(app)
    register_socket_routes(socketio)
    
    # Add support for async routes
    from asgiref.wsgi import WsgiToAsgi
    asgi_app = WsgiToAsgi(app)
    app.asgi_app = asgi_app  # Store reference to asgi_app in app
    
    return app, socketio

if __name__ == '__main__':
    # Ensure analysis directory exists
    
    app, socketio = create_app()
    
    port = int(os.environ.get('PORT', config.PORT if hasattr(config, 'PORT') else 5000))
    host = config.HOST if hasattr(config, 'HOST') else '0.0.0.0'
    debug = config.DEBUG if hasattr(config, 'DEBUG') else True
    
    logger.info(f"Starting combined analysis server on {host}:{port}")
    logger.info(f"Session ID: {config.SESSION_ID}")
    
    socketio.run(app, host=host, port=port, debug=debug)