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
import { useEffect, useState } from 'react'
import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import toast from 'react-hot-toast';

// import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog'

export default function ActiveItems() {
  const { isConnected } = useAccount()
  const { data, isLoading, error, refetch } = useActiveItems(isConnected)

  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    // Optionally, render a loading spinner or nothing
    return null
  }
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-4">
      {data.activeItems.map((item: ActiveItem) => (
        <NftCard key={item.id} item={item} refetch={() => refetch()} />
      ))}
    </div>
  )
}

function NftCard({ item, refetch }: { item: ActiveItem, refetch: () => void }) {
  const NFTMarketplaceAddress = networkMapping["31337"].NftMarketplace[0]
  const [isEdit, setIsEdit] = useState(false)
  const [nftForm, setNftForm] = useState({
    tokenId: "",
    nftAddress: "",
    price: ""
  })
  const { address } = useAccount()
  const isOwner = address?.toLowerCase() === item.seller.toLowerCase()
  const { metadata, isLoading: isLoadingMetadata } = useNftMetadata(
    item.nftAddress,
    item.tokenId
  )
  // Separate hooks for each action
  const { writeContract: writeBuy, data: buyHash, error: buyError } = useWriteContract();
  const { writeContract: writeUpdate, data: updateHash, error: updateError } = useWriteContract();

  // Separate wait hooks for each transaction
  const { isLoading: isBuying, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({ hash: buyHash });
  const { isLoading: isUpdating, isSuccess: isUpdateSuccess } = useWaitForTransactionReceipt({ hash: updateHash });
  

  const showEditForm = (item : ActiveItem) => {
    setNftForm({
      tokenId: item.tokenId,
      nftAddress: item.nftAddress,
      price: formatUnits(BigInt(item.price), 18)
    })
    setIsEdit(true)
  } 

  const buyItem = async () => {
    if(confirm("Are you sure you want to buy this item?")) {

    writeBuy({
      address: NFTMarketplaceAddress as `0x${string}`,
      abi: NftMarketplaceAbi,
      functionName: "buyItem",
      args: [item.nftAddress, item.tokenId],
      value: BigInt(item.price)
    })
    }
  }

  useEffect(() => {
    if(isBuySuccess) {
      toast.success("Item bought successfully")
    }
    if(isUpdateSuccess) {
      setIsEdit(false)
      toast.success("Item updated successfully")
    }
    refetch && refetch()
  }, [isBuySuccess, isUpdateSuccess])

  const updatePrice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    writeUpdate({
      address: NFTMarketplaceAddress as `0x${string}`,
      abi: NftMarketplaceAbi,
      functionName: "updateListing",
      args: [item.nftAddress, item.tokenId, (+nftForm.price) * 10 ** 18]
    })
  }

  return (
    <div>
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
                className="object-contain rounded-lg"
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
              <Button onClick={() => showEditForm(item)}>
                Update Price
              </Button>
            ) : <Button disabled={isBuying} onClick={() => buyItem()}>Buy</Button>
          } 
        </div>
      </div>
      <Dialog open={isEdit} onClose={() => setIsEdit(false)} className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-closed:opacity-0">
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="max-w-lg space-y-4 border bg-white p-12">
            <form onSubmit={updatePrice}>
              <div className="space-y-4">
                <label htmlFor="price">Price In Eth</label>
                <input type="number" id="price" name="price" value={nftForm.price} onChange={(e) => setNftForm((prev) => ({...prev, price: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-md" />
                <Button type="submit" disabled={isUpdating}>Update Price</Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
} 