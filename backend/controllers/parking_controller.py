from flask import request, jsonify
from datetime import datetime
import config.db_config as db_config
import models.slot_model as slot_model
import models.vehicle_model as vehicle_model
import models.payment_model as payment_model
import simulator.sensor_daemon as sensor_daemon

def handle_get_slots():
    floor_filter = request.args.get('floor')
    status_filter = request.args.get('status')
    search_query = request.args.get('search')

    if status_filter:
        status_filter = status_filter.lower()

    slots = slot_model.get_slots_filtered(
        floor=floor_filter, 
        status=status_filter, 
        search=search_query
    )
    return jsonify(slots)

def handle_vehicle_entry():
    data = request.json
    veh_num = data.get('vehicle_number', '').strip().upper()
    veh_type = data.get('vehicle_type', 'Car')
    owner = data.get('owner_name', '').strip()
    phone = data.get('phone', '').strip()

    is_vip = data.get('is_vip', False) or (owner == 'VIP Customer')

    if not veh_num:
        return jsonify({'success': False, 'message': 'Vehicle number is required'}), 400

    # Business rule: check if parked
    if vehicle_model.is_vehicle_parked(veh_num):
        return jsonify({'success': False, 'message': f'Vehicle {veh_num} is already parked inside.'}), 400

    try:
        # Find nearest available slot
        slot = slot_model.get_nearest_available_slot(None, vehicle_type=veh_type, is_vip=is_vip)
        if not slot:
            return jsonify({'success': False, 'message': 'Parking Lot Full! No slots available.'}), 400

        slot_number = slot['slot_number']
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Insert vehicle checkin
        vehicle_model.insert_vehicle_entry(None, veh_num, owner, phone, veh_type, now_str, slot_number)
        
        # Mark slot occupied
        slot_model.update_slot_status(None, slot_number, 'occupied', now_str)

        return jsonify({
            'success': True,
            'message': 'Vehicle entry authorized. Gate status: OPEN',
            'assigned_slot': slot_number,
            'slot_type': slot['slot_type'],
            'floor': slot['floor'],
            'allowed_vehicle': slot['allowed_vehicle'],
            'custom_rate': slot['custom_rate'],
            'gate_status': 'OPEN'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def handle_reserve_slot():
    data = request.json or {}
    slot_num = data.get('slot_number', '').strip()
    owner = data.get('owner_name', '').strip()
    phone = data.get('phone', '').strip()
    veh_num = data.get('vehicle_number', '').strip().upper() or 'RESERVED'
    veh_type = data.get('vehicle_type', 'Car')

    if not slot_num:
        return jsonify({'success': False, 'message': 'Slot number is required'}), 400

    try:
        # Verify slot availability from cache
        slots = db_config.get_slots()
        slot_data = next((s for s in slots if s.get('slot_number') == slot_num), None)
        if not slot_data:
            return jsonify({'success': False, 'message': 'Slot not found'}), 404
        
        if slot_data['status'] != 'available':
            return jsonify({'success': False, 'message': f'Slot {slot_num} is not available'}), 400

        # Validate that the vehicle is not already parked/reserved
        if veh_num != 'RESERVED' and vehicle_model.is_vehicle_parked(veh_num):
            return jsonify({'success': False, 'message': f'Vehicle {veh_num} is already active in the system.'}), 400

        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Create placeholder vehicle booking
        vehicle_model.insert_vehicle_entry(None, veh_num, owner, phone, veh_type, now_str, slot_num)
        
        # Mark slot reserved
        slot_model.update_slot_status(None, slot_num, 'reserved', now_str)

        return jsonify({'success': True, 'message': f'Slot {slot_num} reserved successfully for {owner or "guest"}.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def handle_activate_reserved_slot():
    data = request.json or {}
    slot_num = data.get('slot_number', '').strip()
    veh_num = data.get('vehicle_number', '').strip().upper()

    if not slot_num or not veh_num:
        return jsonify({'success': False, 'message': 'Slot number and Vehicle number are required'}), 400

    if vehicle_model.is_vehicle_parked(veh_num):
        # Allow activating if the parked session is already this reservation!
        active_veh = vehicle_model.get_parked_vehicle_by_slot(slot_num)
        if not active_veh or active_veh['vehicle_number'] != veh_num:
            return jsonify({'success': False, 'message': f'Vehicle {veh_num} is already parked inside elsewhere.'}), 400

    try:
        # Check slot status in cache
        slots = db_config.get_slots()
        slot_data = next((s for s in slots if s.get('slot_number') == slot_num), None)
        if not slot_data or slot_data['status'] != 'reserved':
            return jsonify({'success': False, 'message': f'Slot {slot_num} is not in reserved state'}), 400

        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Update vehicle number if it was 'RESERVED', otherwise keep vehicle number and update entry time
        active_veh = vehicle_model.get_parked_vehicle_by_slot(slot_num)
        if active_veh:
            db_config.db.collection('vehicles').document(active_veh['id']).update({
                'vehicle_number': veh_num,
                'entry_time': now_str
            })
            db_config.invalidate_vehicles()

        # Update slot status to occupied
        slot_model.update_slot_status(None, slot_num, 'occupied', now_str)

        return jsonify({'success': True, 'message': f'Check-in activated for slot {slot_num}. Vehicle: {veh_num}'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def handle_cancel_reservation():
    data = request.json or {}
    slot_num = data.get('slot_number', '').strip()

    if not slot_num:
        return jsonify({'success': False, 'message': 'Slot number is required'}), 400

    try:
        slots = db_config.get_slots()
        slot_data = next((s for s in slots if s.get('slot_number') == slot_num), None)
        if not slot_data or slot_data['status'] != 'reserved':
            return jsonify({'success': False, 'message': f'Slot {slot_num} is not in reserved state'}), 400

        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Cancel vehicle booking (can be 'RESERVED' or specific plate)
        active_veh = vehicle_model.get_parked_vehicle_by_slot(slot_num)
        if active_veh:
            vehicle_model.checkout_vehicle_session(None, active_veh['id'], now_str)

        # Release slot
        slot_model.update_slot_status(None, slot_num, 'available', now_str)

        return jsonify({'success': True, 'message': f'Reservation for slot {slot_num} has been canceled.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def handle_iot_update():
    data = request.json or {}
    slot_num = data.get('slot_number', '').strip()
    distance_cm = float(data.get('distance_cm', 99.0))

    if not slot_num:
        return jsonify({'success': False, 'message': 'Slot number is required'}), 400

    try:
        slots = db_config.get_slots()
        slot_data = next((s for s in slots if s.get('slot_number') == slot_num), None)
        if not slot_data:
            return jsonify({'success': False, 'message': 'Slot not found'}), 404

        slot_status = slot_data['status']
        slot_type = slot_data['slot_type']
        custom_rate = slot_data['custom_rate']
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Threshold logic: <= 15cm is OCCUPIED
        if distance_cm <= 15.0:
            if slot_status == 'available':
                # Autodetect vehicle entry
                vehicle_model.insert_vehicle_entry(None, 'IoT-Sensor', 'Autonomous Loop', 'N/A', 'Car', now_str, slot_num)
                slot_model.update_slot_status(None, slot_num, 'occupied', now_str)
                print(f"[IoT GATEWAY] Sensor detected vehicle at slot {slot_num}. Status set to occupied.")
            elif slot_status == 'reserved':
                # Activate booking automatically
                active_veh = vehicle_model.get_parked_vehicle_by_slot(slot_num)
                if active_veh:
                    db_config.db.collection('vehicles').document(active_veh['id']).update({
                        'vehicle_number': 'IoT-Sensor',
                        'entry_time': now_str
                    })
                    db_config.invalidate_vehicles()
                slot_model.update_slot_status(None, slot_num, 'occupied', now_str)
                print(f"[IoT GATEWAY] Sensor verified reservation at slot {slot_num}. Status updated to occupied.")
            
        else: # > 15cm is VACANT (Vehicle left)
            if slot_status == 'occupied':
                # Find the active parked vehicle session
                active_veh = vehicle_model.get_parked_vehicle_by_slot(slot_num)
                
                if active_veh:
                    v_id = active_veh['id']
                    entry_time = datetime.strptime(active_veh['entry_time'], '%Y-%m-%d %H:%M:%S')
                    duration = datetime.now() - entry_time
                    duration_hours = max(0.1, round(duration.total_seconds() / 3600.0, 2))
                    
                    # Compute Dynamic Pricing rate from cache
                    occupied_slots = len([s for s in slots if s.get('status') == 'occupied'])
                    total_slots = len(slots)
                    occ_pct = (occupied_slots / total_slots) * 100 if total_slots > 0 else 0

                    multiplier = 1.0
                    if occ_pct >= 50.0 and occ_pct < 80.0:
                        multiplier = 1.5
                    elif occ_pct >= 80.0:
                        multiplier = 2.0

                    base_rate_to_use = custom_rate if custom_rate is not None else db_config.RATE_PER_HOUR
                    active_rate = base_rate_to_use * multiplier
                    parking_fee = round(duration_hours * active_rate, 2)

                    # EV Specific calculation
                    charging_fee = 0.0
                    if slot_type == 'ev':
                        energy_kwh = round(duration_hours * 7.2, 2)
                        charging_fee = round(energy_kwh * 10.0, 2)

                    total_amount = max(active_rate + charging_fee, round(parking_fee + charging_fee, 2))

                    # Perform auto checkout
                    vehicle_model.checkout_vehicle_session(None, v_id, now_str)
                    slot_model.update_slot_status(None, slot_num, 'available', now_str)
                    
                    # Record payment automatically as cash/sensor loops completion
                    payment_model.insert_payment_record(None, v_id, total_amount, 'Cash', 'completed', now_str)
                    print(f"[IoT GATEWAY] Sensor detected slot {slot_num} empty. Auto-checkout completed. Paid ₹{total_amount}.")
            
            elif slot_status == 'reserved':
                print(f"[IoT GATEWAY WARNING] Slot {slot_num} is reserved but loop sensor remains clear.")

        return jsonify({'success': True, 'message': 'IoT telemetry processed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def handle_get_settings():
    return jsonify({
        'rate_per_hour': db_config.RATE_PER_HOUR,
        'simulator_active': sensor_daemon.SIMULATOR_ACTIVE,
        'simulation_interval': sensor_daemon.SIMULATION_INTERVAL
    })

def handle_update_settings():
    data = request.json or {}
    rate = data.get('rate_per_hour')
    sim_active = data.get('simulator_active')
    sim_interval = data.get('simulation_interval')

    if rate is not None:
        db_config.RATE_PER_HOUR = float(rate)
    if sim_active is not None:
        sensor_daemon.SIMULATOR_ACTIVE = bool(sim_active)
    if sim_interval is not None:
        sensor_daemon.SIMULATION_INTERVAL = max(3, int(sim_interval))

    return jsonify({
        'success': True,
        'message': 'Settings updated successfully',
        'settings': {
            'rate_per_hour': db_config.RATE_PER_HOUR,
            'simulator_active': sensor_daemon.SIMULATOR_ACTIVE,
            'simulation_interval': sensor_daemon.SIMULATION_INTERVAL
        }
    })

def handle_create_slot():
    data = request.json or {}
    slot_num = data.get('slot_number', '').strip().upper()
    floor = data.get('floor', '').strip()
    slot_type = data.get('slot_type', 'normal').strip().lower()
    allowed_vehicle = data.get('allowed_vehicle', 'all').strip().lower()
    custom_rate_val = data.get('custom_rate')

    custom_rate = float(custom_rate_val) if (custom_rate_val is not None and str(custom_rate_val).strip() != '') else None

    if not slot_num:
        return jsonify({'success': False, 'message': 'Slot number is required'}), 400
    if not floor:
        return jsonify({'success': False, 'message': 'Floor selection is required'}), 400
    if slot_type not in ['normal', 'ev', 'vip']:
        return jsonify({'success': False, 'message': 'Invalid slot type'}), 400
    if allowed_vehicle not in ['all', 'car', 'bike']:
        return jsonify({'success': False, 'message': 'Invalid vehicle constraint'}), 400

    try:
        # Check if slot number already exists in cache
        slots = db_config.get_slots()
        if any(s.get('slot_number') == slot_num for s in slots):
            return jsonify({'success': False, 'message': f'Slot number {slot_num} already exists.'}), 400

        # Get next ID from cache
        next_id = max([s.get('id', 0) for s in slots] + [0]) + 1

        # Insert new slot
        doc_ref = db_config.db.collection('parking_slots').document(slot_num)
        doc_ref.set({
            'id': next_id,
            'slot_number': slot_num,
            'status': 'available',
            'floor': floor,
            'slot_type': slot_type,
            'allowed_vehicle': allowed_vehicle,
            'custom_rate': custom_rate,
            'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        
        # Invalidate cache
        db_config.invalidate_slots()

        return jsonify({
            'success': True,
            'message': f'Slot {slot_num} created successfully on {floor}.'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def handle_edit_slot():
    data = request.json or {}
    slot_num = data.get('slot_number', '').strip().upper()
    floor = data.get('floor', '').strip()
    slot_type = data.get('slot_type', 'normal').strip().lower()
    allowed_vehicle = data.get('allowed_vehicle', 'all').strip().lower()
    custom_rate_val = data.get('custom_rate')

    custom_rate = float(custom_rate_val) if (custom_rate_val is not None and str(custom_rate_val).strip() != '') else None

    if not slot_num:
        return jsonify({'success': False, 'message': 'Slot number is required'}), 400
    if not floor:
        return jsonify({'success': False, 'message': 'Floor selection is required'}), 400
    if slot_type not in ['normal', 'ev', 'vip']:
        return jsonify({'success': False, 'message': 'Invalid slot type'}), 400
    if allowed_vehicle not in ['all', 'car', 'bike']:
        return jsonify({'success': False, 'message': 'Invalid vehicle constraint'}), 400

    try:
        # Verify slot exists
        slots = db_config.get_slots()
        if not any(s.get('slot_number') == slot_num for s in slots):
            return jsonify({'success': False, 'message': f'Slot number {slot_num} does not exist.'}), 404

        # Update slot configuration in Firestore
        doc_ref = db_config.db.collection('parking_slots').document(slot_num)
        doc_ref.update({
            'floor': floor,
            'slot_type': slot_type,
            'allowed_vehicle': allowed_vehicle,
            'custom_rate': custom_rate,
            'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        
        # Invalidate cache
        db_config.invalidate_slots()

        return jsonify({
            'success': True,
            'message': f'Slot {slot_num} updated successfully.'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def handle_delete_slot():
    data = request.json or {}
    slot_num = data.get('slot_number', '').strip().upper()

    if not slot_num:
        return jsonify({'success': False, 'message': 'Slot number is required'}), 400

    try:
        # Verify slot exists and status is available
        slots = db_config.get_slots()
        slot_data = next((s for s in slots if s.get('slot_number') == slot_num), None)
        if not slot_data:
            return jsonify({'success': False, 'message': 'Slot not found'}), 404

        if slot_data['status'] != 'available':
            return jsonify({'success': False, 'message': f'Slot {slot_num} is currently {slot_data["status"]}. Only available slots can be deleted.'}), 400

        # Delete slot in Firestore
        doc_ref = db_config.db.collection('parking_slots').document(slot_num)
        doc_ref.delete()
        
        # Invalidate cache
        db_config.invalidate_slots()

        return jsonify({
            'success': True,
            'message': f'Slot {slot_num} has been successfully deleted.'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
