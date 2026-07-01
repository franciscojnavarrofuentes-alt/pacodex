import { ReactNode, useEffect } from 'react';
import { WalletConnectorPrivyProvider, Network } from '@orderly.network/wallet-connector-privy';
import type { NetworkId } from "@orderly.network/types";
import { QueryClient } from "@tanstack/query-core";
import { getEvmConnectors, getSolanaConfig } from '../../utils/walletConfig';
import { getRuntimeConfig, getRuntimeConfigBoolean } from '@/utils/runtime-config';

// Fix: Radix UI FocusTrap blocks Privy MFA modal input.
// When Privy opens its modal on top of a Radix dialog, the FocusTrap
// sets inert on elements outside its scope, preventing typing in Privy's modal.
// This observer removes inert from Privy's modal container when detected.
function usePrivyFocusTrapFix() {
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const privyDialog = document.querySelector('.privy-dialog, .privy-modal, [class*="privy-dialog"], [class*="privy-modal"]') as HTMLElement | null;
      if (privyDialog) {
        let el: HTMLElement | null = privyDialog;
        while (el) {
          if (el.hasAttribute('inert')) {
            el.removeAttribute('inert');
          }
          el = el.parentElement;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['inert'] });
    return () => observer.disconnect();
  }, []);
}

type LoginMethod = "email" | "passkey" | "twitter" | "google";

const getLoginMethods = (): LoginMethod[] => {
  const loginMethodsEnv = getRuntimeConfig('VITE_PRIVY_LOGIN_METHODS');
  if (!loginMethodsEnv) {
    return ['email'];
  }
  
  const validMethods: LoginMethod[] = ["email", "passkey", "twitter", "google"];
  
  return loginMethodsEnv.split(',')
    .map((method: string) => method.trim())
    .filter((method: string): method is LoginMethod => 
      validMethods.includes(method as LoginMethod)
    );
};

const PrivyConnector = ({ children, networkId }: {
  children: ReactNode;
  networkId: NetworkId;
}) => {
  const appId = getRuntimeConfig('VITE_PRIVY_APP_ID');
  if (!appId) {
    throw new Error(`VITE_PRIVY_APP_ID not set`)
  }
  const termsOfUseUrl = getRuntimeConfig('VITE_PRIVY_TERMS_OF_USE');
  const enableAbstractWallet = getRuntimeConfigBoolean('VITE_ENABLE_ABSTRACT_WALLET');
  const disableEVMWallets = getRuntimeConfigBoolean('VITE_DISABLE_EVM_WALLETS');
  const disableSolanaWallets = getRuntimeConfigBoolean('VITE_DISABLE_SOLANA_WALLETS');
  const loginMethods = getLoginMethods();

  usePrivyFocusTrapFix();

  return (
    <WalletConnectorPrivyProvider
      network={networkId === 'mainnet' ? Network.mainnet : Network.testnet}
      termsOfUse={termsOfUseUrl}
      wagmiConfig={disableEVMWallets ? undefined : {
        connectors: getEvmConnectors()
      }}
      solanaConfig={disableSolanaWallets ? undefined : getSolanaConfig(networkId)}
      privyConfig={{
        config: {
          mfa: {
            noPromptOnMfaRequired: false,
          },
          appearance: {
            showWalletLoginFirst: false,
          },
          loginMethods: loginMethods,
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
            showWalletUIs: true,
          },
          fundingMethodConfig: {
            moonpay: {
              useSandbox: false,
            },
          },
        },
        appid: appId,
      }}
      abstractConfig={enableAbstractWallet ? {
        queryClient: new QueryClient(),
      } : undefined}
    >
      {children}
    </WalletConnectorPrivyProvider>
  );
};

export default PrivyConnector; 