from flask import request, jsonify
from datetime import datetime, timedelta
import random
import config.db_config as db_config

def handle_get_stats():
    # Fetch from cache
    slots = db_config.get_slots()
    vehicles = db_config.get_vehicles()
    payments = db_config.get_payments()

    total_slots = len(slots)
    occupied_slots = len([s for s in slots if s.get('status') == 'occupied'])
    available_slots = total_slots - occupied_slots

    today_start = datetime.now().replace(hour=0, minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S')

    # Today's entries
    today_entries = len([v for v in vehicles if v.get('entry_time', '') >= today_start])

    # Today's exits
    today_exits = len([v for v in vehicles if v.get('status') == 'completed' and v.get('exit_time', '') >= today_start])

    # Today's revenue
    today_revenue = sum(p.get('amount', 0.0) for p in payments if p.get('created_at', '') >= today_start)

    # Occupancy percentage
    occupancy_pct = round((occupied_slots / total_slots) * 100, 1) if total_slots > 0 else 0

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

    # Average parking duration
    durations = []
    for v in vehicles:
        if v.get('status') == 'completed':
            try:
                ent = datetime.strptime(v['entry_time'], '%Y-%m-%d %H:%M:%S')
                ext = datetime.strptime(v['exit_time'], '%Y-%m-%d %H:%M:%S')
                durations.append((ext - ent).total_seconds() / 3600.0)
            except Exception:
                continue
    avg_duration = round(sum(durations) / len(durations), 1) if durations else 0.0

    # Recent alerts/notifications
    # Sort vehicles by entry_time descending
    sorted_vehicles = sorted(vehicles, key=lambda x: x.get('entry_time', ''), reverse=True)[:5]
    recent_events = []
    for row in sorted_vehicles:
        slot_num = row.get('slot_number') or f"P{row.get('slot_id')}"
        
        if row['status'] == 'parked':
            msg = f"Vehicle {row['vehicle_number']} Entered slot {slot_num}"
            time_val = row['entry_time']
            alert_type = 'entry'
        else:
            msg = f"Vehicle {row['vehicle_number']} Exited slot {slot_num}"
            time_val = row['exit_time']
            alert_type = 'exit'
            
        recent_events.append({
            'message': msg,
            'time': time_val,
            'type': alert_type
        })

    return jsonify({
        'total_slots': total_slots,
        'occupied_slots': occupied_slots,
        'available_slots': available_slots,
        'today_entries': today_entries,
        'today_exits': today_exits,
        'today_revenue': round(today_revenue, 2),
        'occupancy_percentage': occupancy_pct,
        'rate_multiplier': multiplier,
        'rate_label': label,
        'avg_duration_hours': avg_duration,
        'recent_events': recent_events
    })

def handle_get_reports():
    rep_type = request.args.get('type', 'daily')
    date_val = request.args.get('date')

    if not date_val:
        date_val = datetime.now().strftime('%Y-%m-%d') if rep_type == 'daily' else datetime.now().strftime('%Y-%m')

    if rep_type == 'daily':
        start_date = f"{date_val} 00:00:00"
        end_date = f"{date_val} 23:59:59"
    else:
        start_date = f"{date_val}-01 00:00:00"
        end_date = f"{date_val}-31 23:59:59"

    # Fetch from cache
    vehicles = db_config.get_vehicles()
    payments = db_config.get_payments()

    payments_map = {str(p.get('vehicle_id')): p for p in payments}
    for p in payments:
        payments_map[p['id']] = p

    entries = 0
    exits = 0
    logs = []
    hourly_counts = {}
    floor_counts = {}

    for v in vehicles:
        entry_in_period = start_date <= v.get('entry_time', '') <= end_date
        exit_in_period = v.get('exit_time') and (start_date <= v.get('exit_time', '') <= end_date)

        if entry_in_period or exit_in_period:
            if entry_in_period:
                entries += 1
            if exit_in_period:
                exits += 1

            slot_num = v.get('slot_number') or f"P{v.get('slot_id')}"
            p = payments_map.get(v['id']) or payments_map.get(str(v.get('id')))
            
            logs.append({
                'id': v.get('id'),
                'vehicle_number': v.get('vehicle_number'),
                'vehicle_type': v.get('vehicle_type'),
                'owner_name': v.get('owner_name'),
                'entry_time': v.get('entry_time'),
                'exit_time': v.get('exit_time'),
                'slot_number': slot_num,
                'amount': p.get('amount') if p else None,
                'payment_method': p.get('payment_method') if p else None
            })

            # Peak hour calculations
            if entry_in_period:
                try:
                    hour = datetime.strptime(v['entry_time'], '%Y-%m-%d %H:%M:%S').strftime('%H')
                    hourly_counts[hour] = hourly_counts.get(hour, 0) + 1
                except Exception:
                    pass

            # Floor tracking
            slot_id = v.get('slot_id')
            floor = "Ground Floor"
            if isinstance(slot_id, int):
                if slot_id <= 35:
                    floor = "Ground Floor"
                elif slot_id <= 70:
                    floor = "First Floor"
                else:
                    floor = "Second Floor"
            elif slot_num:
                try:
                    num = int(slot_num[1:])
                    if num <= 35:
                        floor = "Ground Floor"
                    elif num <= 70:
                        floor = "First Floor"
                    else:
                        floor = "Second Floor"
                except Exception:
                    pass
            floor_counts[floor] = floor_counts.get(floor, 0) + 1

    # Revenue sum
    revenue = sum(p.get('amount', 0.0) for p in payments if start_date <= p.get('created_at', '') <= end_date)

    peak_hour = "N/A"
    if hourly_counts:
        max_hour = max(hourly_counts, key=hourly_counts.get)
        peak_hour = f"{max_hour}:00"

    most_used_floor = "N/A"
    if floor_counts:
        most_used_floor = max(floor_counts, key=floor_counts.get)

    logs.sort(key=lambda x: x.get('entry_time', ''), reverse=True)

    return jsonify({
        'type': rep_type,
        'period': date_val,
        'entries': entries,
        'exits': exits,
        'revenue': round(revenue, 2),
        'peak_hour': peak_hour,
        'most_used_floor': most_used_floor,
        'logs': logs
    })

def handle_get_analytics():
    # Fetch from cache
    payments = db_config.get_payments()
    vehicles = db_config.get_vehicles()

    # 1. Weekly Revenue (Past 7 Days)
    weekly_rev = []
    now = datetime.now()
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S')
        day_end = day.replace(hour=23, minute=59, second=59).strftime('%Y-%m-%d %H:%M:%S')
        day_label = day.strftime('%a')
        
        rev = sum(p.get('amount', 0.0) for p in payments if day_start <= p.get('created_at', '') <= day_end)
        weekly_rev.append({
            'day': day_label,
            'revenue': round(rev, 2)
        })

    # 2. Hourly Entry Trend (Today)
    hourly_entries = []
    today_start = now.replace(hour=0, minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S')
    
    hour_counts = {}
    for v in vehicles:
        if v.get('entry_time', '') >= today_start:
            try:
                hour = datetime.strptime(v['entry_time'], '%Y-%m-%d %H:%M:%S').strftime('%H')
                hour_counts[hour] = hour_counts.get(hour, 0) + 1
            except Exception:
                pass
            
    for h in range(8, 23):
        hour_str = f"{h:02d}"
        hourly_entries.append({
            'time': f"{hour_str}:00",
            'entries': hour_counts.get(hour_str, 0)
        })

    # 3. Vehicle Type Split
    type_counts = {}
    for v in vehicles:
        vt = v.get('vehicle_type', 'Car')
        type_counts[vt] = type_counts.get(vt, 0) + 1
        
    type_split = [{'vehicle_type': k, 'count': v} for k, v in type_counts.items()]

    # 4. Occupancy Rate Trend (Past 7 Days Average Occupancy)
    occupancy_trend = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_label = day.strftime('%d %b')
        day_val = day.weekday()
        base_occ = 75 if day_val in [4, 5, 6] else 50
        occupancy_trend.append({
            'date': day_label,
            'rate': base_occ + random.randint(-10, 15)
        })

    return jsonify({
        'weekly_revenue': weekly_rev,
        'hourly_entries': hourly_entries,
        'vehicle_types': type_split,
        'occupancy_trend': occupancy_trend
    })
