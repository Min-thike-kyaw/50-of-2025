import { useGraphQLQuery } from './useGraphQL'

const GET_ACTIVE_ITEMS = `
  query GetActiveItems {
    activeItems(where: { buyer: "0x0000000000000000000000000000000000000000" }) {
      id
      buyer
      seller
      nftAddress
      tokenId
      price
    }
  }
`

export type ActiveItem = {
  id: string
  buyer: string
  seller: string
  nftAddress: string
  tokenId: string
  price: string
}

export function useActiveItems() {
  return useGraphQLQuery<{ activeItems: ActiveItem[] }>(GET_ACTIVE_ITEMS)
} 