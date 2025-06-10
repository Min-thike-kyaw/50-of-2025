'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import { config } from "./../../wagmi-config";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";


const queryClient = new QueryClient()

type Props = {
    children: React.ReactNode;
    cookie?: string | null;
  };

export default function Providers({ children, cookie }: Props) {
    const initialState = cookieToInitialState(config, cookie);
    return (
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
            theme={darkTheme({
                accentColor: "#0E76FD",
                accentColorForeground: "white",
                borderRadius: "large",
                fontStack: "system",
                overlayBlur: "small",
            })}
            >
                {children}
            </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }
  