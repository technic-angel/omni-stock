import React from 'react'

const VideoGameFields = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Platform</label>
        <select className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20">
          <option>Nintendo Switch</option>
          <option>PlayStation 5</option>
          <option>Xbox Series X</option>
          <option>PC</option>
          <option>Retro (NES/SNES/N64)</option>
          <option>Handheld (GB/GBA/DS)</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Region</label>
        <select className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20">
          <option>NTSC-U (US/Canada)</option>
          <option>NTSC-J (Japan)</option>
          <option>PAL (Europe/Australia)</option>
          <option>Region Free</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Completeness</label>
        <select className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20">
          <option>Loose (Cart/Disc only)</option>
          <option>CIB (Complete in Box)</option>
          <option>New / Sealed</option>
          <option>Box & Manual only</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Genre</label>
        <input
          type="text"
          placeholder="e.g. RPG, Action"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>
    </div>
  )
}

export default VideoGameFields
