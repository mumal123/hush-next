import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function getProductImage(productName) {
  console.log('Using key:', process.env.GOOGLE_SEARCH_KEY?.slice(0, 10))
console.log('Using cx:', process.env.GOOGLE_SEARCH_CX?.slice(0, 10))
  try {
    const query = encodeURIComponent(productName + ' beauty product')
    const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_KEY}&cx=${process.env.GOOGLE_SEARCH_CX}&q=${query}&searchType=image&num=1`
    
    console.log('Searching image for:', productName)
    console.log('GOOGLE_SEARCH_KEY exists:', !!process.env.GOOGLE_SEARCH_KEY)
    console.log('GOOGLE_SEARCH_CX exists:', !!process.env.GOOGLE_SEARCH_CX)
    
    const res = await fetch(url)
    const data = await res.json()
    
    console.log('Full image response:', JSON.stringify(data).slice(0, 400))
    
    return data.items?.[0]?.link ?? null
  } catch(e) {
    console.error('Image search failed:', e)
    return null
  }
}

export async function POST(request) {
  const { query } = await request.json()

  // Step 1 — text search in database first
  const { data: existing } = await supabase
    .from('dupes')
    .select('*')
    .or(`original.ilike.%${query}%,dupe.ilike.%${query}%`)

  if (existing && existing.length > 0) {
    console.log('Found in database:', existing.length, 'results')
    return Response.json({ results: existing, source: 'database' })
  }

  // Step 2 — not found, ask Gemini
  console.log('Calling Gemini for:', query)

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Find the best affordable dupe for "${query}". 
Return ONLY a valid JSON object, no markdown, no explanation, just JSON:
{
  "original": "exact product name",
  "dupe": "dupe product name",
  "brand": "dupe brand name",
  "category": "lipstick or perfume or skincare or concealer or eyeshadow or foundation or primer",
  "original_price": price in INR as integer,
  "dupe_price": price in INR as integer,
  "similarity": number between 70 and 99,
  "reason": "one sentence why this is a good dupe"
  
}
}
Focus on products available in India. Be specific with product names.`
          }]
        }]
      })
    }
  )

  const geminiData = await geminiRes.json()

  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    console.error('Gemini failed:', JSON.stringify(geminiData))
    return Response.json({ error: 'Could not find a dupe. Try a different search.' }, { status: 500 })
  }

  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()

  let dupe
  try {
    dupe = JSON.parse(clean)
  } catch(e) {
    console.error('JSON parse failed:', clean)
    return Response.json({ error: 'Could not parse result. Try again.' }, { status: 500 })
  }
const original_image = await getProductImage(dupe.original)
const dupe_image = await getProductImage(dupe.dupe)
  // Step 3 — save to Supabase
  const { data: saved, error: insertError } = await supabase
    .from('dupes')
    .insert([{
      original: dupe.original,
      dupe: dupe.dupe,
      category: dupe.category,
      original_price: dupe.original_price,
      dupe_price: dupe.dupe_price,
      similarity: dupe.similarity,
      upvotes: 0,
      downvotes: 0,
      ai_generated: true,
       original_image,
    dupe_image
    }])
    .select()

  console.log('Saved:', saved)
  if (insertError) console.error('Insert error:', insertError)

  if (!saved) {
    return Response.json({ error: 'Failed to save result' }, { status: 500 })
  }

  return Response.json({ results: saved, source: 'ai' })
}