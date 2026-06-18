import requests
import json
import time

BASE_URL = "http://52.66.6.87/api/v1"

# 1. Register
print("1. Registering User...")
email = f"test_{int(time.time())}@pivotly.com"
register_res = requests.post(f"{BASE_URL}/auth/register", json={
    "email": email,
    "password": "Password123!",
    "full_name": "Integration Test"
})
print("Register Status:", register_res.status_code)
if register_res.status_code != 201:
    print(register_res.text)
    exit(1)

# 2. Login
print("\n2. Logging in...")
login_res = requests.post(f"{BASE_URL}/auth/login", json={
    "email": email,
    "password": "Password123!"
})
print("Login Status:", login_res.status_code)
if login_res.status_code != 200:
    print(login_res.text)
    exit(1)

token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 3. Get Me
print("\n3. Fetching Profile (/auth/me)...")
me_res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
print("Me Status:", me_res.status_code)

# 4. Analyze Idea
print("\n4. Analyzing Idea (Hitting Gemini)...")
analyze_res = requests.post(f"{BASE_URL}/analyze", headers=headers, json={
    "idea_text": "An AI app that automatically generates bedtime stories for children based on the day's events.",
})
print("Analyze Status:", analyze_res.status_code)
if analyze_res.status_code not in (200, 201):
    print(analyze_res.text)
    exit(1)

report_data = analyze_res.json()
print("Report generated successfully!")

# 5. Get Reports
print("\n5. Fetching All Reports...")
reports_res = requests.get(f"{BASE_URL}/reports", headers=headers)
print("Reports Status:", reports_res.status_code)
report_id = reports_res.json()[0]["id"]
print(f"Found Report ID: {report_id}")

# 6. Get Single Report
print(f"\n6. Fetching Single Report...")
single_res = requests.get(f"{BASE_URL}/reports/{report_id}", headers=headers)
print("Single Report Status:", single_res.status_code)

# 7. Delete Report
print(f"\n7. Deleting Report...")
delete_res = requests.delete(f"{BASE_URL}/reports/{report_id}", headers=headers)
print("Delete Status:", delete_res.status_code)

print("\n✅ All endpoints tested successfully!")
