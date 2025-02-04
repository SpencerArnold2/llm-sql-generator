# backend/database.py
import psycopg2
from config import (
    REDSHIFT_HOST,
    REDSHIFT_PORT,
    REDSHIFT_DB,
    REDSHIFT_USER,
    REDSHIFT_PASSWORD,
    SSH_PRIVATE_KEY_PASSWORD,
    USE_SSH_TUNNEL,
    SSH_HOST,
    SSH_PORT,
    SSH_USER,
    SSH_PRIVATE_KEY,
)

# If port forwarding via SSH is enabled, create a tunnel and use its local port for the connection.
if USE_SSH_TUNNEL:
    from sshtunnel import SSHTunnelForwarder

    tunnel = SSHTunnelForwarder(
        (SSH_HOST, SSH_PORT),
        ssh_username=SSH_USER,
        ssh_pkey=SSH_PRIVATE_KEY,
        ssh_private_key_password=SSH_PRIVATE_KEY_PASSWORD,
        remote_bind_address=(REDSHIFT_HOST, int(REDSHIFT_PORT)),
    )
    tunnel.start()
    # Connect to the Redshift cluster via the tunnel’s local bind address.
    db_host = "127.0.0.1"
    db_port = tunnel.local_bind_port
    print(f"SSH Tunnel established. Local port: {db_port}")
else:
    db_host = REDSHIFT_HOST
    db_port = REDSHIFT_PORT

# Establish the Redshift connection
conn = psycopg2.connect(
    host=db_host,
    port=db_port,
    dbname=REDSHIFT_DB,
    user=REDSHIFT_USER,
    password=REDSHIFT_PASSWORD,
)
cursor = conn.cursor()


def get_db_connection():
    """Return the database connection and cursor."""
    return conn, cursor
