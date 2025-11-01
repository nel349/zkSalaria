# Backup & Recovery Infrastructure for Midnight Ecosystem

**Status:** ⏸️ **OUT OF SCOPE** for Hackathon MVP
**Priority:** High (Post-Launch)
**Target:** Midnight Ecosystem Product/Service (benefits all dApps)
**Timeline:** 6-12 months after zkSalaria launch

---

## Executive Summary

**The Problem:**

Privacy-preserving dApps on Midnight Network store **private data locally** (encrypted balances, decryption keys, ZK proofs, user preferences). This data is at risk when users:
- Switch devices (laptop → phone)
- Change browsers (Chrome → Firefox)
- Clear browsing data
- Lose/break their device
- Reinstall their OS

**Current State:**
- No standardized backup/recovery solution in Midnight ecosystem
- Each dApp must build their own solution (duplication of effort)
- Users face data loss (bad UX, adoption barrier)

**Proposed Solution:**

Build a **Midnight Ecosystem Backup & Recovery Service** that:
1. ✅ Provides seed phrase recovery (like MetaMask)
2. ✅ Offers encrypted cloud backup (IPFS/Arweave)
3. ✅ Enables multi-device sync (E2E encrypted)
4. ✅ Works across all Midnight dApps (standardized SDK)
5. ✅ Non-custodial (user controls keys)

**Business Model:**
- Free tier: Wallet recovery + 10 MB backup
- Pro tier: Unlimited backup + multi-device sync ($5/month)
- Enterprise tier: Custom backup policies + compliance ($50/month)

**Target Market:**
- All Midnight dApps (zkSalaria, bank.compact, games, DeFi protocols)
- Enterprise customers (need compliance/audit trails)
- Privacy-conscious users (non-custodial requirement)

---

## The Problem in Detail

### Data Types Stored Locally in Midnight dApps

| Data Type | Example (zkSalaria) | Storage Location | Risk if Lost |
|-----------|---------------------|------------------|--------------|
| **Private Keys** | Employee decryption key | Midnight Wallet | 🔴 **CRITICAL** - Cannot decrypt salaries |
| **Cached Private Data** | Decrypted payment amounts | IndexedDB/localStorage | 🟡 **HIGH** - Must re-decrypt from blockchain |
| **ZK Proofs** | Income proof for lender | localStorage | 🟡 **HIGH** - Must regenerate proof (~30s) |
| **User Preferences** | Dashboard settings, filters | localStorage | 🟢 **LOW** - Reconfigure manually |
| **Session State** | Connected wallet, last viewed page | sessionStorage | 🟢 **LOW** - Reconnect wallet |

### Loss Scenarios (Real-World User Stories)

**Scenario 1: Alice Gets New Laptop**
```
Current State:
- Alice uses zkSalaria on her work laptop
- Has 28 salary payments (encrypted balances)
- Has 3 generated ZK proofs for lender

Alice's Work Laptop Dies:
❌ All private keys lost (cannot decrypt salaries)
❌ All cached data lost (must re-query blockchain)
❌ All ZK proofs lost (must regenerate)

Recovery WITHOUT Backup Infrastructure:
- Reinstall Midnight Wallet → Create new wallet → New address → Cannot access old salaries ❌
- Lost access to $140,000 in salary history

Recovery WITH Backup Infrastructure:
- Install Midnight Wallet → "Restore from seed phrase" → Enter 12 words → All keys restored ✅
- Install zkSalaria app → Auto-sync encrypted backup from IPFS → All data restored ✅
- Time to recover: 5 minutes
```

**Scenario 2: Bob Switches Browser (Chrome → Firefox)**
```
Current State:
- Bob uses zkSalaria on Chrome
- Has recurring payroll setup for 12 employees
- Has generated 50 ZK proofs (pay equity audits)

Bob Switches to Firefox:
❌ Wallet not connected (must reconnect)
❌ Cached employee data lost (must re-query blockchain)
❌ Recurring payment schedules lost (must re-fetch from smart contract)

Recovery WITHOUT Backup Infrastructure:
- Manually reconnect wallet ✅
- Manually re-fetch all data from blockchain (slow, ~30s per employee)
- Recurring schedules still work (stored on-chain) but UI must re-sync

Recovery WITH Backup Infrastructure:
- Wallet auto-syncs via browser extension ✅
- zkSalaria auto-restores cached data from IPFS ✅
- Time to recover: Instant (background sync)
```

**Scenario 3: Carol Clears Browsing Data**
```
Current State:
- Carol uses zkSalaria as employee
- Has 6 months of salary history cached
- Accidentally clears browsing data

After Clearing Data:
❌ All cached payments gone
❌ All generated proofs gone
❌ All preferences reset

Recovery WITHOUT Backup Infrastructure:
- Reconnect wallet ✅
- Re-query all payments from blockchain (slow, ~10s per payment)
- Regenerate all proofs (if needed)
- Reconfigure all preferences

Recovery WITH Backup Infrastructure:
- zkSalaria detects missing data → "Restore from backup?" → Yes → All data restored ✅
- Time to recover: 30 seconds
```

