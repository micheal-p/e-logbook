// SIWES week math, shared by the student logbook and the public sign page.
export const SIWES_WEEKS = 24
export const WEEKS_PER_MONTH = 4
export const SIWES_MONTHS = SIWES_WEEKS / WEEKS_PER_MONTH // 6 monthly summaries
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}
export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}
function toDate(s: string) {
  return new Date(s + 'T00:00:00')
}
// Monday of the week containing d (Mon=start of week).
function mondayOf(d: Date) {
  const x = new Date(d)
  const offset = (x.getDay() + 6) % 7 // Mon->0 ... Sun->6
  x.setDate(x.getDate() - offset)
  x.setHours(0, 0, 0, 0)
  return x
}

export interface WeekDay { date: string; weekday: string }
export interface SiwesWeek {
  week_number: number
  monday: string
  friday: string
  days: WeekDay[]
}

// Build the fixed list of SIWES weeks (Mon–Fri) from a start date.
export function buildWeeks(startStr: string | null | undefined, totalWeeks = SIWES_WEEKS): SiwesWeek[] {
  if (!startStr) return []
  const m0 = mondayOf(toDate(startStr))
  const weeks: SiwesWeek[] = []
  for (let w = 0; w < totalWeeks; w++) {
    const monday = new Date(m0)
    monday.setDate(m0.getDate() + w * 7)
    const days: WeekDay[] = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push({ date: isoDate(d), weekday: WEEKDAYS[i] })
    }
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)
    weeks.push({ week_number: w + 1, monday: isoDate(monday), friday: isoDate(friday), days })
  }
  return weeks
}

// A week is complete when all 5 weekdays have non-empty content.
export function weekComplete(week: SiwesWeek, entriesByDate: Record<string, any>) {
  return week.days.every((d) => (entriesByDate[d.date]?.content ?? '').trim().length > 0)
}

// The 4-week monthly-summary period a given week belongs to (1-based).
export function periodForWeek(weekNumber: number) {
  return Math.ceil(weekNumber / WEEKS_PER_MONTH)
}

export interface SiwesMonth {
  period: number // 1..6
  week_from: number
  week_to: number
  weeks: SiwesWeek[] // the 4 weeks in this period
  start: string // Monday of the first week
  end: string // Friday of the last week
}

// Build the 6 monthly-summary periods (each = 4 SIWES weeks) from a start date.
export function buildMonths(startStr: string | null | undefined, weeks?: SiwesWeek[]): SiwesMonth[] {
  const ws = weeks ?? buildWeeks(startStr)
  if (!ws.length) return []
  const months: SiwesMonth[] = []
  for (let p = 1; p <= SIWES_MONTHS; p++) {
    const slice = ws.slice((p - 1) * WEEKS_PER_MONTH, p * WEEKS_PER_MONTH)
    if (slice.length < WEEKS_PER_MONTH) break
    months.push({
      period: p,
      week_from: slice[0].week_number,
      week_to: slice[slice.length - 1].week_number,
      weeks: slice,
      start: slice[0].monday,
      end: slice[slice.length - 1].friday,
    })
  }
  return months
}

// A monthly period is complete when all its weeks are complete.
export function monthComplete(month: SiwesMonth, entriesByDate: Record<string, any>) {
  return month.weeks.every((w) => weekComplete(w, entriesByDate))
}
