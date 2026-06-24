import os
import firebase_admin
from firebase_admin import credentials, firestore

# Resolve service account key path
KEY_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'smart-parking-4846c-firebase-adminsdk-fbsvc-ef10ac370e.json'))

# Configurable constants
RATE_PER_HOUR = 20.0

# Initialize firebase app if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate(KEY_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Caching Layer Buffers
_slots_cache = None
_vehicles_cache = None
_payments_cache = None

def get_slots():
    global _slots_cache
    if _slots_cache is None:
        try:
            docs = db.collection('parking_slots').order_by('id').stream()
            _slots_cache = [doc.to_dict() for doc in docs]
            print(f"[CACHE] Loaded {len(_slots_cache)} slots from Firestore.")
        except Exception as e:
            print(f"[CACHE ERROR] Failed to fetch slots: {str(e)}")
            return []
    return _slots_cache

def get_vehicles():
    global _vehicles_cache
    if _vehicles_cache is None:
        try:
            docs = db.collection('vehicles').stream()
            _vehicles_cache = []
            for doc in docs:
                v = doc.to_dict()
                v['id'] = doc.id
                _vehicles_cache.append(v)
            print(f"[CACHE] Loaded {len(_vehicles_cache)} vehicles from Firestore.")
        except Exception as e:
            print(f"[CACHE ERROR] Failed to fetch vehicles: {str(e)}")
            return []
    return _vehicles_cache

def get_payments():
    global _payments_cache
    if _payments_cache is None:
        try:
            docs = db.collection('payments').order_by('created_at', direction=firestore.Query.DESCENDING).stream()
            _payments_cache = []
            for doc in docs:
                p = doc.to_dict()
                p['id'] = doc.id
                _payments_cache.append(p)
            print(f"[CACHE] Loaded {len(_payments_cache)} payments from Firestore.")
        except Exception as e:
            print(f"[CACHE ERROR] Failed to fetch payments: {str(e)}")
            return []
    return _payments_cache

def invalidate_slots():
    global _slots_cache
    _slots_cache = None
    print("[CACHE] Slots cache invalidated.")

def invalidate_vehicles():
    global _vehicles_cache
    _vehicles_cache = None
    print("[CACHE] Vehicles cache invalidated.")

def invalidate_payments():
    global _payments_cache
    _payments_cache = None
    print("[CACHE] Payments cache invalidated.")
