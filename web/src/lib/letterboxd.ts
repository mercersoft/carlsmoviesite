import { LetterboxdReviewData } from '@/types/review'

/**
 * Constructs the Letterboxd RSS feed URL from a username
 */
export function getLetterboxdRSSUrl(username: string): string {
  return `https://letterboxd.com/${username}/rss/`
}

/**
 * Strips HTML tags from a string and decodes HTML entities
 */
function stripHtml(html: string): string {
  // Create a temporary element to parse HTML
  const temp = document.createElement('div')
  temp.innerHTML = html

  // Get text content (this automatically strips tags)
  let text = temp.textContent || temp.innerText || ''

  // Remove extra whitespace
  text = text.trim().replace(/\s+/g, ' ')

  return text
}

/**
 * Extracts text content from an XML element
 */
function getElementText(item: Element, tagName: string, namespaceURI?: string): string | null {
  let element: Element | null

  if (namespaceURI) {
    element = item.getElementsByTagNameNS(namespaceURI, tagName)[0]
  } else {
    element = item.getElementsByTagName(tagName)[0]
  }

  return element?.textContent?.trim() || null
}

/**
 * Parses a Letterboxd RSS feed and extracts review data
 */
export async function parseLetterboxdRSS(username: string): Promise<LetterboxdReviewData[]> {
  const rssUrl = getLetterboxdRSSUrl(username)

  // Use CORS proxy to bypass CORS restrictions
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`

  try {
    // Fetch the RSS feed through CORS proxy
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`)
    }

    const xmlText = await response.text()

    // Parse XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

    // Check for parse errors
    const parserError = xmlDoc.querySelector('parsererror')
    if (parserError) {
      throw new Error('Failed to parse XML: ' + parserError.textContent)
    }

    // Get all review items
    const items = xmlDoc.querySelectorAll('item')
    const reviews: LetterboxdReviewData[] = []

    // Namespaces used in Letterboxd RSS
    const letterboxdNS = 'https://letterboxd.com'
    const tmdbNS = 'https://themoviedb.org'

    for (const item of Array.from(items)) {
      // Extract TMDB ID - this is critical for matching
      const tmdbIdText = getElementText(item, 'movieId', tmdbNS)
      if (!tmdbIdText) {
        console.warn('Skipping review without TMDB ID')
        continue
      }

      const tmdbId = parseInt(tmdbIdText, 10)
      if (isNaN(tmdbId)) {
        console.warn('Skipping review with invalid TMDB ID:', tmdbIdText)
        continue
      }

      // Extract rating (0.5 to 5.0 scale)
      const ratingText = getElementText(item, 'memberRating', letterboxdNS)
      let rating = 0
      if (ratingText) {
        const letterboxdRating = parseFloat(ratingText)
        if (!isNaN(letterboxdRating)) {
          // Convert 0.5-5.0 scale to 1-10 scale
          rating = letterboxdRating * 2
        }
      }

      // Extract review text from description (contains HTML)
      const descriptionHTML = getElementText(item, 'description')
      const reviewText = descriptionHTML ? stripHtml(descriptionHTML) : ''

      // Extract metadata
      const filmTitle = getElementText(item, 'filmTitle', letterboxdNS) || 'Unknown'
      const filmYear = getElementText(item, 'filmYear', letterboxdNS) || ''
      const watchedDate = getElementText(item, 'watchedDate', letterboxdNS)
      const rewatchText = getElementText(item, 'rewatch', letterboxdNS)
      const isRewatch = rewatchText?.toLowerCase() === 'yes'
      const letterboxdUrl = getElementText(item, 'link') || ''
      const letterboxdReviewId = getElementText(item, 'guid') || ''
      const publishedDate = getElementText(item, 'pubDate') || ''

      reviews.push({
        tmdbId,
        filmTitle,
        filmYear,
        rating,
        reviewText,
        watchedDate,
        isRewatch,
        letterboxdUrl,
        letterboxdReviewId,
        publishedDate
      })
    }

    return reviews
  } catch (error) {
    console.error('Error parsing Letterboxd RSS:', error)
    throw error
  }
}
