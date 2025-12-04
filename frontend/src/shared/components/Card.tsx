import React from 'react'

type CardProps = {
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  dataCy?: string
}

const Card = ({ title, children, footer, dataCy }: CardProps) => {
  return (
    <div
      className="max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      data-cy={dataCy}
    >
      {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
      <div className="space-y-4">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}

export default Card
