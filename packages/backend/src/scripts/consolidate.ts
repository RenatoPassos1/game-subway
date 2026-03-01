/**
 * Click Win - Fund Consolidation Script
 *
 * Sweeps USDT and BNB from all user deposit addresses
 * to the platform's consolidation wallet.
 *
 * Usage:
 *   npx tsx src/scripts/consolidate.ts              # dry-run (check balances only)
 *   npx tsx src/scripts/consolidate.ts --execute     # actually transfer funds
 *
 * Required env vars:
 *   DATABASE_URL       - PostgreSQL connection string
 *   HD_MNEMONIC        - HD wallet mnemonic (controls deposit addresses)
 *   CONSOLIDATION_WALLET - Destination wallet for all funds
 *   BSC_RPC_URL        - (optional) BSC RPC endpoint
 */

import { consolidateAll } from '../services/consolidation.service';
import { closePool } from '../db/client';

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');

async function main() {
  const mode = isExecute ? 'EXECUTE' : 'DRY-RUN';
  console.log(`\n=== Click Win Fund Consolidation (${mode}) ===\n`);

  if (!isExecute) {
    console.log('  This is a DRY RUN. No funds will be transferred.');
    console.log('  Use --execute flag to actually transfer funds.\n');
  }

  try {
    const summary = await consolidateAll(!isExecute);

    console.log('\n--- Summary ---');
    console.log(`  Total deposit addresses: ${summary.totalAddresses}`);
    console.log(`  Addresses with funds:    ${summary.addressesWithFunds}`);
    console.log(`  USDT swept:              ${summary.totalUsdtSwept} USDT`);
    console.log(`  BNB swept:               ${summary.totalBnbSwept} BNB`);

    if (summary.results.length > 0) {
      console.log('\n--- Details ---');
      for (const r of summary.results) {
        if (r.usdtSwept !== '0' || r.bnbSwept !== '0' || r.error) {
          console.log(`  ${r.address} (index ${r.derivationIndex})`);
          if (r.usdtSwept !== '0') console.log(`    USDT: ${r.usdtSwept}`);
          if (r.bnbSwept !== '0') console.log(`    BNB:  ${r.bnbSwept}`);
          if (r.txHashes.length > 0) {
            for (const tx of r.txHashes) {
              console.log(`    TX:   https://bscscan.com/tx/${tx}`);
            }
          }
          if (r.error) console.log(`    ERROR: ${r.error}`);
        }
      }
    }

    if (summary.errors.length > 0) {
      console.log(`\n--- Errors (${summary.errors.length}) ---`);
      for (const err of summary.errors) {
        console.log(`  ${err}`);
      }
    }

    console.log('\nDone.');
  } catch (err) {
    console.error('Consolidation failed:', (err as Error).message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
