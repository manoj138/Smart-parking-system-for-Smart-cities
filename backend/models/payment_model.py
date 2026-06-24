import config.db_config as db_config
from datetime import datetime

def init_payment_table(cursor=None):
    pass

def insert_payment_record(cursor=None, vehicle_id=None, amount=0.0, payment_method='UPI', payment_status='completed', created_at=None):
    if not created_at:
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Get sequential ID from cache
    payments = db_config.get_payments()
    next_id = max([int(p.get('id', 0)) for p in payments] + [0]) + 1

    doc_ref = db_config.db.collection('payments').document()
    doc_ref.set({
        'id': next_id,
        'vehicle_id': vehicle_id,
        'amount': float(amount),
        'payment_method': payment_method,
        'payment_status': payment_status,
        'created_at': created_at
    })

    # Invalidate cache
    db_config.invalidate_payments()

def get_payment_ledger():
    # Fetch from cache
    payments = db_config.get_payments()
    vehicles = db_config.get_vehicles()
    
    vehicles_map = {str(v.get('id')): v for v in vehicles}
    # map by doc ID string too
    for v in vehicles:
        vehicles_map[v['id']] = v

    ledger = []
    for p_data in payments:
        pay = dict(p_data) # Clone
        veh_id = str(pay.get('vehicle_id'))
        v = vehicles_map.get(veh_id)
        if v:
            pay['vehicle_number'] = v.get('vehicle_number')
            pay['owner_name'] = v.get('owner_name')
            pay['vehicle_type'] = v.get('vehicle_type')
        else:
            pay['vehicle_number'] = 'Unknown'
            pay['owner_name'] = 'N/A'
            pay['vehicle_type'] = 'Car'
            
        ledger.append(pay)
    return ledger
