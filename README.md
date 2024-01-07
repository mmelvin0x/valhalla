# Valhalla Program

## Overview

The Valhalla program is a Solana-based smart contract designed to create and manage lockers and locks for token management. It allows users to initiate lockers, create locks with specific unlock dates, and handle various token-related operations within these locks.

## Program Address

D93S1f9iaTDXaLXXeyFVLcXX7wJiCBbk2Jqe1SmbWk2k

## Features

- **Locker Initialization**: Initialize new locker accounts with specified fees.
- **Locker Fee Management**: Update locker fees.
- **Lock Creation**: Create locks with defined unlock dates and deposit amounts.
- **Token Operations**: Deposit to, extend, withdraw from, and close locks.

## Instructions

1. **init**: Initializes a new locker.
2. **updateLockerFee**: Updates the fee of a locker.
3. **createLock**: Creates a new lock with specific parameters.
4. **depositToLock**: Deposits tokens into a lock.
5. **extendLock**: Extends the unlock date of a lock.
6. **withdrawFromLock**: Withdraws tokens from a lock.
7. **closeLock**: Closes a lock.

## Accounts

- **Locker**: Stores information about the treasury, admin, and fee.
- **Lock**: Holds details about the user, mint, lockTokenAccount, userTokenAccount, lockedDate, and unlockDate.

## Errors

- `InvalidUnlockDate`: Lock duration is invalid.
- `Locked`: The lock has not expired yet.
- `Unauthorized`: Not authorized to perform this action.

## Getting Started

To integrate or interact with this program, follow these steps:

1. **Install the Solana CLI**: Make sure you have the Solana CLI installed on your system.
2. **Connect to Solana**: Connect to the Solana network (mainnet, testnet, or devnet).
3. **Deploy the Program**: Deploy the Valhalla program to your Solana cluster.
4. **Interact with the Program**: Use the Solana CLI or a Solana client library in your preferred programming language to interact with the program.

## Development

This project welcomes contributions and suggestions. Feel free to fork the repository, make changes, and submit pull requests.

## License

Specify the license under which this program is available.

## Contact

For support or contributions, please contact [@mmelvin0x](https://twitter.com/mmelvin0x).

---

For more detailed information and technical references, please refer to the official documentation.
