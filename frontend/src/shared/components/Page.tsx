import React from 'react'

type PageProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  dataCy?: string
}

const Page = ({ title, subtitle, actions, children, dataCy }: PageProps) => {
  return (
    <section className="p-4 space-y-4" role="main" data-cy={dataCy}>
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div>{children}</div>
    </section>
  )
}

export default Page
