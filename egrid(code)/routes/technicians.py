from flask import Blueprint, jsonify, request
from db import run_query

technicians_bp = Blueprint("technicians", __name__)


@technicians_bp.route("/technicians", methods=["GET"])
def list_technicians():
    try:
        rows = run_query("SELECT * FROM Technician ORDER BY Technician_ID")
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@technicians_bp.route("/technicians", methods=["POST"])
def create_technician():
    d = request.get_json()
    try:
        rows = run_query(
            """INSERT INTO Technician (first_Name, last_Name, Contact_Info)
               OUTPUT INSERTED.*
               VALUES (?, ?, ?)""",
            (d["first_Name"], d["last_Name"], d["Contact_Info"]),
        )
        return jsonify(rows[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@technicians_bp.route("/technicians/<int:tech_id>", methods=["GET"])
def get_technician(tech_id):
    try:
        rows = run_query("SELECT * FROM Technician WHERE Technician_ID = ?", (tech_id,))
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@technicians_bp.route("/technicians/<int:tech_id>", methods=["PATCH"])
def update_technician(tech_id):
    d = request.get_json()
    try:
        rows = run_query(
            """UPDATE Technician
               SET first_Name = ?, last_Name = ?, Contact_Info = ?
               OUTPUT INSERTED.*
               WHERE Technician_ID = ?""",
            (d["first_Name"], d["last_Name"], d["Contact_Info"], tech_id),
        )
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@technicians_bp.route("/technicians/<int:tech_id>", methods=["DELETE"])
def delete_technician(tech_id):
    try:
        run_query("DELETE FROM Technician WHERE Technician_ID = ?", (tech_id,), fetch=False)
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500