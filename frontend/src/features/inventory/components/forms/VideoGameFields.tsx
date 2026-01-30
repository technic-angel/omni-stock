import React from 'react'

export type VideoGameFieldValues = {
  platform?: string
  game_region?: string
  completeness?: string
  game_genre?: string
}

type VideoGameFieldsProps = {
  values: VideoGameFieldValues
  onChange: (updates: VideoGameFieldValues) => void
}

const VideoGameFields: React.FC<VideoGameFieldsProps> = ({ values, onChange }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="video-platform">
          Platform
        </label>
        <select
          id="video-platform"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.platform ?? ''}
          onChange={(e) => onChange({ platform: e.target.value })}
        >
          <option value="">Select platform…</option>
          <option value="nintendo_switch">Nintendo Switch</option>
          <option value="ps5">PlayStation 5</option>
          <option value="xbox_series_x">Xbox Series X</option>
          <option value="pc">PC</option>
          <option value="retro">Retro (NES/SNES/N64)</option>
          <option value="handheld">Handheld (GB/GBA/DS)</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="video-region">
          Region
        </label>
        <select
          id="video-region"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.game_region ?? ''}
          onChange={(e) => onChange({ game_region: e.target.value })}
        >
          <option value="">Select region…</option>
          <option value="ntsc_u">NTSC-U (US/Canada)</option>
          <option value="ntsc_j">NTSC-J (Japan)</option>
          <option value="pal">PAL (Europe/Australia)</option>
          <option value="region_free">Region Free</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="video-completeness">
          Completeness
        </label>
        <select
          id="video-completeness"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.completeness ?? ''}
          onChange={(e) => onChange({ completeness: e.target.value })}
        >
          <option value="">Select completeness…</option>
          <option value="loose">Loose (Cart/Disc only)</option>
          <option value="cib">CIB (Complete in Box)</option>
          <option value="sealed">New / Sealed</option>
          <option value="box_manual">Box &amp; Manual only</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="video-genre">
          Genre
        </label>
        <input
          id="video-genre"
          type="text"
          placeholder="e.g. RPG, Action"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          value={values.game_genre ?? ''}
          onChange={(e) => onChange({ game_genre: e.target.value })}
        />
      </div>
    </div>
  )
}

export default VideoGameFields
