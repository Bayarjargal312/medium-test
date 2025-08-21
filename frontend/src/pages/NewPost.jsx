import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createPost } from '../lib/posts'

export default function NewPost() {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const contentRef = useRef(null)
  const fileRef = useRef(null)
  const wrapperRef = useRef(null)
  const [toolbar, setToolbar] = useState({ visible: false, top: 0, left: 0 })
  const lastRangeRef = useRef(null)
  const navigate = useNavigate()
  useEffect(() => {
    const role = localStorage.getItem('role') || 'USER'
    if (role === 'ADMIN') {
      navigate('/admin')
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    const role = localStorage.getItem('role') || 'USER'
    if (role === 'ADMIN') { navigate('/admin'); return }
    if (!title.trim()) return
    const html = contentRef.current ? contentRef.current.innerHTML : content
    try {
      const res = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, subtitle, content: html, imageUrl, author: localStorage.getItem('user_name') || 'Anonymous', userId: localStorage.getItem('user_id') || null }) })
      if (res.ok) {
        const data = await res.json()
        alert('Submitted for review. An admin will approve it soon.')
        navigate(`/`)
        return
      }
    } catch (_) {}
    const post = createPost({ title, subtitle, content: html, imageUrl })
    navigate(`/p/${post.slug}`)
  }

  function triggerUpload() {
    fileRef.current?.click()
  }

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      // set as cover image (banner) without affecting the editor selection
      setImageUrl(String(dataUrl || ''))
    }
    reader.readAsDataURL(file)
    // reset for same file re-selection
    e.target.value = ''
  }

  function insertNodeAtCursor(node) {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      contentRef.current?.appendChild(node)
      return
    }
    const range = sel.getRangeAt(0)
    range.deleteContents()
    range.insertNode(node)
    // move caret after the node
    range.setStartAfter(node)
    range.setEndAfter(node)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  // Floating selection toolbar
  function isSelectionInsideEditor() {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return false
    let node = sel.anchorNode
    while (node) {
      if (node === contentRef.current) return true
      node = node.parentNode
    }
    return false
  }

  function updateToolbar() {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !isSelectionInsideEditor()) {
      if (toolbar.visible) setToolbar((t) => ({ ...t, visible: false }))
      return
    }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const hostRect = wrapperRef.current?.getBoundingClientRect() || { top: 0, left: 0 }
    const top = rect.top - hostRect.top - 46 // above selection
    const left = rect.left - hostRect.left + rect.width / 2
    // remember selection so clicking toolbar doesn't lose it
    try { lastRangeRef.current = range.cloneRange() } catch {}
    setToolbar({ visible: true, top, left })
  }

  useEffect(() => {
    const onSelection = () => updateToolbar()
    document.addEventListener('selectionchange', onSelection)
    document.addEventListener('mouseup', onSelection)
    document.addEventListener('keyup', onSelection)
    const onMouseDown = (e) => {
      if (contentRef.current && !contentRef.current.contains(e.target)) {
        setToolbar((t) => ({ ...t, visible: false }))
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('selectionchange', onSelection)
      document.removeEventListener('mouseup', onSelection)
      document.removeEventListener('keyup', onSelection)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [])

  function exec(cmd, value) {
    // restore selection and focus editor
    const sel = window.getSelection()
    if (lastRangeRef.current && sel) {
      sel.removeAllRanges()
      sel.addRange(lastRangeRef.current)
    }
    contentRef.current?.focus()
    if (cmd === 'createLink') {
      const url = value || prompt('Enter URL') || ''
      if (!url) { setToolbar((t)=>({ ...t, visible:false })); return }
      document.execCommand('createLink', false, url)
    } else if (cmd === 'formatBlock') {
      applyBlockTag(String(value || 'p').toLowerCase())
    } else {
      document.execCommand(cmd, false, value)
    }
    setToolbar((t) => ({ ...t, visible: false }))
  }

  function applyBlockTag(tagName) {
    try {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      const wrapper = document.createElement(tagName)
      try {
        range.surroundContents(wrapper)
      } catch (_) {
        const frag = range.extractContents()
        wrapper.appendChild(frag)
        range.insertNode(wrapper)
      }
      // move caret after inserted block
      range.setStartAfter(wrapper)
      range.setEndAfter(wrapper)
      sel.removeAllRanges()
      sel.addRange(range)
    } catch {}
  }

  return (
    <div>
      <div className="nav">
        <div className="nav-inner nav-inner-no-menu">
          <Link to="/" className="brand">Medium</Link>
          <div className="nav-links">
            <button className="btn btn-dark" onClick={submit}>Submit for review</button>
          </div>
        </div>
      </div>

      <div ref={wrapperRef} style={{ maxWidth: 1024, margin: '64px auto 24px', padding: '0 24px', position: 'relative', textAlign: 'left' }}>
        <input
          className="title-input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', fontSize: 96, border: 'none', outline: 'none', background: 'transparent', fontWeight: 700, marginBottom: 24, letterSpacing: '-0.02em' }}
        />
        {/* Cover image banner */}
        <input type="file" accept="image/*" ref={fileRef} onChange={onFileChange} style={{ display: 'none' }} />
        {imageUrl && (
          <figure style={{ margin: '0 0 16px 0' }}>
            <img src={imageUrl} alt="Cover" style={{ width: '100%', borderRadius: 12 }} />
          </figure>
        )}
        <div
          ref={contentRef}
          contentEditable
          placeholder="Tell your story..."
          onInput={(e) => setContent(e.currentTarget.innerHTML)}
          style={{ width: '100%', border: 'none', outline: 'none', minHeight: 520, background: 'transparent', fontSize: 24, lineHeight: 1.9, letterSpacing: '-0.005em' }}
          suppressContentEditableWarning
        />
        {toolbar.visible && (
          <div onMouseDown={(e)=>e.preventDefault()} style={{ position: 'absolute', top: toolbar.top, left: toolbar.left, transform: 'translate(-50%, -100%)', background: '#2a2a2a', color: '#fff', borderRadius: 12, padding: '10px 12px', display: 'flex', gap: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.35)', fontSize: 18 }}>
            <button type="button" onMouseDown={(e)=>{e.preventDefault(); exec('bold')}} style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 800, fontSize: 18 }}>B</button>
            <button type="button" onMouseDown={(e)=>{e.preventDefault(); exec('italic')}} style={{ background: 'transparent', border: 'none', color: 'inherit', fontStyle: 'italic', fontSize: 18 }}>i</button>
            <button type="button" onMouseDown={(e)=>{e.preventDefault(); exec('createLink')}} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: 18 }}>🔗</button>
            <span style={{ opacity: 0.4 }}>|</span>
            <button type="button" onMouseDown={(e)=>{e.preventDefault(); exec('formatBlock', 'h2')}} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: 18 }}>T</button>
            <button type="button" onMouseDown={(e)=>{e.preventDefault(); exec('formatBlock', 'h3')}} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: 18 }}>T</button>
            <button type="button" onMouseDown={(e)=>{e.preventDefault(); exec('formatBlock', 'blockquote')}} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: 18 }}>❝❞</button>
            <button type="button" onMouseDown={(e)=>{e.preventDefault(); exec('insertUnorderedList')}} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: 18 }}>•</button>
          </div>
        )}
        <button type="button" title="Upload cover image" onClick={triggerUpload} style={{ width: 44, height: 44, borderRadius: 999, border: '1px solid #ddd', background: '#fff', display: 'grid', placeItems: 'center', margin: '8px 0 12px 0', fontSize: 20 }}>+</button>
        <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
          <input placeholder="Subtitle (optional)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={{ fontSize: 18, padding: 10 }} />
          <input placeholder="Cover image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ fontSize: 18, padding: 10 }} />
        </div>
      </div>

      {/* Bottom helper like Medium */}
      <div style={{ background: '#fafafa', borderTop: '1px solid #eee' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '22px 24px', textAlign: 'center' }}>
          <div style={{ color: '#6B6B6B', marginBottom: 12 }}>Select text to change formatting, add headers, or create links.</div>
          {/* <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px', gap: 10 }}>
            <button type="button" style={{ border: 'none', background: 'transparent', fontWeight: 800 }}>B</button>
            <button type="button" style={{ border: 'none', background: 'transparent', fontStyle: 'italic' }}>i</button>
            <button type="button" style={{ border: 'none', background: 'transparent' }}>🔗</button>
            <span style={{ opacity: 0.4 }}>|</span>
            <button type="button" style={{ border: 'none', background: 'transparent' }}>T</button>
            <button type="button" style={{ border: 'none', background: 'transparent' }}>T</button>
            <button type="button" style={{ border: 'none', background: 'transparent' }}>❝❞</button>
            <button type="button" style={{ border: 'none', background: 'transparent' }}>≡</button>
            <button type="button" style={{ border: 'none', background: 'transparent' }}>💬</button>
          </div> */}
          <div style={{ marginTop: 10, color: '#1a8917' }}>Writing on Medium</div>
        </div>
      </div>
    </div>
  )
}


