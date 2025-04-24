import os
import json
import psycopg2
import psycopg2.extras
from datetime import datetime

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    """Create a database connection"""
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn

def close_db_connection(conn):
    """Close the database connection"""
    if conn:
        conn.close()

def get_all_voices():
    """Get all voices from the database"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT id, name, type, accent, is_celebrity, parameters, file_path, created_at
            FROM voices
            ORDER BY is_celebrity DESC, name ASC
        """)
        voices = cur.fetchall()
        
        # Convert to list of dictionaries
        result = []
        for voice in voices:
            voice_dict = dict(voice)
            # Convert parameters to dict if it's a string
            if isinstance(voice_dict['parameters'], str):
                voice_dict['parameters'] = json.loads(voice_dict['parameters'])
            result.append(voice_dict)
        
        return result
    except Exception as e:
        print(f"Database error: {e}")
        return []
    finally:
        close_db_connection(conn)

def get_celebrity_voices():
    """Get only celebrity voices from the database"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT id, name, type, accent, is_celebrity, parameters, file_path, created_at
            FROM voices
            WHERE is_celebrity = TRUE
            ORDER BY name ASC
        """)
        voices = cur.fetchall()
        
        # Convert to list of dictionaries
        result = []
        for voice in voices:
            voice_dict = dict(voice)
            # Convert parameters to dict if it's a string
            if isinstance(voice_dict['parameters'], str):
                voice_dict['parameters'] = json.loads(voice_dict['parameters'])
            result.append(voice_dict)
        
        return result
    except Exception as e:
        print(f"Database error: {e}")
        return []
    finally:
        close_db_connection(conn)

def get_custom_voices():
    """Get only custom (non-celebrity) voices from the database"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT id, name, type, accent, is_celebrity, parameters, file_path, created_at
            FROM voices
            WHERE is_celebrity = FALSE
            ORDER BY name ASC
        """)
        voices = cur.fetchall()
        
        # Convert to list of dictionaries
        result = []
        for voice in voices:
            voice_dict = dict(voice)
            # Convert parameters to dict if it's a string
            if isinstance(voice_dict['parameters'], str):
                voice_dict['parameters'] = json.loads(voice_dict['parameters'])
            result.append(voice_dict)
        
        return result
    except Exception as e:
        print(f"Database error: {e}")
        return []
    finally:
        close_db_connection(conn)

def get_voice_by_id(voice_id):
    """Get a specific voice by ID"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT id, name, type, accent, is_celebrity, parameters, file_path, created_at
            FROM voices
            WHERE id = %s
        """, (voice_id,))
        voice = cur.fetchone()
        
        if voice:
            voice_dict = dict(voice)
            # Convert parameters to dict if it's a string
            if isinstance(voice_dict['parameters'], str):
                voice_dict['parameters'] = json.loads(voice_dict['parameters'])
            return voice_dict
        
        return None
    except Exception as e:
        print(f"Database error: {e}")
        return None
    finally:
        close_db_connection(conn)

def add_voice(name, voice_type, accent, is_celebrity=False, parameters=None, file_path=None):
    """Add a new voice to the database"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Convert parameters to JSON string if it's a dict
        if parameters and isinstance(parameters, dict):
            parameters = json.dumps(parameters)
        
        cur.execute("""
            INSERT INTO voices (name, type, accent, is_celebrity, parameters, file_path)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (name, voice_type, accent, is_celebrity, parameters, file_path))
        
        voice_id = cur.fetchone()[0]
        return voice_id
    except Exception as e:
        print(f"Database error: {e}")
        return None
    finally:
        close_db_connection(conn)

def update_voice(voice_id, name=None, voice_type=None, accent=None, is_celebrity=None, parameters=None, file_path=None):
    """Update an existing voice in the database"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get current voice data
        voice = get_voice_by_id(voice_id)
        if not voice:
            return False
        
        # Update only provided fields
        name = name if name is not None else voice['name']
        voice_type = voice_type if voice_type is not None else voice['type']
        accent = accent if accent is not None else voice['accent']
        is_celebrity = is_celebrity if is_celebrity is not None else voice['is_celebrity']
        
        # Handle parameters update
        if parameters:
            if isinstance(parameters, dict):
                parameters = json.dumps(parameters)
        else:
            parameters = voice['parameters']
            if isinstance(parameters, dict):
                parameters = json.dumps(parameters)
        
        file_path = file_path if file_path is not None else voice['file_path']
        
        cur.execute("""
            UPDATE voices
            SET name = %s, type = %s, accent = %s, is_celebrity = %s, parameters = %s, file_path = %s
            WHERE id = %s
        """, (name, voice_type, accent, is_celebrity, parameters, file_path, voice_id))
        
        return True
    except Exception as e:
        print(f"Database error: {e}")
        return False
    finally:
        close_db_connection(conn)

def delete_voice(voice_id):
    """Delete a voice from the database"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # First, check if this voice is being used in any call sessions
        cur.execute("SELECT COUNT(*) FROM call_sessions WHERE voice_id = %s", (voice_id,))
        count = cur.fetchone()[0]
        
        if count > 0:
            # If voice is in use, just return without deleting
            return False
        
        cur.execute("DELETE FROM voices WHERE id = %s", (voice_id,))
        
        return True
    except Exception as e:
        print(f"Database error: {e}")
        return False
    finally:
        close_db_connection(conn)

