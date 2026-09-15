/**
 * Defers building a LangChain runnable until the first invocation and caches
 * the result. Chains reach for a Groq model as they are constructed, which
 * throws when GROQ_API_KEY is absent — and `next build` imports every route
 * module long before any request supplies one.
 */
export function lazyChain<T>(build: () => T): () => T {
  let value: T | undefined
  return () => (value ??= build())
}
