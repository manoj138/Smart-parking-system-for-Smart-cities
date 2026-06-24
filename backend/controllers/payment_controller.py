from flask import request, jsonify
from datetime import datetime
import config.db_config as db_config
import models.slot_model as slot_model
import models.vehicle_model as vehicle_model
import models.payment_model as payment_model

def handle_get_payments():
    payments = payment_model.get_payment_ledger()
    return jsonify(payments)

def handle_calculate_fee():
    data = request.json
    slot_num = data.get('slot_number', '').strip()
    veh_num = data.get('vehicle_number', '').strip().upper()

    vehicle = None
    if slot_num:
        vehicle = vehicle_model.get_parked_vehicle_by_slot(slot_num)
    elif veh_num:
        vehicle = vehicle_model.get_parked_vehicle_by_plate(veh_num)
    else:
        return jsonify({'success': False, 'message': 'Please provide Slot Number or Vehicle Number'}), 400

    if not vehicle:
        return jsonify({'success': False, 'message': 'No parked vehicle matches the query'}), 404

    # Calculate active occupancy rate from cache
    slots = db_config.get_slots()
    total_slots = len(slots)
    occupied_slots = len([s for s in slots if s.get('status') == 'occupied'])
    
    # Fetch this slot's category & rate attributes dynamically from cache
    slot_number_str = vehicle['slot_number']
    slot_info = next((s for s in slots if s.get('slot_number') == slot_number_str), None)
    
    slot_type = 'normal'
    custom_rate = None
    if slot_info:
        slot_type = slot_info.get('slot_type', 'normal')
        custom_rate = slot_info.get('custom_rate')

    occupancy_pct = (occupied_slots / total_slots) * 100 if total_slots > 0 else 0

    # Determine dynamic rate multiplier
    if occupancy_pct < 50.0:
        multiplier = 1.0
        label = "Normal"
    elif occupancy_pct < 80.0:
        multiplier = 1.5
        label = "Peak"
    else:
        multiplier = 2.0
        label = "Surge"

    base_rate_to_use = custom_rate if custom_rate is not None else db_config.RATE_PER_HOUR
    active_rate = base_rate_to_use * multiplier

    # Calculation logic
    entry_time = datetime.strptime(vehicle['entry_time'], '%Y-%m-%d %H:%M:%S')
    now = datetime.now()
    duration = now - entry_time
    duration_hours = max(0.1, round(duration.total_seconds() / 3600.0, 2))
    
    # Calculate base parking cost
    parking_fee = round(duration_hours * active_rate, 2)
    
    # EV Charging Logic
    is_ev = (slot_type == 'ev') and (vehicle['vehicle_type'] == 'EV')
    energy_kwh = 0.0
    charging_fee = 0.0
    
    if is_ev:
        # EV stats: 7.2 kW charging speed, ₹10 per kWh
        energy_kwh = round(duration_hours * 7.2, 2)
        charging_fee = round(energy_kwh * 10.0, 2)

    total_amount = max(active_rate + charging_fee, round(parking_fee + charging_fee, 2))

    return jsonify({
        'success': True,
        'vehicle_id': vehicle['id'],
        'vehicle_number': vehicle['vehicle_number'],
        'owner_name': vehicle['owner_name'],
        'vehicle_type': vehicle['vehicle_type'],
        'slot_number': vehicle['slot_number'],
        'entry_time': vehicle['entry_time'],
        'exit_time': now.strftime('%Y-%m-%d %H:%M:%S'),
        'duration_hours': duration_hours,
        'hourly_rate': active_rate,
        'rate_multiplier': multiplier,
        'rate_label': label,
        'is_ev': is_ev,
        'energy_kwh': energy_kwh,
        'charging_fee': charging_fee,
        'parking_fee': parking_fee,
        'amount': total_amount
    })

def handle_checkout():
    data = request.json
    v_id = data.get('vehicle_id')
    pay_method = data.get('payment_method', 'UPI')
    amount = data.get('amount')

    if not v_id:
        return jsonify({'success': False, 'message': 'Vehicle ID is required'}), 400

    try:
        # Find vehicle details in cache to release slot
        vehicles = db_config.get_vehicles()
        veh_data = next((v for v in vehicles if (str(v.get('id')) == str(v_id) or v['id'] == v_id) and v.get('status') == 'parked'), None)
        if not veh_data:
            return jsonify({'success': False, 'message': 'Vehicle not found or already checked out'}), 404

        v_id = veh_data['id'] # Document ID or integer ID
        slot_number = veh_data['slot_number']
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Checkout vehicle session
        vehicle_model.checkout_vehicle_session(None, v_id, now_str)
        
        # Release parking slot
        slot_model.update_slot_status(None, slot_number, 'available', now_str)
        
        # Log payment
        payment_model.insert_payment_record(None, v_id, amount, pay_method, 'completed', now_str)

        return jsonify({
            'success': True,
            'message': f'Payment of ₹{amount} recorded. Exit Gate status: OPEN. Vehicle checkout complete.',
            'gate_status': 'OPEN'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
