import config.db_config as db_config
from datetime import datetime

def init_slot_table(cursor=None):
    pass

def seed_default_slots(cursor=None):
    # Check if slots exist
    slots = db_config.get_slots()
    if not slots:
        print("Seeding 100 default parking slots to Cloud Firestore...")
        batch = db_config.db.batch()
        for i in range(1, 101):
            slot_num = f"P{i}"
            if i <= 35:
                floor = "Ground Floor"
            elif i <= 70:
                floor = "First Floor"
            else:
                floor = "Second Floor"
            
            # P91-P100: EV Slots, P81-P90: VIP Slots, others: Normal
            if 91 <= i <= 100:
                slot_type = 'ev'
                allowed_vehicle = 'all'
                custom_rate = None
            elif 81 <= i <= 90:
                slot_type = 'vip'
                allowed_vehicle = 'all'
                custom_rate = 40.0 # premium hourly rate
            else:
                slot_type = 'normal'
                allowed_vehicle = 'all'
                custom_rate = None
            
            doc_ref = db_config.db.collection('parking_slots').document(slot_num)
            batch.set(doc_ref, {
                'id': i,
                'slot_number': slot_num,
                'status': 'available',
                'floor': floor,
                'slot_type': slot_type,
                'allowed_vehicle': allowed_vehicle,
                'custom_rate': custom_rate,
                'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
            
            # Commit batch in chunks of 50 docs
            if i % 50 == 0:
                batch.commit()
                batch = db_config.db.batch()
        db_config.invalidate_slots()

def get_slots_filtered(floor=None, status=None, search=None):
    # Fetch slots from cache
    cached_slots = db_config.get_slots()
    
    # Fetch vehicles from cache
    cached_vehicles = db_config.get_vehicles()
    vehicles_by_slot = {}
    for v in cached_vehicles:
        if v.get('status') == 'parked':
            slot_ref = v.get('slot_number') or str(v.get('slot_id'))
            vehicles_by_slot[slot_ref] = v

    slots = []
    for slot_data in cached_slots:
        slot = dict(slot_data) # Clone dict to prevent modifying global cache directly
        slot_num = slot['slot_number']
        slot_id_str = str(slot['id'])
        
        # Merge vehicle data if occupied/reserved
        v = vehicles_by_slot.get(slot_num) or vehicles_by_slot.get(slot_id_str)
        if v:
            slot['vehicle_number'] = v.get('vehicle_number')
            slot['owner_name'] = v.get('owner_name')
            slot['phone'] = v.get('phone')
            slot['vehicle_type'] = v.get('vehicle_type')
            slot['entry_time'] = v.get('entry_time')
            slot['vehicle_id'] = v.get('id')
        else:
            slot['vehicle_number'] = None
            slot['owner_name'] = None
            slot['phone'] = None
            slot['vehicle_type'] = None
            slot['entry_time'] = None
            slot['vehicle_id'] = None

        # Filter logic in python
        if floor and slot['floor'] != floor:
            continue
        if status and slot['status'] != status:
            continue
        if search:
            search_lower = search.lower()
            match_slot = search_lower in slot['slot_number'].lower()
            match_veh = v and (
                search_lower in (v.get('vehicle_number') or '').lower() or
                search_lower in (v.get('owner_name') or '').lower()
            )
            if not match_slot and not match_veh:
                continue
        
        slots.append(slot)
    return slots

def get_nearest_available_slot(cursor=None, vehicle_type=None, is_vip=False):
    slots = db_config.get_slots()
    
    # 1. VIP Specific request
    if is_vip:
        vip_slots = [s for s in slots if s.get('status') == 'available' and s.get('slot_type') == 'vip']
        if vip_slots:
            return vip_slots[0]

    # 2. EV Specific request
    if vehicle_type == 'EV':
        ev_slots = [s for s in slots if s.get('status') == 'available' and s.get('slot_type') == 'ev']
        if ev_slots:
            return ev_slots[0]

    # 3. Normal search with allowed vehicle filters
    normal_slots = [s for s in slots if s.get('status') == 'available' and s.get('slot_type') == 'normal']
    for slot in normal_slots:
        allowed = slot.get('allowed_vehicle', 'all')
        if vehicle_type == 'Bike':
            if allowed in ['bike', 'all']:
                return slot
        elif vehicle_type in ['Car', 'SUV', 'EV']:
            if allowed in ['car', 'all']:
                return slot
        else:
            return slot

    # 4. Fallback search (any available non-VIP slot)
    available_slots = [s for s in slots if s.get('status') == 'available']
    if is_vip:
        if available_slots:
            return available_slots[0]
    else:
        for slot in available_slots:
            if slot.get('slot_type') != 'vip':
                return slot

    return None

def update_slot_status(cursor=None, slot_id=None, status='available', timestamp=None):
    if not timestamp:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Perform Firestore write
    if isinstance(slot_id, int):
        slots_ref = db_config.db.collection('parking_slots').where('id', '==', slot_id).limit(1).stream()
        res = list(slots_ref)
        if res:
            res[0].reference.update({
                'status': status,
                'updated_at': timestamp
            })
    elif isinstance(slot_id, str):
        doc_ref = db_config.db.collection('parking_slots').document(slot_id)
        if doc_ref.get().exists:
            doc_ref.update({
                'status': status,
                'updated_at': timestamp
            })
        else:
            slots_ref = db_config.db.collection('parking_slots').where('slot_number', '==', slot_id).limit(1).stream()
            res = list(slots_ref)
            if res:
                res[0].reference.update({
                    'status': status,
                    'updated_at': timestamp
                })
    
    # Invalidate cache
    db_config.invalidate_slots()
