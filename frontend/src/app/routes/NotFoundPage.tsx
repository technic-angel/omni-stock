import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="p-6 space-y-3">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-sm text-gray-600">The page you are looking for does not exist.</p>
      <Link className="text-blue-600" to="/inventory">
        Go back to inventory
      </Link>
    </div>
  )
}

export default NotFoundPage
