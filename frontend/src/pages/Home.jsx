import { Link, useNavigate } from 'react-router-dom'
import { getPosts } from '../lib/posts'
import { useMemo } from 'react'
import { useEffect, useState } from 'react'

export default function Home() {
	// Try to fetch latest posts from backend, fallback to local posts
	const [remotePosts, setRemotePosts] = useState([])
	useEffect(() => {
		fetch('/api/posts').then(r=>r.json()).then(setRemotePosts).catch(()=>{})
	}, [])
	const posts = useMemo(() => {
		return (remotePosts && remotePosts.length ? remotePosts : getPosts())
	}, [remotePosts])
	const [signedIn, setSignedIn] = useState(() => localStorage.getItem('signed_in') === '1')
	const [role, setRole] = useState(() => localStorage.getItem('role') || 'USER')
	const [showModal, setShowModal] = useState(false)
	const [mode, setMode] = useState('register') // 'register' | 'verify' | 'login' | 'interests'
	const [sidebarVisible, setSidebarVisible] = useState(true)
	const [form, setForm] = useState({ username: '', name: '', email: '', password: '', code: '' })
	const [message, setMessage] = useState('')
	const [otpSent, setOtpSent] = useState(false)
	const interestOptions = [
		'Programming','Data Science','Technology','Self Improvement','Writing','Relationships','Machine Learning','Productivity','Politics','Cryptocurrency','Psychology','Money','Business','Python','Health','Science','Mental Health','Life','Software Development','Startup','Design','JavaScript','Artificial Intelligence','Culture','Software Engineering','Blockchain','Coding','Entrepreneurship','React','UX','Education','History','Humor','Web Development','Work','Lifestyle','Society','Deep Learning','Marketing','Books','Nft','Social Media','Leadership','Android','Apple','Women'
	]
	const [selectedInterests, setSelectedInterests] = useState([])
	const [userInterests, setUserInterests] = useState([])
	const navigate = useNavigate()

	function resetForm() {
		setForm({ username: '', name: '', email: '', password: '', code: '' })
	}

	useEffect(() => {
		if (signedIn) {
			localStorage.setItem('signed_in', '1')
		} else {
			localStorage.removeItem('signed_in')
		}
	}, [signedIn])

	useEffect(() => {
		if (signedIn && role === 'ADMIN') {
			navigate('/admin')
		}
	}, [signedIn, role])

	useEffect(() => {
		try {
			const stored = localStorage.getItem('user_interests')
			if (stored) setUserInterests(JSON.parse(stored))
		} catch {}
	}, [])

	const handleSignIn = (e) => {
		e?.preventDefault()
		setSignedIn(true)
	}
	const handleSignOut = (e) => {
		e?.preventDefault()
		setSignedIn(false)
		try {
			localStorage.removeItem('user_name')
			localStorage.removeItem('role')
		} catch {}
	}

	const openModal = (e) => {
		e?.preventDefault()
		setShowModal(true)
		setMode('register')
		setMessage('')
		setOtpSent(false)
		resetForm()
	}

	const openLoginModal = (e) => {
		e?.preventDefault()
		setShowModal(true)
		setMode('login')
		setMessage('')
		setOtpSent(false)
		resetForm()
	}
	const closeModal = () => {
		setShowModal(false)
		setMode('register')
		setMessage('')
		setOtpSent(false)
		resetForm()
	}

	const goToLogin = (e) => {
		e?.preventDefault()
		setMode('login')
		setMessage('')
		setOtpSent(false)
		resetForm()
	}

	const goToRegister = (e) => {
		e?.preventDefault()
		setMode('register')
		setMessage('')
		setOtpSent(false)
		resetForm()
	}

	async function submitRegisterStart(e) {
		e.preventDefault()
		setMessage('Sending code...')
		const res = await fetch('/api/auth/register/start', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: form.username, name: form.name, email: form.email, password: form.password })
		})
		const data = await res.json()
		if (res.ok) {
			setMode('verify')
			setOtpSent(true)
			setMessage('Verification code sent to your email.')
		} else {
			setMessage(data.error || 'Failed to send code')
		}
	}

	async function submitVerify(e) {
		e.preventDefault()
		setMessage('Verifying...')
		const res = await fetch('/api/auth/register/verify', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: form.email, code: form.code })
		})
		const data = await res.json()
		if (res.ok) {
			setMessage('Select your interests to personalize your feed.')
			setMode('interests')
			setOtpSent(false)
			setShowModal(false)
			if (data && data.role) { try { localStorage.setItem('role', data.role); setRole(data.role) } catch {} }
		} else {
			setMessage(data.error || 'Verification failed')
		}
	}

	async function submitLogin(e) {
		e.preventDefault()
		setMessage('Signing in...')
		const res = await fetch('/api/auth/login', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ usernameOrEmail: form.username || form.email, password: form.password })
		})
		const data = await res.json()
		if (res.ok) {
			setSignedIn(true)
			setShowModal(false)
			try { localStorage.setItem('user_name', form.username || form.email || 'User') } catch {}
			if (data && data.role) { try { localStorage.setItem('role', data.role); setRole(data.role) } catch {} }
			if (data && data.id) { try { localStorage.setItem('user_id', data.id) } catch {} }
		} else {
			setMessage(data.error || 'Login failed')
		}
	}

	async function saveInterests() {
		if (selectedInterests.length < 3) { setMessage('Please choose at least 3.'); return; }
		setMessage('Saving...')
		const res = await fetch('/api/auth/interests', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: form.email, interests: selectedInterests })
		})
		if (res.ok) {
			setSignedIn(true)
			setMode('login')
			setMessage('')
			try {
				localStorage.setItem('user_interests', JSON.stringify(selectedInterests))
				setUserInterests(selectedInterests)
				localStorage.setItem('user_name', form.name || form.username || form.email || 'User')
			} catch {}
		} else {
			const data = await res.json().catch(() => ({}))
			setMessage(data.error || 'Failed to save interests')
		}
	}

	return (
		<>
			<div className="nav">
				<div className={`nav-inner ${!signedIn ? 'nav-inner-no-menu' : ''}`}>
					{signedIn && (
						<button className="menu-btn" aria-label="Toggle menu" onClick={() => setSidebarVisible(v => !v)}>
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"></path></svg>
						</button>
					)}
					<div className="brand">Medium</div>
					{signedIn && (
						<div className="nav-search">
							<input className="search-input" placeholder="Search" aria-label="Search" />
						</div>
					)}
					<div className="nav-links">
						<a href="#">Our story</a>
						<a href="#">Membership</a>
						{role !== 'ADMIN' && <Link to="/new">Write</Link>}
						{!signedIn ? (
							<a href="#" onClick={openLoginModal}>Sign in</a>
						) : (
							<a href="#" onClick={handleSignOut}>Sign out</a>
						)}
						<button className="btn btn-dark" onClick={openModal}>Get started</button>
					</div>
				</div>
			</div>

			{!signedIn && mode !== 'interests' && (
				<section className="hero">
					<div className="copy">
						<h1>Human stories & ideas</h1>
						<p>A place to read, write, and deepen your understanding</p>
						<Link to="#feed" className="btn btn-dark" onClick={(e)=>{ if(!signedIn){ e.preventDefault(); openLoginModal(e); } }}>
							Start reading
						</Link>
					</div>
					<div className="art" aria-hidden="true">
						<img src="/hero-art.png" alt="Decorative" />
					</div>
				</section>
			)}

			{signedIn && (
				<div className={`dashboard ${sidebarVisible ? '' : 'sidebar-collapsed'}`}>
					<aside className="sidebar-left">
						<ul className="side-list">
							<li>
								<a href="#">
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z"></path></svg>
									<span>Home</span>
								</a>
							</li>
							<li>
								<a href="#">
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a1 1 0 0 1 1 1v14l-4-3-4 3-4-3-4 3V5a1 1 0 0 1 1-1z"></path></svg>
									<span>Library</span>
								</a>
							</li>
							<li>
								<a href="#">
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.418 0-8 2.239-8 5v3h16v-3c0-2.761-3.582-5-8-5z"></path></svg>
									<span>Profile</span>
								</a>
							</li>
							<li>
								<a href="#">
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v2H4zm0 6h16v2H4zm0 6h10v2H4z"></path></svg>
									<span>Stories</span>
								</a>
							</li>
							<li>
								<a href="#">
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path d="M4 13h3v7H4zM10 9h3v11h-3zM16 5h3v15h-3z"/>
									</svg>
									<span>Stats</span>
								</a>
							</li>
						</ul>
						<div className="follow-card">
							<div className="muted">Discover more writers and publications to follow.</div>
							<a className="see-link" href="#">See suggestions</a>
						</div>
					</aside>

					<main className="dashboard-feed">
						<div className="tabs">
							<button className="tab active">For you</button>
							<button className="tab">Featured</button>
							{role === 'ADMIN' && <Link to="/admin" className="tab">Admin</Link>}
						</div>
						<div className="info-banner">
							<p className="muted">“Following” and your topics are now part of the new Following page, which you can find from the sidebar.</p>
							<a href="#" className="see-link">Okay, got it</a>
						</div>
						<ul className="feed-cards">
							{posts.map((p) => (
								<li key={p.id} className="feed-card">
									<div className="feed-card-body">
										<div className="feed-card-meta muted">In {p.collection || 'General'} · {p.author}</div>
										<Link to={`/p/${p.slug}`} className="feed-card-title">{p.title}</Link>
										{(p.excerpt || p.subtitle) && <div className="feed-card-sub">{p.excerpt || p.subtitle}</div>}
										<div className="meta-row">
											<span>{new Date(p.createdAt || p.createdAtIso || p.createdAtEpochMs).toLocaleString('en-US', { month: 'short', day: 'numeric' })}</span>
											<span className="meta-dot"></span>
											<span>👍 {p.likeCount?.toLocaleString?.() || 0}</span>
											<span className="meta-dot"></span>
											<span>💬 {p.commentCount?.toLocaleString?.() || 0}</span>
										</div>
									</div>
									<div className="feed-thumb">
										<Link to={`/p/${p.slug}`}><img src={p.imageUrl || '/hero-art.png'} alt="" /></Link>
									</div>
								</li>
							))}
							{posts.length === 0 && <li className="muted">No posts yet</li>}
						</ul>
					</main>

					<aside className="sidebar-right">
						<div className="card">
							<div className="card-title">Staff Picks</div>
							<ul className="mini-list">
								<li>
									<div className="muted">In Sharing Food · Ninad Kulkarni</div>
									<a href="#">Eating With My Hands Doesn’t Make Me Less Civilised</a>
								</li>
								<li>
									<div className="muted">In The Wind Phone · Jim Parton</div>
									<a href="#">You Are Dead: What Happens Next?</a>
								</li>
								<li>
									<div className="muted">Michelle Glauser</div>
									<a href="#">How the #ILookLikeAnEngineer Ad Campaign Happened Ten Years Ago</a>
								</li>
							</ul>
						</div>

						<div className="card">
							<div className="card-title">Recommended topics</div>
							<div className="topic-pills">
								{(userInterests.length ? userInterests : ['Programming','Self Improvement','Data Science','Writing','Technology','Politics']).map(t => (
									<button key={t} className="pill">{t}</button>
								))}
							</div>
						</div>
						<div className="card">
							<div className="card-title">Who to follow</div>
							<ul className="who-list">
								<li><span>Jane Doe</span> <button className="btn btn-dark">Follow</button></li>
								<li><span>John Writer</span> <button className="btn btn-dark">Follow</button></li>
								<li><span>Ada Dev</span> <button className="btn btn-dark">Follow</button></li>
							</ul>
						</div>
					</aside>
				</div>
			)}

			{!signedIn && mode === 'interests' && (
				<section className="feed" style={{ textAlign: 'center' }}>
					<div style={{ maxWidth: 820, margin: '40px auto' }}>
						<h2 style={{ fontSize: 32, margin: '0 0 8px 0' }}>What are you interested in?</h2>
						<p className="muted" style={{ marginBottom: 18 }}>Choose three or more.</p>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
							{interestOptions.map((opt) => {
								const active = selectedInterests.includes(opt)
								return (
									<button
										key={opt}
										type="button"
										onClick={() => setSelectedInterests((prev) => prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt])}
										className="btn"
										style={{ background: active ? '#1a8917' : 'transparent', color: active ? 'white' : '#191919', borderColor: '#191919' }}
									>
										{opt}
									</button>
								)
							})}
						</div>
						<div style={{ marginTop: 18 }}>
							<button className="btn btn-dark" onClick={saveInterests} disabled={selectedInterests.length < 3}>
								Continue
							</button>
						</div>
						{message && <p className="muted" style={{ marginTop: 12 }}>{message}</p>}
					</div>
				</section>
			)}

			{showModal && (
				<div className="modal-backdrop" onClick={closeModal}>
					<div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
						<button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
						<h2 className="modal-title">{mode === 'login' ? 'Sign in' : 'Create your account'}</h2>
						{mode === 'register' && (
							<form className="form" onSubmit={submitRegisterStart}>
								<input placeholder="Username" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} />
								<input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
								<input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
								<input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
								<button type="submit" className="btn btn-dark">Send code</button>
							</form>
						)}
						{mode === 'verify' && (
							<form className="form" onSubmit={submitVerify}>
								<input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
								<input type="text" placeholder="One-time password (6 digits)" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={form.code} onChange={e=>setForm({...form, code:e.target.value.replace(/\D/g,'').slice(0,6)})} title="Enter the 6-digit code" style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }} />
								<button type="submit" className="btn btn-dark">Verify & register</button>
							</form>
						)}
						{mode === 'login' && (
							<form className="form" onSubmit={submitLogin}>
								<input placeholder="Username or email" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} />
								<input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
								<button type="submit" className="btn btn-dark">Sign in</button>
							</form>
						)}
						<p className="muted">{message}</p>
						<p className="modal-sub">
							{mode !== 'login' ? (
								<>Already have an account? <a href="#" onClick={goToLogin}>Sign in</a></>
							) : (
								<>New here? <a href="#" onClick={goToRegister}>Create an account</a></>
							)}
						</p>
					</div>
				</div>
			)}

			<footer className="footer">
				<div className="footer-inner">
					<a href="#">Help</a>
					<a href="#">Status</a>
					<a href="#">About</a>
					<a href="#">Careers</a>
					<a href="#">Press</a>
					<a href="#">Blog</a>
					<a href="#">Privacy</a>
					<a href="#">Rules</a>
					<a href="#">Terms</a>
					<a href="#">Text to speech</a>
				</div>
			</footer>
		</>
	)
}


