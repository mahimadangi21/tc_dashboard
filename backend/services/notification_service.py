import os
import firebase_admin
from firebase_admin import credentials, messaging
from pathlib import Path

cred = credentials.Certificate(str(Path(__file__).resolve().parent.parent / "firebase-service-account.json"))
firebase_admin.initialize_app(cred)


def send_push_notification(token: str, title: str, body: str):
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=token,
    )
    try:
        response = messaging.send(message)
        return response
    except Exception as e:
        print(f"Error sending push notification: {e}")
        return None


def send_topic_notification(topic: str, title: str, body: str):
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        topic=topic,
    )
    try:
        response = messaging.send(message)
        return response
    except Exception as e:
        print(f"Error sending topic notification: {e}")
        return None

