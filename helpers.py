import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from email.mime.text import MIMEText

def sendNewEmail(subject, body, sender, recipients):
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    smtp_user = sender
    smtp_password = "mydr xtot zkxz ebll"  # Usa una app password, non la password normale

    # Corpo HTML user friendly
    html_body = f"""
    <html>
      <body>
        <h2 style="color:#2d3748;">{subject}</h2>
        <table border="1" cellpadding="8" style="border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr style="background-color:#f2f2f2;">
            <th>Piattaforma</th>
            <th>Accessi</th>
          </tr>
          <tr>
            <td>Instagram</td>
            <td>{body['instagram']}</td>
          </tr>
          <tr>
            <td>Full Link</td>
            <td>{body['full_link']}</td>
          </tr>
        </table>
        <p style="font-size:12px;color:gray;">Report generato automaticamente</p>
      </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(sender, recipients, msg.as_string())

def format_logs(logs):
    formatted_logs = []
    for log in logs:
        # log[0] = id, log[1] = piattaforma, log[3] = ora
        formatted_logs.append(f"- {log[0]}, {log[1]}, {log[3]}")
    return "\n".join(formatted_logs)