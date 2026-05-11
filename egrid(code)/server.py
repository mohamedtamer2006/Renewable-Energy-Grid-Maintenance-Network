import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from db import get_db          

# ── route blueprints ────────────────────────────────────────────────────────
from routes.dashboard         import dashboard_bp
from routes.energy_sites      import energy_sites_bp
from routes.power_units       import power_units_bp
from routes.technicians       import technicians_bp
from routes.inspection_rounds import inspection_rounds_bp
from routes.inspection_details import inspection_details_bp
from routes.components        import components_bp
from routes.parts             import parts_bp
from routes.certifications    import certifications_bp
from routes.inquiries         import inquiries_bp

app = Flask(__name__, static_folder=r"C:\Users\moham\Desktop\egrid\static", static_url_path="")

# ── register all API blueprints under /api ───────────────────────────────────
for bp in [
    dashboard_bp,
    energy_sites_bp,
    power_units_bp,
    technicians_bp,
    inspection_rounds_bp,
    inspection_details_bp,
    components_bp,
    parts_bp,
    certifications_bp,
    inquiries_bp,
]:
    app.register_blueprint(bp, url_prefix="/api")

# ── serve the frontend SPA ───────────────────────────────────────────────────
@app.route("/")
def index():
    return app.send_static_file("index.html")

# ── startup ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    print(f"GridMaintain server running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)