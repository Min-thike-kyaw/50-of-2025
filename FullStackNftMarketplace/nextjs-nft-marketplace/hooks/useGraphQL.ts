import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { fetchGraphQL } from '../lib/graphql'

export function useGraphQLQuery<TData = any, TVariables extends Record<string, any> = Record<string, any>>(
  query: string,
  variables?: TVariables,
  options?: Omit<UseQueryOptions<TData, Error, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, Error>({
    queryKey: [query, variables],
    queryFn: () => fetchGraphQL<TData>(query, variables),
    ...options,
  })
}

export function useGraphQLMutation<TData = any, TVariables extends Record<string, any> = Record<string, any>>(
  mutation: string,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => fetchGraphQL<TData>(mutation, variables),
    ...options,
  })
} 