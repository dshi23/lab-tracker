import re
from typing import Tuple, Optional

class VolumeConverter:
    """Utility class for parsing and converting volume measurements"""
    
    # Common volume units and their conversion factors to microliters
    UNIT_CONVERSIONS = {
        'μl': 1.0,
        'ul': 1.0,
        'microliter': 1.0,
        'microliters': 1.0,
        'ml': 1000.0,
        'milliliter': 1000.0,
        'milliliters': 1000.0,
        'l': 1000000.0,
        'liter': 1000000.0,
        'liters': 1000000.0,
        'nl': 0.001,
        'nanoliter': 0.001,
        'nanoliters': 0.001,
        'pl': 0.000001,
        'picoliter': 0.000001,
        'picoliters': 0.000001,
    }
    
    @staticmethod
    def parse_volume(volume_str: str) -> Tuple[float, str]:
        """
        Parse volume string and return value and unit
        
        Args:
            volume_str (str): Volume string like "5ul", "6.5μl", "0.5ml"
            
        Returns:
            Tuple[float, str]: (value, unit) or (0.0, 'μl') if parsing fails
        """
        if not volume_str or not isinstance(volume_str, str):
            return 0.0, 'μl'
        
        volume_str = volume_str.strip().lower()
        
        # Pattern to match number followed by unit
        pattern = r'^([\d.]+)\s*([a-zA-Zμ]+)$'
        match = re.match(pattern, volume_str)
        
        if match:
            value_str, unit = match.groups()
            try:
                value = float(value_str)
                # Normalize unit
                normalized_unit = VolumeConverter._normalize_unit(unit)
                return value, normalized_unit
            except ValueError:
                pass
        
        # Try to extract just the number if no unit found
        number_pattern = r'^([\d.]+)'
        match = re.match(number_pattern, volume_str)
        if match:
            try:
                value = float(match.group(1))
                return value, 'μl'  # Default to microliters
            except ValueError:
                pass
        
        return 0.0, 'μl'
    
    @staticmethod
    def convert_to_microliters(volume_str: str) -> float:
        """
        Convert volume string to microliters
        
        Args:
            volume_str (str): Volume string to convert
            
        Returns:
            float: Volume in microliters
        """
        value, unit = VolumeConverter.parse_volume(volume_str)
        conversion_factor = VolumeConverter.UNIT_CONVERSIONS.get(unit, 1.0)
        return value * conversion_factor
    
    @staticmethod
    def format_volume(value: float, unit: str = 'μl', precision: int = 2) -> str:
        """
        Format volume value with unit
        
        Args:
            value (float): Volume value
            unit (str): Unit to use
            precision (int): Decimal precision
            
        Returns:
            str: Formatted volume string
        """
        if unit not in VolumeConverter.UNIT_CONVERSIONS:
            unit = 'μl'
        
        formatted_value = f"{value:.{precision}f}".rstrip('0').rstrip('.')
        return f"{formatted_value}{unit}"
    
    @staticmethod
    def _normalize_unit(unit: str) -> str:
        """
        Normalize unit string to standard format
        
        Args:
            unit (str): Unit string to normalize
            
        Returns:
            str: Normalized unit
        """
        unit = unit.lower().strip()
        
        # Handle common variations
        unit_mapping = {
            'ul': 'μl',
            'microliter': 'μl',
            'microliters': 'μl',
            'ml': 'ml',
            'milliliter': 'ml',
            'milliliters': 'ml',
            'l': 'l',
            'liter': 'l',
            'liters': 'l',
            'nl': 'nl',
            'nanoliter': 'nl',
            'nanoliters': 'nl',
            'pl': 'pl',
            'picoliter': 'pl',
            'picoliters': 'pl',
        }
        
        return unit_mapping.get(unit, unit)
    
    @staticmethod
    def convert_to_grams(volume_str: str, chemical_type: str = '化学品') -> Optional[float]:
        """
        Convert volume to grams based on chemical type and estimated density
        
        Args:
            volume_str (str): Volume string to convert (e.g., "5μl", "2ml")
            chemical_type (str): Type of chemical for density estimation
            
        Returns:
            Optional[float]: Weight in grams, or None if conversion not possible
        """
        if not volume_str:
            return None
        
        # Parse volume to get value and unit
        volume_dict = VolumeConverter.parse_volume_dict(volume_str)
        if not volume_dict:
            return None
        
        # Convert to ml first
        ml_value = VolumeConverter.convert_to_microliters(volume_str) / 1000.0
        
        # Density estimates (g/ml) based on chemical type
        density_map = {
            '化学品': 1.0,      # Default density ~1.0 g/ml
            '试剂': 1.1,       # Slightly higher density for reagents
            '酶': 1.05,        # Protein solutions
            '缓冲液': 1.0,      # Mostly water
            '培养基': 1.0,      # Mostly water
            '其他': 1.0        # Default
        }
        
        density = density_map.get(chemical_type, 1.0)
        weight_grams = ml_value * density
        
        return round(weight_grams, 6)  # Round to 6 decimal places for precision
    
    @staticmethod
    def parse_volume_dict(volume_str: str) -> Optional[dict]:
        """
        Parse volume string and return value and unit as dict
        
        Args:
            volume_str (str): Volume string like "5ul", "6.5μl", "0.5ml"
            
        Returns:
            dict: {'value': float, 'unit': str} or None if parsing fails
        """
        if not volume_str or not isinstance(volume_str, str):
            return None
        
        volume_str = volume_str.strip().lower()
        
        # Pattern to match number followed by unit
        pattern = r'^([\d.]+)\s*([a-zA-Zμ]+)$'
        match = re.match(pattern, volume_str)
        
        if match:
            value_str, unit = match.groups()
            try:
                value = float(value_str)
                # Normalize unit
                normalized_unit = VolumeConverter._normalize_unit(unit)
                return {'value': value, 'unit': normalized_unit}
            except ValueError:
                pass
        
        # Try to extract just the number if no unit found
        number_pattern = r'^([\d.]+)'
        match = re.match(number_pattern, volume_str)
        if match:
            try:
                value = float(match.group(1))
                return {'value': value, 'unit': 'μl'}  # Default to microliters
            except ValueError:
                pass
        
        return None

    @staticmethod
    def is_valid_volume(volume_str: str) -> bool:
        """
        Check if volume string is valid
        
        Args:
            volume_str (str): Volume string to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not volume_str:
            return False
        
        volume_dict = VolumeConverter.parse_volume_dict(volume_str)
        if not volume_dict:
            return False
            
        value = volume_dict.get('value', 0)
        unit = volume_dict.get('unit', '')
        return value > 0 and unit in VolumeConverter.UNIT_CONVERSIONS 