from flask import Blueprint, jsonify, request
from db import run_query

power_units_bp = Blueprint("power_units", __name__)


@power_units_bp.route("/power-units", methods=["GET"])
def list_units():
    try:
        where, params = "", ()
        if request.args.get("siteId"):
            where  = "WHERE site_ID = ?"
            params = (request.args["siteId"],)
        rows = run_query(f"SELECT * FROM Power_Unit {where} ORDER BY Unit_ID", params)
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@power_units_bp.route("/power-units", methods=["POST"])
def create_unit():
    d = request.get_json()
    try:
        rows = run_query(
            """INSERT INTO Power_Unit
                   (site_ID, installation_date, max_kilowatt_output, manufacturer, Type)
               OUTPUT INSERTED.*
               VALUES (?, ?, ?, ?, ?)""",
            (d["site_ID"], d["installation_date"],
             d["max_kilowatt_output"], d["manufacturer"], d["Type"]),
        )
        return jsonify(rows[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@power_units_bp.route("/power-units/<int:unit_id>", methods=["GET"])
def get_unit(unit_id):
    try:
        rows = run_query("SELECT * FROM Power_Unit WHERE Unit_ID = ?", (unit_id,))
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@power_units_bp.route("/power-units/<int:unit_id>", methods=["PATCH"])
def update_unit(unit_id):
    d = request.get_json()
    try:
        rows = run_query(
            """UPDATE Power_Unit
               SET site_ID = ?, installation_date = ?,
                   max_kilowatt_output = ?, manufacturer = ?, Type = ?
               OUTPUT INSERTED.*
               WHERE Unit_ID = ?""",
            (d["site_ID"], d["installation_date"],
             d["max_kilowatt_output"], d["manufacturer"], d["Type"], unit_id),
        )
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@power_units_bp.route("/power-units/<int:unit_id>", methods=["DELETE"])
def delete_unit(unit_id):
    try:
        run_query("DELETE FROM Power_Unit WHERE Unit_ID = ?", (unit_id,), fetch=False)
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500