import { useEffect, useRef, type MutableRefObject } from "react";
import { useAccount, useKeyStore } from "@orderly.network/hooks";
import type { OrderlyKeyStore } from "@orderly.network/core";
import type { NetworkId } from "@orderly.network/types";
import bs58 from "bs58";
import { getRuntimeConfig } from "@/utils/runtime-config";

interface StarchildCredentialsRequest {
	pubKey: string;
	nonce: string;
	scope: string;
}

interface StarchildCredentialsResult {
	ciphertext: string;
	accountId: string;
	brokerId: string;
	networkId?: "mainnet" | "testnet";
}

interface BridgeState {
	address: string | undefined;
	accountId: string | undefined;
	keyStore: OrderlyKeyStore | undefined;
}

export type StarchildBridgeRef = MutableRefObject<BridgeState>;

export function useStarchildBridgeRef(): StarchildBridgeRef {
	return useRef<BridgeState>({ address: undefined, accountId: undefined, keyStore: undefined });
}

// Renders nothing; keeps `bridgeRef` in sync with hooks that can only be read
// from inside the OrderlyAppProvider tree, so the credentials callback (which
// is handed to OrderlyAppProvider itself) can read them imperatively.
export function StarchildCredentialsBridge({ bridgeRef }: { bridgeRef: StarchildBridgeRef }) {
	const { state } = useAccount();
	const keyStore = useKeyStore();

	useEffect(() => {
		bridgeRef.current = {
			address: state?.address,
			accountId: state?.accountId,
			keyStore,
		};
	});

	return null;
}

async function pemToRsaPublicKey(pem: string): Promise<CryptoKey> {
	const b64 = pem
		.replace(/-----BEGIN PUBLIC KEY-----/g, "")
		.replace(/-----END PUBLIC KEY-----/g, "")
		.replace(/\s/g, "");
	const binary = atob(b64);
	const keyBytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		keyBytes[i] = binary.charCodeAt(i);
	}
	return crypto.subtle.importKey(
		"spki",
		keyBytes.buffer,
		{ name: "RSA-OAEP", hash: "SHA-256" },
		false,
		["encrypt"]
	);
}

// The SDK's own keyStore is inconsistent about the "ed25519:" prefix depending
// on the code path that wrote it, so strip it defensively before bs58-decoding
// (matches the normalization the Orderly SDK itself does internally).
function normalizeOrderlySecret(secret: string): string {
	const trimmed = secret.trim();
	return trimmed.startsWith("ed25519:") ? trimmed.slice("ed25519:".length) : trimmed;
}

export function createGetOrderlyCredentials(bridgeRef: StarchildBridgeRef, networkId: NetworkId) {
	return async (req: StarchildCredentialsRequest): Promise<StarchildCredentialsResult> => {
		const { address, accountId, keyStore } = bridgeRef.current;
		const brokerId = getRuntimeConfig("VITE_ORDERLY_BROKER_ID");

		if (!address || !keyStore) {
			throw new Error("Wallet not connected");
		}
		if (!brokerId) {
			throw new Error("Broker id not configured");
		}

		const orderlyKey = keyStore.getOrderlyKey(address);
		if (!orderlyKey) {
			throw new Error("Enable trading on the exchange first");
		}
		if (!accountId) {
			throw new Error("Orderly account id not available yet");
		}

		const secretBytes = bs58.decode(normalizeOrderlySecret(orderlyKey.secretKey));
		const cryptoKey = await pemToRsaPublicKey(req.pubKey);
		const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, cryptoKey, secretBytes);
		const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

		return {
			ciphertext,
			accountId,
			brokerId,
			networkId,
		};
	};
}
