"""
Response formatting utilities for consistent API responses
"""
from datetime import datetime
from typing import Dict, Any, Optional, List


class ResponseFormatter:
    """Utility class for standardizing API response formats"""
    
    API_VERSION = "2.0"
    
    @staticmethod
    def success_response(
        message: str,
        data: Dict[str, Any],
        endpoint: str,
        status_code: int = 200,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a standardized success response"""
        
        response = {
            'success': True,
            'message': message,
            'timestamp': datetime.utcnow().isoformat(),
            **data,
            'metadata': {
                'endpoint': endpoint,
                'api_version': ResponseFormatter.API_VERSION,
                'status_code': status_code,
                **(metadata or {})
            }
        }
        
        return response
    
    @staticmethod
    def error_response(
        error: str,
        error_type: str,
        endpoint: str,
        status_code: int,
        details: Optional[Dict[str, Any]] = None,
        suggestions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a standardized error response"""
        
        response = {
            'success': False,
            'error': error,
            'error_type': error_type,
            'timestamp': datetime.utcnow().isoformat(),
            'endpoint': endpoint,
            'status_code': status_code,
            'details': details or {},
            'metadata': {
                'api_version': ResponseFormatter.API_VERSION,
                'error_occurred': True
            }
        }
        
        if suggestions:
            response['suggestions'] = suggestions
        
        return response
    
    @staticmethod
    def record_creation_response(
        record: Any,
        storage_item: Any,
        operation_details: Dict[str, Any],
        endpoint: str
    ) -> Dict[str, Any]:
        """Create a standardized response for record creation"""
        
        return ResponseFormatter.success_response(
            message="Usage record created successfully",
            data={
                'record': {
                    **record.to_dict(),
                    'created': True,
                    'creation_timestamp': record.创建时间.isoformat() if record.创建时间 else None
                },
                'storage_item': {
                    **storage_item.to_dict(),
                    'inventory_updated': True,
                    'last_updated': storage_item.更新时间.isoformat() if storage_item.更新时间 else None
                },
                'operation_details': operation_details
            },
            endpoint=endpoint,
            status_code=201,
            metadata={
                'operation': 'record_creation',
                'record_id': record.id,
                'storage_id': storage_item.id
            }
        )
    
    @staticmethod
    def storage_creation_response(
        storage_item: Any,
        endpoint: str
    ) -> Dict[str, Any]:
        """Create a standardized response for storage creation"""
        
        return ResponseFormatter.success_response(
            message="Storage item created successfully",
            data={
                'item': {
                    **storage_item.to_dict(),
                    'created': True,
                    'creation_timestamp': storage_item.创建时间.isoformat() if storage_item.创建时间 else None
                },
                'unit_info': {
                    'original_unit': storage_item.单位,
                    'current_quantity': storage_item.当前库存量,
                    'total_quantity': storage_item.当前库存量,
                    'unit_consistent': True,
                    'quantity_format': storage_item.数量及数量单位
                }
            },
            endpoint=endpoint,
            status_code=201,
            metadata={
                'operation': 'storage_creation',
                'storage_id': storage_item.id
            }
        )
    
    @staticmethod
    def validation_error_response(
        error: str,
        endpoint: str,
        field: Optional[str] = None,
        provided_value: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Create a standardized validation error response"""
        
        details = {
            'message': 'Request validation failed',
            'validation_type': 'field_validation' if field else 'general_validation'
        }
        
        if field:
            details['invalid_field'] = field
        if provided_value is not None:
            details['provided_value'] = str(provided_value)
        
        suggestions = [
            'Check required fields are provided',
            'Verify data types and formats',
            'Ensure values meet constraints',
            'Review API documentation'
        ]
        
        return ResponseFormatter.error_response(
            error=error,
            error_type='validation_error',
            endpoint=endpoint,
            status_code=400,
            details=details,
            suggestions=suggestions
        )
    
    @staticmethod
    def server_error_response(
        error: str,
        endpoint: str,
        action_taken: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a standardized server error response"""
        
        details = {
            'message': 'An internal server error occurred',
            'retry_recommended': True
        }
        
        if action_taken:
            details['action_taken'] = action_taken
        
        suggestions = [
            'Try the request again',
            'Check request format',
            'Contact support if issue persists'
        ]
        
        return ResponseFormatter.error_response(
            error=error,
            error_type='server_error',
            endpoint=endpoint,
            status_code=500,
            details=details,
            suggestions=suggestions
        ) 