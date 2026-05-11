from flask import Blueprint, jsonify, request
from db import run_query

parts_bp = Blueprint("parts", __name__)


@parts_bp.route("/parts", methods=["GET"])
def list_parts():
    try:
        where, params = "", ()
        if request.args.get("componentId"):
            where  = "WHERE Component_ID = ?"
            params = (request.args["componentId"],)
        rows = run_query(f"SELECT * FROM Part {where} ORDER BY Part_ID", params)
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parts_bp.route("/parts", methods=["POST"])
def create_part():
    d = request.get_json()
    try:
        rows = run_query(
            """INSERT INTO Part (Component_ID, Part_Name, Part_category)
               OUTPUT INSERTED.*
               VALUES (?, ?, ?)""",
            (d["Component_ID"], d["Part_Name"], d["Part_category"]),
        )
        return jsonify(rows[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parts_bp.route("/parts/<int:part_id>", methods=["GET"])
def get_part(part_id):
    try:
        rows = run_query("SELECT * FROM Part WHERE Part_ID = ?", (part_id,))
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parts_bp.route("/parts/<int:part_id>", methods=["PATCH"])
def update_part(part_id):
    d = request.get_json()
    try:
        rows = run_query(
            """UPDATE Part
               SET Component_ID = ?, Part_Name = ?, Part_category = ?
               OUTPUT INSERTED.*
               WHERE Part_ID = ?""",
            (d["Component_ID"], d["Part_Name"], d["Part_category"], part_id),
        )
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@parts_bp.route("/parts/<int:part_id>", methods=["DELETE"])
def delete_part(part_id):
    try:
        run_query("DELETE FROM Part WHERE Part_ID = ?", (part_id,), fetch=False)
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500