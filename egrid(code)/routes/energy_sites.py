from flask import Blueprint, jsonify, request
from db import run_query

energy_sites_bp = Blueprint("energy_sites", __name__)


@energy_sites_bp.route("/energy-sites", methods=["GET"])
def list_sites():
    try:
        rows = run_query("SELECT * FROM Energy_Site ORDER BY Site_ID")
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@energy_sites_bp.route("/energy-sites", methods=["POST"])
def create_site():
    d = request.get_json()
    try:
        rows = run_query(
            """INSERT INTO Energy_Site (Site_name, Latitude, longitude, Terrain_Type)
               OUTPUT INSERTED.*
               VALUES (?, ?, ?, ?)""",
            (d["Site_name"], d["Latitude"], d["longitude"], d["Terrain_Type"]),
        )
        return jsonify(rows[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@energy_sites_bp.route("/energy-sites/<int:site_id>", methods=["GET"])
def get_site(site_id):
    try:
        rows = run_query("SELECT * FROM Energy_Site WHERE Site_ID = ?", (site_id,))
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@energy_sites_bp.route("/energy-sites/<int:site_id>", methods=["PATCH"])
def update_site(site_id):
    d = request.get_json()
    try:
        rows = run_query(
            """UPDATE Energy_Site
               SET Site_name = ?, Latitude = ?, longitude = ?, Terrain_Type = ?
               OUTPUT INSERTED.*
               WHERE Site_ID = ?""",
            (d["Site_name"], d["Latitude"], d["longitude"], d["Terrain_Type"], site_id),
        )
        if not rows:
            return jsonify({"error": "Not found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@energy_sites_bp.route("/energy-sites/<int:site_id>", methods=["DELETE"])
def delete_site(site_id):
    try:
        run_query("DELETE FROM Energy_Site WHERE Site_ID = ?", (site_id,), fetch=False)
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500