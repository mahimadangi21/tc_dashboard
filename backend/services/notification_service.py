import os
from pathlib import Path

# Firebase is optional — only initialise if the service account file exists
_firebase_available = False
_messaging = None

_cred_path = Path(__file__).resolve().parent.parent / "firebase-service-account.json"

if _cred_path.exists():
    try:
        import firebase_admin
        from firebase_admin import credentials, messaging as fb_messaging
        cred = credentials.Certificate(str(_cred_path))
        firebase_admin.initialize_app(cred)
        _messaging = fb_messaging
        _firebase_available = True
    except Exception as e:
        print(f"Firebase init skipped: {e}")


def send_push_notification(token: str, title: str, body: str):
    if not _firebase_available or not _messaging:
        print("Firebase not configured — push notification skipped.")
        return None
    message = _messaging.Message(
        notification=_messaging.Notification(title=title, body=body),
        token=token,
    )
    try:
        return _messaging.send(message)
    except Exception as e:
        print(f"Error sending push notification: {e}")
        return None


def send_topic_notification(topic: str, title: str, body: str):
    if not _firebase_available or not _messaging:
        print("Firebase not configured — topic notification skipped.")
        return None
    message = _messaging.Message(
        notification=_messaging.Notification(title=title, body=body),
        topic=topic,
    )
    try:
        return _messaging.send(message)
    except Exception as e:
        print(f"Error sending topic notification: {e}")
        return None
