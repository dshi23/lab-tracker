"""
Services package for lab tracker backend

This package contains business logic services that handle data processing,
file operations, and other complex operations separated from route handlers.
"""

# Import all services
from .excel_processor import ExcelProcessor
from .storage_excel_processor import StorageExcelProcessor
from .storage_service import StorageService

# Service instances for dependency injection
excel_processor = ExcelProcessor()
storage_excel_processor = StorageExcelProcessor()
storage_service = StorageService()

__all__ = [
    'ExcelProcessor',
    'StorageExcelProcessor', 
    'StorageService',
    'excel_processor',
    'storage_excel_processor',
    'storage_service'
] 