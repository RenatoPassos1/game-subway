import { ethers, parseEther, parseUnits, formatEther, formatUnits } from 'ethers';
import pino from 'pino';
import { config } from './config.js';

const logger = pino({ name: 'tx-executor' });

// ============ USDT BEP-20 minimal ABI (transfer + balanceOf) ============

const USDT_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// ============ Types ============

export interface WalletBalances {
  bnb: string;
  usdt: string;
}

// ============ TransactionExecutor ============

export class TransactionExecutor {
  public readonly wallet: ethers.Wallet;
  public readonly provider: ethers.JsonRpcProvider;
  public readonly usdtContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.BNB_RPC_URL, {
      name: 'bnb',
      chainId: 56,
    });

    this.wallet = new ethers.Wallet(config.HOT_WALLET_KEY, this.provider);

    this.usdtContract = new ethers.Contract(
      config.USDT_CONTRACT,
      USDT_ABI,
      this.wallet,
    );

    logger.info(
      { hotWallet: this.wallet.address },
      'TransactionExecutor initialized',
    );
  }

  /**
   * Execute a BNB payout to the winner's wallet.
   * @param toAddress - Recipient wallet address
   * @param amountBNB - Amount in BNB (as a human-readable string, e.g. "0.5")
   * @returns Transaction hash
   */
  async executePayoutBNB(toAddress: string, amountBNB: string): Promise<string> {
    logger.info({ to: toAddress, amount: amountBNB }, 'Executing BNB payout');

    // Build transaction
    const tx: ethers.TransactionRequest = {
      to: toAddress,
      value: parseEther(amountBNB),
    };

    // Estimate gas
    const gasEstimate = await this.provider.estimateGas({
      ...tx,
      from: this.wallet.address,
    });
    logger.info({ gasEstimate: gasEstimate.toString() }, 'Gas estimated');

    // Get current fee data
    const feeData = await this.provider.getFeeData();
    tx.gasLimit = gasEstimate;
    tx.gasPrice = feeData.gasPrice;

    // Sign and send
    const sentTx = await this.wallet.sendTransaction(tx);
    logger.info({ txHash: sentTx.hash }, 'BNB transaction sent, awaiting confirmation');

    // Wait for 1 confirmation
    const receipt = await sentTx.wait(1);
    if (!receipt || receipt.status !== 1) {
      throw new Error(`BNB payout transaction reverted: ${sentTx.hash}`);
    }

    logger.info(
      {
        txHash: sentTx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      },
      'BNB payout confirmed',
    );

    return sentTx.hash;
  }

  /**
   * Execute a USDT (BEP-20) payout to the winner's wallet.
   * USDT on BSC uses 18 decimals.
   * @param toAddress - Recipient wallet address
   * @param amountUSDT - Amount in USDT (as a human-readable string, e.g. "100.50")
   * @returns Transaction hash
   */
  async executePayoutUSDT(toAddress: string, amountUSDT: string): Promise<string> {
    logger.info({ to: toAddress, amount: amountUSDT }, 'Executing USDT payout');

    // USDT on BSC has 18 decimals
    const parsedAmount = parseUnits(amountUSDT, 18);

    // Execute the transfer
    const tx = await this.usdtContract.transfer(toAddress, parsedAmount);
    logger.info({ txHash: tx.hash }, 'USDT transaction sent, awaiting confirmation');

    // Wait for 1 confirmation
    const receipt = await tx.wait(1);
    if (!receipt || receipt.status !== 1) {
      throw new Error(`USDT payout transaction reverted: ${tx.hash}`);
    }

    logger.info(
      {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      },
      'USDT payout confirmed',
    );

    return tx.hash;
  }

  /**
   * Check the hot wallet's BNB and USDT balance.
   */
  async getHotWalletBalance(): Promise<WalletBalances> {
    const [bnbBalance, usdtBalance] = await Promise.all([
      this.provider.getBalance(this.wallet.address),
      this.usdtContract.balanceOf(this.wallet.address) as Promise<bigint>,
    ]);

    const balances: WalletBalances = {
      bnb: formatEther(bnbBalance),
      usdt: formatUnits(usdtBalance, 18),
    };

    logger.info(
      { wallet: this.wallet.address, ...balances },
      'Hot wallet balances',
    );

    return balances;
  }
}
