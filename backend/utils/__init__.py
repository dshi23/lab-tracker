"""
Utils package for lab tracker backend

This package contains utility functions and helpers used across the application.
These are pure functions that don't depend on application state.
"""

# Import all utility modules
from .date_parser import DateParser


# Utility instances for easy access
date_parser = DateParser()
# Common utility functions
def is_valid_file_extension(filename, allowed_extensions):
    """Check if file has a valid extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def sanitize_filename(filename):
    """Sanitize filename for safe storage"""
    import re
    # Remove or replace unsafe characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    # Replace spaces with underscores
    filename = re.sub(r'\s+', '_', filename)
    return filename

__all__ = [
    'DateParser',
    'date_parser', 
    'is_valid_file_extension',
    'sanitize_filename'
] 