from config.db_config import db
from werkzeug.security import generate_password_hash
from datetime import datetime

def init_user_table(cursor=None):
    pass

def seed_default_admin(cursor=None):
    user_ref = db.collection('users').document('admin')
    doc = user_ref.get()
    if not doc.exists:
        hashed_password = generate_password_hash('admin123')
        user_ref.set({
            'name': 'System Admin',
            'email': 'admin',
            'password': hashed_password,
            'role': 'admin',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })

def find_user_by_email(email):
    if not email:
        return None
    doc_ref = db.collection('users').document(email)
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        data['id'] = doc.id
        return data
    return None
