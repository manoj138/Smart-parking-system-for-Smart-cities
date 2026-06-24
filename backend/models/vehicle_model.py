import config.db_config as db_config
from datetime import datetime

def init_vehicle_table(cursor=None):
    pass

def is_vehicle_parked(vehicle_number):
    vehicles = db_config.get_vehicles()
    for v in vehicles:
        if v.get('vehicle_number') == vehicle_number and v.get('status') == 'parked':
            return True
    return False

def insert_vehicle_entry(cursor=None, vehicle_number=None, owner_name=None, phone=None, vehicle_type='Car', entry_time=None, slot_id=None):
    if not entry_time:
        entry_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Resolve slot_number from slots cache
    slot_number = str(slot_id)
    slots = db_config.get_slots()
    if isinstance(slot_id, int):
        for s in slots:
            if s.get('id') == slot_id:
                slot_number = s.get('slot_number')
                break
    else:
        for s in slots:
            if s.get('slot_number') == str(slot_id):
                slot_number = s.get('slot_number')
                break

    # Calculate next ID from vehicles cache
    vehicles = db_config.get_vehicles()
    next_id = max([int(v.get('id', 0)) for v in vehicles] + [0]) + 1

    doc_ref = db_config.db.collection('vehicles').document()
    doc_ref.set({
        'id': next_id,
        'vehicle_number': vehicle_number,
        'owner_name': owner_name,
        'phone': phone,
        'vehicle_type': vehicle_type,
        'entry_time': entry_time,
        'exit_time': None,
        'slot_id': slot_id,
        'slot_number': slot_number,
        'status': 'parked'
    })

    # Invalidate cache
    db_config.invalidate_vehicles()

def get_parked_vehicle_by_slot(slot_number):
    vehicles = db_config.get_vehicles()
    for v in vehicles:
        if v.get('status') == 'parked':
            if v.get('slot_number') == slot_number or str(v.get('slot_id')) == str(slot_number):
                return v
    return None

def get_parked_vehicle_by_plate(vehicle_number):
    vehicles = db_config.get_vehicles()
    for v in vehicles:
        if v.get('vehicle_number') == vehicle_number and v.get('status') == 'parked':
            return v
    return None

def checkout_vehicle_session(cursor=None, vehicle_id=None, exit_time=None):
    if not exit_time:
        exit_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Try updating by doc ID string
    doc_ref = db_config.db.collection('vehicles').document(str(vehicle_id))
    if doc_ref.get().exists:
        doc_ref.update({
            'exit_time': exit_time,
            'status': 'completed'
        })
    else:
        # Query by integer id if passed
        query_val = vehicle_id
        if isinstance(vehicle_id, str):
            try:
                query_val = int(vehicle_id)
            except ValueError:
                pass
        
        docs = db_config.db.collection('vehicles').where('id', '==', query_val).limit(1).stream()
        res = list(docs)
        if res:
            res[0].reference.update({
                'exit_time': exit_time,
                'status': 'completed'
            })
            
    # Invalidate cache
    db_config.invalidate_vehicles()
