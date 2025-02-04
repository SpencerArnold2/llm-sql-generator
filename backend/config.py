# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env if available

# Redshift connection details
REDSHIFT_HOST = os.getenv("REDSHIFT_HOST")
REDSHIFT_PORT = os.getenv("REDSHIFT_PORT", "5439")
REDSHIFT_DB = os.getenv("REDSHIFT_DB")
REDSHIFT_USER = os.getenv("REDSHIFT_USER")
REDSHIFT_PASSWORD = os.getenv("REDSHIFT_PASSWORD")

# LLM configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")  # Options: 'openai' or 'ollama'
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# SSH tunneling configuration (set USE_SSH_TUNNEL to "true" if port forwarding is required)
USE_SSH_TUNNEL = os.getenv("USE_SSH_TUNNEL", "false").lower() == "true"
SSH_HOST = os.getenv("SSH_HOST")  # SSH server host
SSH_PORT = int(os.getenv("SSH_PORT", "22"))  # SSH server port (default is 22)
SSH_USER = os.getenv("SSH_USER")  # SSH username
SSH_PRIVATE_KEY = os.getenv(
    "SSH_PRIVATE_KEY"
)  # Path to your private key file, or the key string
SSH_PRIVATE_KEY_PASSWORD = os.getenv(
    "SSH_PRIVATE_KEY_PASSWORD", None
)  # Password for the SSH private key (if required)
