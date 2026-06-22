import asyncio
import time
import httpx
from pydantic import BaseModel

async def main():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        # Get token
        r = await client.post("/api/v1/auth/login", data={"username": "test@example.com", "password": "password"})
        if r.status_code != 200:
            print("Login failed, creating user")
            r = await client.post("/api/v1/auth/register", json={"email": "test@example.com", "password": "password", "full_name": "Test User"})
            r = await client.post("/api/v1/auth/login", data={"username": "test@example.com", "password": "password"})
            
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print("Testing POST /api/v1/analyze...")
        start = time.perf_counter()
        # Mock payload
        payload = {"idea_text": "A new startup idea that is definitely long enough to pass validation."}
        r = await client.post("/api/v1/analyze", json=payload, headers=headers)
        duration = time.perf_counter() - start
        
        print(f"Status Code: {r.status_code}")
        print(f"Latency: {duration:.4f} seconds")
        print(f"Response: {r.json()}")

        if r.status_code == 202:
            report_id = r.json()["report_id"]
            for _ in range(10):
                r_stat = await client.get(f"/api/v1/reports/{report_id}/status", headers=headers)
                print(f"Poll Status: {r_stat.json()['status']}")
                await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(main())
