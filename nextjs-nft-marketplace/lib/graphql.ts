import { QueryClient } from '@tanstack/react-query'

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// GraphQL endpoint
export const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'YOUR_GRAPHQL_ENDPOINT'

// Helper function to make GraphQL requests
export async function fetchGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  const json = await response.json()

  if (json.errors) {
    throw new Error(json.errors[0].message)
  }

  return json.data
} 