'use client'
import { useRouter } from 'next/navigation'
import './globals.css'

export default function Home() {
  const router = useRouter()

  return (
    <div className="App">
      <h2 className="Name">HUSH</h2>
      <h4 className="sub">psst, I know a secret</h4>
      <button className="btn" onClick={() => router.push('/search')}>
        Find My Dupe
      </button>
    </div>
  )
}