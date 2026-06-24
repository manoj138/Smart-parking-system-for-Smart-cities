from models.user_model import seed_default_admin
from models.slot_model import seed_default_slots

def init_db():
    # Seed Firestore collections if empty
    seed_default_admin()
    seed_default_slots()
