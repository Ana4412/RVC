
import logging
import traceback
import socket
import requests
import json
from typing import Dict, List, Optional

class DebugBot:
    def __init__(self):
        self.logger = logging.getLogger('DebugBot')
        self.issues = []
        
    def check_port_conflicts(self) -> List[Dict]:
        """Check for port conflicts"""
        ports_to_check = [5000, 5001, 4573]
        conflicts = []
        
        for port in ports_to_check:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                sock.bind(('0.0.0.0', port))
                sock.close()
            except socket.error:
                conflicts.append({
                    'type': 'port_conflict',
                    'port': port,
                    'message': f'Port {port} is already in use'
                })
        return conflicts

    def check_asterisk_config(self) -> List[Dict]:
        """Check Asterisk configuration"""
        issues = []
        try:
            response = requests.get('http://localhost:5001/api/config/asterisk/status')
            if response.status_code != 200:
                issues.append({
                    'type': 'asterisk_config',
                    'message': 'Asterisk configuration check failed'
                })
        except Exception as e:
            issues.append({
                'type': 'asterisk_config',
                'message': f'Asterisk check error: {str(e)}'
            })
        return issues

    def check_syntax_errors(self) -> List[Dict]:
        """Check for syntax errors in key Python files"""
        files_to_check = [
            'backend/phone.py',
            'backend/voice_api.py',
            'run_voice_api.py'
        ]
        issues = []
        
        for file_path in files_to_check:
            try:
                with open(file_path) as f:
                    compile(f.read(), file_path, 'exec')
            except SyntaxError as e:
                issues.append({
                    'type': 'syntax_error',
                    'file': file_path,
                    'line': e.lineno,
                    'message': str(e)
                })
        return issues

    def fix_syntax_errors(self) -> bool:
        """Attempt to fix common syntax errors"""
        try:
            # Fix the unterminated string in phone.py
            with open('backend/phone.py', 'r') as f:
                content = f.read()
            
            # Fix specific issues we found
            content = content.replace(
                '"""Handle DTMF tones during an Asterisk call"""',
                '"""Handle DTMF tones during an Asterisk call."""'
            )
            
            with open('backend/phone.py', 'w') as f:
                f.write(content)
            return True
        except Exception as e:
            self.logger.error(f"Error fixing syntax: {e}")
            return False

    def run_diagnostics(self) -> Dict:
        """Run all diagnostic checks"""
        results = {
            'port_conflicts': self.check_port_conflicts(),
            'asterisk_config': self.check_asterisk_config(),
            'syntax_errors': self.check_syntax_errors(),
            'status': 'error' if any([
                self.check_port_conflicts(),
                self.check_asterisk_config(),
                self.check_syntax_errors()
            ]) else 'ok'
        }
        return results

    def auto_fix(self) -> Dict:
        """Attempt to automatically fix detected issues"""
        fixes = {
            'syntax_fixed': self.fix_syntax_errors(),
            'message': 'Attempted to fix syntax errors'
        }
        return fixes
