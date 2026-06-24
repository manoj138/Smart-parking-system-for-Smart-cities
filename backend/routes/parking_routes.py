from flask import Blueprint
import controllers.parking_controller as parking_controller

parking_bp = Blueprint('parking_bp', __name__)

@parking_bp.route('/slots', methods=['GET'])
def get_slots():
    return parking_controller.handle_get_slots()

@parking_bp.route('/entry', methods=['POST'])
def vehicle_entry():
    return parking_controller.handle_vehicle_entry()

@parking_bp.route('/slots/reserve', methods=['POST'])
def reserve_slot():
    return parking_controller.handle_reserve_slot()

@parking_bp.route('/slots/activate', methods=['POST'])
def activate_reserved_slot():
    return parking_controller.handle_activate_reserved_slot()

@parking_bp.route('/slots/cancel', methods=['POST'])
def cancel_reservation():
    return parking_controller.handle_cancel_reservation()

@parking_bp.route('/slots/create', methods=['POST'])
def create_slot():
    return parking_controller.handle_create_slot()

@parking_bp.route('/slots/edit', methods=['POST'])
def edit_slot():
    return parking_controller.handle_edit_slot()

@parking_bp.route('/slots/delete', methods=['POST'])
def delete_slot():
    return parking_controller.handle_delete_slot()

@parking_bp.route('/iot/slot-update', methods=['POST'])
def iot_slot_update():
    return parking_controller.handle_iot_update()

@parking_bp.route('/settings', methods=['GET', 'POST'])
def manage_settings():
    from flask import request
    if request.method == 'GET':
        return parking_controller.handle_get_settings()
    else:
        return parking_controller.handle_update_settings()
