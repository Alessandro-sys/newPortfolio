from flask import Flask, redirect, render_template, g, send_file
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

load_dotenv()

from helpers import sendNewEmail, format_logs

app = Flask(__name__)

DATABASE = "data.db"

# Configura scheduler
scheduler = APScheduler()

app.config['SCHEDULER_API_ENABLED'] = True
scheduler.init_app(app)
scheduler.start()

me = 'chiarulli14@gmail.com'

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


# ... (rest of configuration for Cloudinary, DB, etc.)

def scheduled_email_job():
    """Funzione eseguita automaticamente ogni giorno alle 20:00"""
    print("⏳ Esecuzione job invio email automatico...")
    try:
        # Nota: Qui non possiamo usare get_db() o g.db perché siamo fuori dal contesto della richiesta
        # Creiamo una nuova connessione
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            
            # Calcolo date
            today = datetime.now().date()
            yesterday = today - timedelta(days=1)
            
            # Periodo: Ieri 20:01 -> Oggi 20:00
            start_datetime = datetime.combine(yesterday, datetime.strptime("20:01:00", "%H:%M:%S").time())
            end_datetime = datetime.combine(today, datetime.strptime("20:00:00", "%H:%M:%S").time())
            
            cursor.execute("""
                SELECT platform, COUNT(*)
                FROM access_log
                WHERE (date > ? OR (date = ? AND time >= ?))
                  AND (date < ? OR (date = ? AND time <= ?))
                GROUP BY platform
            """, (
                yesterday.strftime('%Y-%m-%d'), yesterday.strftime('%Y-%m-%d'), "20:01:00",
                today.strftime('%Y-%m-%d'), today.strftime('%Y-%m-%d'), "20:00:00"
            ))
            
            results = cursor.fetchall()
            counts = {"instagram": 0, "full_link": 0}
            for platform, count in results:
                if platform in counts:
                    counts[platform] = count
            
            # Aggiornamento daily_access
            cursor.execute("SELECT 1 FROM daily_access WHERE date = ?", (today.strftime('%Y-%m-%d'),))
            if cursor.fetchone() is None:
                cursor.execute(
                    "INSERT INTO daily_access (date, instagram, full_link) VALUES (?, ?, ?)",
                    (today.strftime('%Y-%m-%d'), counts["instagram"], counts["full_link"])
                )
                conn.commit()

            # Invio Email
            sendNewEmail(
                subject=f"Report AUTOMATICO {start_datetime.strftime('%d/%m')} - {end_datetime.strftime('%d/%m')}",
                body=counts,
                sender=me,
                recipients=[me]
            )
            print("✅ Email automatica inviata con successo.")
            
    except Exception as e:
        print(f"❌ Errore durante il job automatico: {e}")


@scheduler.task('cron', id='daily_email', hour=20, minute=0)
def daily_email_task():
    with app.app_context():
        scheduled_email_job()


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

@app.route("/sendEmail")
def sendEmail():
    db = get_db()
    cursor = db.cursor()

    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    start_datetime = datetime.combine(yesterday, datetime.strptime("18:01:00", "%H:%M:%S").time())
    end_datetime = datetime.combine(today, datetime.strptime("18:00:00", "%H:%M:%S").time())

    start_datetime_display = start_datetime + timedelta(hours=2)
    end_datetime_display = end_datetime + timedelta(hours=2)

    cursor.execute("""
        SELECT platform, COUNT(*)
        FROM access_log
        WHERE (date > ? OR (date = ? AND time >= ?))
          AND (date < ? OR (date = ? AND time <= ?))
        GROUP BY platform
    """, (
        yesterday.strftime('%Y-%m-%d'), yesterday.strftime('%Y-%m-%d'), "18:01:00",
        today.strftime('%Y-%m-%d'), today.strftime('%Y-%m-%d'), "18:00:00"
    ))
    results = cursor.fetchall()

    counts = {"instagram": 0, "full_link": 0}
    for platform, count in results:
        if platform in counts:
            counts[platform] = count

    # Aggiorna la tabella daily_access
    update_daily_access(
        today.strftime('%Y-%m-%d'),
        counts["instagram"],
        counts["full_link"]
    )

    sendNewEmail(
        subject=f"Report accessi dalle {start_datetime_display.strftime('%d/%m/%Y %H:%M')} alle {end_datetime_display.strftime('%d/%m/%Y %H:%M')}",
        body=counts,
        sender=me,
        recipients=[me]
    )

    return (
        f"Email inviata:<br>"
        f"Periodo: {start_datetime_display.strftime('%d/%m/%Y %H:%M')} - {end_datetime_display.strftime('%d/%m/%Y %H:%M')}<br>"
        f"Instagram: {counts['instagram']}<br>Full Link: {counts['full_link']}"
    )


@app.route("/attestatoArbitro")
def attestatoArbitro():
    return send_file(
        "static/attestato.pdf",
        mimetype="application/pdf",
        as_attachment=False
    )



@app.route("/astro")
def galleria_foto():
    # Costruisci il folder name su Cloudinary
    tag_name = "astroGallery"

    
    # Recupera foto da Cloudinary
    try:
        result = cloudinary.api.resources_by_tag(
            tag_name,
            max_results=500
        )
        print(result)
    
        
        foto = []
        for resource in result.get('resources', []):
            print(f"  - {resource['public_id']}")
            # URL thumbnail (risoluzione ottimizzata per le colonne)
            thumbnail_url = cloudinary.CloudinaryImage(resource['public_id']).build_url(
                width=600,
                crop="scale",
                quality="auto"
            )
            
            # URL full size (alta risoluzione)
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
    
    return render_template("astro.html", foto=foto)