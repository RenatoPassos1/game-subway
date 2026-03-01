// ============================================================
// BSC Transaction Verification
// Verifies USDT (BEP-20) and native BNB transfers on BSC mainnet
// Uses Routescan API (BscScan-compatible)
// ============================================================

import pino from 'pino';

const logger = pino({ name: 'bsc-verify' });

const ROUTESCAN_API = 'https://api.routescan.io/v2/network/mainnet/evm/56/etherscan/api';
const OUR_WALLET = '0x2b77C4cD1a1955E51DF2D8eBE50187566c71Cc48';
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';

// ERC-20 Transfer event topic: Transfer(address,address,uint256)
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export interface BscVerifyResult {
  verified: boolean;
  status: string;
  amount: number | null;
  from: string | null;
  to: string | null;
  error: string | null;
}

/**
 * Verify a USDT BEP-20 transfer to our platform wallet.
 * Parses Transfer event logs from the transaction receipt.
 */
export async function verifyBscTransaction(txHash: string): Promise<BscVerifyResult> {
  try {
    // 1. Get transaction receipt (contains logs)
    const receiptUrl = `${ROUTESCAN_API}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}`;
    const receiptRes = await fetch(receiptUrl);
    const receiptData = await receiptRes.json() as any;

    if (!receiptData.result) {
      return {
        verified: false,
        status: 'TX_NOT_FOUND',
        amount: null,
        from: null,
        to: null,
        error: 'Transaction receipt not found. It may still be pending.',
      };
    }

    const receipt = receiptData.result;

    // Check if transaction was successful
    if (receipt.status !== '0x1') {
      return {
        verified: false,
        status: 'TX_REVERTED',
        amount: null,
        from: null,
        to: null,
        error: 'Transaction was reverted on-chain.',
      };
    }

    // Check the contract address matches USDT
    const txTo = (receipt.to || '').toLowerCase();
    if (txTo !== USDT_CONTRACT.toLowerCase()) {
      return {
        verified: false,
        status: 'WRONG_CONTRACT',
        amount: null,
        from: null,
        to: null,
        error: `Transaction target is not the USDT contract. Got: ${txTo}`,
      };
    }

    // Parse Transfer event logs
    const logs: any[] = receipt.logs || [];
    const transferLog = logs.find((log: any) => {
      if (!log.topics || log.topics.length < 3) return false;
      if (log.topics[0] !== TRANSFER_TOPIC) return false;
      // topic[2] = to address (padded to 32 bytes)
      const toAddress = '0x' + log.topics[2].slice(26).toLowerCase();
      return toAddress === OUR_WALLET.toLowerCase();
    });

    if (!transferLog) {
      return {
        verified: false,
        status: 'NO_TRANSFER_TO_WALLET',
        amount: null,
        from: receipt.from?.toLowerCase() || null,
        to: null,
        error: 'No USDT Transfer event found sending to our wallet.',
      };
    }

    // Decode amount from data (USDT has 18 decimals on BSC)
    const rawAmount = BigInt(transferLog.data);
    const amount = Number(rawAmount) / 1e18;

    // Decode from address from topic[1]
    const from = '0x' + transferLog.topics[1].slice(26).toLowerCase();
    const to = '0x' + transferLog.topics[2].slice(26).toLowerCase();

    logger.info({ txHash, from, to, amount }, 'USDT transaction verified');

    return {
      verified: true,
      status: 'CONFIRMED',
      amount,
      from,
      to,
      error: null,
    };
  } catch (err) {
    logger.error({ err, txHash }, 'Failed to verify BSC USDT transaction');
    return {
      verified: false,
      status: 'VERIFICATION_ERROR',
      amount: null,
      from: null,
      to: null,
      error: (err as Error).message,
    };
  }
}

/**
 * Verify a native BNB transfer to our platform wallet.
 * Checks the transaction value field directly.
 */
export async function verifyBnbTransaction(txHash: string): Promise<BscVerifyResult> {
  try {
    // 1. Get the transaction details
    const txUrl = `${ROUTESCAN_API}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`;
    const txRes = await fetch(txUrl);
    const txData = await txRes.json() as any;

    if (!txData.result) {
      return {
        verified: false,
        status: 'TX_NOT_FOUND',
        amount: null,
        from: null,
        to: null,
        error: 'Transaction not found. It may still be pending.',
      };
    }

    const tx = txData.result;

    // 2. Check recipient is our wallet
    const txTo = (tx.to || '').toLowerCase();
    if (txTo !== OUR_WALLET.toLowerCase()) {
      return {
        verified: false,
        status: 'WRONG_RECIPIENT',
        amount: null,
        from: tx.from?.toLowerCase() || null,
        to: txTo,
        error: `Transaction recipient is not our wallet. Got: ${txTo}`,
      };
    }

    // 3. Get receipt to check success status
    const receiptUrl = `${ROUTESCAN_API}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}`;
    const receiptRes = await fetch(receiptUrl);
    const receiptData = await receiptRes.json() as any;

    if (receiptData.result && receiptData.result.status !== '0x1') {
      return {
        verified: false,
        status: 'TX_REVERTED',
        amount: null,
        from: tx.from?.toLowerCase() || null,
        to: txTo,
        error: 'Transaction was reverted on-chain.',
      };
    }

    // 4. Decode native BNB value (18 decimals)
    const rawValue = BigInt(tx.value);
    const amount = Number(rawValue) / 1e18;

    if (amount <= 0) {
      return {
        verified: false,
        status: 'ZERO_VALUE',
        amount: 0,
        from: tx.from?.toLowerCase() || null,
        to: txTo,
        error: 'Transaction has zero BNB value.',
      };
    }

    const from = tx.from?.toLowerCase() || null;

    logger.info({ txHash, from, to: txTo, amount }, 'BNB transaction verified');

    return {
      verified: true,
      status: 'CONFIRMED',
      amount,
      from,
      to: txTo,
      error: null,
    };
  } catch (err) {
    logger.error({ err, txHash }, 'Failed to verify BNB transaction');
    return {
      verified: false,
      status: 'VERIFICATION_ERROR',
      amount: null,
      from: null,
      to: null,
      error: (err as Error).message,
    };
  }
}
