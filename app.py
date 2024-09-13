from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from flask import Flask, redirect, render_template, g
from flask_session import Session
import sqlite3
from datetime import datetime, timedelta
from string import Template

from helpers import sendEmail, format_logs

app = Flask(__name__)

me = 'chiarulli14@gmail.com'

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

#DATABASE = "data.db"
DATABASE = "home/astroale/mysite/data.db"

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




# def scheduled_task():
#     with app.app_context():  # Crea un contesto applicativo per la durata della funzione
#         db = get_db()
#         cursor = db.cursor()

#         current_date = datetime.now()
#         yesterday_date = (current_date - timedelta(days=1)).strftime('%Y-%m-%d')

#         cursor.execute("SELECT * FROM access_log WHERE date = ?", (yesterday_date))
#         logs = cursor.fetchall()

#         db.commit()

#         cursor.execute("SELECT * FROM data WHERE platform = 'instagram'")
#         n_accessi = cursor.fetchall()

#         db.commit()

#         n_accessi = n_accessi[0][1]

#         yesterday_date_formatted = yesterday_date.strftime('%d-%m-%Y')
       

#         emailBody = Template('''
# Daily log 

# Access log in data $data: $tot

# $log.

# ''')
#         formatted_logs = format_logs(logs)
#         body = emailBody.substitute(data = yesterday_date_formatted, tot = n_accessi, log = formatted_logs)
#         subject = "Daily Log"
#         sendEmail(body, me, subject)

# # Configura APScheduler per eseguire `scheduled_task` ogni giorno a mezzanotte
# scheduler = BackgroundScheduler()
# scheduler.add_job(func=scheduled_task, trigger=CronTrigger(hour=8, minute=0))
# scheduler.start()


