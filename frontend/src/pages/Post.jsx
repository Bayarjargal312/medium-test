import { Link, useNavigate, useParams } from 'react-router-dom'
import { deletePostBySlug, getPostBySlug } from '../lib/posts'
import { useState, useEffect, useMemo } from 'react'

export default function Post() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [remotePost, setRemotePost] = useState(null)
  const [loading, setLoading] = useState(true)
  const fallbackPost = getPostBySlug(slug)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const signedIn = typeof window !== 'undefined' && localStorage.getItem('signed_in') === '1'
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [replyText, setReplyText] = useState({})
  const [replyOpenId, setReplyOpenId] = useState(null)

  async function loadComments() {
    try {
      const res = await fetch(`/api/comments/${slug}`)
      const data = await res.json()
      setComments(Array.isArray(data) ? data : [])
    } catch (e) { /* ignore for now */ }
  }

  useEffect(() => { loadComments() }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/posts/slug/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setRemotePost(data)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [slug])

  async function submitComment(e, parentId, isAnonymous = false) {
    e?.preventDefault()
    const content = parentId ? replyText[parentId] : commentText
    if (!content || !content.trim()) return
    const authorName = isAnonymous ? 'Anonymous' : (typeof window !== 'undefined' && (localStorage.getItem('user_name') || localStorage.getItem('username') || localStorage.getItem('email'))) || 'Anonymous'
    await fetch('/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postSlug: slug, parentId: parentId || null, author: authorName, content })
    })
    if (parentId) {
      setReplyText((prev) => ({ ...prev, [parentId]: '' }))
      setReplyOpenId(null)
    } else {
      setCommentText('')
    }
    loadComments()
    // Update comment count
    if (remotePost) {
      setRemotePost(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }))
    }
  }

  const childrenByParent = useMemo(() => {
    const map = {}
    for (const c of comments) {
      const key = c.parentId || 'root'
      if (!map[key]) map[key] = []
      map[key].push(c)
    }
    return map
  }, [comments])

  function renderComments(parentId, depth = 0) {
    const items = childrenByParent[parentId || 'root'] || []
    if (items.length === 0) return null
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((c) => (
          <div key={c.id} style={{ borderTop: depth === 0 ? '1px solid #eee' : 'none', paddingTop: depth === 0 ? 12 : 0, marginLeft: depth > 0 ? 16 : 0, paddingLeft: depth > 0 ? 12 : 0, borderLeft: depth > 0 ? '2px solid #f0f0f0' : 'none' }}>
            <div style={{ fontWeight: 700 }}>{c.author}</div>
            <div className="muted" style={{ fontSize: 14 }}>{new Date(c.createdAtEpochMs).toLocaleString()}</div>
            <div style={{ marginTop: 6 }}>{c.content}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setReplyOpenId(replyOpenId === c.id ? null : c.id)}>Reply</button>
              <button className="btn" onClick={() => setReplyOpenId(replyOpenId === c.id ? null : c.id)}>Reply Anonymously</button>
            </div>
            {replyOpenId === c.id && (
              <form onSubmit={(e) => submitComment(e, c.id, false)} style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                <textarea placeholder="Reply" value={replyText[c.id] || ''} onChange={(e) => setReplyText((prev) => ({ ...prev, [c.id]: e.target.value }))} style={{ padding: 10, border: '1px solid #eee', borderRadius: 6 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-dark" type="submit">Send</button>
                  <button className="btn" type="button" onClick={(e) => submitComment(e, c.id, true)}>Send Anonymously</button>
                </div>
              </form>
            )}
            {renderComments(c.id, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  const post = remotePost || fallbackPost

  if (loading && !post) {
    return (
      <div className="container"><p>Loading...</p></div>
    )
  }

  if (!post) {
    return (
      <div className="container">
        <p>Post not found.</p>
        <Link to="/">Go home</Link>
      </div>
    )
  }

  const remove = () => {
    deletePostBySlug(slug)
    navigate('/')
  }

  return (
    <>
      <div className="nav">
        <div className="nav-inner">
          <button className="menu-btn" aria-label="Toggle menu" onClick={() => setSidebarVisible(v => !v)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"></path></svg>
          </button>
          <Link to="/" className="brand">Medium</Link>
          <div className="nav-search"><input className="search-input" placeholder="Search" /></div>
          <div className="nav-links">
            <a href="#">Our story</a>
            <a href="#">Membership</a>
            <Link to="/new">Write</Link>
            {signedIn ? <Link to="/">Home</Link> : <Link to="/">Sign in</Link>}
          </div>
        </div>
      </div>

      <div className={`dashboard ${sidebarVisible ? '' : 'sidebar-collapsed'}`}>
        <aside className="sidebar-left">
          <ul className="side-list">
            <li>
              <Link to="/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z"></path></svg><span>Home</span></Link>
            </li>
            <li>
              <a href="#"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a1 1 0 0 1 1 1v14l-4-3-4 3-4-3-4 3V5a1 1 0 0 1 1-1z"></path></svg><span>Library</span></a>
            </li>
            <li>
              <a href="#"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.418 0-8 2.239-8 5v3h16v-3c0-2.761-3.582-5-8-5z"></path></svg><span>Profile</span></a>
            </li>
            <li>
              <a href="#"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v2H4zm0 6h16v2H4zm0 6h10v2H4z"></path></svg><span>Stories</span></a>
            </li>
            <li>
              <a href="#"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h3v7H4zM10 9h3v11h-3zM16 5h3v15h-3z"/></svg><span>Stats</span></a>
            </li>
          </ul>
        </aside>

        <main className="dashboard-feed">
          <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 0 80px' }}>
            <div style={{ marginTop: 24 }}>
              <div className="muted" style={{ marginBottom: 10 }}>In {post.collection || 'General'} · {post.author}</div>
              <h1 style={{ fontSize: 44, lineHeight: 1.2, margin: '12px 0 6px', letterSpacing: '-0.02em' }}>{post.title}</h1>
              {post.subtitle && <div className="muted" style={{ fontSize: 18 }}>{post.subtitle}</div>}
              <div className="muted" style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{new Date(post.createdAt || post.createdAtIso || post.createdAtEpochMs).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>·</span>
                <span>{Math.max(3, Math.round((post.body || post.content || '').split(/\s+/).length / 220))} min read</span>
              </div>
            </div>

            {post.imageUrl && (
              <figure style={{ margin: '26px 0 6px' }}>
                <img src={post.imageUrl} alt="" style={{ width: '100%', borderRadius: 12 }} />
                <figcaption className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 8 }}>Image Created by Author</figcaption>
              </figure>
            )}

            {remotePost ? (
              <article style={{ marginTop: 24, lineHeight: 1.8, textAlign: 'left', fontSize: 20 }} dangerouslySetInnerHTML={{ __html: remotePost.content }} />
            ) : (
              <article style={{ marginTop: 24, lineHeight: 1.8, textAlign: 'left', whiteSpace: 'pre-wrap', fontSize: 20 }}>
                {post.body || post.content}
              </article>
            )}

            <div style={{ marginTop: 32, display: 'flex', gap: 14, alignItems: 'center', color: '#6B6B6B' }}>
              <button onClick={async () => {
                try {
                  const res = await fetch(`/api/posts/${remotePost.id}/like`, { method: 'POST' })
                  if (res.ok) {
                    setRemotePost(prev => ({ ...prev, likeCount: (prev.likeCount || 0) + 1 }))
                  }
                } catch {}
              }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                👍 {remotePost ? (remotePost.likeCount || 0) : (post.claps || 0)}
              </button>
              <span>·</span>
              <span>💬 {remotePost ? (remotePost.commentCount || 0) : (post.responses || 0)}</span>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Link to="/">Home</Link>
              <Link to="/new">Write</Link>
              <button onClick={remove} className="danger">Delete</button>
            </div>

            {/* Comments */}
            <section style={{ marginTop: 40 }}>
              <h3>Comments</h3>
              <form onSubmit={(e)=>submitComment(e)} style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
                <textarea placeholder="Write a comment" value={commentText} onChange={(e)=>setCommentText(e.target.value)} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-dark" type="submit">Post comment</button>
                  <button className="btn" type="button" onClick={(e)=>submitComment(e, null, true)}>Post anonymously</button>
                </div>
              </form>
              {renderComments(null, 0) || <div className="muted">No comments yet</div>}
            </section>
          </div>
        </main>

        <aside className="sidebar-right"></aside>
      </div>
    </>
  )
}


