export type Valhalla = {
  version: "0.1.0";
  name: "valhalla";
  docs: [
    "The `valhalla` module contains functions for interacting with the Valhalla program."
  ];
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
      name: "adminInitialize";
      docs: [
        "Initializes the Valhalla program with the given context and fee.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the initialization.",
        "* `fee` - The fee to be charged for the initialization.",
        "",
        "# Errors",
        "",
        "Returns an error if the initialization fails."
      ];
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
          docs: ["The admin account that will sign the transaction."];
        },
        {
          name: "locker";
          isMut: true;
          isSigner: false;
          docs: ["The locker account that will be initialized."];
        },
        {
          name: "treasury";
          isMut: false;
          isSigner: false;
          docs: ["The treasury account that receives the fee."];
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
          docs: ["The system program account."];
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
      name: "adminUpdate";
      docs: [
        "Updates the fee for the Valhalla program with the given context and new fee.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the update.",
        "* `new_fee` - The new fee to be set.",
        "",
        "# Errors",
        "",
        "Returns an error if the update fails."
      ];
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
          docs: ["The current admin account."];
        },
        {
          name: "newAdmin";
          isMut: false;
          isSigner: false;
          docs: ["The new admin account."];
        },
        {
          name: "newTreasury";
          isMut: false;
          isSigner: false;
          docs: ["The new treasury account."];
        },
        {
          name: "locker";
          isMut: true;
          isSigner: false;
          docs: ["The Locker account to be updated."];
        },
        {
          name: "treasury";
          isMut: false;
          isSigner: false;
          docs: ["The current treasury account that receives the fee."];
        }
      ];
      args: [
        {
          name: "newFee";
          type: "u64";
        }
      ];
    },
    {
      name: "createLock";
      docs: [
        "Creates a lock with the given parameters.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the lock creation.",
        "* `amount_to_be_vested` - The amount to be vested.",
        "* `vesting_duration` - The duration of the vesting period.",
        "* `payout_interval` - The interval at which payouts will be made.",
        "* `cliff_payment_amount` - The amount to be paid at the cliff.",
        "* `cancel_authority` - The authority to cancel the lock.",
        "* `change_recipient_authority` - The authority to change the recipient of the lock.",
        "",
        "# Errors",
        "",
        "Returns an error if the lock creation fails."
      ];
      accounts: [
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "recipient";
          isMut: false;
          isSigner: false;
          docs: [
            "The account of the recipient who will receive the locked tokens."
          ];
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
          docs: ["The treasury where the fee will be sent too."];
        },
        {
          name: "lock";
          isMut: true;
          isSigner: false;
          docs: ["The lock PDA that will be created."];
        },
        {
          name: "lockTokenAccount";
          isMut: true;
          isSigner: false;
          docs: ["The token account for the lock PDA"];
        },
        {
          name: "funderTokenAccount";
          isMut: true;
          isSigner: false;
          docs: ["The funder's token account."];
        },
        {
          name: "recipientTokenAccount";
          isMut: true;
          isSigner: false;
          docs: ["The recipient's token account."];
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
          docs: ["The mint account for the tokens."];
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
          docs: ["The program that provides the token-related functionality."];
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
          docs: [
            "The program that provides the associated token functionality."
          ];
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
          docs: ["The system program."];
        }
      ];
      args: [
        {
          name: "amountToBeVested";
          type: "u64";
        },
        {
          name: "vestingDuration";
          type: "u64";
        },
        {
          name: "payoutInterval";
          type: "u64";
        },
        {
          name: "cliffPaymentAmount";
          type: "u64";
        },
        {
          name: "startDate";
          type: "u64";
        },
        {
          name: "cancelAuthority";
          type: {
            defined: "Authority";
          };
        },
        {
          name: "changeRecipientAuthority";
          type: {
            defined: "Authority";
          };
        }
      ];
    },
    {
      name: "disburse";
      docs: [
        "Disburses the vested amount for a lock.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the disbursement.",
        "",
        "# Errors",
        "",
        "Returns an error if the disbursement fails."
      ];
      accounts: [
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "funder";
          isMut: false;
          isSigner: false;
        },
        {
          name: "recipient";
          isMut: false;
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
          name: "recipientTokenAccount";
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
    },
    {
      name: "cancel";
      docs: [
        "Closes a lock.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the lock closure.",
        "",
        "# Errors",
        "",
        "Returns an error if the lock closure fails."
      ];
      accounts: [
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "funder";
          isMut: true;
          isSigner: false;
        },
        {
          name: "recipient";
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
          name: "funderTokenAccount";
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
    },
    {
      name: "update";
      docs: [
        "Updates the recipient of a lock.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the update.",
        "",
        "# Errors",
        "",
        "Returns an error if the update fails."
      ];
      accounts: [
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "funder";
          isMut: true;
          isSigner: false;
        },
        {
          name: "recipient";
          isMut: true;
          isSigner: false;
        },
        {
          name: "newRecipient";
          isMut: false;
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
            name: "admin";
            type: "publicKey";
          },
          {
            name: "treasury";
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
            name: "funder";
            type: "publicKey";
          },
          {
            name: "recipient";
            type: "publicKey";
          },
          {
            name: "mint";
            type: "publicKey";
          },
          {
            name: "cancelAuthority";
            type: {
              defined: "Authority";
            };
          },
          {
            name: "changeRecipientAuthority";
            type: {
              defined: "Authority";
            };
          },
          {
            name: "vestingDuration";
            type: "u64";
          },
          {
            name: "payoutInterval";
            type: "u64";
          },
          {
            name: "amountPerPayout";
            type: "u64";
          },
          {
            name: "startDate";
            type: "u64";
          },
          {
            name: "cliffPaymentAmount";
            type: "u64";
          },
          {
            name: "lastPaymentTimestamp";
            type: "u64";
          },
          {
            name: "cliffPaymentAmountPaid";
            type: "bool";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "Authority";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Neither";
          },
          {
            name: "Funder";
          },
          {
            name: "Recipient";
          },
          {
            name: "Both";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "Locked";
      msg: "The lock has not expired yet";
    },
    {
      code: 6001;
      name: "Unauthorized";
      msg: "Not authorized to perform this action";
    },
    {
      code: 6002;
      name: "InsufficientFundsForDeposit";
      msg: "You do not have enough tokens to perform this action";
    },
    {
      code: 6003;
      name: "NoPayout";
      msg: "No payout!";
    }
  ];
};

export const IDL: Valhalla = {
  version: "0.1.0",
  name: "valhalla",
  docs: [
    "The `valhalla` module contains functions for interacting with the Valhalla program.",
  ],
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
      name: "adminInitialize",
      docs: [
        "Initializes the Valhalla program with the given context and fee.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the initialization.",
        "* `fee` - The fee to be charged for the initialization.",
        "",
        "# Errors",
        "",
        "Returns an error if the initialization fails.",
      ],
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
          docs: ["The admin account that will sign the transaction."],
        },
        {
          name: "locker",
          isMut: true,
          isSigner: false,
          docs: ["The locker account that will be initialized."],
        },
        {
          name: "treasury",
          isMut: false,
          isSigner: false,
          docs: ["The treasury account that receives the fee."],
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
          docs: ["The system program account."],
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
      name: "adminUpdate",
      docs: [
        "Updates the fee for the Valhalla program with the given context and new fee.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the update.",
        "* `new_fee` - The new fee to be set.",
        "",
        "# Errors",
        "",
        "Returns an error if the update fails.",
      ],
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
          docs: ["The current admin account."],
        },
        {
          name: "newAdmin",
          isMut: false,
          isSigner: false,
          docs: ["The new admin account."],
        },
        {
          name: "newTreasury",
          isMut: false,
          isSigner: false,
          docs: ["The new treasury account."],
        },
        {
          name: "locker",
          isMut: true,
          isSigner: false,
          docs: ["The Locker account to be updated."],
        },
        {
          name: "treasury",
          isMut: false,
          isSigner: false,
          docs: ["The current treasury account that receives the fee."],
        },
      ],
      args: [
        {
          name: "newFee",
          type: "u64",
        },
      ],
    },
    {
      name: "createLock",
      docs: [
        "Creates a lock with the given parameters.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the lock creation.",
        "* `amount_to_be_vested` - The amount to be vested.",
        "* `vesting_duration` - The duration of the vesting period.",
        "* `payout_interval` - The interval at which payouts will be made.",
        "* `cliff_payment_amount` - The amount to be paid at the cliff.",
        "* `cancel_authority` - The authority to cancel the lock.",
        "* `change_recipient_authority` - The authority to change the recipient of the lock.",
        "",
        "# Errors",
        "",
        "Returns an error if the lock creation fails.",
      ],
      accounts: [
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "recipient",
          isMut: false,
          isSigner: false,
          docs: [
            "The account of the recipient who will receive the locked tokens.",
          ],
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
          docs: ["The treasury where the fee will be sent too."],
        },
        {
          name: "lock",
          isMut: true,
          isSigner: false,
          docs: ["The lock PDA that will be created."],
        },
        {
          name: "lockTokenAccount",
          isMut: true,
          isSigner: false,
          docs: ["The token account for the lock PDA"],
        },
        {
          name: "funderTokenAccount",
          isMut: true,
          isSigner: false,
          docs: ["The funder's token account."],
        },
        {
          name: "recipientTokenAccount",
          isMut: true,
          isSigner: false,
          docs: ["The recipient's token account."],
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
          docs: ["The mint account for the tokens."],
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
          docs: ["The program that provides the token-related functionality."],
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
          docs: [
            "The program that provides the associated token functionality.",
          ],
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
          docs: ["The system program."],
        },
      ],
      args: [
        {
          name: "amountToBeVested",
          type: "u64",
        },
        {
          name: "vestingDuration",
          type: "u64",
        },
        {
          name: "payoutInterval",
          type: "u64",
        },
        {
          name: "cliffPaymentAmount",
          type: "u64",
        },
        {
          name: "startDate",
          type: "u64",
        },
        {
          name: "cancelAuthority",
          type: {
            defined: "Authority",
          },
        },
        {
          name: "changeRecipientAuthority",
          type: {
            defined: "Authority",
          },
        },
      ],
    },
    {
      name: "disburse",
      docs: [
        "Disburses the vested amount for a lock.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the disbursement.",
        "",
        "# Errors",
        "",
        "Returns an error if the disbursement fails.",
      ],
      accounts: [
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "funder",
          isMut: false,
          isSigner: false,
        },
        {
          name: "recipient",
          isMut: false,
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
          name: "recipientTokenAccount",
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
    {
      name: "cancel",
      docs: [
        "Closes a lock.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the lock closure.",
        "",
        "# Errors",
        "",
        "Returns an error if the lock closure fails.",
      ],
      accounts: [
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: false,
        },
        {
          name: "recipient",
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
          name: "funderTokenAccount",
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
    {
      name: "update",
      docs: [
        "Updates the recipient of a lock.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the update.",
        "",
        "# Errors",
        "",
        "Returns an error if the update fails.",
      ],
      accounts: [
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: false,
        },
        {
          name: "recipient",
          isMut: true,
          isSigner: false,
        },
        {
          name: "newRecipient",
          isMut: false,
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
            name: "admin",
            type: "publicKey",
          },
          {
            name: "treasury",
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
            name: "funder",
            type: "publicKey",
          },
          {
            name: "recipient",
            type: "publicKey",
          },
          {
            name: "mint",
            type: "publicKey",
          },
          {
            name: "cancelAuthority",
            type: {
              defined: "Authority",
            },
          },
          {
            name: "changeRecipientAuthority",
            type: {
              defined: "Authority",
            },
          },
          {
            name: "vestingDuration",
            type: "u64",
          },
          {
            name: "payoutInterval",
            type: "u64",
          },
          {
            name: "amountPerPayout",
            type: "u64",
          },
          {
            name: "startDate",
            type: "u64",
          },
          {
            name: "cliffPaymentAmount",
            type: "u64",
          },
          {
            name: "lastPaymentTimestamp",
            type: "u64",
          },
          {
            name: "cliffPaymentAmountPaid",
            type: "bool",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "Authority",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Neither",
          },
          {
            name: "Funder",
          },
          {
            name: "Recipient",
          },
          {
            name: "Both",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "Locked",
      msg: "The lock has not expired yet",
    },
    {
      code: 6001,
      name: "Unauthorized",
      msg: "Not authorized to perform this action",
    },
    {
      code: 6002,
      name: "InsufficientFundsForDeposit",
      msg: "You do not have enough tokens to perform this action",
    },
    {
      code: 6003,
      name: "NoPayout",
      msg: "No payout!",
    },
  ],
};
