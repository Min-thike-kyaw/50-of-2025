'use client'

import { useActiveItems, ActiveItem } from '../../../hooks/useActiveItems'
import { useNftMetadata } from '../../../hooks/useNftMetadata'
import { formatUnits } from 'viem'
import { middleEllipsis } from '@/lib/utils'
import Image from 'next/image'
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import Button from './Button'
import NftMarketplaceAbi from "../../../constants/NftMarketplace.json"
import networkMapping from "../../../constants/networkMapping.json"

export default function ActiveItems() {
  const { isConnected } = useAccount()
  const { data, isLoading, error } = useActiveItems(isConnected)

  if (!isConnected) {
    return <div>Please connect your wallet to view active items</div>
  }

  if (isLoading) {
    return <div>Loading active items...</div>
  }

  if (error) {
    return <div>Error loading active items: {error.message}</div>
  }

  if (!data?.activeItems.length) {
    return <div>No active items found</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
      {data.activeItems.map((item: ActiveItem) => (
        <NftCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function NftCard({ item }: { item: ActiveItem }) {
  const NFTMarketplaceAddress = networkMapping["31337"].NftMarketplace[0]
  const { address } = useAccount()
  const isOwner = address?.toLowerCase() === item.seller.toLowerCase()
  const { metadata, isLoading: isLoadingMetadata } = useNftMetadata(
    item.nftAddress,
    item.tokenId
  )
  const { writeContract, data: hash, error: writeContractError } = useWriteContract()
  const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
  })

  const buyItem = async () => {
    if(confirm("Are you sure you want to buy this item?")) {

    writeContract({
      address: NFTMarketplaceAddress as `0x${string}`,
      abi: NftMarketplaceAbi,
      functionName: "buyItem",
      args: [item.nftAddress, item.tokenId],
      value: BigInt(item.price)
    })
    }
  }
  console.log(isLoading, isSuccess, isError, error, writeContractError, "isLoading, isSuccess, isError, error, writeContractError")

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-2">
        {isLoadingMetadata ? (
          <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg" />
        ) : metadata?.image ? (
          <div className="relative w-full h-48">
            <Image
              src={metadata.image}
              alt={metadata.name || `NFT #${item.tokenId}`}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
            No image available
          </div>
        )}
        <p className="text-sm text-gray-500">Token ID: {item.tokenId}</p>
        <p className="text-sm">
          Seller: {middleEllipsis(item.seller, 6)}
        </p>
        <p className="text-sm">
          NFT Address: {middleEllipsis(item.nftAddress, 6)}
        </p>
        <p className="text-lg font-semibold">
          Price: {formatUnits(BigInt(item.price), 18)} ETH
        </p>
        {metadata?.name && (
          <p className="text-sm font-medium">{metadata.name}</p>
        )}
      </div>
      <div className='flex justify-center mt-4'>
        {
          isOwner ? (
            <Button>
              Update Price
            </Button>
          ) : <Button onClick={() => buyItem()}>Buy</Button>
        } 
      </div>
    </div>
  )
} 