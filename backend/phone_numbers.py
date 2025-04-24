
import os
import json
import random
from datetime import datetime

class PhoneNumberManager:
    def __init__(self):
        self.available_countries = {
            'US': '+1',
            'UK': '+44',
            'CA': '+1',
            'AU': '+61',
            'DE': '+49'
        }
        
        # Load platform config
        self.load_platform_config()
        
    def load_platform_config(self):
        """Load platform configuration from environment or default to Asterisk"""
        try:
            with open('config/platform_config.json', 'r') as f:
                config = json.load(f)
                self.virtual_number_platform = config.get('virtualNumberPlatform', 'asterisk')
                self.sms_provider = config.get('smsProvider', 'asterisk')
        except:
            self.virtual_number_platform = 'asterisk'
            self.sms_provider = 'asterisk'
            
    def generate_virtual_number(self, country_code='US'):
        """Generate a virtual phone number using the configured platform"""
        if self.virtual_number_platform == 'asterisk':
            return self._generate_asterisk_number(country_code)
        elif self.virtual_number_platform == 'twilio':
            return self._generate_twilio_number(country_code)
        elif self.virtual_number_platform == 'vonage':
            return self._generate_vonage_number(country_code)
        else:
            return self._generate_asterisk_number(country_code)  # Default fallback
            
    def _generate_asterisk_number(self, country_code):
        """Generate number using Asterisk with validation"""
        prefix = self.available_countries.get(country_code, '+1')
        
        for _ in range(4):  # Try up to 4 times to generate a valid number
            if prefix == '+1':  # US/CA format
                area_code = str(random.randint(200, 999))
                middle = str(random.randint(200, 999))
                end = str(random.randint(1000, 9999))
                number = f"{prefix}{area_code}{middle}{end}"
            else:
                number = f"{prefix}{random.randint(1000000000, 9999999999)}"
                
            # Validate the number
            if self._validate_asterisk_number(number):
                return number
                
        # If we couldn't generate a valid number after 4 tries
        raise Exception("Could not generate valid Asterisk number")
        
    def _validate_asterisk_number(self, number):
        """Validate number format and check Asterisk availability"""
        # Basic format validation
        if not number or len(number) < 10:
            return False
            
        try:
            # Check if number is registered in Asterisk
            # This would integrate with your Asterisk server
            return True  # Placeholder - implement actual check
        except Exception:
            return False
        
    def _generate_twilio_number(self, country_code):
        """Generate number using Twilio API"""
        # Implementation for when Twilio is selected
        return self._generate_asterisk_number(country_code)  # Fallback for now
        
    def _generate_vonage_number(self, country_code):
        """Generate number using Vonage API"""
        # Implementation for when Vonage is selected
        return self._generate_asterisk_number(country_code)  # Fallback for now
        
    def assign_number_to_user(self, user_id, country_code='US'):
        """Assign a virtual number to a user using the configured platform"""
        number = self.generate_virtual_number(country_code)
        
        return {
            'number': number,
            'country': country_code,
            'platform': self.virtual_number_platform,
            'assigned_at': datetime.now().isoformat(),
            'user_id': user_id
        }
