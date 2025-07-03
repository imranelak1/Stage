import time
import pymysql
from sqlalchemy import create_engine, text
from sqlalchemy.pool import QueuePool
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Optional, List, Dict, Any
from urllib.parse import quote_plus
from logger_config import logger

class Database:
    def __init__(self):
        self.host = "185.255.131.80"
        self.user = "root"
        self.password = "Sensthings@012"
        self.port = 3306                                                                                  
        self.database = "VPS_T3-shield-v2"
        
        # URL encode the password to handle special characters
        encoded_password = quote_plus(self.password)
        
        # Create SQLAlchemy engine with connection pooling
        self.engine = create_engine(
            f"mysql+pymysql://{self.user}:{encoded_password}@{self.host}:{self.port}/{self.database}",
            poolclass=QueuePool,
            pool_size=15,          # Base connections
            max_overflow=25,       # Extra connections when needed
            pool_pre_ping=True,    # Test connections before use
            pool_recycle=3600,     # Recycle connections every hour
            echo=False,            # Disable SQL logging in production
            pool_reset_on_return='commit'  # Reset connection state
        )
        
        # Create session factory
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Legacy connection for backward compatibility
        self.connection = None
        self.cursor = None

    @contextmanager
    def get_session(self):
        """Get a database session with automatic cleanup"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def connect(self):
        """
        Connect to MySQL Database (legacy method for backward compatibility).
        """
        # This method is kept for backward compatibility but uses the pool
        self.connection = self.engine.raw_connection()
        self.cursor = self.connection.cursor(pymysql.cursors.DictCursor)

    def close(self):
        """Close the database connection."""
        try:
            if hasattr(self, 'connection') and self.connection:
                self.connection.close()
        except Exception as e:
            logger.error(f"Error closing connection: {e}")

    def execute_query(self, query, params=None):
        """Execute a SELECT query and return the results."""
        connection = self.engine.raw_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(query, params)
                result = cursor.fetchall()
                return result
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            return None
        finally:
            connection.close()

    def execute_update(self, query, params=None):
        """
        Execute an update query (INSERT, UPDATE, DELETE)
        """
        connection = self.engine.raw_connection()
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(query, params or ())
                connection.commit()
                return True
        except Exception as e:
            logger.error(f"Update execution failed: {e}")
            return False
        finally:
            connection.close()

    def execute_query_raw(self, query, params=None):
        """Execute a SELECT query using raw connection (for complex queries)"""
        try:
            with self.engine.raw_connection() as connection:
                with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                    cursor.execute(query, params)
                    result = cursor.fetchall()
                    return result
        except Exception as e:
            logger.error(f"Error executing raw query: {e}")
            return None

    def execute_update_raw(self, query, params=None):
        """Execute an update query using raw connection (for complex queries)"""
        try:
            with self.engine.raw_connection() as connection:
                with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                    cursor.execute(query, params or ())
                    connection.commit()
                    return True
        except Exception as e:
            logger.error(f"Raw update execution failed: {e}")
            return False