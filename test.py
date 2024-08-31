import sqlite3


DATABASE = "/home/ale/newPortfolio/data.db"

db = sqlite3.connect(DATABASE, check_same_thread=False)

cursor = db.cursor()

cursor.execute("SELECT * FROM data")
amongus = cursor.fetchall()
db.close()
print(amongus)