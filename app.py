from flask import Flask, redirect, render_template, g, send_file, send_from_directory, request, session
from flask_session import Session
from flask_apscheduler import APScheduler
import sqlite3
from datetime import datetime, timedelta
from string import Template
import cloudinary
import cloudinary.uploader
import cloudinary.api
from cloudinary.utils import cloudinary_url
import os
from dotenv import load_dotenv


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Configure Cloudinary
# Prefer CLOUDINARY_URL if available, otherwise use individual keys
if not os.getenv("CLOUDINARY_URL"):
    cloudinary.config(
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key = os.getenv("CLOUDINARY_API_KEY"),
        api_secret = os.getenv("CLOUDINARY_API_SECRET")
    )

from helpers import sendNewEmail, format_logs

app = Flask(__name__)

@app.before_request
def redirect_to_www():
    host = request.headers.get("Host", "")
    if host == "astroale.com":
        return redirect("https://www.astroale.com" + request.full_path, code=301)



DATABASE = os.path.join(BASE_DIR, "data.db")

# Configura scheduler
#scheduler = APScheduler()

# app.config['SCHEDULER_API_ENABLED'] = True
# scheduler.init_app(app)
# scheduler.start()

me = 'chiarulli14@gmail.com'

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)




def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE, check_same_thread=False)
    return g.db

@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
def index():
    print("sono nel main")
    db = get_db()
    cursor3 = db.cursor()

    # Update the data table
    cursor3.execute("""
        UPDATE data
        SET access = access + 1
        WHERE platform = 'full_link';
    """)
    db.commit()

    # Log the access
    current_date = datetime.now().strftime('%Y-%m-%d')
    current_time = datetime.now().strftime('%H:%M:%S')

    cursor4 = db.cursor()
    cursor4.execute("""
        INSERT INTO access_log (platform, date, time)
        VALUES ('full_link', ?, ?);
    """, (current_date, current_time))
    db.commit()
    print("dovrei aver inserito nel database")

    return render_template("home.html")

@app.route("/home")
def pages():
    return redirect("/")

# @app.route("/astro")
# def astro():
#     return render_template("astro.html")

@app.route("/robocup")
def robocup():
    return render_template("robocup.html")

@app.route("/robocupIt")
def robocupIt():
    return render_template("robocupIt.html")


@app.route("/insta")
def insta():
    db = get_db()
    cursor1 = db.cursor()

    # Update the data table
    cursor1.execute("""
        UPDATE data
        SET access = access + 1
        WHERE platform = 'instagram';
    """)
    db.commit()

    # Log the access
    current_date = datetime.now().strftime('%Y-%m-%d')
    current_time = datetime.now().strftime('%H:%M:%S')

    cursor2 = db.cursor()
    cursor2.execute("""
        INSERT INTO access_log (platform, date, time)
        VALUES ('instagram', ?, ?);
    """, (current_date, current_time))
    db.commit()

    return redirect("/")

@app.route("/stats")
def stats():
    db = get_db()
    cursor3 = db.cursor()

    cursor3.execute("SELECT * FROM data")
    accessi = cursor3.fetchall()

    cursor3.execute("SELECT * FROM access_log")
    log = cursor3.fetchall()

    # Recupera gli ultimi 10 giorni dalla tabella daily_access
    cursor3.execute("""
        SELECT date, instagram, full_link
        FROM daily_access
        ORDER BY date DESC
        LIMIT 10
    """)
    daily_stats = cursor3.fetchall()
    daily_stats = daily_stats[::-1]  # Ordina dal più vecchio al più recente

    db.commit()

    return render_template("table.html", accessi=accessi, logs=log, daily_stats=daily_stats)

@app.route("/docmost")
def docmost():
    return "benvenuto su docmost"



def update_daily_access(date, instagram_count, full_link_count):
    db = get_db()
    cursor = db.cursor()
    # Controlla se il dato per quella data esiste già
    cursor.execute("SELECT 1 FROM daily_access WHERE date = ?", (date,))
    if cursor.fetchone() is None:
        # Inserisce solo se non esiste già
        cursor.execute(
            "INSERT INTO daily_access (date, instagram, full_link) VALUES (?, ?, ?)",
            (date, instagram_count, full_link_count)
        )
        db.commit()

# @app.route("/sendEmail")
# def sendEmail():
#     db = get_db()
#     cursor = db.cursor()

#     today = datetime.now().date()
#     yesterday = today - timedelta(days=1)
#     start_datetime = datetime.combine(yesterday, datetime.strptime("18:01:00", "%H:%M:%S").time())
#     end_datetime = datetime.combine(today, datetime.strptime("18:00:00", "%H:%M:%S").time())

#     start_datetime_display = start_datetime + timedelta(hours=2)
#     end_datetime_display = end_datetime + timedelta(hours=2)

#     cursor.execute("""
#         SELECT platform, COUNT(*)
#         FROM access_log
#         WHERE (date > ? OR (date = ? AND time >= ?))
#           AND (date < ? OR (date = ? AND time <= ?))
#         GROUP BY platform
#     """, (
#         yesterday.strftime('%Y-%m-%d'), yesterday.strftime('%Y-%m-%d'), "18:01:00",
#         today.strftime('%Y-%m-%d'), today.strftime('%Y-%m-%d'), "18:00:00"
#     ))
#     results = cursor.fetchall()

#     counts = {"instagram": 0, "full_link": 0}
#     for platform, count in results:
#         if platform in counts:
#             counts[platform] = count

#     # Aggiorna la tabella daily_access
#     update_daily_access(
#         today.strftime('%Y-%m-%d'),
#         counts["instagram"],
#         counts["full_link"]
#     )