### Quantifying the Problem

**User Impact (zkSalaria MVP):**
- **200 users** (50 companies × 4 employees avg)
- **Assume 10% data loss rate per year** (20 users affected)
- **Average recovery time WITHOUT backup:** 30 minutes per user
- **Total time lost:** 600 minutes/year (10 hours)

**Midnight Ecosystem Impact:**
- **Assume 50 dApps** launched in first year
- **Assume 10,000 users** across all dApps
- **Assume 10% data loss rate per year** (1,000 users affected)
- **Average recovery time WITHOUT backup:** 30 minutes per user
- **Total time lost:** 30,000 minutes/year (500 hours)

**Cost of NOT Building This:**
- Lost user trust (privacy dApp that loses user data = bad optics)
- Support burden (users contacting each dApp for recovery help)
- Competitive disadvantage (Ethereum has MetaMask recovery, Midnight doesn't)

---

## Solution Architecture

### Overview: Multi-Layered Backup Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Midnight Wallet (Private Keys)                    │
│ • Seed phrase recovery (12-24 word mnemonic)                │
│ • HD wallet (deterministic key derivation)                  │
│ • Cross-device sync via seed phrase                         │
│ • Standard: BIP39/BIP44                                     │
│ • Status: ✅ Provided by Midnight Network                   │
└─────────────────────────────────────────────────────────────┘
           ↓ API
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Encrypted Cloud Backup (Cached Private Data)      │
│ • IPFS/Arweave storage (decentralized)                      │
│ • AES-256 encryption (user password-derived key)            │
│ • Automatic backup on data change                           │
│ • Status: 🔨 TO BUILD (Midnight Backup Service)             │
└─────────────────────────────────────────────────────────────┘
           ↓ Sync Protocol
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Multi-Device Sync (Real-Time Updates)             │
│ • Signal Protocol (E2E encrypted sync)                      │
│ • QR code device pairing                                    │
│ • WebSocket real-time sync                                  │
│ • Status: 🔨 TO BUILD (Midnight Sync Service)               │
└─────────────────────────────────────────────────────────────┘
           ↓ Used by
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: dApp Integration (zkSalaria, bank.compact, etc.)  │
│ • Import @midnight-network/backup-sdk                       │
│ • Call backup.save(data) on data change                     │
│ • Call backup.restore() on app load                         │
│ • Status: 🔨 TO BUILD (SDK + Documentation)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Solution 1: Midnight Wallet Seed Phrase Recovery

### Architecture (Existing, Provided by Midnight)

```
┌─────────────────────────────────────────────────────────────┐
│ Midnight Wallet (Browser Extension + Mobile App)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. User creates new wallet:                                 │
│    • Generate 12-word seed phrase (BIP39)                   │
│    • Derive private key: HD wallet (BIP44)                  │
│    • Display seed phrase: "Write this down!"                │
│    • User confirms: Re-enter 3 random words                 │
│                                                             │
│ 2. User recovers on new device:                             │
│    • Install wallet → "Restore from seed phrase"            │
│    • Enter 12 words → Derive same private key               │
│    • All accounts restored                                  │
│                                                             │
│ 3. dApp integration:                                        │
│    • zkSalaria requests wallet connection                   │
│    • Wallet provides public address                         │
│    • zkSalaria requests decryption                          │
│    • Wallet decrypts with private key                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### User Flow

**First-Time Setup:**

```
1. User visits zkSalaria.app
   ↓
2. Click "Connect Wallet"
   ↓
3. Midnight Wallet popup:
   ┌────────────────────────────────────┐
   │ Create New Wallet                  │
   ├────────────────────────────────────┤
   │                                    │
   │ Your 12-word seed phrase:          │
   │                                    │
   │ 1. abandon  2. ability  3. able    │
   │ 4. about    5. above    6. absent  │
   │ 7. absorb   8. abstract 9. absurd  │
   │ 10. abuse   11. access  12. account│
   │                                    │
   │ ⚠️ WRITE THIS DOWN!                │
   │ This is the ONLY way to recover    │
   │ your wallet.                       │
   │                                    │
   │ [I've written this down ✓]         │
   └────────────────────────────────────┘
   ↓
4. Verify seed phrase:
   ┌────────────────────────────────────┐
   │ Verify Seed Phrase                 │
   ├────────────────────────────────────┤
   │                                    │
   │ Enter word #3:  [able______]       │
   │ Enter word #7:  [absorb____]       │
   │ Enter word #11: [access____]       │
   │                                    │
   │ [Verify]                           │
   └────────────────────────────────────┘
   ↓
5. Wallet created ✅
   ↓
6. zkSalaria connected
```

**Recovery on New Device:**

```
1. User gets new laptop
   ↓
2. Install Midnight Wallet extension
   ↓
3. Click "Restore from seed phrase"
   ┌────────────────────────────────────┐
   │ Restore Wallet                     │
   ├────────────────────────────────────┤
   │                                    │
   │ Enter your 12-word seed phrase:    │
   │                                    │
   │ [abandon___] [ability___] [able___]│
   │ [about_____] [above_____] [absent_]│
   │ [absorb____] [abstract__] [absurd_]│
   │ [abuse_____] [access____] [account]│
   │                                    │
   │ [Restore Wallet]                   │
   └────────────────────────────────────┘
   ↓
4. Wallet restored ✅
   ↓
5. Visit zkSalaria.app → Connect wallet
   ↓
6. All salary data accessible (decrypt with restored keys)
```

### Implementation (dApp Side)

```typescript
// payroll-ui/src/hooks/useWallet.ts

import { MidnightWallet } from '@midnight-network/wallet-sdk';

export function useWallet() {
  const [wallet, setWallet] = useState<MidnightWallet | null>(null);

  async function connectWallet() {
    // Request wallet connection
    const wallet = await MidnightWallet.connect();

    // Get user address
    const address = await wallet.getAddress();

    // Save connection state (NOT keys!)
    localStorage.setItem('wallet_address', address);

    setWallet(wallet);
    return wallet;
  }

  async function decryptSalary(encryptedAmount: string) {
    if (!wallet) throw new Error('Wallet not connected');

    // Wallet handles decryption (keys never leave wallet)
    const decrypted = await wallet.decrypt(encryptedAmount);
    return decrypted;
  }

  return { wallet, connectWallet, decryptSalary };
}
```

### What This Solves

✅ **Private key recovery** (seed phrase = all keys)
✅ **Cross-device wallet access** (same seed phrase = same wallet)
✅ **Non-custodial** (user controls seed phrase, not zkSalaria)
✅ **Industry standard** (BIP39/BIP44, same as MetaMask/Ledger)

### What This DOESN'T Solve

❌ **Cached private data** (decrypted balances, generated proofs)
❌ **User preferences** (dashboard settings, filters)
❌ **Session state** (last viewed page, notification settings)

**Why?** These are stored in browser localStorage/IndexedDB, NOT in the wallet.

---

## Solution 2: Encrypted Cloud Backup (Midnight Backup Service)

### Architecture

**Proposed Service: Midnight Backup Service**

```
┌─────────────────────────────────────────────────────────────┐
│ dApp (zkSalaria, bank.compact, etc.)                        │
├─────────────────────────────────────────────────────────────┤
│ import { BackupSDK } from '@midnight-network/backup-sdk';   │
│                                                             │
│ const backup = new BackupSDK({                              │
│   appId: 'zksalaria',                                       │
│   userPassword: await getUserPassword()                     │
│ });                                                         │
│                                                             │
│ // Auto-backup on data change                               │
│ await backup.save({                                         │
│   cachedPayments: payments,                                 │
│   zkProofs: proofs,                                         │
│   preferences: settings                                     │
│ });                                                         │
└─────────────────────────────────────────────────────────────┘
           ↓ Encrypt with AES-256 (password-derived key)
┌─────────────────────────────────────────────────────────────┐
│ Encrypted Backup Blob (JSON)                                │
├─────────────────────────────────────────────────────────────┤
│ {                                                           │
│   "version": "1.0",                                         │
│   "appId": "zksalaria",                                     │
│   "timestamp": "2025-11-15T14:30:00Z",                      │
│   "data": "U2FsdGVkX1+...(encrypted)...=="                  │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
           ↓ Upload to decentralized storage
┌─────────────────────────────────────────────────────────────┐
│ Storage Layer (IPFS + Arweave)                              │
├─────────────────────────────────────────────────────────────┤
│ • IPFS: Fast retrieval, may expire                          │
│ • Arweave: Permanent storage, one-time fee                  │
│ • Redundancy: Store on both                                 │
│                                                             │
│ Backup CID: QmXyZ...1234                                    │
│ Arweave TxID: abc...5678                                    │
└─────────────────────────────────────────────────────────────┘
           ↓ Store backup reference
┌─────────────────────────────────────────────────────────────┐
│ Midnight Backup Registry (Smart Contract)                  │
├─────────────────────────────────────────────────────────────┤
│ mapping(address => BackupMetadata) public backups;          │
│                                                             │
│ struct BackupMetadata {                                     │
│   string ipfsCID;       // "QmXyZ...1234"                   │
│   string arweaveTxID;   // "abc...5678"                     │
│   uint256 timestamp;    // Last backup time                 │
│   string appId;         // "zksalaria"                      │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### User Flow

**Create Backup:**

```
Settings → Backup & Recovery → Create Backup
↓
Modal: "Enter backup password"
┌────────────────────────────────────────┐
│ Create Encrypted Backup                │
├────────────────────────────────────────┤
│                                        │
│ Password (min 12 characters):          │
│ [***************]                      │
│                                        │
│ Confirm password:                      │
│ [***************]                      │
│                                        │
│ ⚠️ Save this password securely!        │
│ You'll need it to restore your backup. │
│                                        │
│ [Create Backup]                        │
└────────────────────────────────────────┘
↓
Processing...
• Collecting data (128 payments, 5 proofs, preferences)
• Encrypting with your password (AES-256)
• Uploading to IPFS
• Uploading to Arweave (permanent storage)
• Registering backup on-chain
↓
Success! ✅
┌────────────────────────────────────────┐
│ Backup Created                         │
├────────────────────────────────────────┤
│                                        │
│ Backup ID: QmXyZ...1234                │
│ Arweave TX: abc...5678                 │
│ Size: 2.3 MB                           │
│ Created: Nov 15, 2025 @ 2:45 PM        │
│                                        │
│ ✅ Automatically backed up on-chain    │
│                                        │
│ [Download Recovery Kit (PDF)]          │
│ [Copy Backup ID]                       │
│ [Done]                                 │
└────────────────────────────────────────┘
```

**Restore Backup:**

```
New device/browser
↓
Settings → Backup & Recovery → Restore
↓
Modal: "Restore from backup"
┌────────────────────────────────────────┐
│ Restore from Backup                    │
├────────────────────────────────────────┤
│                                        │
│ Backup ID (IPFS CID or Arweave TX):    │
│ [QmXyZ...1234__________________]       │
│                                        │
│ Or, auto-detect from wallet:           │
│ [Auto-Detect] (checks on-chain registry)│
│                                        │
│ Backup password:                       │
│ [***************]                      │
│                                        │
│ [Restore Backup]                       │
└────────────────────────────────────────┘
↓
Processing...
• Downloading backup from IPFS
• Decrypting with your password
• Validating data integrity
• Restoring to local storage
↓
Success! ✅
┌────────────────────────────────────────┐
│ Backup Restored                        │
├────────────────────────────────────────┤
│                                        │
│ Restored:                              │
│ • 128 payment records                  │
│ • 5 ZK proofs                          │
│ • Dashboard preferences                │
│                                        │
│ Last backup: Nov 15, 2025 @ 2:45 PM    │
│                                        │
│ [Close]                                │
└────────────────────────────────────────┘
```

### Implementation

**SDK (for dApp developers):**

```typescript
// @midnight-network/backup-sdk/src/index.ts

import IPFS from 'ipfs-http-client';
import Arweave from 'arweave';
import CryptoJS from 'crypto-js';

export class BackupSDK {
  private appId: string;
  private userPassword: string;
  private ipfs: IPFS;
  private arweave: Arweave;

  constructor(config: { appId: string; userPassword: string }) {
    this.appId = config.appId;
    this.userPassword = config.userPassword;
    this.ipfs = IPFS.create({ host: 'ipfs.midnight.network', port: 5001 });
    this.arweave = Arweave.init({ host: 'arweave.net', port: 443 });
  }

  async save(data: any): Promise<BackupMetadata> {
    // 1. Serialize data
    const json = JSON.stringify({
      version: '1.0',
      appId: this.appId,
      timestamp: new Date().toISOString(),
      data
    });

    // 2. Encrypt with user password (AES-256)
    const encrypted = CryptoJS.AES.encrypt(json, this.userPassword).toString();

    // 3. Upload to IPFS
    const ipfsResult = await this.ipfs.add(encrypted);
    const ipfsCID = ipfsResult.cid.toString();

    // 4. Upload to Arweave (permanent storage)
    const tx = await this.arweave.createTransaction({ data: encrypted });
    await this.arweave.transactions.sign(tx);
    await this.arweave.transactions.post(tx);
    const arweaveTxID = tx.id;

    // 5. Register backup on-chain (Midnight smart contract)
    await this.registerBackup({
      ipfsCID,
      arweaveTxID,
      timestamp: Date.now(),
      appId: this.appId
    });

    return { ipfsCID, arweaveTxID, timestamp: Date.now() };
  }

  async restore(backupId: string): Promise<any> {
    // 1. Download from IPFS (or fallback to Arweave)
    let encrypted: string;
    try {
      encrypted = await this.downloadFromIPFS(backupId);
    } catch (error) {
      console.warn('IPFS failed, trying Arweave...');
      encrypted = await this.downloadFromArweave(backupId);
    }

    // 2. Decrypt with user password
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.userPassword);
      const json = decrypted.toString(CryptoJS.enc.Utf8);
      const backup = JSON.parse(json);

      // 3. Validate backup
      if (backup.appId !== this.appId) {
        throw new Error('Backup is for different app');
      }

      return backup.data;
    } catch (error) {
      throw new Error('Invalid password or corrupted backup');
    }
  }

  async autoDetectBackup(walletAddress: string): Promise<string | null> {
    // Query on-chain registry for latest backup
    const metadata = await this.getBackupMetadata(walletAddress);
    return metadata?.ipfsCID || null;
  }
}
```

**Usage in zkSalaria:**

```typescript
// payroll-ui/src/services/backup.ts

import { BackupSDK } from '@midnight-network/backup-sdk';

class PayrollBackupService {
  private backup: BackupSDK;

  async initialize(userPassword: string) {
    this.backup = new BackupSDK({
      appId: 'zksalaria',
      userPassword
    });
  }

  async autoBackup() {
    // Collect all local data
    const data = {
      cachedPayments: await db.getAll('payments'),
      zkProofs: await db.getAll('proofs'),
      preferences: localStorage.getItem('preferences')
    };

    // Upload to cloud
    const metadata = await this.backup.save(data);

    // Save backup reference locally
    localStorage.setItem('last_backup', JSON.stringify(metadata));
  }

  async autoRestore() {
    // Try to auto-detect backup from wallet address
    const walletAddress = await wallet.getAddress();
    const backupId = await this.backup.autoDetectBackup(walletAddress);

    if (backupId) {
      const data = await this.backup.restore(backupId);

      // Restore to IndexedDB
      await db.putAll('payments', data.cachedPayments);
      await db.putAll('proofs', data.zkProofs);
      localStorage.setItem('preferences', data.preferences);
    }
  }
}
```

### Cost Analysis

**IPFS Storage:**
- Cost: Free (hosted by Midnight Foundation or dApp)
- Retention: ~1 year (pinned by Midnight nodes)
- Speed: Fast (CDN-like)

**Arweave Storage:**
- Cost: One-time fee (~$0.10 per MB)
- Retention: Permanent (200+ years guaranteed)
- Speed: Slower than IPFS

**Example (zkSalaria User with 2 MB Backup):**
- IPFS: Free
- Arweave: $0.20 one-time fee
- Total: $0.20 for permanent backup

**Midnight Backup Service Pricing:**
- Free Tier: 10 MB backup, 1 device
- Pro Tier: Unlimited backup, multi-device sync ($5/month)
- Enterprise: Custom retention, compliance features ($50/month)

### What This Solves

✅ **Cached private data recovery** (payments, proofs, preferences)
✅ **Cross-device data sync** (via backup restore)
✅ **Permanent storage** (Arweave = 200+ years)
✅ **Non-custodial** (user controls password, not Midnight)

### What This DOESN'T Solve

❌ **Real-time sync** (must manually restore on new device)
❌ **Automatic cross-device updates** (backup is snapshot, not live sync)

---

## Solution 3: Multi-Device Sync (Midnight Sync Service)

### Architecture

**Proposed Service: Midnight Sync Service (Signal Protocol E2E Encrypted Sync)**

```
┌─────────────────────────────────────────────────────────────┐
│ Device 1 (Laptop)                                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Enable sync:                                             │
│    • Generate sync key pair (ECDH)                          │
│    • Display QR code (contains public key)                  │
│                                                             │
│ 2. Data changes:                                            │
│    • New payment received → Encrypt with sync key           │
│    • Push to Midnight Sync Server (via WebSocket)          │
└─────────────────────────────────────────────────────────────┘
           ↓ E2E encrypted WebSocket
┌─────────────────────────────────────────────────────────────┐
│ Midnight Sync Server (Cannot Read Data)                    │
├─────────────────────────────────────────────────────────────┤
│ • Relays encrypted messages between devices                 │
│ • Does NOT have decryption keys                             │
│ • Just stores encrypted blobs temporarily                   │
│                                                             │
│ WebSocket rooms:                                            │
│ • user_abc123: [device1, device2, device3]                  │
└─────────────────────────────────────────────────────────────┘
           ↓ E2E encrypted WebSocket
┌─────────────────────────────────────────────────────────────┐
│ Device 2 (Phone)                                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Pair with Device 1:                                      │
│    • Scan QR code (gets public key)                         │
│    • Perform ECDH key exchange → Shared sync key            │
│                                                             │
│ 2. Auto-sync:                                               │
│    • Receive encrypted update from server                   │
│    • Decrypt with sync key                                  │
│    • Apply changes to local database                        │
└─────────────────────────────────────────────────────────────┘
```

### User Flow

**Setup Sync (Device 1 - Laptop):**

```
Settings → Multi-Device Sync → Enable Sync
↓
┌────────────────────────────────────────┐
│ Enable Multi-Device Sync               │
├────────────────────────────────────────┤
│                                        │
│ Scan this QR code with your other      │
│ device to sync your data.              │
│                                        │
│     ████████████████                   │
│     ██  ██  ██  ██  ██                 │
│     ████████████████                   │
│     ██  ██  ██  ██  ██                 │
│     ████████████████                   │
│                                        │
│ Or, enter this code manually:          │
│ ABCD-EFGH-1234-5678                    │
│                                        │
│ Waiting for device to connect...       │
└────────────────────────────────────────┘
```

**Pair Device 2 (Phone):**

```
Settings → Multi-Device Sync → Add Device
↓
[Scan QR Code from Device 1]
↓
Camera opens → Scan QR code
↓
┌────────────────────────────────────────┐
│ Pairing Device...                      │
├────────────────────────────────────────┤
│                                        │
│ Establishing encrypted connection...   │
│                                        │
│ ████████████████░░░░░░░░  60%          │
│                                        │
└────────────────────────────────────────┘
↓
Success! ✅
┌────────────────────────────────────────┐
│ Device Paired                          │
├────────────────────────────────────────┤
│                                        │
│ Your phone is now synced with your     │
│ laptop. All changes will sync          │
│ automatically.                         │
│                                        │
│ Syncing data...                        │
│ • 128 payment records                  │
│ • 5 ZK proofs                          │
│ • Dashboard preferences                │
│                                        │
│ [Done]                                 │
└────────────────────────────────────────┘
```

**Auto-Sync (Real-Time Updates):**

```
Device 1 (Laptop):
User receives new payment → Auto-sync to Device 2
↓
Device 2 (Phone):
Toast notification: "💰 New payment synced from laptop"
```

### Implementation

**SDK (for dApp developers):**

```typescript
// @midnight-network/sync-sdk/src/index.ts

import { SignalProtocol } from '@signalapp/libsignal';
import { io, Socket } from 'socket.io-client';

export class SyncSDK {
  private socket: Socket;
  private syncKey: CryptoKey;
  private deviceId: string;

  async initialize(walletAddress: string) {
    // Connect to Midnight Sync Server
    this.socket = io('wss://sync.midnight.network', {
      auth: { walletAddress }
    });

    // Generate device ID
    this.deviceId = await this.generateDeviceId();

    // Load or generate sync key
    this.syncKey = await this.loadOrGenerateSyncKey();

    // Listen for incoming sync messages
    this.socket.on('sync_update', async (encryptedData) => {
      const decrypted = await this.decrypt(encryptedData);
      await this.applyUpdate(decrypted);
    });
  }

  async generatePairingCode(): Promise<{ qrCode: string; code: string }> {
    const publicKey = await this.exportPublicKey();
    const code = this.encodeBase64(publicKey);
    const qrCode = await QRCode.toDataURL(code);

    return { qrCode, code };
  }

  async pairDevice(code: string) {
    // Decode pairing code
    const publicKey = this.decodeBase64(code);

    // Perform ECDH key exchange
    this.syncKey = await this.performKeyExchange(publicKey);

    // Join sync room
    this.socket.emit('join_sync_room', { walletAddress });

    // Request full sync from other device
    this.socket.emit('request_full_sync');
  }

  async syncData(data: any) {
    // Encrypt with sync key
    const encrypted = await this.encrypt(data);

    // Send to all synced devices (via server)
    this.socket.emit('sync_update', encrypted);
  }

  private async encrypt(data: any): Promise<string> {
    const json = JSON.stringify(data);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: this.generateIV() },
      this.syncKey,
      new TextEncoder().encode(json)
    );
    return this.encodeBase64(encrypted);
  }

  private async decrypt(encryptedData: string): Promise<any> {
    const encrypted = this.decodeBase64(encryptedData);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.extractIV(encrypted) },
      this.syncKey,
      encrypted
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  }
}
```

**Usage in zkSalaria:**

```typescript
// payroll-ui/src/services/sync.ts

import { SyncSDK } from '@midnight-network/sync-sdk';

class PayrollSyncService {
  private sync: SyncSDK;

  async initialize() {
    const walletAddress = await wallet.getAddress();
    this.sync = new SyncSDK();
    await this.sync.initialize(walletAddress);
  }

  async onPaymentReceived(payment: Payment) {
    // Save to local database
    await db.put('payments', payment);

    // Sync to other devices
    await this.sync.syncData({
      type: 'payment_received',
      payment
    });
  }

  async onSyncUpdate(update: any) {
    switch (update.type) {
      case 'payment_received':
        await db.put('payments', update.payment);
        showToast('💰 New payment synced from other device');
        break;
      case 'preference_changed':
        localStorage.setItem('preferences', update.preferences);
        break;
    }
  }
}
```

### Cost Analysis

**Midnight Sync Server:**
- WebSocket connections: ~$0.001/hour per device
- Storage (temporary): Free (encrypted blobs stored <24 hours)
- Bandwidth: ~$0.10/GB

**Example (zkSalaria User with 3 Devices):**
- 3 WebSocket connections × 24 hours/day × 30 days = 2,160 device-hours
- Cost: 2,160 × $0.001 = $2.16/month
- Bandwidth: ~100 MB/month = $0.01

**Total: ~$2.20/month per user (covered by Pro tier: $5/month)**

### What This Solves

✅ **Real-time cross-device sync** (instant updates)
✅ **Automatic** (no manual backup/restore)
✅ **End-to-end encrypted** (server cannot read data)
✅ **Multi-device support** (laptop, phone, tablet)

### What This DOESN'T Solve

❌ **Requires at least one device online** (to pair new devices)
❌ **Lost all devices = lost data** (need backup as well)

---

## Complete Solution: Hybrid Approach (All 3 Layers)

**Recommendation for Midnight Ecosystem:**

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Midnight Wallet (Private Keys)                    │
│ • Seed phrase recovery (12-24 words)                        │
│ • Status: ✅ Already provided by Midnight                   │
│ • Cost: Free                                                │
└─────────────────────────────────────────────────────────────┘
           +
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Midnight Backup Service (Encrypted Cloud Backup)  │
│ • IPFS + Arweave storage                                    │
│ • Status: 🔨 TO BUILD (6-12 months)                         │
│ • Cost: Free tier (10 MB), Pro tier ($5/month)              │
└─────────────────────────────────────────────────────────────┘
           +
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Midnight Sync Service (Real-Time Multi-Device)    │
│ • Signal Protocol E2E encrypted sync                        │
│ • Status: 🔨 TO BUILD (12-18 months)                        │
│ • Cost: Included in Pro tier ($5/month)                     │
└─────────────────────────────────────────────────────────────┘
```

**User Experience:**

1. **Setup (First Device):**
   - Create Midnight Wallet → Write down seed phrase ✅
   - Enable backup → Enter password → Auto-backup to IPFS ✅
   - Enable sync → Scan QR on phone → All devices synced ✅

2. **Daily Use:**
   - All devices sync in real-time (instant updates)
   - Auto-backup every 24 hours to IPFS/Arweave
   - No user action needed

3. **Recovery (New Device):**
   - Install Midnight Wallet → Restore from seed phrase ✅
   - Open zkSalaria → Auto-detect backup → Restore ✅
   - Pair with existing device → Sync enabled ✅

4. **Lost All Devices:**
   - Restore wallet from seed phrase ✅
   - Restore backup from IPFS/Arweave ✅
   - Everything recovered

---

## Business Model

### Midnight Backup & Sync Service (SaaS Product)

**Free Tier:**
- Midnight Wallet seed phrase recovery
- 10 MB encrypted cloud backup (IPFS only)
- 1 device sync
- 30-day backup retention
- Target: Individual users

**Pro Tier ($5/month):**
- Unlimited encrypted cloud backup (IPFS + Arweave)
- Unlimited device sync (real-time)
- Permanent backup retention (Arweave)
- Priority support
- Target: Power users, professionals

**Enterprise Tier ($50/month):**
- Custom backup policies (hourly, daily, weekly)
- Compliance features (GDPR, SOC 2)
- Audit logs (who accessed what, when)
- Dedicated support
- SLA (99.9% uptime)
- Target: Companies (for employee data)

**Revenue Projections:**

Assumptions:
- Year 1: 10,000 Midnight users
- 10% convert to Pro tier (1,000 users)
- 1% convert to Enterprise tier (100 users)

Revenue:
- Free tier: $0
- Pro tier: 1,000 × $5/month × 12 months = $60,000/year
- Enterprise tier: 100 × $50/month × 12 months = $60,000/year
- **Total: $120,000/year (Year 1)**

**Costs:**
- IPFS hosting: $500/month ($6,000/year)
- Arweave storage: $1,000/year (one-time per user)
- Sync server: $1,000/month ($12,000/year)
- Development: $200,000 (one-time)
- Support: $50,000/year
- **Total: $268,000 (Year 1)**

**Break-even:** ~3,000 Pro users or 300 Enterprise users

---

## Implementation Roadmap

### Phase 1 (Months 0-3): SDK Development

**Deliverables:**
- [ ] `@midnight-network/backup-sdk` (TypeScript)
  - [ ] Encrypt/decrypt with user password
  - [ ] Upload to IPFS
  - [ ] Upload to Arweave
  - [ ] Download from IPFS/Arweave
  - [ ] Smart contract backup registry
- [ ] Documentation (developer docs)
- [ ] Example integration (reference dApp)

**Team:**
- 2 engineers (6 engineer-months)
- Budget: $60,000

---

### Phase 2 (Months 3-6): Backup Service Infrastructure

**Deliverables:**
- [ ] IPFS nodes (hosted by Midnight Foundation)
- [ ] Arweave integration (one-time payment API)
- [ ] Smart contract backup registry (on Midnight Network)
- [ ] REST API (for backup management)
- [ ] Web dashboard (view/manage backups)

**Team:**
- 2 engineers + 1 DevOps (9 engineer-months)
- Budget: $90,000

---

### Phase 3 (Months 6-9): Sync Service Infrastructure

**Deliverables:**
- [ ] `@midnight-network/sync-sdk` (TypeScript)
  - [ ] Signal Protocol implementation
  - [ ] QR code pairing
  - [ ] WebSocket real-time sync
- [ ] Sync server (WebSocket server + Redis)
- [ ] Device management UI
- [ ] Multi-device testing

**Team:**
- 2 engineers + 1 DevOps (9 engineer-months)
- Budget: $90,000

---

### Phase 4 (Months 9-12): Production Launch

**Deliverables:**
- [ ] Integration with 5 pilot dApps (zkSalaria, bank.compact, etc.)
- [ ] Security audit (3rd party)
- [ ] Load testing (10,000 concurrent users)
- [ ] Marketing website
- [ ] User onboarding flow
- [ ] Free tier launch
- [ ] Pro tier launch (billing integration)

**Team:**
- 2 engineers + 1 marketing + 1 designer (12 person-months)
- Budget: $120,000

---

### Total Budget (Year 1)

**Development:**
- Phase 1: $60,000
- Phase 2: $90,000
- Phase 3: $90,000
- Phase 4: $120,000
- **Subtotal: $360,000**

**Infrastructure:**
- IPFS hosting: $6,000/year
- Arweave storage: $10,000/year (for all users)
- Sync server: $12,000/year
- **Subtotal: $28,000/year**

**Support & Marketing:**
- Support: $50,000/year
- Marketing: $30,000/year
- **Subtotal: $80,000/year**

**Total Year 1: $468,000**

---

## Competitive Advantage

**Why This is Strategic for Midnight Ecosystem:**

1. **Reduces Friction for dApp Adoption:**
   - Users won't lose data when switching devices
   - Non-custodial (preserves privacy ethos)
   - Standardized SDK (easy for dApp developers)

2. **Competitive Moat:**
   - Ethereum has MetaMask wallet recovery (seed phrase)
   - Ethereum does NOT have encrypted cloud backup for dApp data
   - Midnight would be FIRST blockchain with complete backup/sync solution

3. **Network Effects:**
   - More dApps integrate → More users need backup → More users subscribe to Pro tier
   - More users → More revenue → Better infrastructure → More dApps integrate

4. **Monetization:**
   - Recurring revenue ($5/month per Pro user)
   - Enterprise tier ($50/month for companies)
   - Scales with ecosystem growth

---

## Success Metrics

**Phase 1 (SDK Launch):**
- ✅ 5 dApps integrate Backup SDK
- ✅ 1,000 backups created (free tier)
- ✅ 10% restore success rate

**Phase 2 (Backup Service Launch):**
- ✅ 10 dApps integrate Backup SDK
- ✅ 5,000 backups created (free tier)
- ✅ 500 Pro tier subscribers ($2,500/month revenue)

**Phase 3 (Sync Service Launch):**
- ✅ 20 dApps integrate Sync SDK
- ✅ 10,000 users (free tier)
- ✅ 1,000 Pro tier subscribers ($5,000/month revenue)
- ✅ 50 Enterprise tier subscribers ($2,500/month revenue)
- ✅ **Total: $7,500/month revenue ($90,000/year)**

**Phase 4 (Year 2):**
- ✅ 50 dApps integrated
- ✅ 50,000 users (free tier)
- ✅ 5,000 Pro tier subscribers ($25,000/month revenue)
- ✅ 200 Enterprise tier subscribers ($10,000/month revenue)
- ✅ **Total: $35,000/month revenue ($420,000/year)**

**Break-even:** Month 18 (assuming steady growth)

---

## Conclusion

**Why Build This:**

1. **Critical UX Problem:** Privacy-preserving dApps on Midnight WILL face data loss issues without standardized backup/recovery.

2. **Ecosystem-Level Solution:** Benefits ALL Midnight dApps (not just zkSalaria).

3. **Competitive Advantage:** No other blockchain has this (Ethereum only has wallet recovery, not dApp data backup).

4. **Revenue Opportunity:** $420,000/year by Year 2 (conservative estimates).

5. **Strategic:** Reduces friction for dApp adoption, increases user retention, builds Midnight ecosystem moat.

**Recommended Next Steps:**

1. **Validate with zkSalaria MVP:** Identify exact data loss scenarios during hackathon testing
2. **Prototype Backup SDK:** Build minimal SDK for zkSalaria (1-2 weeks)
3. **Pilot with 3 dApps:** zkSalaria + 2 other Midnight dApps (3 months)
4. **Fundraise:** Midnight Foundation grant or external funding ($500k)
5. **Full Development:** 12-month roadmap to production launch

---

*This infrastructure is critical for Midnight's long-term success. Without it, every dApp will independently solve (or fail to solve) the same problem, leading to poor UX and user churn.*
