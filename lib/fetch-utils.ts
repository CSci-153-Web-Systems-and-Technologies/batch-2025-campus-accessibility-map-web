export async function safeFetch<T>(
  url: string,
  signal?: AbortSignal
): Promise<{ data: T; error: null } | { data: null; error: Error }> {
  try {
    const response = await fetch(url, { signal })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    return { data: result.data || result, error: null }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { data: null, error: err }
    }
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Unknown error occurred')
    }
  }
}

