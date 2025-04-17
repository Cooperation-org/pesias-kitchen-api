import { configureChains, createConfig } from 'wagmi'
import { celo, celoAlfajores } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const { chains, publicClient, webSocketPublicClient } = configureChains(
    [celo, celoAlfajores],
    [
        jsonRpcProvider({
            rpc: (chain) => ({
                http: `https://forno.celo.org`
            })
        }),
        publicProvider
    ]
)

const config = createConfig({
    autoConnect: true,
    connectors: [
        new InjectedConnector({ chains }),
        new WalletConnectConnector({
            chains,
            options: {
                projectId: 'WALLETCONNECT_PROJECT_ID',
                showQrModal: true
            }
        })
    ],
    publicClient,
    webSocketPublicClient
})

module.exports = new goodCollectiveService()