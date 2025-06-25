import { useContractRead, useReadContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import BasicNftAbi from '../constants/BasicNft.json'

export type NftMetadata = {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

export function useNftMetadata(nftAddress: string, tokenId: string) {
  // First, get the tokenURI from the contract
  const { data: tokenUri } = useReadContract({
    address: nftAddress as `0x${string}`,
    abi: BasicNftAbi,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
    // enabled: !!nftAddress && !!tokenId,
  })

  // Then, fetch the metadata from the tokenURI
  const { data: metadata, isLoading, error } = useQuery({
    queryKey: ['nft-metadata', tokenUri],
    queryFn: async () => {
      if (!tokenUri) return null
      
      // Handle IPFS URLs
      const url = tokenUri.toString().replace('ipfs://', 'https://ipfs.io/ipfs/')
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch NFT metadata')
      }
      const data = await response.json()
      
      // Handle IPFS image URLs
      if (data.image) {
        data.image = data.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
      }
      
      return data as NftMetadata
    },
    enabled: !!tokenUri,
  })

  return {
    metadata,
    isLoading,
    error,
  }
} 