  
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import '../globals.css'

const getFilteredItems = (query, category, items) => {
  return items.filter((item) => {
    const matchesSearch =
      query === '' ||
      item.original.toLowerCase().includes(query.toLowerCase()) ||
      item.dupe.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'all' || item.category === category
    return matchesSearch && matchesCategory
  })
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [dupes, setDupes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [aiResult, setAiResult] = useState(null)

  useEffect(() => {
    async function fetchDupes() {
      const { data, error } = await supabase.from('dupes').select('*')
      if (error) console.error(error)
      else setDupes(data)
      setLoading(false)
    }
    fetchDupes()
  }, [])

  async function handleAiSearch(e) {
    if (e.key !== 'Enter' || !query.trim()) return
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)

    try {
      const res = await fetch('/api/findDupe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const { results, source, error } = await res.json()

      if (error) {
        setAiError('Could not find a dupe. Try a different search.')
        return
      }

      if (source === 'ai' && results && Array.isArray(results)) {
        setDupes(prev => [...prev, results[0]])
        setAiResult(results[0])
      }

      if (source === 'database') {
        setQuery(query)
      }

    } catch (err) {
      setAiError('Something went wrong. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleUpvote(id) {
    setDupes(prev => prev.map(item =>
      item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item
    ))
    await supabase
      .from('dupes')
      .update({ upvotes: dupes.find(i => i.id === id).upvotes + 1 })
      .eq('id', id)
  }

  async function handleDownvote(id) {
    setDupes(prev => prev.map(item =>
      item.id === id ? { ...item, downvotes: item.downvotes + 1 } : item
    ))
    await supabase
      .from('dupes')
      .update({ downvotes: dupes.find(i => i.id === id).downvotes + 1 })
      .eq('id', id)
  }

  const filteredItems = getFilteredItems(query, selectedCategory, dupes)

  return (
    <div className="screens">
      <div className="search">
        <input
          type="text"
          placeholder="Search or press Enter to find with AI..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setAiResult(null)
          }}
          onKeyDown={handleAiSearch}
        />
      </div>

      {aiLoading && (
        <p style={{ color: '#f4a7bb', textAlign: 'center', marginTop: '12px' }}>
          ✨ asking AI to find your dupe...
        </p>
      )}

      {aiError && (
        <p style={{ color: '#e8517a', textAlign: 'center', marginTop: '12px' }}>
          {aiError}
        </p>
      )}

      {aiResult && (
        <div style={{ padding: '0 20px', maxWidth: '380px', margin: '0 auto 20px' }}>
          <p style={{ color: '#f4a7bb', fontSize: '13px', textAlign: 'center', marginBottom: '10px' }}>
            ✨ AI found this dupe for you
          </p>
          <div className="cards" style={{ border: '1px solid #e8517a' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                {aiResult.original_image ? (
                  <img
                    src={aiResult.original_image}
                    alt={aiResult.original}
                    style={{ width: '100%', height: '140px', objectFit: 'contain',
                             borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '140px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(232,81,122,0.3), rgba(90,20,40,0.5))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: '#f4a7bb', padding: '8px', textAlign: 'center'
                  }}>{aiResult.original}</div>
                )}
                <p style={{ fontSize: '10px', color: '#f4a7bb', marginTop: '4px' }}>Original</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                {aiResult.dupe_image ? (
                  <img
                    src={aiResult.dupe_image}
                    alt={aiResult.dupe}
                    style={{ width: '100%', height: '140px', objectFit: 'contain',
                             borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '140px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(100,200,100,0.2), rgba(20,60,30,0.5))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: '#90d490', padding: '8px', textAlign: 'center'
                  }}>{aiResult.dupe}</div>
                )}
                <p style={{ fontSize: '10px', color: '#90d490', marginTop: '4px' }}>Dupe</p>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <span style={{
                background: 'rgba(232,81,122,0.2)', border: '1px solid #e8517a',
                color: '#f4a7bb', borderRadius: '100px', padding: '2px 10px', fontSize: '11px'
              }}>✨ AI Found</span>
            </div>
            <p><strong>Original:</strong> {aiResult.original}</p>
            <p><strong>Original Price:</strong> ₹{aiResult.original_price}</p>
            <p><strong>Dupe:</strong> {aiResult.dupe}</p>
            <p><strong>Dupe Price:</strong> ₹{aiResult.dupe_price}</p>
            <div style={{
              display: 'inline-block', background: '#e8517a', color: 'white',
              borderRadius: '100px', padding: '3px 12px', fontSize: '12px', margin: '6px 0'
            }}>
              {aiResult.similarity}% match
            </div>
            <div className="votes">
              <button onClick={() => handleUpvote(aiResult.id)}>👍 {aiResult.upvotes}</button>
              <button onClick={() => handleDownvote(aiResult.id)}>👎 {aiResult.downvotes}</button>
            </div>
          </div>
        </div>
      )}

      <div className="categories">
        {['all', 'lipstick', 'perfume', 'concealer',
          'eyeshadow', 'foundation', 'skincare', 'primer'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#f4a7bb', textAlign: 'center' }}>Finding dupes...</p>
      ) : (
        <div className="results">
          {filteredItems.map((item) => (
            <div className="cards" key={item.id}>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  {item.original_image ? (
                    <img
                      src={item.original_image}
                      alt={item.original}
                      style={{ width: '100%', height: '140px', objectFit: 'contain',
                               borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '140px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(232,81,122,0.3), rgba(90,20,40,0.5))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', color: '#f4a7bb', padding: '8px', textAlign: 'center'
                    }}>{item.original}</div>
                  )}
                  <p style={{ fontSize: '10px', color: '#f4a7bb', marginTop: '4px' }}>Original</p>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  {item.dupe_image ? (
                    <img
                      src={item.dupe_image}
                      alt={item.dupe}
                      style={{ width: '100%', height: '140px', objectFit: 'contain',
                               borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '140px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(100,200,100,0.2), rgba(20,60,30,0.5))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', color: '#90d490', padding: '8px', textAlign: 'center'
                    }}>{item.dupe}</div>
                  )}
                  <p style={{ fontSize: '10px', color: '#90d490', marginTop: '4px' }}>Dupe</p>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                {item.ai_generated
                  ? <span style={{
                      background: 'rgba(232,81,122,0.2)', border: '1px solid #e8517a',
                      color: '#f4a7bb', borderRadius: '100px', padding: '2px 10px', fontSize: '11px'
                    }}>✨ AI Found</span>
                  : <span style={{
                      background: 'rgba(100,200,100,0.1)', border: '1px solid rgba(100,200,100,0.4)',
                      color: '#90d490', borderRadius: '100px', padding: '2px 10px', fontSize: '11px'
                    }}>✅ Community Verified</span>
                }
              </div>

              <p><strong>Original:</strong> {item.original}</p>
              <p><strong>Original Price:</strong> ₹{item.original_price}</p>
              <p><strong>Dupe:</strong> {item.dupe}</p>
              <p><strong>Dupe Price:</strong> ₹{item.dupe_price}</p>

              <div style={{
                display: 'inline-block', background: '#e8517a', color: 'white',
                borderRadius: '100px', padding: '3px 12px', fontSize: '12px', margin: '6px 0'
              }}>
                {item.similarity}% match
              </div>

              <div className="votes">
                <button onClick={() => handleUpvote(item.id)}>👍 {item.upvotes}</button>
                <button onClick={() => handleDownvote(item.id)}>👎 {item.downvotes}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}