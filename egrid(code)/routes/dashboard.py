from flask import Blueprint, jsonify
from db import run_query

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard/summary")
def summary():
    try:
        rows = run_query("""
            SELECT
                (SELECT COUNT(*) FROM Energy_Site)      AS totalSites,
                (SELECT COUNT(*) FROM Power_Unit)       AS totalPowerUnits,
                (SELECT COUNT(*) FROM Technician)       AS totalTechnicians,
                (SELECT COUNT(*) FROM Inspection_Round) AS totalInspections,
                (SELECT COUNT(*) FROM Component)        AS totalComponents,
                (SELECT COUNT(*) FROM Part)             AS totalParts
        """)
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dashboard_bp.route("/dashboard/recent-inspections")
def recent_inspections():
    try:
        rows = run_query("""
            SELECT TOP 10
                ir.Inspection_ID,
                CONVERT(varchar(10), ir.Inspection_Date, 120) AS Inspection_Date,
                ir.Notes,
                es.Site_name,
                CONCAT(t.first_Name, ' ', t.last_Name) AS technicianName
            FROM Inspection_Round ir
            JOIN Energy_Site es ON ir.Site_ID       = es.Site_ID
            JOIN Technician  t  ON ir.Technician_ID = t.Technician_ID
            ORDER BY ir.Inspection_Date DESC
        """)
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500