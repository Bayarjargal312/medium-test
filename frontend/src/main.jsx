import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Home from './pages/Home.jsx'
import NewPost from './pages/NewPost.jsx'
import Post from './pages/Post.jsx'
import Users from './pages/Users.jsx'
import Admin from './pages/Admin.jsx'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/new', element: <NewPost /> },
  { path: '/p/:slug', element: <Post /> },
  { path: '/users', element: <Users /> },
  { path: '/admin', element: <Admin /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
