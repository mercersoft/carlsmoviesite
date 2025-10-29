import admin from 'firebase-admin';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function testConnection() {
  console.log('🧪 Testing your API connections...\n');
  
  // Test 1: TMDB API Key
  console.log('1️⃣  Testing TMDB API Key...');
  const tmdbKey = process.env.TMDB_API_KEY;
  
  if (!tmdbKey) {
    console.log('   ❌ ERROR: TMDB_API_KEY not found in .env file!');
    console.log('   → Make sure your .env file exists and contains:');
    console.log('   → TMDB_API_KEY=your_actual_key_here\n');
    return;
  }
  
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/550?api_key=${tmdbKey}`
    );
    console.log(`   ✅ TMDB API works! Test movie: "${response.data.title}"\n`);
  } catch (error: any) {
    console.log(`   ❌ TMDB API failed!`);
    console.log(`   → Error: ${error.response?.data?.status_message || error.message}`);
    console.log(`   → Check that your API key is correct\n`);
    return;
  }
  
  // Test 2: Firebase Admin SDK
  console.log('2️⃣  Testing Firebase Admin SDK...');
  
  try {
    // Initialize Firebase
    admin.initializeApp({
      credential: admin.credential.cert('./serviceAccountKey.json')
    });
    
    const db = admin.firestore();
    
    // Try to write and delete a test document
    await db.collection('_connection_test').doc('_test').set({ 
      timestamp: new Date().toISOString() 
    });
    await db.collection('_connection_test').doc('_test').delete();
    
    console.log('   ✅ Firebase connection works!\n');
  } catch (error: any) {
    console.log(`   ❌ Firebase connection failed!`);
    console.log(`   → Error: ${error.message}`);
    console.log(`   → Make sure serviceAccountKey.json exists in this folder\n`);
    return;
  }
  
  console.log('🎉 Success! Both API keys are working correctly!');
  console.log('📝 You can now run the seeding script.\n');
  
  process.exit(0);
}

testConnection().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
