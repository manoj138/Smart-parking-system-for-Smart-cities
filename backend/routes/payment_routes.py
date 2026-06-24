from flask import Blueprint
import controllers.payment_controller as payment_controller

payment_bp = Blueprint('payment_bp', __name__)

@payment_bp.route('/payments', methods=['GET'])
def get_payments():
    return payment_controller.handle_get_payments()

@payment_bp.route('/exit/calculate', methods=['POST'])
def calculate_fee():
    return payment_controller.handle_calculate_fee()

@payment_bp.route('/exit/checkout', methods=['POST'])
def checkout_vehicle():
    return payment_controller.handle_checkout()
