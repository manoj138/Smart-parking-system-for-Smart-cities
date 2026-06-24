from flask import Blueprint, request
import controllers.auth_controller as auth_controller

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    return auth_controller.handle_login(data.get('username'), data.get('password'))

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return auth_controller.handle_logout()

@auth_bp.route('/session', methods=['GET'])
def check_session():
    return auth_controller.handle_session()
