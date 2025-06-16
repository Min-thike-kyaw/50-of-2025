"use client";

import { useEffect, useRef, useState } from "react";
import {
  useConnectModal,
  useAccountModal,
  useChainModal,
} from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";
import { emojiAvatarForAddress } from "@/lib/emojiAvatarForAddress";
import { middleEllipsis } from "@/lib/utils";
import Link from "next/link";

export default function Header() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const { isConnecting, address, isConnected, chain } = useAccount();
  const { color: backgroundColor, emoji } = emojiAvatarForAddress(
    address ?? ""
  );

  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();
  const { disconnect } = useDisconnect();

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    // Return a placeholder that matches your button's size during SSR
    return <div className="btn opacity-0">Connecting...</div>;
  }

  if (!isConnected) {
    return (
      <button
        className="btn"
        onClick={async () => {
          // Disconnecting wallet first because sometimes when is connected but the user is not connected
          if (isConnected) {
            disconnect();
          }
          openConnectModal?.();
        }}
        disabled={isConnecting}
      >
        { isConnecting ? 'Connecting...' : 'Connect your wallet' }
      </button>
    );
  }

  if (isConnected && !chain) {
    return (
      <button className="btn" onClick={openChainModal}>
        Wrong network
      </button>
    );
  }

  return (
    <div className="max-w-5xl w-full flex items-center justify-between">
      <Link href="/">Home</Link>
      <div className="flex px-4 py-2 gap-x-10 items-center">
        <div>
          <Link href="/sell-nft">Sell Nft</Link>
        </div>
        {/* <button className="btn" onClick={openChainModal}>
          Switch Networks
        </button> */}
        <div
        className="flex justify-center items-center px-4 py-2 border border-neutral-700 bg-neutral-800/30 rounded-xl font-mono font-bold gap-x-2 cursor-pointer"
        onClick={async () => openAccountModal?.()}
      >
        <div
          role="button"
          tabIndex={1}
          className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{
            backgroundColor,
            boxShadow: "0px 2px 2px 0px rgba(81, 98, 255, 0.20)",
          }}
        >
          {emoji}
        </div>
        <p>{middleEllipsis(address as string, 8) || ""}</p>
      </div>
      </div>
    </div>
  );
};
