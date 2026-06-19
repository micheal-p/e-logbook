// SIWES week math, shared by the student logbook and the public sign page.
export const SIWES_WEEKS = 24
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
