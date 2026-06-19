// Reads the single, cohort-wide SIWES start date from the settings table.
export const getSiwesStart = async (): Promise<string | null> => {
  const client = useSupabaseClient<any>()
  const { data } = await client
    .from('settings')
    .select('value')
    .eq('key', 'siwes_start_date')
    .maybeSingle()
  return (data?.value as string) || null
}

// Sets the single, cohort-wide SIWES start date (admins only, enforced by RLS).
export const setSiwesStart = async (value: string | null) => {
  const client = useSupabaseClient<any>()
  return client
    .from('settings')
    .upsert({ key: 'siwes_start_date', value: value || null, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}
