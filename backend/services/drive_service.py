"""Google Drive service — handles uploading clips via OAuth user credentials."""

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# Environment variables
CREDENTIALS_FILE = os.environ.get("GOOGLE_CREDENTIALS_FILE", "credentials.json")
TOKEN_FILE = os.environ.get("GOOGLE_TOKEN_FILE", "token.json")
DRIVE_FOLDER_ID = os.environ.get("GOOGLE_DRIVE_FOLDER_ID", "")

# Cache for Drive service instance
_drive_service = None
_credentials = None

# Optional imports - service will be None if not available
try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    DRIVE_AVAILABLE = True
except ImportError as e:
    DRIVE_AVAILABLE = False
    logger.warning("Google Drive libraries not installed: %s", e)
    logger.warning("Drive upload will be disabled")


def _get_credentials():
    """Get or refresh OAuth credentials for user's Google account."""
    global _credentials

    if not DRIVE_AVAILABLE:
        return None

    if _credentials is not None and _credentials.valid:
        return _credentials

    try:
        scopes = ["https://www.googleapis.com/auth/drive.file"]

        # Load existing token if available
        if os.path.exists(TOKEN_FILE):
            _credentials = Credentials.from_authorized_user_file(TOKEN_FILE, scopes)

        # If no valid credentials, run OAuth flow
        if not _credentials or not _credentials.valid:
            if _credentials and _credentials.expired and _credentials.refresh_token:
                _credentials.refresh(Request())
                logger.info("OAuth token refreshed")
            else:
                if not os.path.exists(CREDENTIALS_FILE):
                    logger.error("OAuth credentials file not found: %s", CREDENTIALS_FILE)
                    logger.error("Please download credentials.json from Google Cloud Console")
                    return None

                flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, scopes)
                _credentials = flow.run_local_server(port=0)
                logger.info("OAuth auth success - user logged in")

            # Save credentials for next run
            with open(TOKEN_FILE, "w") as token:
                token.write(_credentials.to_json())
                logger.info("OAuth token saved to %s", TOKEN_FILE)

        return _credentials

    except Exception as e:
        logger.error("Failed to get OAuth credentials: %s", str(e))
        return None


def _get_drive_service():
    """Create and return Google Drive API service using OAuth credentials."""
    global _drive_service

    if not DRIVE_AVAILABLE:
        return None

    if _drive_service is not None:
        return _drive_service

    try:
        creds = _get_credentials()
        if not creds:
            return None

        _drive_service = build("drive", "v3", credentials=creds)
        logger.info("Drive service initialized with OAuth")
        return _drive_service

    except Exception as e:
        logger.error("Failed to initialize Drive service: %s", e)
        return None


def upload_clip_to_drive(file_path: str, filename: str) -> dict:
    """Upload a clip file to Google Drive using OAuth user credentials.

    Args:
        file_path: Local path to the video file
        filename: Name to use in Drive

    Returns:
        dict with 'file_id', 'url', 'view_url' keys, or empty dict on failure
    """
    if not DRIVE_AVAILABLE:
        logger.warning("Drive service not available, skipping upload")
        return {}

    try:
        service = _get_drive_service()
        if not service:
            logger.error("Drive service not available")
            return {}

        if not os.path.exists(file_path):
            logger.error("File not found: %s", file_path)
            return {}

        # Prepare file metadata
        file_metadata = {
            "name": filename,
            "parents": [DRIVE_FOLDER_ID] if DRIVE_FOLDER_ID else [],
            "mimeType": "video/mp4",
        }

        logger.info("DRIVE UPLOAD START: %s", filename)

        media = MediaFileUpload(
            file_path,
            mimetype="video/mp4",
            resumable=True,
        )

        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id, webViewLink, webContentLink",
        ).execute()

        file_id = file.get("id")
        logger.info("DRIVE FILE ID: %s", file_id)

        # Make file publicly accessible with link
        make_file_public(file_id)

        # Get download and view URLs
        result = get_drive_urls(file_id)

        logger.info("DRIVE FINAL URL: %s", result.get("url", "N/A"))
        return result

    except Exception as e:
        logger.error("Drive upload failed: %s", str(e))
        return {}


def make_file_public(file_id: str) -> bool:
    """Make a Drive file publicly accessible with link permission."""

    try:
        service = _get_drive_service()
        if not service:
            return False

        permission = {
            "type": "anyone",
            "role": "reader",
            "allowFileDiscovery": False,
        }

        service.permissions().create(
            fileId=file_id,
            body=permission,
        ).execute()

        logger.info("File made public: %s", file_id)
        return True

    except Exception as e:
        logger.error("Failed to make file public: %s", str(e))
        return False


def get_drive_urls(file_id: str) -> dict:
    """Get download and view URLs for a Drive file.

    Returns:
        dict with 'url', 'view_url', 'file_id' keys
    """
    return {
        "url": f"https://drive.google.com/uc?id={file_id}&export=download",
        "view_url": f"https://drive.google.com/file/d/{file_id}/view",
        "file_id": file_id,
    }
