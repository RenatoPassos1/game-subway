import { ethers } from 'ethers';
import pino from 'pino';
import { query } from '../db/client';
import { USDT_CONTRACT_BSC } from '../../../../shared/src/constants';

const logger = pino({ name: 'consolidation' });

// Minimal ERC-20 ABI for balanceOf + transfer
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

// Minimum thresholds (in wei / smallest unit)
const MIN_USDT_WEI = ethers.parseUnits('0.50', 18); // 0.50 USDT minimum to sweep
const MIN_BNB_WEI = ethers.parseEther('0.0005');     // 0.0005 BNB minimum to sweep
const GAS_FUND_AMOUNT = ethers.parseEther('0.0008');  // BNB to send for gas (~2 USDT transfers worth)
const GAS_LIMIT_ERC20 = 65_000n;                      // gas limit for ERC-20 transfer

export interface ConsolidationResult {
  address: string;
  derivationIndex: number;
  usdtSwept: string;
  bnbSwept: string;
  txHashes: string[];
  error?: string;
}

export interface ConsolidationSummary {
  totalAddresses: number;
  addressesWithFunds: number;
  totalUsdtSwept: string;
  totalBnbSwept: string;
  results: ConsolidationResult[];
  errors: string[];
}

/**
 * Get all deposit addresses from the database
 */
async function getAllDepositAddresses(): Promise<
  { address: string; derivation_index: number; user_id: string }[]
> {
  const { rows } = await query<{
    address: string;
    derivation_index: number;
    user_id: string;
  }>('SELECT address, derivation_index, user_id FROM deposit_addresses ORDER BY derivation_index ASC');
  return rows;
}

/**
 * Derive a signer (wallet) for a given derivation index from the mnemonic
 */
function deriveWallet(
  mnemonic: string,
  index: number,
  provider: ethers.JsonRpcProvider,
): ethers.Wallet {
  const hdNode = ethers.HDNodeWallet.fromMnemonic(
    ethers.Mnemonic.fromPhrase(mnemonic),
    `m/44'/60'/0'/0`,
  );
  const child = hdNode.deriveChild(index);
  return new ethers.Wallet(child.privateKey, provider);
}

/**
 * Consolidate all funds from deposit addresses to the consolidation wallet.
 *
 * @param dryRun - If true, only check balances without transferring
 */
