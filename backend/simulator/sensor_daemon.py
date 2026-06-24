import time
import random
import threading
from datetime import datetime
from config.db_config import db, RATE_PER_HOUR, get_slots, get_vehicles, get_payments
import models.slot_model as slot_model
import models.vehicle_model as vehicle_model
import models.payment_model as payment_model

# Global configurations in memory
SIMULATOR_ACTIVE = True
SIMULATION_INTERVAL = 15

def run_simulation():
    global SIMULATOR_ACTIVE, SIMULATION_INTERVAL
    
    prefixes = ['MH09', 'MH12', 'MH14', 'MH02', 'DL03', 'KA51', 'HR26']
    owner_names = [
        'Rajesh Kumar', 'Kiran Patil', 'Sunil Deshmukh', 'Yogesh Shinde', 'Snehal More',
        'Abhijit Sawant', 'Ganesh Thorat', 'Tejaswini Joshi', 'Sameer Kadam', 'Nitin Pawar'
    ]
    vehicle_types = ['Car', 'SUV', 'Bike', 'EV']
    payment_methods = ['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Credit Card', 'Cash']

    print("Background Parking Simulator (Cloud Firestore) active...")
    
    while True:
        if not SIMULATOR_ACTIVE:
            time.sleep(2)
            continue
            
        try:
            # Count slots state from cache
            slots = get_slots()
            avail_count = sum(1 for s in slots if s.get('status') == 'available')
            occupied_count = sum(1 for s in slots if s.get('status') == 'occupied')
            
            action = None
            if occupied_count == 0:
                action = 'entry'
            elif avail_count == 0:
                action = 'exit'
            else:
                action = 'entry' if random.random() < 0.55 else 'exit'
                
            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            if action == 'entry':
                v_type = random.choice(vehicle_types)
                is_vip = random.random() < 0.10
                
                slot = slot_model.get_nearest_available_slot(None, vehicle_type=v_type, is_vip=is_vip)
                if slot:
                    slot_num = slot['slot_number']
                    
                    veh_num = f"{random.choice(prefixes)}{chr(random.randint(65,90))}{chr(random.randint(65,90))}{random.randint(1000,9999)}"
                    owner = "VIP Customer" if is_vip else random.choice(owner_names)
                    phone = f"{random.randint(7000000000, 9999999999)}"
                    
                    vehicle_model.insert_vehicle_entry(None, veh_num, owner, phone, v_type, now_str, slot_num)
                    slot_model.update_slot_status(None, slot_num, 'occupied', now_str)
                    print(f"[SIMULATOR] Vehicle {veh_num} ({v_type}{', VIP' if is_vip else ''}) entered gate. Assigned slot {slot_num}.")
                    
            elif action == 'exit':
                vehicles = get_vehicles()
                parked_list = [v for v in vehicles if v.get('status') == 'parked']
                
                if parked_list:
                    v = random.choice(parked_list)
                    v_id = v['id']
                    
                    veh_num = v['vehicle_number']
                    v_type = v['vehicle_type']
                    entry_time_str = v['entry_time']
                    slot_number = v.get('slot_number') or str(v.get('slot_id'))
                    
                    entry_time = datetime.strptime(entry_time_str, '%Y-%m-%d %H:%M:%S')
                    exit_time = datetime.now()
                    duration = exit_time - entry_time
                    duration_hours = max(1.0, round(duration.total_seconds() / 3600.0, 2))
                    
                    # Fetch slot details dynamically from cache
                    slot_info = next((s for s in slots if s.get('slot_number') == slot_number), None)
                    slot_type = 'normal'
                    custom_rate = None
                    if slot_info:
                        slot_type = slot_info.get('slot_type', 'normal')
                        custom_rate = slot_info.get('custom_rate')

                    # Calculate active occupancy rate using cached slots to determine Surge/Peak pricing multiplier
                    occupied_slots = sum(1 for s in slots if s.get('status') == 'occupied')
                    total_slots = len(slots)
                    occ_pct = (occupied_slots / total_slots) * 100 if total_slots > 0 else 0

                    multiplier = 1.0
                    if occ_pct >= 50.0 and occ_pct < 80.0:
                        multiplier = 1.5
                    elif occ_pct >= 80.0:
                        multiplier = 2.0

                    base_rate_to_use = custom_rate if custom_rate is not None else RATE_PER_HOUR
                    active_rate = base_rate_to_use * multiplier
                    parking_fee = round(duration_hours * active_rate, 2)

                    # EV Specific calculation
                    charging_fee = 0.0
                    if slot_type == 'ev' and v_type == 'EV':
                        energy_kwh = round(duration_hours * 7.2, 2)
                        charging_fee = round(energy_kwh * 10.0, 2)

                    amount = max(active_rate + charging_fee, round(parking_fee + charging_fee, 2))
                    pay_method = random.choice(payment_methods)
                    
                    vehicle_model.checkout_vehicle_session(None, v_id, now_str)
                    slot_model.update_slot_status(None, slot_number, 'available', now_str)
                    payment_model.insert_payment_record(None, v_id, amount, pay_method, 'completed', now_str)
                    
                    print(f"[SIMULATOR] Vehicle {veh_num} exited from {slot_number}. Paid ₹{amount} via {pay_method}.")
            
        except Exception as e:
            print(f"[SIMULATOR ERROR] {str(e)}")
            
        time.sleep(SIMULATION_INTERVAL)

def start_simulator():
    sim_thread = threading.Thread(target=run_simulation, daemon=True)
    sim_thread.start()
    return sim_thread
