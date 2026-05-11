from flask import Blueprint, jsonify, request
from db import run_query

certifications_bp = Blueprint("certifications", __name__)


@certifications_bp.route("/certifications", methods=["GET"])
def list_certifications():
    try:
        where, params = "", ()
        if request.args.get("technicianId"):
            where  = "WHERE Technician_ID = ?"
            params = (request.args["technicianId"],)
        rows = run_query(
            f"SELECT * FROM certification {where} ORDER BY certification_ID", params
        )
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@certifications_bp.route("/certifications", methods=["POST"])
def create_certification():
    d = request.get_json()
    try:
        rows = run_query(
            """INSERT INTO certification (Technician_ID, Unit_Type)
               OUTPUT INSERTED.*
               VALUES (?, ?)""",
            (d["Technician_ID"], d["Unit_Type"]),
        )
        return jsonify(rows[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@certifications_bp.route("/certifications/<int:cert_id>", methods=["DELETE"])
def delete_certification(cert_id):
    try:
        run_query(
            "DELETE FROM certification WHERE certification_ID = ?",
            (cert_id,), fetch=False,
        )
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500