// Debug script - run in browser console to find auth tokens
console.log('=== AUTH TOKEN FINDER ===');

// Check localStorage
console.log('\n📦 localStorage:');
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
    console.log(`  ${key}:`, localStorage.getItem(key));
  }
});

// Check sessionStorage
console.log('\n📦 sessionStorage:');
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
    console.log(`  ${key}:`, sessionStorage.getItem(key));
  }
});

// Check cookies
console.log('\n🍪 Cookies:');
document.cookie.split(';').forEach(cookie => {
  if (cookie.includes('supabase') || cookie.includes('auth') || cookie.includes('token')) {
    console.log(`  ${cookie.trim()}`);
  }
});

// Check current admin auth store
try {
  const adminAuth = JSON.parse(localStorage.getItem('admin-auth-storage') || '{}');
  console.log('\n🔐 Admin Auth Store:', adminAuth);
} catch (e) {
  console.log('\n🔐 Admin Auth Store: Not found or invalid');
}

console.log('\n=== END ===');