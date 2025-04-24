
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import json
from typing import Dict, List
from datetime import datetime

class MLDebugger:
    def __init__(self):
        self.model_path = 'backend/models/debug_model.joblib'
        self.history_path = 'backend/models/debug_history.csv'
        self.label_encoder = LabelEncoder()
        self.model = None
        self.initialize_model()
        
    def initialize_model(self):
        """Initialize or load the ML model"""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            self.model = RandomForestClassifier()
            os.makedirs('backend/models', exist_ok=True)
            
    def extract_features(self, diagnostic_data: Dict) -> np.ndarray:
        """Extract features from diagnostic data"""
        features = [
            len(diagnostic_data.get('port_conflicts', [])),
            len(diagnostic_data.get('asterisk_config', [])),
            len(diagnostic_data.get('syntax_errors', [])),
            1 if diagnostic_data.get('status') == 'error' else 0
        ]
        return np.array(features).reshape(1, -1)
        
    def train_model(self, history_data: pd.DataFrame):
        """Train the model on historical debug data"""
        if len(history_data) < 2:  # Need minimum data to train
            return
            
        X = history_data[['port_conflicts', 'asterisk_issues', 'syntax_errors', 'had_error']]
        y = history_data['resolution_type']
        
        self.label_encoder.fit(y)
        y_encoded = self.label_encoder.transform(y)
        self.model.fit(X, y_encoded)
        joblib.dump(self.model, self.model_path)
        
    def predict_resolution(self, diagnostic_data: Dict) -> str:
        """Predict best resolution approach"""
        if self.model is None or not os.path.exists(self.model_path):
            return 'auto_fix'  # Default to auto fix if no model
            
        features = self.extract_features(diagnostic_data)
        prediction = self.model.predict(features)
        return self.label_encoder.inverse_transform(prediction)[0]
        
    def save_diagnostic_record(self, diagnostic_data: Dict, resolution: str, success: bool):
        """Save diagnostic record for future training"""
        record = {
            'timestamp': datetime.now().isoformat(),
            'port_conflicts': len(diagnostic_data.get('port_conflicts', [])),
            'asterisk_issues': len(diagnostic_data.get('asterisk_config', [])),
            'syntax_errors': len(diagnostic_data.get('syntax_errors', [])),
            'had_error': 1 if diagnostic_data.get('status') == 'error' else 0,
            'resolution_type': resolution,
            'success': int(success)
        }
        
        df = pd.DataFrame([record])
        mode = 'a' if os.path.exists(self.history_path) else 'w'
        df.to_csv(self.history_path, mode=mode, header=(mode == 'w'), index=False)
