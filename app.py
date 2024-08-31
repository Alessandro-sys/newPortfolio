from flask import Flask, flash, redirect, render_template, request, session, url_for, g
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
import base64
from PIL import Image
import sqlite3
from datetime import datetime

app = Flask(__name__)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

DATABASE = "/home/ale/newPortfolio/data.db"

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