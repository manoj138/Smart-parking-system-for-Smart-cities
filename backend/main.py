from flask import Flask
from flask_cors import CORS
from models import init_db
import simulator.sensor_daemon as sensor_daemon

# Import Blueprints
from routes.auth_routes import auth_bp
from routes.parking_routes import parking_bp
from routes.payment_routes import payment_bp
from routes.report_routes import report_bp

app = Flask(__name__)
app.secret_key = 'smart_parking_secure_session_key'

# Enable CORS for React frontend communications
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(parking_bp, url_prefix='/api')
app.register_blueprint(payment_bp, url_prefix='/api')
app.register_blueprint(report_bp, url_prefix='/api')

if __name__ == '__main__':
    # Initialize SQL database structure and configs seeding
    init_db()
    
    # Launch background loop sensor simulator
    sensor_daemon.start_simulator()
    
    # Start Flask Webserver
    print("Flask MVC Webserver starting...")
    app.run(debug=True, host='127.0.0.1', port=5000)
