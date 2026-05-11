from flask import Blueprint, jsonify
from db import run_query

inquiries_bp = Blueprint("inquiries", __name__)


@inquiries_bp.route("/inquiries/manufacturer-below-average")
def manufacturer_below_average():
    try:
        rows = run_query("""
            WITH avg_reading AS (
                SELECT AVG(Current_reading) AS avg_val FROM Inspection_Detail
            )
            SELECT
                pu.manufacturer,
                COUNT(*) AS belowAverageCount
            FROM Inspection_Detail id_t
            JOIN Power_Unit  pu ON id_t.Unit_ID = pu.Unit_ID
            CROSS JOIN avg_reading
            WHERE id_t.Current_reading < avg_reading.avg_val
            GROUP BY pu.manufacturer
            ORDER BY belowAverageCount DESC
        """)
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inquiries_bp.route("/inquiries/sites-no-inspection")
def sites_no_inspection():
    try:
        rows = run_query("""
            SELECT es.*
            FROM Energy_Site es
            WHERE es.Site_ID NOT IN (
                SELECT DISTINCT Site_ID
                FROM Inspection_Round
                WHERE Inspection_Date >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()) - 1, 0)
                  AND Inspection_Date <  DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()),     0)
            )
            ORDER BY es.Site_ID
        """)
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inquiries_bp.route("/inquiries/top-technician")
def top_technician():
    try:
        rows = run_query("""
            SELECT
                t.Technician_ID,
                t.first_Name,
                t.last_Name,
                t.Contact_Info,
                COUNT(ir.Inspection_ID) AS inspectionCount
            FROM Technician t
            JOIN Inspection_Round ir ON t.Technician_ID = ir.Technician_ID
            WHERE ir.Inspection_Date >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()) - 1, 0)
              AND ir.Inspection_Date <  DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()),     0)
            GROUP BY t.Technician_ID, t.first_Name, t.last_Name, t.Contact_Info
            ORDER BY inspectionCount DESC
        """)
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inquiries_bp.route("/inquiries/units-no-replacement")
def units_no_replacement():
    try:
        rows = run_query("""
            SELECT pu.*
            FROM Power_Unit pu
            WHERE pu.Unit_ID NOT IN (
                SELECT DISTINCT Unit_ID
                FROM Component
                WHERE Replacement_date >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()) - 1, 0)
                  AND Replacement_date <  DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()),     0)
            )
            ORDER BY pu.Unit_ID
        """)
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inquiries_bp.route("/inquiries/components-by-site")
def components_by_site():
    try:
        rows = run_query("""
            SELECT
                es.Site_ID,
                es.Site_name,
                c.Component_ID,
                c.Component_Name,
                c.Serial_number,
                CONVERT(varchar(10), c.Replacement_date, 120) AS Replacement_date
            FROM Component   c
            JOIN Power_Unit  pu ON c.Unit_ID   = pu.Unit_ID
            JOIN Energy_Site es ON pu.site_ID  = es.Site_ID
            WHERE c.Replacement_date >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()) - 1, 0)
              AND c.Replacement_date <  DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()),     0)
            ORDER BY es.Site_name, c.Replacement_date DESC
        """)
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inquiries_bp.route("/inquiries/technician-profiles")
def technician_profiles():
    try:
        rows = run_query("""
            SELECT
                t.Technician_ID,
                t.first_Name,
                t.last_Name,
                t.Contact_Info,
                COUNT(DISTINCT id_t.Unit_ID) AS totalUnitsInspected
            FROM Technician t
            LEFT JOIN Inspection_Round  ir   ON t.Technician_ID  = ir.Technician_ID
            LEFT JOIN Inspection_Detail id_t ON ir.Inspection_ID = id_t.Inspection_ID
            GROUP BY t.Technician_ID, t.first_Name, t.last_Name, t.Contact_Info
            ORDER BY totalUnitsInspected DESC
        """)
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500