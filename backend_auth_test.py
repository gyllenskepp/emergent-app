#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Test configuration
BASE_URL = "https://borka-mobile-dev.preview.emergentagent.com"
ADMIN_EMAIL = "admin@borka.se"
ADMIN_PASSWORD = "borka2024"
WRONG_PASSWORD = "wrongpassword"

def print_test_result(test_name, success, details=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   {details}")
    print()

def test_email_password_login():
    """Test 1: POST /api/auth/login - Email/password login with correct credentials"""
    print("=" * 60)
    print("TEST 1: Email/Password Login (Correct Credentials)")
    print("=" * 60)
    
    url = f"{BASE_URL}/api/auth/login"
    payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        print(f"URL: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Body: {json.dumps(data, indent=2, default=str)}")
            
            # Verify required fields
            required_fields = ["user", "session_token"]
            user_required_fields = ["email", "role"]
            
            success = True
            details = []
            
            for field in required_fields:
                if field not in data:
                    success = False
                    details.append(f"Missing field: {field}")
            
            if "user" in data:
                user_data = data["user"]
                for field in user_required_fields:
                    if field not in user_data:
                        success = False
                        details.append(f"Missing user field: {field}")
                
                # Verify admin role
                if user_data.get("role") != "admin":
                    success = False
                    details.append(f"Expected role 'admin', got '{user_data.get('role')}'")
                
                # Verify email
                if user_data.get("email") != ADMIN_EMAIL:
                    success = False
                    details.append(f"Expected email '{ADMIN_EMAIL}', got '{user_data.get('email')}'")
            
            if success:
                details.append(f"Successfully logged in as {user_data.get('email')} with role {user_data.get('role')}")
                session_token = data.get("session_token")
                details.append(f"Session token: {session_token[:20]}...")
                print_test_result("Email/Password Login", True, "; ".join(details))
                return session_token
            else:
                print_test_result("Email/Password Login", False, "; ".join(details))
                return None
        else:
            print(f"Response Body: {response.text}")
            print_test_result("Email/Password Login", False, f"Expected 200, got {response.status_code}")
            return None
            
    except Exception as e:
        print_test_result("Email/Password Login", False, f"Request failed: {str(e)}")
        return None

def test_verify_session_token(session_token):
    """Test 2: GET /api/auth/me - Verify session token works"""
    print("=" * 60)
    print("TEST 2: Verify Session Token")
    print("=" * 60)
    
    if not session_token:
        print_test_result("Session Token Verification", False, "No session token from previous test")
        return False
    
    url = f"{BASE_URL}/api/auth/me"
    headers = {
        "Authorization": f"Bearer {session_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"URL: {url}")
        print(f"Headers: {headers}")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Body: {json.dumps(data, indent=2, default=str)}")
            
            # Verify user data
            required_fields = ["email", "role", "user_id"]
            success = True
            details = []
            
            for field in required_fields:
                if field not in data:
                    success = False
                    details.append(f"Missing field: {field}")
            
            if data.get("email") != ADMIN_EMAIL:
                success = False
                details.append(f"Expected email '{ADMIN_EMAIL}', got '{data.get('email')}'")
            
            if data.get("role") != "admin":
                success = False
                details.append(f"Expected role 'admin', got '{data.get('role')}'")
            
            if success:
                details.append(f"Session token valid for user {data.get('email')}")
            
            print_test_result("Session Token Verification", success, "; ".join(details))
            return success
        else:
            print(f"Response Body: {response.text}")
            print_test_result("Session Token Verification", False, f"Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print_test_result("Session Token Verification", False, f"Request failed: {str(e)}")
        return False

def test_wrong_password_login():
    """Test 3: POST /api/auth/login - Test wrong password"""
    print("=" * 60)
    print("TEST 3: Wrong Password Login")
    print("=" * 60)
    
    url = f"{BASE_URL}/api/auth/login"
    payload = {
        "email": ADMIN_EMAIL,
        "password": WRONG_PASSWORD
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        print(f"URL: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 401:
            data = response.json()
            print(f"Response Body: {json.dumps(data, indent=2, default=str)}")
            
            # Verify error message exists
            success = "detail" in data
            details = []
            
            if success:
                details.append(f"Correctly returned 401 with error: {data.get('detail')}")
            else:
                details.append("Expected 'detail' field in error response")
            
            print_test_result("Wrong Password Login", success, "; ".join(details))
            return success
        else:
            print(f"Response Body: {response.text}")
            print_test_result("Wrong Password Login", False, f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print_test_result("Wrong Password Login", False, f"Request failed: {str(e)}")
        return False

def main():
    """Run all authentication tests"""
    print("BORKA Backend Authentication API Testing")
    print(f"Testing against: {BASE_URL}")
    print(f"Test time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n")
    
    # Test results
    results = []
    
    # Test 1: Correct login
    session_token = test_email_password_login()
    results.append(("Email/Password Login (Correct)", session_token is not None))
    
    # Test 2: Verify session token
    if session_token:
        session_valid = test_verify_session_token(session_token)
        results.append(("Session Token Verification", session_valid))
    else:
        results.append(("Session Token Verification", False))
    
    # Test 3: Wrong password
    wrong_password_handled = test_wrong_password_login()
    results.append(("Wrong Password Handling", wrong_password_handled))
    
    # Summary
    print("=" * 60)
    print("AUTHENTICATION TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL AUTHENTICATION TESTS PASSED!")
        print("✅ Email/password login flow is working correctly")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        print("❌ Authentication flow has issues that need to be addressed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)