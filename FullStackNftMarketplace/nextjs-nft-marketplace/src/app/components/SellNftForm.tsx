"use client"
import { useEffect, useState } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import NftMarketplaceAbi from "../../../constants/NftMarketplace.json"
import Button from "./Button"
import networkMapping from "../../../constants/networkMapping.json"
import toast from "react-hot-toast"

export default function SellNftForm() {
  const { writeContract, data: hash, error: writeContractError } = useWriteContract()
	const NFTMarketplaceAddress = networkMapping["31337"].NftMarketplace[0]
  const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
  })
  const [form, setForm] = useState({
    price: 0,
    nftAddress: "",
    tokenId: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Submitting form with values:', form)
    
    try {
      console.log('Contract address:', NFTMarketplaceAddress)
      const result = writeContract({
        address: NFTMarketplaceAddress as `0x${string}`,
        abi: NftMarketplaceAbi,
        functionName: "listItem",
        args: [form.nftAddress as `0x${string}`, form.tokenId, form.price * 10 ** 18],
      })
      console.log('Transaction submitted:', result)
      console.log('Transaction hash:', hash)
    } catch (err) {
      console.error('Error submitting transaction:', err)
      console.error('Write contract error:', writeContractError)
    }
  }


  useEffect(()=> {
    if(isSuccess) {
      toast.success("NFT listed successfully")
    }
  }, [isSuccess])

  return (
    <div className="mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Sell NFT</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nftAddress" className="block text-sm font-medium text-gray-700">
            NFT Address
          </label>
          <input
            type="text"
            id="nftAddress"
            name="nftAddress"
            value={form.nftAddress}
            onChange={handleChange}
            className="mt-1 h-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700">
            Token ID
          </label>
          <input
            type="text"
            id="tokenId"
            name="tokenId"
            value={form.tokenId}
            onChange={handleChange}
            className="mt-1 h-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price (ETH)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="mt-1 h-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Selling...' : 'Sell NFT'}
        </Button>
        {isSuccess && <p className="text-green-600">NFT listed successfully!</p>}
        {isError && <p className="text-red-600">Error: {error?.message}</p>}
      </form>
    </div>
  )
}