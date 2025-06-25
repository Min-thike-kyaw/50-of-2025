'use client';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import networkMapping from "../../../constants/networkMapping.json"
import NftMarketplaceAbi from "../../../constants/NftMarketplace.json"
import Button from "./Button";
import { formatUnits } from "viem";

export default function Proceed () {
    const { isConnected, address } = useAccount()
    const { writeContract, data: hash, error: writeContractError } = useWriteContract()
    const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
        hash,
      })
    
    const NFTMarketplaceAddress = networkMapping["31337"].NftMarketplace[0]

    const { data: proceed } = useReadContract({
        address: NFTMarketplaceAddress as `0x${string}`,
        abi: NftMarketplaceAbi,
        functionName: 'getProceed',
        args: [address],
        query: {
            enabled: !!isConnected
        }
    })

    const withdraw = () => {
        if(confirm("Are you sure you want to withdraw?")) {
            writeContract({
                address: NFTMarketplaceAddress as `0x${string}`,
                abi: NftMarketplaceAbi,
                functionName: 'withdrawProceeds',
                args: [],
            })
        }
    }

    if(!isConnected) {
        return null;
    }
    return (
        <div>
            You Have {proceed ? formatUnits(BigInt(proceed as number), 18) : 0} ETH in Proceeds {proceed as number > 0 ? <Button onClick={() => withdraw()}>Withdraw</Button> : <></>}
        </div>
    )

}