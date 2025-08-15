import decimal
from typing import Union, Optional

class NumberUtils:
    """Utility class for handling floating point arithmetic with precision control"""
    
    # Default precision for decimal operations
    DEFAULT_PRECISION = 6
    
    @staticmethod
    def safe_float(value: Union[str, float, int, None], precision: int = None) -> float:
        """
        Safely convert a value to float with controlled precision
        
        Args:
            value: Value to convert
            precision: Number of decimal places to round to (default: DEFAULT_PRECISION)
            
        Returns:
            float: Rounded float value
        """
        if value is None:
            return 0.0
        
        if precision is None:
            precision = NumberUtils.DEFAULT_PRECISION
        
        try:
            # Use Decimal for precise arithmetic
            decimal_value = decimal.Decimal(str(value))
            # Round to specified precision
            rounded = round(decimal_value, precision)
            return float(rounded)
        except (ValueError, TypeError, decimal.InvalidOperation):
            return 0.0
    
    @staticmethod
    def safe_add(a: Union[str, float, int], b: Union[str, float, int], precision: int = None) -> float:
        """
        Safely add two numbers with controlled precision
        
        Args:
            a: First number
            b: Second number
            precision: Number of decimal places to round to
            
        Returns:
            float: Sum with controlled precision
        """
        if precision is None:
            precision = NumberUtils.DEFAULT_PRECISION
        
        try:
            decimal_a = decimal.Decimal(str(a))
            decimal_b = decimal.Decimal(str(b))
            result = decimal_a + decimal_b
            return float(round(result, precision))
        except (ValueError, TypeError, decimal.InvalidOperation):
            return 0.0
    
    @staticmethod
    def safe_subtract(a: Union[str, float, int], b: Union[str, float, int], precision: int = None) -> float:
        """
        Safely subtract two numbers with controlled precision
        
        Args:
            a: First number
            b: Second number
            precision: Number of decimal places to round to
            
        Returns:
            float: Difference with controlled precision
        """
        if precision is None:
            precision = NumberUtils.DEFAULT_PRECISION
        
        try:
            decimal_a = decimal.Decimal(str(a))
            decimal_b = decimal.Decimal(str(b))
            result = decimal_a - decimal_b
            return float(round(result, precision))
        except (ValueError, TypeError, decimal.InvalidOperation):
            return 0.0
    
    @staticmethod
    def safe_multiply(a: Union[str, float, int], b: Union[str, float, int], precision: int = None) -> float:
        """
        Safely multiply two numbers with controlled precision
        
        Args:
            a: First number
            b: Second number
            precision: Number of decimal places to round to
            
        Returns:
            float: Product with controlled precision
        """
        if precision is None:
            precision = NumberUtils.DEFAULT_PRECISION
        
        try:
            decimal_a = decimal.Decimal(str(a))
            decimal_b = decimal.Decimal(str(b))
            result = decimal_a * decimal_b
            return float(round(result, precision))
        except (ValueError, TypeError, decimal.InvalidOperation):
            return 0.0
    
    @staticmethod
    def safe_divide(a: Union[str, float, int], b: Union[str, float, int], precision: int = None) -> float:
        """
        Safely divide two numbers with controlled precision
        
        Args:
            a: First number
            b: Second number
            precision: Number of decimal places to round to
            
        Returns:
            float: Quotient with controlled precision
        """
        if precision is None:
            precision = NumberUtils.DEFAULT_PRECISION
        
        try:
            decimal_a = decimal.Decimal(str(a))
            decimal_b = decimal.Decimal(str(b))
            
            if decimal_b == 0:
                return 0.0
            
            result = decimal_a / decimal_b
            return float(round(result, precision))
        except (ValueError, TypeError, decimal.InvalidOperation):
            return 0.0
    
    @staticmethod
    def format_quantity(quantity: Union[str, float, int], precision: int = 3) -> str:
        """
        Format a quantity for display with controlled precision
        
        Args:
            quantity: Quantity to format
            precision: Number of decimal places to show
            
        Returns:
            str: Formatted quantity string
        """
        safe_quantity = NumberUtils.safe_float(quantity, precision)
        return f"{safe_quantity:.{precision}f}".rstrip('0').rstrip('.')
    
    @staticmethod
    def is_positive(value: Union[str, float, int]) -> bool:
        """
        Check if a value is positive
        
        Args:
            value: Value to check
            
        Returns:
            bool: True if positive, False otherwise
        """
        try:
            return NumberUtils.safe_float(value) > 0
        except:
            return False
    
    @staticmethod
    def is_non_negative(value: Union[str, float, int]) -> bool:
        """
        Check if a value is non-negative
        
        Args:
            value: Value to check
            
        Returns:
            bool: True if non-negative, False otherwise
        """
        try:
            return NumberUtils.safe_float(value) >= 0
        except:
            return False
