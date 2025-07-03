import logging
import logging.handlers
import os
from datetime import datetime
from pathlib import Path

# Create logs directory if it doesn't exist
logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)

# Configure logging
def setup_logger(name="t3shield"):
    """
    Setup logger with daily rotating file handler and console handler
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # Create formatters
    file_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    console_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # File handler with daily rotation
    today = datetime.now().strftime('%Y-%m-%d')
    file_handler = logging.handlers.TimedRotatingFileHandler(
        filename=logs_dir / f"t3shield_{today}.log",
        when='midnight',
        interval=1,
        backupCount=30,  # Keep 30 days of logs
        encoding='utf-8'
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(file_formatter)
    
    # Console handler (only for errors and critical messages)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.ERROR)
    console_handler.setFormatter(console_formatter)
    
    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# Create main application logger
app_logger = setup_logger("t3shield")

# Create specific loggers for different components
db_logger = setup_logger("t3shield.db")
api_logger = setup_logger("t3shield.api")
auth_logger = setup_logger("t3shield.auth")
websocket_logger = setup_logger("t3shield.websocket")

def log_request(request, response_time=None, status_code=None, error=None):
    """
    Log HTTP request details
    """
    log_data = {
        "method": request.method,
        "url": str(request.url),
        "client_ip": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }
    
    if response_time:
        log_data["response_time"] = f"{response_time:.3f}s"
    
    if status_code:
        log_data["status_code"] = status_code
    
    if error:
        log_data["error"] = str(error)
        api_logger.error(f"Request failed: {log_data}")
    else:
        api_logger.info(f"Request completed: {log_data}")

def log_database_operation(operation, table=None, query=None, params=None, error=None):
    """
    Log database operations
    """
    log_data = {
        "operation": operation,
        "table": table
    }
    
    if query:
        # Truncate long queries for readability
        log_data["query"] = query[:200] + "..." if len(query) > 200 else query
    
    if params:
        # Don't log sensitive data like passwords
        safe_params = {}
        for key, value in params.items():
            if 'password' in key.lower() or 'token' in key.lower():
                safe_params[key] = "***"
            else:
                safe_params[key] = str(value)[:100]  # Truncate long values
        log_data["params"] = safe_params
    
    if error:
        log_data["error"] = str(error)
        db_logger.error(f"Database operation failed: {log_data}")
    else:
        db_logger.info(f"Database operation: {log_data}")

def log_authentication_event(event_type, user_id=None, success=True, error=None):
    """
    Log authentication events
    """
    log_data = {
        "event": event_type,
        "success": success
    }
    
    if user_id:
        log_data["user_id"] = user_id
    
    if error:
        log_data["error"] = str(error)
        auth_logger.error(f"Authentication failed: {log_data}")
    else:
        auth_logger.info(f"Authentication event: {log_data}")

def log_websocket_event(event_type, client_id=None, data_size=None, error=None):
    """
    Log WebSocket events
    """
    log_data = {
        "event": event_type
    }
    
    if client_id:
        log_data["client_id"] = client_id
    
    if data_size:
        log_data["data_size"] = data_size
    
    if error:
        log_data["error"] = str(error)
        websocket_logger.error(f"WebSocket error: {log_data}")
    else:
        websocket_logger.info(f"WebSocket event: {log_data}")

def log_performance_metric(metric_name, value, unit=None):
    """
    Log performance metrics
    """
    metric_data = {
        "metric": metric_name,
        "value": value
    }
    
    if unit:
        metric_data["unit"] = unit
    
    app_logger.info(f"Performance metric: {metric_data}")

def log_business_event(event_type, details=None, user_id=None):
    """
    Log business logic events
    """
    log_data = {
        "event": event_type
    }
    
    if details:
        log_data["details"] = details
    
    if user_id:
        log_data["user_id"] = user_id
    
    app_logger.info(f"Business event: {log_data}")

# Export the main logger for easy access
logger = app_logger 