export type RawStationRecord = {
  stationcode: string
  name: string
  is_installed: 'OUI' | 'NON'
  capacity: number
  numdocksavailable: number
  numbikesavailable: number
  mechanical: number
  ebike: number
  is_renting: 'OUI' | 'NON'
  is_returning: 'OUI' | 'NON'
  duedate: string | null
  coordonnees_geo: { lon: number; lat: number } | null
  nom_arrondissement_communes: string | null
  code_insee_commune: string | null
  station_opening_hours: string | null
}

export type Station = {
  code: string
  name: string
  city: string
  capacity: number
  mechanical: number
  ebike: number
  bikes: number
  docks: number
  installed: boolean
  renting: boolean
  returning: boolean
  lon: number
  lat: number
  updatedAt: string | null
}
