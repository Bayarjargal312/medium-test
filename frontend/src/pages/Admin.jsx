import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Admin() {
  const [pending, setPending] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const navigate = useNavigate()
  const role = typeof window !== 'undefined' ? (localStorage.getItem('role') || 'USER') : 'USER'

  useEffect(() => {
    if (role !== 'ADMIN') {
      navigate('/')
      return
    }
    fetch('/api/posts/pending').then(r=>r.json()).then(setPending).catch(()=>{})
  }, [])

  async function act(id, action) {
    await fetch(`/api/posts/${id}/${action}`, { method: 'POST' })
    setPending(prev => prev.filter(p => p.id !== id))
    setSelectedPost(null) // Close the selected post view
  }

  function signOut(e) {
    e?.preventDefault()
    try {
      localStorage.removeItem('signed_in')
      localStorage.removeItem('user_name')
      localStorage.removeItem('role')
      localStorage.removeItem('user_id')
    } catch {}
    navigate('/')
  }

  function viewPost(post) {
    setSelectedPost(selectedPost?.id === post.id ? null : post)
  }

  return (
    <div>
      <div className="nav">
        <div className="nav-inner">
          <button className="menu-btn" aria-label="Toggle menu" style={{ visibility: 'hidden' }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"></path></svg>
          </button>
          <Link to="/" className="brand">Medium</Link>
          <div className="nav-search" />
          <div className="nav-links">
            <Link to="/">Home</Link>
            <a href="#" onClick={signOut}>Sign out</a>
          </div>
        </div>
      </div>

      <section className="feed" style={{ paddingTop: 24 }}>
        <div className="card" style={{ maxWidth: 980, margin: '0 auto' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Pending Posts</span>
            <span className="muted">{pending.length} {pending.length === 1 ? 'item' : 'items'}</span>
          </div>
          <ul className="list">
            {pending.map(p => (
              <li key={p.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                <div 
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} 
                  onClick={() => viewPost(p)}
                >
                  <div style={{ fontWeight: 700, fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title}
                    <span className="muted" style={{ fontSize: 14, marginLeft: 8 }}>
                      {selectedPost?.id === p.id ? '▼' : '▶'}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 14 }}>By {p.author} · {new Date(p.createdAtEpochMs || p.createdAtIso || p.createdAt).toLocaleString()}</div>
                  
                  {/* Expanded post details */}
                  {selectedPost?.id === p.id && (
                    <div style={{ marginTop: 16, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>Author:</strong> {p.author}
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>Submitted:</strong> {new Date(p.createdAtEpochMs || p.createdAtIso || p.createdAt).toLocaleString()}
                      </div>
                      {p.subtitle && (
                        <div style={{ marginBottom: 12 }}>
                          <strong>Subtitle:</strong> {p.subtitle}
                        </div>
                      )}
                      {p.imageUrl && (
                        <div style={{ marginBottom: 12 }}>
                          <strong>Cover Image:</strong>
                          <img 
                            src={p.imageUrl} 
                            alt="Cover" 
                            style={{ 
                              width: '100%', 
                              maxWidth: 300, 
                              height: 'auto', 
                              borderRadius: 8, 
                              marginTop: 8,
                              border: '1px solid #dee2e6'
                            }} 
                          />
                        </div>
                      )}
                      <div style={{ marginBottom: 12 }}>
                        <strong>Content:</strong>
                        <div 
                          style={{ 
                            marginTop: 8, 
                            padding: 12, 
                            background: 'white', 
                            borderRadius: 6, 
                            border: '1px solid #dee2e6',
                            maxHeight: '300px',
                            overflow: 'auto',
                            lineHeight: 1.6
                          }}
                          dangerouslySetInnerHTML={{ __html: p.content }}
                        />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>Word Count:</strong> {(p.content || '').split(/\s+/).length} words
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>Reading Time:</strong> {Math.max(1, Math.round((p.content || '').split(/\s+/).length / 200))} min read
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-dark" onClick={() => act(p.id, 'approve')}>Approve</button>
                  <button className="btn" onClick={() => act(p.id, 'decline')}>Decline</button>
                </div>
              </li>
            ))}
            {pending.length === 0 && (
              <li className="muted" style={{ padding: 8 }}>No pending posts</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  )
}