export async function consolidateAll(dryRun = false): Promise<ConsolidationSummary> {
  const HD_MNEMONIC = process.env.HD_MNEMONIC;
  const CONSOLIDATION_WALLET = process.env.CONSOLIDATION_WALLET;
  const BSC_RPC_URL = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/';

  if (!HD_MNEMONIC) throw new Error('HD_MNEMONIC env var not configured');
  if (!CONSOLIDATION_WALLET) throw new Error('CONSOLIDATION_WALLET env var not configured');

  if (!ethers.isAddress(CONSOLIDATION_WALLET)) {
    throw new Error(`Invalid CONSOLIDATION_WALLET address: ${CONSOLIDATION_WALLET}`);
  }

  const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
  const usdtContract = new ethers.Contract(USDT_CONTRACT_BSC, ERC20_ABI, provider);

  // Get the consolidation wallet signer (index 0 from mnemonic or separate key)
  // We'll use a dedicated private key or derive from index 0
  const consolidationSigner = new ethers.Wallet(
    ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(HD_MNEMONIC),
      `m/44'/60'/0'/0`,
    ).deriveChild(0).privateKey,
    provider,
  );

  const depositAddresses = await getAllDepositAddresses();
  logger.info({ count: depositAddresses.length }, 'Found deposit addresses');

  const summary: ConsolidationSummary = {
    totalAddresses: depositAddresses.length,
    addressesWithFunds: 0,
    totalUsdtSwept: '0',
    totalBnbSwept: '0',
    results: [],
    errors: [],
  };

  let totalUsdtWei = 0n;
  let totalBnbWei = 0n;

  for (const dep of depositAddresses) {
    const result: ConsolidationResult = {
      address: dep.address,
      derivationIndex: dep.derivation_index,
      usdtSwept: '0',
      bnbSwept: '0',
      txHashes: [],
    };

    try {
      // Check balances
      const usdtBalance: bigint = await usdtContract.balanceOf(dep.address);
      const bnbBalance: bigint = await provider.getBalance(dep.address);

      const hasUsdt = usdtBalance >= MIN_USDT_WEI;
      const hasBnb = bnbBalance >= MIN_BNB_WEI;

      if (!hasUsdt && !hasBnb) {
        logger.debug(
          { address: dep.address, usdt: ethers.formatUnits(usdtBalance, 18), bnb: ethers.formatEther(bnbBalance) },
          'No funds to sweep',
        );
        continue;
      }

      summary.addressesWithFunds++;
      const wallet = deriveWallet(HD_MNEMONIC, dep.derivation_index, provider);

      // Verify derived address matches
      if (wallet.address.toLowerCase() !== dep.address.toLowerCase()) {
        const msg = `Address mismatch! DB: ${dep.address}, Derived: ${wallet.address}`;
        logger.error(msg);
        result.error = msg;
        summary.errors.push(msg);
        summary.results.push(result);
        continue;
      }

      logger.info({
        address: dep.address,
        usdtBalance: ethers.formatUnits(usdtBalance, 18),
        bnbBalance: ethers.formatEther(bnbBalance),
        dryRun,
      }, 'Found funds');

      if (dryRun) {
        result.usdtSwept = ethers.formatUnits(usdtBalance, 18);
        result.bnbSwept = ethers.formatEther(bnbBalance);
        totalUsdtWei += usdtBalance;
        totalBnbWei += bnbBalance;
        summary.results.push(result);
        continue;
      }

      // ---- USDT Transfer ----
      if (hasUsdt) {
        // Check if address has enough BNB for gas
        const currentBnb = await provider.getBalance(dep.address);
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice ?? ethers.parseUnits('3', 'gwei');
        const estimatedGas = gasPrice * GAS_LIMIT_ERC20;

        if (currentBnb < estimatedGas) {
          // Fund gas from consolidation wallet
          logger.info(
            { address: dep.address, needed: ethers.formatEther(estimatedGas) },
            'Funding gas for USDT sweep',
          );
          const gasTx = await consolidationSigner.sendTransaction({
            to: dep.address,
            value: GAS_FUND_AMOUNT,
          });
          await gasTx.wait(1);
          logger.info({ txHash: gasTx.hash }, 'Gas funded');
        }

        // Transfer USDT
        const usdtWithSigner = new ethers.Contract(USDT_CONTRACT_BSC, ERC20_ABI, wallet);
        const usdtTx = await usdtWithSigner.transfer(CONSOLIDATION_WALLET, usdtBalance, {
          gasLimit: GAS_LIMIT_ERC20,
        });
        const receipt = await usdtTx.wait(1);
        result.usdtSwept = ethers.formatUnits(usdtBalance, 18);
        result.txHashes.push(receipt.hash);
        totalUsdtWei += usdtBalance;
        logger.info(
          { address: dep.address, amount: result.usdtSwept, txHash: receipt.hash },
          'USDT swept',
        );
      }

      // ---- BNB Transfer (remaining after gas) ----
      const remainingBnb = await provider.getBalance(dep.address);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ?? ethers.parseUnits('3', 'gwei');
      const bnbTransferGas = gasPrice * 21_000n; // simple transfer gas

      if (remainingBnb > bnbTransferGas + MIN_BNB_WEI) {
        const bnbToSend = remainingBnb - bnbTransferGas;
        const bnbTx = await wallet.sendTransaction({
          to: CONSOLIDATION_WALLET,
          value: bnbToSend,
          gasLimit: 21_000,
        });
        const receipt = await bnbTx.wait(1);
        result.bnbSwept = ethers.formatEther(bnbToSend);
        result.txHashes.push(receipt.hash);
        totalBnbWei += bnbToSend;
        logger.info(
          { address: dep.address, amount: result.bnbSwept, txHash: receipt.hash },
          'BNB swept',
        );
      }
    } catch (err) {
      const msg = `Error sweeping ${dep.address}: ${(err as Error).message}`;
      logger.error({ err, address: dep.address }, 'Sweep failed');
      result.error = msg;
      summary.errors.push(msg);
    }

    summary.results.push(result);
  }

  summary.totalUsdtSwept = ethers.formatUnits(totalUsdtWei, 18);
  summary.totalBnbSwept = ethers.formatEther(totalBnbWei);

  logger.info(
    {
      totalAddresses: summary.totalAddresses,
      addressesWithFunds: summary.addressesWithFunds,
      totalUsdtSwept: summary.totalUsdtSwept,
      totalBnbSwept: summary.totalBnbSwept,
      errors: summary.errors.length,
      dryRun,
    },
    'Consolidation complete',
  );

  return summary;
}
