export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="w-12 h-12 rounded-full border-2 border-[#3b9fd8]/25 border-t-[#3b9fd8] animate-spin" />
      <p className="text-gray-400 mt-4 text-sm">Chargement…</p>
    </div>
  )
}
