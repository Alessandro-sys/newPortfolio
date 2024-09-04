import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def sendEmail(body, toemail, subject):
    s = smtplib.SMTP(host="smtp.gmail.com", port=587)
    s.starttls()
    s.login("chiarulli14@gmail.com", "dajfosbvggcdemwu")
    senderEmail = "chiarulli14@gmail.com"

    msg = MIMEMultipart()
    msg['From'] = senderEmail
    msg['To'] = toemail
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    s.send_message(msg)
    s.quit()
    del msg