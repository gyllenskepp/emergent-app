#!/usr/bin/env python3
"""
BORKA Backend API Tests
Tests all backend API endpoints using the production URL
"""

import requests
import json
from datetime import datetime, timezone
import sys

# Backend URL from frontend environment
BASE_URL = "https://borka-mobil.preview.emergentagent.com/api"
ADMIN_TOKEN = "admin_test_session_token"

def test_get_events():
    """Test GET /api/events - Should return list of events"""
    print("🧪 Testing GET /api/events...")
    try:
        response = requests.get(f"{BASE_URL}/events")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Events count: {len(data)}")
            if data:
                print(f"   First event: {data[0].get('title', 'No title')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   Exception: {e}")
        return False

def test_get_news():
    """Test GET /api/news - Should return list of news items"""
    print("🧪 Testing GET /api/news...")
    try:
        response = requests.get(f"{BASE_URL}/news")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   News count: {len(data)}")
            if data:
                print(f"   First news: {data[0].get('title', 'No title')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   Exception: {e}")
        return False

def test_get_categories():
    """Test GET /api/categories - Should return 4 categories"""
    print("🧪 Testing GET /api/categories...")
    try:
        response = requests.get(f"{BASE_URL}/categories")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Categories count: {len(data)}")
            if len(data) == 4:
                category_names = [cat.get('name', 'Unknown') for cat in data]
                print(f"   Categories: {', '.join(category_names)}")
                return True
            else:
                print(f"   Expected 4 categories, got {len(data)}")
                return False
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   Exception: {e}")
        return False

def test_calendar_ics():
    """Test GET /api/calendar/ics - Should return ICS calendar file"""
    print("🧪 Testing GET /api/calendar/ics...")
    try:
        response = requests.get(f"{BASE_URL}/calendar/ics")
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type', 'Not set')}")
        
        if response.status_code == 200:
            content = response.text
            if content.startswith("BEGIN:VCALENDAR") and "END:VCALENDAR" in content:
                print(f"   Valid ICS format (length: {len(content)} chars)")
                return True
            else:
                print(f"   Invalid ICS format: {content[:100]}...")
                return False
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   Exception: {e}")
        return False

def test_auth_me_no_token():
    """Test GET /api/auth/me without token - Should return 401"""
    print("🧪 Testing GET /api/auth/me (no token) - expecting 401...")
    try:
        response = requests.get(f"{BASE_URL}/auth/me")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Correctly returns 401 for unauthenticated request")
            return True
        else:
            print(f"   ❌ Expected 401, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"   Exception: {e}")
        return False

def test_auth_me_with_token():
    """Test GET /api/auth/me with Bearer token - Should return admin user"""
    print("🧪 Testing GET /api/auth/me (with admin token)...")
    try:
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   User email: {data.get('email', 'No email')}")
            print(f"   User role: {data.get('role', 'No role')}")
            if data.get('role') == 'admin':
                print("   ✅ Admin user authenticated successfully")
                return True
            else:
                print(f"   ❌ Expected admin role, got: {data.get('role')}")
                return False
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   Exception: {e}")
        return False

def test_create_event():
    """Test POST /api/events - Create a new event (admin only)"""
    print("🧪 Testing POST /api/events (admin only)...")
    try:
        headers = {
            "Authorization": f"Bearer {ADMIN_TOKEN}",
            "Content-Type": "application/json"
        }
        
        event_data = {
            "title": "Test Event from API",
            "description": "Detta är ett test-event skapat via API-test",
            "location": "Test Location",
            "start_time": "2025-01-20T18:00:00Z",
            "end_time": "2025-01-20T21:00:00Z",
            "category": "open_game_night"
        }
        
        response = requests.post(f"{BASE_URL}/events", headers=headers, json=event_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Created event ID: {data.get('id', 'No ID')}")
            print(f"   Event title: {data.get('title', 'No title')}")
            return True, data.get('id')
        else:
            print(f"   Error: {response.text}")
            return False, None
    except Exception as e:
        print(f"   Exception: {e}")
        return False, None

def test_create_news():
    """Test POST /api/news - Create a new news item (admin only)"""
    print("🧪 Testing POST /api/news (admin only)...")
    try:
        headers = {
            "Authorization": f"Bearer {ADMIN_TOKEN}",
            "Content-Type": "application/json"
        }
        
        news_data = {
            "title": "Test News från API",
            "body": "Detta är en test-nyhet skapad via API-test för att verifiera att backend fungerar korrekt."
        }
        
        response = requests.post(f"{BASE_URL}/news", headers=headers, json=news_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Created news ID: {data.get('id', 'No ID')}")
            print(f"   News title: {data.get('title', 'No title')}")
            return True, data.get('id')
        else:
            print(f"   Error: {response.text}")
            return False, None
    except Exception as e:
        print(f"   Exception: {e}")
        return False, None

def test_cleanup(event_id=None, news_id=None):
    """Clean up test data"""
    print("🧹 Cleaning up test data...")
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    
    if event_id:
        try:
            response = requests.delete(f"{BASE_URL}/events/{event_id}", headers=headers)
            print(f"   Delete event {event_id}: {response.status_code}")
        except:
            pass
    
    if news_id:
        try:
            response = requests.delete(f"{BASE_URL}/news/{news_id}", headers=headers)
            print(f"   Delete news {news_id}: {response.status_code}")
        except:
            pass

def main():
    print("=" * 60)
    print("🚀 BORKA Backend API Test Suite")
    print("=" * 60)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test time: {datetime.now(timezone.utc).isoformat()}")
    print()
    
    results = {}
    created_event_id = None
    created_news_id = None
    
    # Test public endpoints
    results['events'] = test_get_events()
    print()
    
    results['news'] = test_get_news()
    print()
    
    results['categories'] = test_get_categories()
    print()
    
    results['calendar_ics'] = test_calendar_ics()
    print()
    
    # Test auth endpoints
    results['auth_no_token'] = test_auth_me_no_token()
    print()
    
    results['auth_with_token'] = test_auth_me_with_token()
    print()
    
    # Test admin endpoints
    result, created_event_id = test_create_event()
    results['create_event'] = result
    print()
    
    result, created_news_id = test_create_news()
    results['create_news'] = result
    print()
    
    # Cleanup
    test_cleanup(created_event_id, created_news_id)
    print()
    
    # Summary
    print("=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"{test_name:20} {status}")
        if passed_test:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests PASSED!")
        return 0
    else:
        print("⚠️  Some tests FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())