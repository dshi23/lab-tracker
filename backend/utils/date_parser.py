import re
from datetime import datetime, date
from dateutil import parser as date_parser

class DateParser:
    """Utility class for parsing various date formats, especially Chinese date formats"""
    
    @staticmethod
    def parse_date(date_str):
        """
        Parse date string in various formats including Chinese formats
        
        Args:
            date_str (str): Date string to parse
            
        Returns:
            datetime.date: Parsed date object or None if parsing fails
        """
        if not date_str or not isinstance(date_str, str):
            return None
            
        date_str = date_str.strip()
        
        # Handle various Chinese date formats
        patterns = [
            # 2025.04.29 format
            r'(\d{4})\.(\d{1,2})\.(\d{1,2})',
            # 2025.0522 format (month and day combined)
            r'(\d{4})\.(\d{1,2})(\d{2})',
            # 2025-04-29 format
            r'(\d{4})-(\d{1,2})-(\d{1,2})',
            # 2025/04/29 format
            r'(\d{4})/(\d{1,2})/(\d{1,2})',
            # 04.29.2025 format
            r'(\d{1,2})\.(\d{1,2})\.(\d{4})',
            # 04-29-2025 format
            r'(\d{1,2})-(\d{1,2})-(\d{4})',
        ]
        
        for pattern in patterns:
            match = re.match(pattern, date_str)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    try:
                        if len(groups[0]) == 4:  # Year first format
                            year, month, day = int(groups[0]), int(groups[1]), int(groups[2])
                        else:  # Month first format
                            month, day, year = int(groups[0]), int(groups[1]), int(groups[2])
                        
                        return date(year, month, day)
                    except ValueError:
                        continue
        
        # Try standard date parsing as fallback
        try:
            parsed_date = date_parser.parse(date_str)
            return parsed_date.date()
        except (ValueError, TypeError):
            pass
            
        return None
    
    @staticmethod
    def format_date_for_display(date_obj):
        """
        Format date object for display
        
        Args:
            date_obj (datetime.date): Date object to format
            
        Returns:
            str: Formatted date string
        """
        if not date_obj:
            return ""
        
        if isinstance(date_obj, str):
            parsed = DateParser.parse_date(date_obj)
            if parsed:
                date_obj = parsed
            else:
                return date_obj
        
        return date_obj.strftime("%Y-%m-%d")
    
    @staticmethod
    def is_valid_date_range(start_date, end_date):
        """
        Check if date range is valid
        
        Args:
            start_date (datetime.date): Start date
            end_date (datetime.date): End date
            
        Returns:
            bool: True if valid range, False otherwise
        """
        if not start_date or not end_date:
            return False
        
        return start_date <= end_date 