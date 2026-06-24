from flask import session, jsonify
from werkzeug.security import check_password_hash
from models.user_model import find_user_by_email

def handle_login(username, password):
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and Password are required'}), 400

    user = find_user_by_email(username)

    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        session['user_email'] = user['email']
        return jsonify({
            'success': True,
            'message': 'Logged in successfully',
            'user': {
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        })

    return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

def handle_logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

def handle_session():
    if 'user_id' in session:
        return jsonify({
            'logged_in': True,
            'user': {
                'name': session['user_name'],
                'email': session['user_email']
            }
        })
    return jsonify({'logged_in': False})
