const STORAGE_KEY = 'medium_clone_posts'

function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed)) return parsed
    return []
  } catch (_) {
    return []
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function ensureSeeded() {
  const existing = loadPosts()
  if (existing.length >= 5) return

  const now = new Date().toISOString()
  const templates = [
    {
      title:
        'The 100-Article Effect: What Happens Once You Publish 100+ Articles on Your Website',
      subtitle:
        'What will happen to your website and its traffic once you publish 100+ articles?',
      content: 'Template content for demo purposes.',
      author: 'Thakur Rahul Singh',
      collection: 'Better Marketing',
      imageUrl:
        'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1200&auto=format&fit=crop',
      claps: 3200,
      responses: 116,
      createdAt: now,
    },
    {
      title: "You’re using ChatGPT wrong. Here’s how to prompt like a pro",
      subtitle: 'Smarter prompts lead to smarter responses.',
      content: 'Template content for demo purposes.',
      author: 'James Wilkins',
      collection: 'Data Science Collective',
      imageUrl:
        'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1200&auto=format&fit=crop',
      claps: 4700,
      responses: 263,
      createdAt: now,
    },
    {
      title: 'How to Learn Vocabulary Without Memorising Word Lists',
      subtitle:
        'A personal method for building vocabulary through reading, writing, and emotional connection',
      content: 'Template content for demo purposes.',
      author: 'Helen Nomura',
      collection: 'Language Lab',
      imageUrl:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
      claps: 13600,
      responses: 523,
      createdAt: now,
    },
  ]

  const posts = [...existing]
  templates.forEach((t) => {
    const baseSlug = slugify(t.title)
    let slug = baseSlug
    let i = 1
    while (posts.some((p) => p.slug === slug)) slug = `${baseSlug}-${i++}`
    posts.push({
      id: crypto.randomUUID(),
      slug,
      title: t.title,
      subtitle: t.subtitle,
      excerpt: t.subtitle,
      content: t.content,
      author: t.author,
      collection: t.collection,
      imageUrl: t.imageUrl,
      claps: t.claps,
      responses: t.responses,
      createdAt: t.createdAt,
      updatedAt: now,
    })
  })

  savePosts(posts)
}

export function getPosts() {
  ensureSeeded()
  const posts = loadPosts()
  return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getPostBySlug(slug) {
  ensureSeeded()
  const post = loadPosts().find((p) => p.slug === slug)
  if (!post) return undefined
  if (!post.body) {
    post.body = generateMockBody(post)
  }
  return post
}

function generateMockBody(post) {
  const paras = [
    `From an SEO standpoint, more content equals a greater probability of ranking. This article explores what tends to happen after publishing over 100 posts on your site and how to prepare for that growth.`,
    `This isn’t the case for everyone, and if you’re someone who is aiming for 100+ articles for your website growth, then you need to go through this blog post.`,
    `Let me tell you that I am a seasoned owner with a proven record of successful case studies. Publishing content day in and day out is what we do, so we’re very familiar with the results you can achieve after publishing 100+ blog posts.`,
    `Are you looking to rank your articles on Google or do you want to grow your website using SEO? The following sections include a few quick wins, a checklist to avoid content decay, and a compact framework to prioritize topics.`,
  ]
  return paras.join('\n\n')
}

export function createPost({ title, subtitle = '', content = '', imageUrl = '' }) {
  const posts = loadPosts()
  const baseSlug = slugify(title || crypto.randomUUID())
  let slug = baseSlug
  let i = 1
  while (posts.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${i++}`
  }
  const now = new Date().toISOString()
  const post = {
    id: crypto.randomUUID(),
    slug,
    title,
    subtitle,
    excerpt: subtitle,
    content,
    author: 'You',
    collection: 'My Collection',
    imageUrl: imageUrl || '/hero-art.png',
    claps: Math.floor(Math.random() * 5000) + 100,
    responses: Math.floor(Math.random() * 500),
    createdAt: now,
    updatedAt: now,
  }
  posts.push(post)
  savePosts(posts)
  return post
}

export function deletePostBySlug(slug) {
  const posts = loadPosts().filter((p) => p.slug !== slug)
  savePosts(posts)
}


