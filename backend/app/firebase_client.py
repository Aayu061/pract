import os
import json
from pathlib import Path
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore

_firestore_client = None


def get_firestore_db():
    """
    Returns an initialized Firestore client if credentials are present, else None.
    Supports:
    1. FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_JSON env var (in production)
    2. backend/firebase-credentials.json file (in local development)
    """
    global _firestore_client
    if _firestore_client is not None:
        return _firestore_client

    cred_json_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT") or os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    local_cred_path = Path(__file__).resolve().parent.parent / "firebase-credentials.json"

    cred = None
    if cred_json_str:
        try:
            cert_dict = json.loads(cred_json_str)
            cred = credentials.Certificate(cert_dict)
        except Exception as e:
            print(f"Warning: Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: {e}")
    elif local_cred_path.exists():
        try:
            cred = credentials.Certificate(str(local_cred_path))
        except Exception as e:
            print(f"Warning: Failed to load local firebase-credentials.json: {e}")

    if cred:
        try:
            app = firebase_admin.get_app()
        except ValueError:
            app = firebase_admin.initialize_app(cred)
        _firestore_client = firestore.client(app=app)
        return _firestore_client

    return None
