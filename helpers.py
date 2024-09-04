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

def format_logs(logs):
    formatted_logs = []
    for log in logs:
        # log[0] = id, log[1] = piattaforma, log[3] = ora
        formatted_logs.append(f"- {log[0]}, {log[1]}, {log[3]}")
    return "\n".join(formatted_logs)