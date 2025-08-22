import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [users, setUsers] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/api/users')
      setUsers(res.data)
    } catch (e) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const addUser = async (e) => {
    e.preventDefault()
    if (!name || !email) return
    try {
      await axios.post('/api/users', { name, email })
      setName('')
      setEmail('')
      fetchUsers()
    } catch (e) {
      setError('Failed to add user')
    }
  }

  const deleteUser = async (id) => {
    try {
      await axios.delete(`/api/users/${id}`)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (e) {
      setError('Failed to delete user')
    }
  }

  return (
    <div className="container">
      {loading && (
        <div className="spinner-overlay"><div className="spinner" /></div>
      )}
      <h1>User Management</h1>

      <form onSubmit={addUser} className="form">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}

      <ul className="list">
        {users.map((u) => (
          <li key={u.id} className="list-item">
            <div>
              <strong>{u.name}</strong>
              <div className="muted">{u.email}</div>
            </div>
            <button onClick={() => deleteUser(u.id)} className="danger">Delete</button>
          </li>
        ))}
        {!loading && users.length === 0 && <li>No users</li>}
      </ul>
    </div>
  )
}

export default App
