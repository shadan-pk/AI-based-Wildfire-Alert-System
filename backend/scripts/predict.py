import sys
import json
import joblib
import pandas as pd
import os

# Load the pre-trained model
# model = joblib.load('lightgbm_model.pkl')
model_path = os.path.join(os.path.dirname(__file__), 'lightgbm_model.pkl')
model = joblib.load(model_path)

# Read JSON from stdin
input_data = sys.stdin.read()
data = json.loads(input_data)

# Prepare features for the model
features_list = []
for entry in data:
    features = entry['data']
    # Exclude 'forest_fire' as it's the target variable
    feature_values = [
        features['temperature_2m'],
        features['relative_humidity_2m'],
        features['wind_speed_10m'],
        features['precipitation'],
        features['FFMC'],
        features['DMC'],
        features['DC'],
        features['ISI'],
        features['BUI'],
        features['FWI'],
    ]
    features_list.append(feature_values)

# Convert to DataFrame (optional, if model expects named columns)
features_df = pd.DataFrame(
    features_list,
    columns=[
        'temperature_2m', 'relative_humidity_2m', 'wind_speed_10m',
        'precipitation', 'FFMC', 'DMC', 'DC', 'ISI', 'BUI', 'FWI'
    ]
)

# Make predictions
predictions = model.predict(features_df)

# Prepare output
output = []
for i, entry in enumerate(data):
    output.append({
        'lat': entry['lat'],
        'lon': entry['lon'],
        'prediction': int(predictions[i])
    })

# Output predictions as JSON
print(json.dumps(output))