import Page from '@/shared/components/Page'

const SettingsPage = () => {
  return (
    <Page
      title="Settings"
      subtitle="Account and workspace preferences live here. This is a placeholder until the detailed settings experience ships."
      dataCy="settings-page"
    >
      <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-6 text-sm text-gray-600">
        <p className="mb-4 text-base font-medium text-gray-900">Coming soon</p>
        <p>
          We&apos;re still building the settings flows for billing, notifications, and workspace configuration. In the
          meantime, use the profile panel to update your personal info or reach out to the OmniStock team if you need a
          change.
        </p>
      </div>
    </Page>
  )
}

export default SettingsPage