def create_call_session(phone_number, voice_id, session_id, status="initiated", parameters=None):
    """Create a new call session"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Convert parameters to JSON string if it's a dict
        if parameters and isinstance(parameters, dict):
            parameters = json.dumps(parameters)
        
        cur.execute("""
            INSERT INTO call_sessions (phone_number, voice_id, session_id, status, parameters)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (phone_number, voice_id, session_id, status, parameters))
        
        session_id = cur.fetchone()[0]
        return session_id
    except Exception as e:
        print(f"Database error: {e}")
        return None
    finally:
        close_db_connection(conn)

def update_call_session_status(session_id, status, ended_at=None):
    """Update the status of a call session"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if ended_at:
            cur.execute("""
                UPDATE call_sessions
                SET status = %s, ended_at = %s
                WHERE session_id = %s
            """, (status, ended_at, session_id))
        else:
            cur.execute("""
                UPDATE call_sessions
                SET status = %s
                WHERE session_id = %s
            """, (status, session_id))
        
        return True
    except Exception as e:
        print(f"Database error: {e}")
        return False
    finally:
        close_db_connection(conn)

def get_call_session(session_id):
    """Get a specific call session by ID"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT cs.*, v.name as voice_name, v.accent as voice_accent, v.parameters as voice_parameters
            FROM call_sessions cs
            LEFT JOIN voices v ON cs.voice_id = v.id
            WHERE cs.session_id = %s
        """, (session_id,))
        session = cur.fetchone()
        
        if session:
            session_dict = dict(session)
            # Convert parameters to dict if it's a string
            if isinstance(session_dict['parameters'], str):
                session_dict['parameters'] = json.loads(session_dict['parameters'])
            if isinstance(session_dict['voice_parameters'], str):
                session_dict['voice_parameters'] = json.loads(session_dict['voice_parameters'])
            return session_dict
        
        return None
    except Exception as e:
        print(f"Database error: {e}")
        return None
    finally:
        close_db_connection(conn)

# Add many celebrity voices at once for initial database setup
def add_celebrity_voices(celebrity_voices):
    """Add multiple celebrity voices at once"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # First, check if we already have a name column constraint
        cur.execute("""
            SELECT count(*) FROM pg_constraint 
            WHERE conname = 'voices_name_key' AND conrelid = 'voices'::regclass
        """)
        
        has_constraint = cur.fetchone()[0] > 0
        
        # If no constraint exists, try to add one
        if not has_constraint:
            try:
                cur.execute("""
                    ALTER TABLE voices ADD CONSTRAINT voices_name_key UNIQUE (name)
                """)
                print("Added unique constraint on name column")
            except Exception as constraint_error:
                print(f"Could not add constraint: {constraint_error}")
                # Continue anyway, we'll just handle duplicates manually
        
        # Get existing voice names
        cur.execute("SELECT name FROM voices")
        existing_names = set(row[0] for row in cur.fetchall())
        
        voices_added = 0
        
        for voice in celebrity_voices:
            name = voice.get('name')
            
            # Skip if name already exists
            if name in existing_names:
                print(f"Voice '{name}' already exists, skipping")
                continue
                
            voice_type = voice.get('type', 'celebrity')
            accent = voice.get('accent', 'neutral')
            parameters = voice.get('parameters', {})
            
            # Convert parameters to JSON string if it's a dict
            if parameters and isinstance(parameters, dict):
                parameters = json.dumps(parameters)
            
            # Simple insert without conflict handling
            cur.execute("""
                INSERT INTO voices (name, type, accent, is_celebrity, parameters)
                VALUES (%s, %s, %s, TRUE, %s)
            """, (name, voice_type, accent, parameters))
            
            voices_added += 1
            existing_names.add(name)  # Add to our tracking set
        
        print(f"Added {voices_added} new celebrity voices")
        return True
    except Exception as e:
        print(f"Database error: {e}")
        return False
    finally:
        close_db_connection(conn)