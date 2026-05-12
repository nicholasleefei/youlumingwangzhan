import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

function readDotEnv(filePath) {
  try {
    const txt = fs.readFileSync(filePath, 'utf8')
    const env = {}
    for (const line of txt.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i < 0) continue
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
    return env
  } catch {
    return {}
  }
}

function isLikelyJwt(value) {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (v.length < 40) return false
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v)
}

function pickNums(v) {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return [v]
  const s = typeof v === 'string' ? v : ''
  const m = s.match(/\d+(?:\.\d+)?/g)
  if (!m) return []
  return m.map(Number).filter((x) => Number.isFinite(x) && x > 0)
}

function pickKmFromText(text) {
  const s = typeof text === 'string' ? text : ''
  const m = s.match(/\d{2,4}(?:\.\d+)?(?=\s*(?:km|公里))/gi)
  if (!m) return []
  return m.map(Number).filter((x) => Number.isFinite(x) && x > 0)
}

function ensureObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  return {}
}

function getRawFuelType(raw) {
  const engine = ensureObject(raw?.engine)
  const ft = typeof engine.fueltype === 'string' ? engine.fueltype : ''
  return ft
}

function getExistingRangeNums(raw) {
  const engine = ensureObject(raw?.engine)
  const em = ensureObject(raw?.electricmotor)
  const candidates = [
    engine?.cltcmaxmileage,
    engine?.cltccomprehensivemileage,
    em?.cltcmaxmileage,
    em?.cltccomprehensivemileage,
    em?.wltcmaxmileage,
    em?.wltccomprehensivemileage,
    raw?.engine_cltccomprehensivemileage,
    raw?.electricmotor_cltccomprehensivemileage,
    raw?.electricmotor_wltcmaxmileage,
    raw?.electricmotor_wltccomprehensivemileage,
    raw?.cltc_range,
    raw?.wltc_range,
  ]
  const out = []
  for (const c of candidates) out.push(...pickNums(c))
  return out.filter((x) => x >= 50 && x <= 2000)
}

function estimateKmFromBatteryAndConsumption(raw, fallbackConsumption) {
  const em = ensureObject(raw?.electricmotor)
  const capText = em?.batterycapacity
  const consText = em?.powerconsumption
  const cap = pickNums(capText)[0]
  const cons = pickNums(consText)[0] ?? fallbackConsumption
  if (!cap || !cons || cons <= 0) return null
  const km = Math.round((cap * 100) / cons)
  if (!Number.isFinite(km) || km < 100 || km > 2000) return null
  return km
}

function shouldTreatAsPureEV(raw, name) {
  const ft = getRawFuelType(raw)
  if (ft.includes('纯电')) return true
  const n = typeof name === 'string' ? name : ''
  return n.includes('纯电')
}

function patchRawWithKm(raw, km) {
  const next = ensureObject(raw)
  const electricmotor = ensureObject(next.electricmotor)
  const setIfMissing = (key) => {
    const v = electricmotor[key]
    const s = typeof v === 'string' ? v.trim() : ''
    if (!s || s === '-' || s === '—') electricmotor[key] = String(km)
  }
  setIfMissing('cltcmaxmileage')
  setIfMissing('cltccomprehensivemileage')
  next.electricmotor = electricmotor
  return next
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length)
  let nextIndex = 0
  const runners = new Array(Math.min(limit, items.length)).fill(null).map(async () => {
    while (true) {
      const i = nextIndex
      nextIndex++
      if (i >= items.length) break
      results[i] = await worker(items[i], i)
    }
  })
  await Promise.all(runners)
  return results
}

async function main() {
  const envFromFile = readDotEnv(path.join(process.cwd(), '.env'))
  const supabaseUrl = process.env.SUPABASE_URL || envFromFile.VITE_SUPABASE_URL
  const keyCandidates = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    envFromFile.SUPABASE_SERVICE_ROLE_KEY,
    envFromFile.VITE_SUPABASE_ANON_KEY,
  ].filter(isLikelyJwt)
  const supabaseKey = keyCandidates[0]

  if (!supabaseUrl) throw new Error('SUPABASE_URL missing')
  if (!supabaseKey) throw new Error('SUPABASE key missing')

  const supabase = createClient(supabaseUrl, supabaseKey)

  const pageSize = 1000
  let offset = 0
  const candidates = []
  const consumptionAgg = new Map()
  let consumptionAllSum = 0
  let consumptionAllCount = 0

  while (true) {
    const { data, error } = await supabase
      .from('model_details')
      .select('id,name,yeartype,raw,activity_status')
      .eq('activity_status', 0)
      .range(offset, offset + pageSize - 1)

    if (error) throw error
    const rows = data ?? []
    if (rows.length === 0) break

    for (const r of rows) {
      const raw = r.raw ?? {}
      if (!shouldTreatAsPureEV(raw, r.name)) continue

      const em = ensureObject(raw?.electricmotor)
      const cons = pickNums(em?.powerconsumption)[0]
      if (cons && cons > 0) {
        const sizetype = String(raw?.sizetype || r.sizetype || '').trim() || 'ALL'
        const cur = consumptionAgg.get(sizetype) || { sum: 0, count: 0 }
        cur.sum += cons
        cur.count += 1
        consumptionAgg.set(sizetype, cur)
        consumptionAllSum += cons
        consumptionAllCount += 1
      }

      const existing = getExistingRangeNums(raw)
      if (existing.length > 0) continue
      candidates.push(r)
    }

    if (rows.length < pageSize) break
    offset += pageSize
  }

  let updated = 0
  let skipped = 0
  let failed = 0
  let fromName = 0
  let fromEstimate = 0

  const overallConsumption = consumptionAllCount > 0 ? consumptionAllSum / consumptionAllCount : null

  await mapLimit(candidates, 4, async (row) => {
    try {
      const raw = row.raw ?? {}
      const kmFromName = pickKmFromText(row.name)[0] ?? null
      const sizetype = String(raw?.sizetype || row.sizetype || '').trim() || 'ALL'
      const agg = consumptionAgg.get(sizetype)
      const fallbackConsumption = agg && agg.count > 0 ? agg.sum / agg.count : overallConsumption
      const kmFromCalc = estimateKmFromBatteryAndConsumption(raw, fallbackConsumption)
      const km = kmFromName ?? kmFromCalc
      if (!km) {
        skipped++
        return
      }
      if (kmFromName) fromName++
      else fromEstimate++

      const nextRaw = patchRawWithKm(raw, km)
      const { error } = await supabase
        .from('model_details')
        .update({ raw: nextRaw })
        .eq('id', row.id)

      if (error) throw error
      updated++
    } catch {
      failed++
    }
  })

  const summary = {
    pure_ev_missing_before: candidates.length,
    updated,
    updated_from_name_km: fromName,
    updated_from_estimate: fromEstimate,
    skipped_no_source: skipped,
    failed,
  }

  process.stdout.write(JSON.stringify(summary, null, 2) + '\n')
}

main().catch((e) => {
  process.stderr.write(String(e?.message || e) + '\n')
  process.exit(1)
})
