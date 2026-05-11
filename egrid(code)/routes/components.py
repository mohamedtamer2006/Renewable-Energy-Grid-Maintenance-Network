from flask import Blueprint, jsonify, request
from db import run_query

components_bp = Blueprint("components", __name__)


@components_bp.route("/components", methods=["GET"])
def list_components():
    try:
        where, params = "", ()
        if request.args.get("unitId"):
            where  = "WHERE Unit_ID = ?"
            params = (request.args["unitId"],)
        rows = run_query(
            f"SELECT * FROM Component {where} ORDER BY Component_ID", params
        )
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@components_bp.route("/components", methods=["POST"])
def create_component():
    d = request.get_json()
    try:
        rows = run_query(
            """INSERT INTO Component
                   (Unit_ID, Detail_ID, Component_Name, Serial_number, Replacement_date)
               OUTPUT INSERTED.*
               VALUES (?, ?, ?, ?, ?)""",
            (d["Unit_ID"], d["Detail_ID"], d["Component_Name"],
             d["Serial_number"], d.get("Replacement_date")),
        )
        return jsonify(rows[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@components_bp.route("/components/<int:comp_id>", methods=["GET"])
def get_component(comp_id):
    try:
        rows = run_query("SELECT * FROM Component WHERE Component_ID = ?", (comp_id,))
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@components_bp.route("/components/<int:comp_id>", methods=["PATCH"])
def update_component(comp_id):
    d = request.get_json()
    try:
        rows = run_query(
            """UPDATE Component
               SET Unit_ID = ?, Detail_ID = ?, Component_Name = ?,
                   Serial_number = ?, Replacement_date = ?
               OUTPUT INSERTED.*
               WHERE Component_ID = ?""",
            (d["Unit_ID"], d["Detail_ID"], d["Component_Name"],
             d["Serial_number"], d.get("Replacement_date"), comp_id),
        )
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@components_bp.route("/components/<int:comp_id>", methods=["DELETE"])
def delete_component(comp_id):
    try:
        run_query(
            "DELETE FROM Component WHERE Component_ID = ?", (comp_id,), fetch=False
        )
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500