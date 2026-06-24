from flask import Blueprint
import controllers.report_controller as report_controller

report_bp = Blueprint('report_bp', __name__)

@report_bp.route('/stats', methods=['GET'])
def get_stats():
    return report_controller.handle_get_stats()

@report_bp.route('/reports', methods=['GET'])
def get_reports():
    return report_controller.handle_get_reports()

@report_bp.route('/analytics', methods=['GET'])
def get_analytics():
    return report_controller.handle_get_analytics()
