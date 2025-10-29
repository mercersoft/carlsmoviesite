import admin from 'firebase-admin';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json')
});

const db = admin.firestore();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  console.error('❌ TMDB_API_KEY not found in .env file!');
  process.exit(1);
}

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromTMDB(endpoint: string, params: any = {}) {
  const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
    params: { api_key: TMDB_API_KEY, ...params }
  });
  await delay(300); // ~3 requests per second to respect rate limits
  return response.data;
}

async function cacheMovie(tmdbId: number): Promise<boolean> {
  try {
    // Check if already cached
    const existingDoc = await db.collection('movies').doc(tmdbId.toString()).get();
    if (existingDoc.exists) {
      console.log(`   ↪ Movie ${tmdbId} already cached, skipping`);
      return false;
    }

    // Fetch movie details and credits
    const [movie, credits] = await Promise.all([
      fetchFromTMDB(`/movie/${tmdbId}`),
      fetchFromTMDB(`/movie/${tmdbId}/credits`)
    ]);

    // Prepare movie data
    const movieData = {
      tmdbId: movie.id,
      title: movie.title,
      releaseDate: movie.release_date,
      runtime: movie.runtime,
      genres: movie.genres.map((g: any) => g.name),
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      imdbId: movie.imdb_id,
      budget: movie.budget,
      revenue: movie.revenue,
      tagline: movie.tagline,
      popularity: movie.popularity,
      
      // Denormalized data
      director: credits.crew.find((c: any) => c.job === 'Director')?.name || null,
      cast: credits.cast.slice(0, 15).map((actor: any) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profilePath: actor.profile_path,
        order: actor.order
      })),
      
      cachedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    await db.collection('movies').doc(tmdbId.toString()).set(movieData);
    console.log(`   ✓ Cached: ${movie.title} (${movie.release_date?.split('-')[0] || 'N/A'})`);
    return true;
    
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`   ✗ Movie ${tmdbId} not found (404)`);
    } else {
      console.error(`   ✗ Error caching movie ${tmdbId}:`, error.message);
    }
    return false;
  }
}

async function seedFromEndpoint(
  name: string, 
  endpoint: string, 
  params: any = {}, 
  maxPages: number = 5
): Promise<number> {
  console.log(`\n📊 Seeding ${name}...`);
  let cachedCount = 0;
  
  for (let page = 1; page <= maxPages; page++) {
    try {
      const data = await fetchFromTMDB(endpoint, { ...params, page });
      
      if (!data.results || data.results.length === 0) {
        console.log(`   No results on page ${page}`);
        break;
      }
      
      console.log(`   Page ${page}/${maxPages}: Processing ${data.results.length} movies...`);
      
      for (const movie of data.results) {
        const wasCached = await cacheMovie(movie.id);
        if (wasCached) cachedCount++;
      }
      
      if (page >= data.total_pages) break;
      
    } catch (error: any) {
      console.error(`   Error on page ${page}:`, error.message);
      break;
    }
  }
  
  console.log(`   ✅ Completed! Cached ${cachedCount} new movies`);
  return cachedCount;
}

async function main() {
  console.log('🚀 Starting database seeding...\n');
  console.log('=' .repeat(60));
  const startTime = Date.now();
  let totalCached = 0;
  
  try {
    // Seed different categories
    totalCached += await seedFromEndpoint('Trending Movies', '/trending/movie/week', {}, 2);
    totalCached += await seedFromEndpoint('Now Playing', '/movie/now_playing', { region: 'US' }, 2);
    totalCached += await seedFromEndpoint('Upcoming', '/movie/upcoming', { region: 'US' }, 2);
    totalCached += await seedFromEndpoint('Popular', '/movie/popular', {}, 5);
    totalCached += await seedFromEndpoint('Top Rated', '/movie/top_rated', {}, 3);
    
    // Calculate stats
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Total movies cached: ${totalCached}`);
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log(`🚀 Average: ${(totalCached / parseFloat(duration)).toFixed(1)} movies/min`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();