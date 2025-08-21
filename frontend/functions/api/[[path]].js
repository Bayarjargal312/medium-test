export async function onRequest(context) {
  const { request, env } = context
  const backendBase = (env.BACKEND_URL || '').replace(/\/$/, '')
  if (!backendBase) {
    return new Response('BACKEND_URL not set', { status: 500 })
  }

  const url = new URL(request.url)
  const upstreamUrl = new URL(
    url.pathname.replace(/^\/api/, '/api') + url.search,
    backendBase
  ).toString()

  const reqInit = {
    method: request.method,
    headers: new Headers(request.headers),
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    const body = await request.arrayBuffer()
    reqInit.body = body
  }

  // Remove host-related headers that can break proxying
  reqInit.headers.delete('host')
  reqInit.headers.delete('content-length')

  return fetch(upstreamUrl, reqInit)
}


