// Storage is keyed by the `IssuePDF` row `id` (not by content bytes): each row
// owns its single PDF, so deletion is a plain remove of one object with no orphans
// or reference-counting. The id is regenerated on every re-upload, which busts the
// cache; the previous object is removed on replacement/delete.
//
// Flat layout `<id>.pdf` — no shard folder. Sharding exists for images because one
// image expands into many variant files and there are hundreds of thousands of
// them; PDFs are one object per issue (tens, low hundreds ever), so the directory
// never grows large. Convertible to a shard layout later if that ever changes.

export function buildPdfKey(id: string) {
  return `${id}.pdf`
}
