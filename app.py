from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from flask import Flask, redirect, render_template, g
from flask_session import Session
import sqlite3
from datetime import datetime, timedelta
from string import Template

from helpers import sendNewEmail, format_logs

app = Flask(__name__)

me = 'chiarulli14@gmail.com'

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

#DATABASE = "data.db"
DATABASE = "/home/astroale/mysite/data.db"

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

@app.route("/astro")
def astro():
    return render_template("astro.html")

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

    db.commit()

    return render_template("table.html", accessi = accessi, logs = log)

@app.route("/docmost")
def docmost():
    return "benvenuto su docmost"



@app.route("/sendEmail")
def sendEmail():
    db = get_db()
    cursor = db.cursor()

    # Calcola l'intervallo di tempo desiderato
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    start_datetime = datetime.combine(yesterday, datetime.strptime("18:01:00", "%H:%M:%S").time())
    end_datetime = datetime.combine(today, datetime.strptime("18:00:00", "%H:%M:%S").time())

    # Aggiungi due ore agli orari per la visualizzazione
    start_datetime_display = start_datetime + timedelta(hours=2)
    end_datetime_display = end_datetime + timedelta(hours=2)

    # Query per selezionare gli accessi nell'intervallo specificato
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

    # Conta per tipo
    counts = {"instagram": 0, "full_link": 0}
    for platform, count in results:
        if platform in counts:
            counts[platform] = count

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