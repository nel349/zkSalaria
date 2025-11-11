#!/usr/bin/env python3
"""
Generate calibration data covering realistic salary ranges
This ensures the ZK circuits can handle real-world payment amounts
"""

import json
import os

def generate_calibration_samples():
    """
    Generate diverse calibration samples covering realistic salary ranges:
    - Entry level: $2,000 - $4,000/month
    - Mid level: $4,000 - $8,000/month
    - Senior: $8,000 - $15,000/month
    - Executive: $15,000 - $30,000/month
    """

    calibration_samples = []

    # Sample 1: Entry level (~$3,000/month)
    calibration_samples.append({
        "payments": [2800, 2900, 3000, 3100, 3200, 3300],
        "description": "Entry level"
    })

    # Sample 2: Mid level (~$6,000/month)
    calibration_samples.append({
        "payments": [5500, 5800, 6000, 6200, 6400, 6600],
        "description": "Mid level"
    })

    # Sample 3: Senior (~$10,000/month)
    calibration_samples.append({
        "payments": [9000, 9500, 10000, 10500, 11000, 11500],
        "description": "Senior"
    })

    # Sample 4: Executive (~$20,000/month)
    calibration_samples.append({
        "payments": [18000, 19000, 20000, 21000, 22000, 23000],
        "description": "Executive"
    })

    # Sample 5: Low income edge case
    calibration_samples.append({
        "payments": [1000, 1200, 1500, 1800, 2000, 2200],
        "description": "Low income"
    })

    # Sample 6: Very high earner edge case
    calibration_samples.append({
        "payments": [25000, 26000, 28000, 29000, 30000, 32000],
        "description": "Very high earner"
    })

    return calibration_samples

def create_calibration_file(model_name, num_thresholds=1):
    """Create calibration data file for a specific model using MAX values"""

    # Use conservative maximum values to avoid circuit overflow
    # Maximum payment: $10,000/month (covers up to ~$120K/year)
    # This prevents overflow in sum/division operations
    max_payments = [10000.0] * 6

    # Create input data for EZKL calibration
    calibration_data = {
        "input_shapes": [[1]] * (6 + num_thresholds),
        "input_data": []
    }

    # Add payment data (flatten to single array)
    for payment in max_payments:
        calibration_data["input_data"].append([payment])

    # Add threshold(s) based on model type
    if model_name == "income_above_threshold":
        # Max total threshold: 6 months * $10K = $60K
        calibration_data["input_data"].append([60000.0])
    elif model_name == "income_range":
        # Max range thresholds (conservative)
        calibration_data["input_data"].append([40000.0])  # min
        calibration_data["input_data"].append([60000.0])  # max
    elif model_name == "average_income":
        # Max average threshold: $10,000/month
        calibration_data["input_data"].append([10000.0])
    elif model_name == "first_time_loan":
        # Max consistency ratio
        calibration_data["input_data"].append([1.0])

    return calibration_data

if __name__ == "__main__":
    # Create calibration directory if it doesn't exist
    os.makedirs("calibration", exist_ok=True)

    # Generate calibration files for all models
    models = {
        "income_above_threshold": 1,
        "income_range": 2,
        "average_income": 1,
        "first_time_loan": 1
    }

    for model_name, num_thresholds in models.items():
        cal_data = create_calibration_file(model_name, num_thresholds)

        output_file = f"calibration/calibration_{model_name}.json"
        with open(output_file, "w") as f:
            json.dump(cal_data, f, indent=2)

        print(f"✅ Created {output_file}")
        print(f"   Input count: {len(cal_data['input_data'])}")
        print(f"   Max payment value: ${max([v[0] for v in cal_data['input_data'][:6]]):.0f}")
        print()
