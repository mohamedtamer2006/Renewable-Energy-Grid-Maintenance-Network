from flask import Blueprint, jsonify, request
from db import run_query

inspection_details_bp = Blueprint("inspection_details", __name__)


@inspection_details_bp.route("/inspection-details", methods=["GET"])
def list_details():
    try:
        clauses, params = [], []
        if request.args.get("inspectionId"):
            clauses.append("Inspection_ID = ?")
            params.append(request.args["inspectionId"])
        if request.args.get("unitId"):
            clauses.append("Unit_ID = ?")
            params.append(request.args["unitId"])
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        rows = run_query(
            f"SELECT * FROM Inspection_Detail {where} ORDER BY Detail_ID",
            tuple(params),
        )
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inspection_details_bp.route("/inspection-details", methods=["POST"])
def create_detail():
    d = request.get_json()
    try:
        rows = run_query(
            """INSERT INTO Inspection_Detail
                   (Unit_ID, Inspection_ID, Status, Current_reading)
               OUTPUT INSERTED.*
               VALUES (?, ?, ?, ?)""",
            (d["Unit_ID"], d["Inspection_ID"], d["Status"], d.get("Current_reading")),
        )
        return jsonify(rows[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inspection_details_bp.route("/inspection-details/<int:detail_id>", methods=["GET"])
def get_detail(detail_id):
    try:
        rows = run_query(
            "SELECT * FROM Inspection_Detail WHERE Detail_ID = ?", (detail_id,)
        )
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inspection_details_bp.route("/inspection-details/<int:detail_id>", methods=["PATCH"])
def update_detail(detail_id):
    d = request.get_json()
    try:
        rows = run_query(
            """UPDATE Inspection_Detail
               SET Unit_ID = ?, Inspection_ID = ?, Status = ?, Current_reading = ?
               OUTPUT INSERTED.*
               WHERE Detail_ID = ?""",
            (d["Unit_ID"], d["Inspection_ID"], d["Status"],
             d.get("Current_reading"), detail_id),
        )
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inspection_details_bp.route("/inspection-details/<int:detail_id>", methods=["DELETE"])
def delete_detail(detail_id):
    try:
        run_query(
            "DELETE FROM Inspection_Detail WHERE Detail_ID = ?",
            (detail_id,), fetch=False,
        )
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500