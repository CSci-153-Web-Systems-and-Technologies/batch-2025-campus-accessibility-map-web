export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T; error: null } | { data: null; error: Error }> {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(errorMessage)
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