#     sendNewEmail(
#         subject=f"Report accessi dalle {start_datetime_display.strftime('%d/%m/%Y %H:%M')} alle {end_datetime_display.strftime('%d/%m/%Y %H:%M')}",
#         body=counts,
#         sender=me,
#         recipients=[me]
#     )

#     return (
#         f"Email inviata:<br>"
#         f"Periodo: {start_datetime_display.strftime('%d/%m/%Y %H:%M')} - {end_datetime_display.strftime('%d/%m/%Y %H:%M')}<br>"
#         f"Instagram: {counts['instagram']}<br>Full Link: {counts['full_link']}"
#     )


@app.route("/attestatoArbitro")
def attestatoArbitro():
    return send_file(
        "static/attestato.pdf",
        mimetype="application/pdf",
        as_attachment=False
    )



@app.route("/astro")
def galleria_foto():
    tag_name = "astroGallery"
    filter_tag = request.args.get("tag")
    
    try:
        # Recupera foto da Cloudinary includendo i tag per il filtraggio
        result = cloudinary.api.resources_by_tag(
            tag_name,
            max_results=500,
            tags=True
        )
        
        foto = []
        for resource in result.get('resources', []):
            tags = resource.get('tags', [])
            
            # Se è specificato un tag, saltiamo l'immagine se non contiene il tag (case-insensitive)
            if filter_tag:
                if filter_tag.lower() not in [t.lower() for t in tags]:
                    continue
            
            thumbnail_url = cloudinary.CloudinaryImage(resource['public_id']).build_url(
                width=600,
                crop="scale",
                quality="auto"
            )
            
            full_url = cloudinary.CloudinaryImage(resource['public_id']).build_url(
                quality="auto:best"
            )
            
            foto.append({
                "thumbnail": thumbnail_url,
                "url": full_url
            })
            
    except Exception as e:
        print(f"✗ Errore recupero foto da Cloudinary: {e}")
        import traceback
        traceback.print_exc()
        foto = []
    
    return render_template("astro.html", foto=foto, filter_tag=filter_tag)


# --- ROTTE AMMINISTRATIVE PER GESTIONE GALLERIA ---

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        password = request.form.get("password")
        correct_password = os.getenv("ADMIN_PASSWORD", "astroale2026")
        if password == correct_password:
            session['admin_logged_in'] = True
            return redirect("/admin")
        else:
            return render_template("admin_login.html", error="Password errata!")
    return render_template("admin_login.html")


@app.route("/admin/logout")
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect("/admin/login")


@app.route("/admin")
def admin_dashboard():
    if not session.get('admin_logged_in'):
        return redirect("/admin/login")
        
    tag_name = "astroGallery"
    try:
        # Recupera tutte le foto caricate per visualizzarle in griglia
        result = cloudinary.api.resources_by_tag(
            tag_name,
            max_results=500,
            tags=True
        )
        foto = []
        for resource in result.get('resources', []):
            tags = resource.get('tags', [])
            # Rimuove il tag base per mostrare solo i tag inseriti dall'utente
            user_tags = [t for t in tags if t != "astroGallery"]
            foto.append({
                "public_id": resource['public_id'],
                "thumbnail": cloudinary.CloudinaryImage(resource['public_id']).build_url(
                    width=150,
                    height=150,
                    crop="fill"
                ),
                "tags": ", ".join(user_tags)
            })
    except Exception as e:
        print(f"✗ Errore recupero foto per dashboard: {e}")
        foto = []
        
    return render_template("admin.html", foto=foto)


@app.route("/admin/upload", methods=["POST"])
def admin_upload():
    if not session.get('admin_logged_in'):
        return redirect("/admin/login")
        
    file = request.files.get("file")
    if not file:
        return redirect("/admin")
        
    tags_raw = request.form.get("tags", "")
    tags_list = [t.strip() for t in tags_raw.split(",") if t.strip()]
    
    # Assicurati che il tag primario "astroGallery" sia sempre presente
    if "astroGallery" not in tags_list:
        tags_list.append("astroGallery")
        
    try:
        cloudinary.uploader.upload(file, tags=tags_list)
        print(f"✓ Immagine caricata con tag: {tags_list}")
    except Exception as e:
        print(f"✗ Errore caricamento immagine: {e}")
        
    return redirect("/admin")


@app.route("/admin/update_tags", methods=["POST"])
def admin_update_tags():
    if not session.get('admin_logged_in'):
        return redirect("/admin/login")
        
    public_id = request.form.get("public_id")
    tags_raw = request.form.get("tags", "")
    tags_list = [t.strip() for t in tags_raw.split(",") if t.strip()]
    
    # Mantieni il tag primario
    if "astroGallery" not in tags_list:
        tags_list.append("astroGallery")
        
    try:
        cloudinary.api.update(public_id, tags=tags_list)
        print(f"✓ Tag aggiornati per {public_id}: {tags_list}")
    except Exception as e:
        print(f"✗ Errore aggiornamento tag: {e}")
        
    return redirect("/admin")


@app.route("/admin/delete", methods=["POST"])
def admin_delete():
    if not session.get('admin_logged_in'):
        return redirect("/admin/login")
        
    public_id = request.form.get("public_id")
    try:
        cloudinary.uploader.destroy(public_id)
        print(f"✓ Risorsa eliminata da Cloudinary: {public_id}")
    except Exception as e:
        print(f"✗ Errore eliminazione risorsa: {e}")
        
    return redirect("/admin")


@app.route("/sitemap.xml")
def sitemap():
    return send_from_directory("static", "sitemap.xml", mimetype="application/xml")
