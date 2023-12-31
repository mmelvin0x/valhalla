export type Valhalla = {
  version: "0.1.0";
  name: "valhalla";
  constants: [
    {
      name: "LOCKER_SEED";
      type: "bytes";
      value: "[108, 111, 99, 107, 101, 114]";
    },
    {
      name: "LOCK_SEED";
      type: "bytes";
      value: "[108, 111, 99, 107]";
    },
    {
      name: "LOCK_TOKEN_ACCOUNT_SEED";
      type: "bytes";
      value: "[116, 111, 107, 101, 110]";
    }
  ];
  instructions: [
    {
      name: "init";
      docs: [
        "# Initializes a new locker.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the locker account.",
        "1. `[writable]` The locker account to be initialized.",
        "2. `[]` The treasury account.",
        "3. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* `fee` - The fee to be charged for each lock."
      ];
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
        },
        {
          name: "locker";
          isMut: true;
          isSigner: false;
        },
        {
          name: "treasury";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "fee";
          type: "u64";
        }
      ];
    },
    {
      name: "updateLockerFee";
      docs: [
        "# Updates the fee of a locker.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the locker account.",
        "1. `[writable]` The locker account.",
        "2. `[]` The treasury account.",
        "",
        "## Arguments",
        "",
        "* `new_fee` - The new fee of the locker.",
        "",
        "## Errors",
        "",
        "* `Unauthorized` - The signer is not the current admin."
      ];
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
        },
        {
          name: "locker";
          isMut: true;
          isSigner: false;
        },
        {
          name: "treasury";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "fee";
          type: "u64";
        }
      ];
    },
    {
      name: "createLock";
      docs: [
        "# Creates a new lock.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the lock account.",
        "1. `[]` The public key of the treasury.",
        "2. `[writable]` The locker account.",
        "3. `[writable]` The lock account to be initialized.",
        "4. `[writable]` The lock token account to be initialized.",
        "5. `[writable]` The owner token account.",
        "6. `[]` The mint account.",
        "7. `[executable]` The token program.",
        "8. `[executable]` The associated token program.",
        "9. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* `unlock_date` - The unlock date of the lock.",
        "* `amount_to_be_vested` - The amount of tokens to be deposited into the lock.",
        "",
        "## Errors",
        "",
        "`InvalidUnlockDate` - The unlock date is invalid. Must be in the future."
      ];
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "locker";
          isMut: false;
          isSigner: false;
        },
        {
          name: "treasury";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lock";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lockTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "unlockDate";
          type: "u64";
        },
        {
          name: "depositAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "depositToLock";
      docs: [
        "# Deposits tokens into a lock.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the lock account.",
        "1. `[writable]` The lock account.",
        "2. `[writable]` The lock token account.",
        "3. `[writable]` The owner token account.",
        "4. `[]` The mint account.",
        "5. `[executable]` The token program.",
        "6. `[executable]` The associated token program.",
        "7. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* `amount_to_be_vested` - The amount of tokens to be deposited into the lock."
      ];
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "lock";
          isMut: false;
          isSigner: false;
        },
        {
          name: "lockTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "depositAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "extendLock";
      docs: [
        "# Extends the unlock date of a lock.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the lock account.",
        "1. `[writable]` The lock account.",
        "2. `[]` The mint account.",
        "3. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* `new_unlock_date` - The new unlock date.",
        "",
        "## Errors",
        "",
        "* `InvalidUnlockDate` - The new unlock date is invalid. Must be greater than the current unlock date."
      ];
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "lockTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lock";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "newUnlockDate";
          type: "u64";
        }
      ];
    },
    {
      name: "WithdrawToBeneficiary";
      docs: [
        "# Withdraws tokens from a lock.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the lock account.",
        "1. `[writable]` The locker account.",
        "2. `[writable]` The lock account.",
        "3. `[writable]` The lock token account.",
        "4. `[writable]` The owner token account.",
        "5. `[]` The mint account.",
        "6. `[executable]` The token program.",
        "7. `[executable]` The associated token program.",
        "8. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* `withdraw_amount` - The amount of tokens to be withdrawn from the lock.",
        "",
        "## Errors",
        "",
        "* `Locked` - The lock is still locked."
      ];
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "lock";
          isMut: false;
          isSigner: false;
        },
        {
          name: "lockTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "withdrawAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "closeLock";
      docs: [
        "# Closes a lock.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the lock account.",
        "1. `[writable]` The locker account.",
        "2. `[writable]` The lock account.",
        "3. `[writable]` The lock token account.",
        "4. `[]` The mint account.",
        "5. `[executable]` The token program.",
        "6. `[executable]` The associated token program.",
        "7. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* none",
        "",
        "## Errors",
        "",
        "* `Locked` - The lock is still locked."
      ];
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "lock";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lockTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "locker";
      type: {
        kind: "struct";
        fields: [
          {
            name: "treasury";
            type: "publicKey";
          },
          {
            name: "admin";
            type: "publicKey";
          },
          {
            name: "fee";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "lock";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "publicKey";
          },
          {
            name: "mint";
            type: "publicKey";
          },
          {
            name: "lockTokenAccount";
            type: "publicKey";
          },
          {
            name: "userTokenAccount";
            type: "publicKey";
          },
          {
            name: "lockedDate";
            type: "u64";
          },
          {
            name: "unlockDate";
            type: "u64";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidUnlockDate";
      msg: "Lock duration is invalid";
    },
    {
      code: 6001;
      name: "Locked";
      msg: "The lock has not expired yet";
    },
    {
      code: 6002;
      name: "Unauthorized";
      msg: "Not authorized to perform this action";
    }
  ];
};

export const IDL: Valhalla = {
  version: "0.1.0",
  name: "valhalla",
  constants: [
    {
      name: "LOCKER_SEED",
      type: "bytes",
      value: "[108, 111, 99, 107, 101, 114]",
    },
    {
      name: "LOCK_SEED",
      type: "bytes",
      value: "[108, 111, 99, 107]",
    },
    {
      name: "LOCK_TOKEN_ACCOUNT_SEED",
      type: "bytes",
      value: "[116, 111, 107, 101, 110]",
    },
  ],
  instructions: [
    {
      name: "init",
      docs: [
        "# Initializes a new locker.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the locker account.",
        "1. `[writable]` The locker account to be initialized.",
        "2. `[]` The treasury account.",
        "3. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* `fee` - The fee to be charged for each lock.",
      ],
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "locker",
          isMut: true,
          isSigner: false,
        },
        {
          name: "treasury",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "fee",
          type: "u64",
        },
      ],
    },
    {
      name: "updateLockerFee",
      docs: [
        "# Updates the fee of a locker.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the locker account.",
        "1. `[writable]` The locker account.",
        "2. `[]` The treasury account.",
        "",
        "## Arguments",
        "",
        "* `new_fee` - The new fee of the locker.",
        "",
        "## Errors",
        "",
        "* `Unauthorized` - The signer is not the current admin.",
      ],
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "locker",
          isMut: true,
          isSigner: false,
        },
        {
          name: "treasury",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "fee",
          type: "u64",
        },
      ],
    },
    {
      name: "createLock",
      docs: [
        "# Creates a new lock.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the lock account.",
        "1. `[]` The public key of the treasury.",
        "2. `[writable]` The locker account.",
        "3. `[writable]` The lock account to be initialized.",
        "4. `[writable]` The lock token account to be initialized.",
        "5. `[writable]` The owner token account.",
        "6. `[]` The mint account.",
        "7. `[executable]` The token program.",
        "8. `[executable]` The associated token program.",
        "9. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* `unlock_date` - The unlock date of the lock.",
        "* `amount_to_be_vested` - The amount of tokens to be deposited into the lock.",
        "",
        "## Errors",
        "",
        "`InvalidUnlockDate` - The unlock date is invalid. Must be in the future.",
      ],
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "locker",
          isMut: false,
          isSigner: false,
        },
        {
          name: "treasury",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lock",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lockTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "unlockDate",
          type: "u64",
        },
        {
          name: "depositAmount",
          type: "u64",
        },
      ],
    },
    {
      name: "depositToLock",
      docs: [
        "# Deposits tokens into a lock.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the lock account.",
        "1. `[writable]` The lock account.",
        "2. `[writable]` The lock token account.",
        "3. `[writable]` The owner token account.",
        "4. `[]` The mint account.",
        "5. `[executable]` The token program.",
        "6. `[executable]` The associated token program.",
        "7. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* `amount_to_be_vested` - The amount of tokens to be deposited into the lock.",
      ],
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "lock",
          isMut: false,
          isSigner: false,
        },
        {
          name: "lockTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "depositAmount",
          type: "u64",
        },
      ],
    },
    {
      name: "extendLock",
      docs: [
        "# Extends the unlock date of a lock.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the lock account.",
        "1. `[writable]` The lock account.",
        "2. `[]` The mint account.",
        "3. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* `new_unlock_date` - The new unlock date.",
        "",
        "## Errors",
        "",
        "* `InvalidUnlockDate` - The new unlock date is invalid. Must be greater than the current unlock date.",
      ],
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "lockTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lock",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "newUnlockDate",
          type: "u64",
        },
      ],
    },
    {
      name: "WithdrawToBeneficiary",
      docs: [
        "# Withdraws tokens from a lock.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the lock account.",
        "1. `[writable]` The locker account.",
        "2. `[writable]` The lock account.",
        "3. `[writable]` The lock token account.",
        "4. `[writable]` The owner token account.",
        "5. `[]` The mint account.",
        "6. `[executable]` The token program.",
        "7. `[executable]` The associated token program.",
        "8. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* `withdraw_amount` - The amount of tokens to be withdrawn from the lock.",
        "",
        "## Errors",
        "",
        "* `Locked` - The lock is still locked.",
      ],
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "lock",
          isMut: false,
          isSigner: false,
        },
        {
          name: "lockTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "withdrawAmount",
          type: "u64",
        },
      ],
    },
    {
      name: "closeLock",
      docs: [
        "# Closes a lock.",
        "",
        "## Accounts expected",
        "",
        "0. `[signer]` The payer account for the lock account.",
        "1. `[writable]` The locker account.",
        "2. `[writable]` The lock account.",
        "3. `[writable]` The lock token account.",
        "4. `[]` The mint account.",
        "5. `[executable]` The token program.",
        "6. `[executable]` The associated token program.",
        "7. `[executable]` The system program.",
        "",
        "## Arguments",
        "",
        "* none",
        "",
        "## Errors",
        "",
        "* `Locked` - The lock is still locked.",
      ],
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "lock",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lockTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "locker",
      type: {
        kind: "struct",
        fields: [
          {
            name: "treasury",
            type: "publicKey",
          },
          {
            name: "admin",
            type: "publicKey",
          },
          {
            name: "fee",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "lock",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "publicKey",
          },
          {
            name: "mint",
            type: "publicKey",
          },
          {
            name: "lockTokenAccount",
            type: "publicKey",
          },
          {
            name: "userTokenAccount",
            type: "publicKey",
          },
          {
            name: "lockedDate",
            type: "u64",
          },
          {
            name: "unlockDate",
            type: "u64",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidUnlockDate",
      msg: "Lock duration is invalid",
    },
    {
      code: 6001,
      name: "Locked",
      msg: "The lock has not expired yet",
    },
    {
      code: 6002,
      name: "Unauthorized",
      msg: "Not authorized to perform this action",
    },
  ],
};
