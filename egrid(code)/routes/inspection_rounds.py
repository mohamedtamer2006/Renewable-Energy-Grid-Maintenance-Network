from flask import Blueprint, jsonify, request
from db import run_query

inspection_rounds_bp = Blueprint("inspection_rounds", __name__)


@inspection_rounds_bp.route("/inspection-rounds", methods=["GET"])
def list_rounds():
    try:
        clauses, params = [], []
        if request.args.get("siteId"):
            clauses.append("Site_ID = ?")
            params.append(request.args["siteId"])
        if request.args.get("technicianId"):
            clauses.append("Technician_ID = ?")
            params.append(request.args["technicianId"])
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        rows = run_query(
            f"SELECT * FROM Inspection_Round {where} ORDER BY Inspection_ID",
            tuple(params),
        )
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inspection_rounds_bp.route("/inspection-rounds", methods=["POST"])
def create_round():
    d = request.get_json()
    try:
        rows = run_query(
            """INSERT INTO Inspection_Round
                   (Site_ID, Technician_ID, Inspection_Date, Notes)
               OUTPUT INSERTED.*
               VALUES (?, ?, ?, ?)""",
            (d["Site_ID"], d["Technician_ID"], d["Inspection_Date"], d.get("Notes")),
        )
        return jsonify(rows[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inspection_rounds_bp.route("/inspection-rounds/<int:insp_id>", methods=["GET"])
def get_round(insp_id):
    try:
        rows = run_query(
            "SELECT * FROM Inspection_Round WHERE Inspection_ID = ?", (insp_id,)
        )
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inspection_rounds_bp.route("/inspection-rounds/<int:insp_id>", methods=["PATCH"])
def update_round(insp_id):
    d = request.get_json()
    try:
        rows = run_query(
            """UPDATE Inspection_Round
               SET Site_ID = ?, Technician_ID = ?, Inspection_Date = ?, Notes = ?
               OUTPUT INSERTED.*
               WHERE Inspection_ID = ?""",
            (d["Site_ID"], d["Technician_ID"], d["Inspection_Date"],
             d.get("Notes"), insp_id),
        )
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inspection_rounds_bp.route("/inspection-rounds/<int:insp_id>", methods=["DELETE"])
def delete_round(insp_id):
    try:
        run_query(
            "DELETE FROM Inspection_Round WHERE Inspection_ID = ?",
            (insp_id,), fetch=False,
        )
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500