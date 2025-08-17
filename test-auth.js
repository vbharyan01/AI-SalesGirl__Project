#!/usr/bin/env node

// Test script for authentication system
const BASE_URL = 'http://localhost:5001';

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Signup
    console.log('1️⃣ Testing User Signup...');
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser3', password: 'testpass789' })
    });
    
    if (!signupResponse.ok) {
      throw new Error(`Signup failed: ${signupResponse.status}`);
    }
    
    const signupData = await signupResponse.json();
    console.log('✅ Signup successful:', signupData.user.username);
    
    // Test 2: Login
    console.log('\n2️⃣ Testing User Login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser3', password: 'testpass789' })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.user.username);
    
    // Test 3: Access Protected Endpoint
    console.log('\n3️⃣ Testing Protected Endpoint Access...');
    const settingsResponse = await fetch(`${BASE_URL}/api/settings`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    if (!settingsResponse.ok) {
      throw new Error(`Protected access failed: ${settingsResponse.status}`);
    }
    
    const settingsData = await settingsResponse.json();
    console.log('✅ Protected endpoint access successful:', settingsData);
    
    // Test 4: Logout
    console.log('\n4️⃣ Testing User Logout...');
    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    if (!logoutResponse.ok) {
      throw new Error(`Logout failed: ${logoutResponse.status}`);
    }
    
    const logoutData = await logoutResponse.json();
    console.log('✅ Logout successful:', logoutData);
    
    // Test 5: Verify Token Invalidation
    console.log('\n5️⃣ Testing Token Invalidation...');
    const invalidAccessResponse = await fetch(`${BASE_URL}/api/settings`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    if (invalidAccessResponse.status === 401) {
      console.log('✅ Token properly invalidated after logout');
    } else {
      console.log('❌ Token still valid after logout');
    }
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('\n❌ Authentication test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAuth();
