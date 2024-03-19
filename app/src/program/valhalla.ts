export type Valhalla = {
  "version": "0.1.0",
  "name": "valhalla",
  "docs": [
    "The `valhalla` module contains functions for creating, updating, and managing vaults."
  ],
  "constants": [
    {
      "name": "MIN_SOL_FEE",
      "type": "u64",
      "value": "(0.001 * LAMPORTS_PER_SOL as f64) as u64"
    },
    {
      "name": "MAX_BASIS_POINTS",
      "type": "u64",
      "value": "10000"
    },
    {
      "name": "CONFIG_SEED",
      "type": "bytes",
      "value": "[99, 111, 110, 102, 105, 103]"
    },
    {
      "name": "VAULT_SEED",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116]"
    },
    {
      "name": "VAULT_ATA_SEED",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116, 95, 97, 116, 97]"
    },
    {
      "name": "GOVERNANCE_TOKEN_MINT_SEED",
      "type": "bytes",
      "value": "[103, 111, 118, 101, 114, 110, 97, 110, 99, 101, 95, 116, 111, 107, 101, 110, 95, 109, 105, 110, 116]"
    }
  ],
  "instructions": [
    {
      "name": "createConfig",
      "docs": [
        "Creates a new configuration with the specified fee.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "* `dev_fee` - The fee value for the configuration.",
        "* `token_fee_basis_points` - The basis points of the token fee.",
        "* `governance_token_amount` - The amount of reward tokens to be minted.",
        "* `dev_treasury_governance_token_amount` - The amount of reward tokens to be minted for the dev treasury.",
        "* `dao_treasury_governance_token_amount` - The amount of reward tokens to be minted for the dao treasury.",
        "",
        "# Errors",
        "",
        "Returns an error if the configuration creation fails."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The admin account that will sign the transaction."
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The configuration account to be created."
          ]
        },
        {
          "name": "devTreasury",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The dev treasury account."
          ]
        },
        {
          "name": "daoTreasury",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The dao treasury account."
          ]
        },
        {
          "name": "governanceTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The reward token mint account."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program account."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The associated token program account."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program account."
          ]
        }
      ],
      "args": [
        {
          "name": "devFee",
          "type": "u64"
        },
        {
          "name": "tokenFeeBasisPoints",
          "type": "u64"
        },
        {
          "name": "governanceTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateConfig",
      "docs": [
        "Updates the configuration with a new fee.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "* `new_dev_fee` - The new fee to be set in the configuration.",
        "* `new_token_fee_basis_points` - The new basis points of the token fee.",
        "",
        "# Errors",
        "",
        "Returns an error if the configuration update fails."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The admin account that is authorized to update the configuration."
          ]
        },
        {
          "name": "newAdmin",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The new admin account to be set in the configuration.",
            "Pass in the same admin if you don't want to change it."
          ]
        },
        {
          "name": "newDaoTreasury",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The new dao treasury account to be set in the configuration.",
            "Pass in the same dao treasury if you don't want to change it."
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The configuration account to be updated."
          ]
        }
      ],
      "args": [
        {
          "name": "newDevFee",
          "type": "u64"
        },
        {
          "name": "newTokenFeeBasisPoints",
          "type": "u64"
        },
        {
          "name": "newGovernanceTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mintGovernanceTokens",
      "docs": [
        "Mints governance tokens to the receiver.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "* `amount` - The amount of governance tokens to mint.",
        "",
        "# Errors",
        "",
        "Returns an error if the minting fails."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The admin account that will sign the transaction."
          ]
        },
        {
          "name": "receiver",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The account that will receive the minted governance tokens."
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The config account"
          ]
        },
        {
          "name": "governanceTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The governance token mint account."
          ]
        },
        {
          "name": "receiverTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The receiver token account."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program account."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The associated token program account."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program account."
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "create",
      "docs": [
        "Creates a new vault with the specified parameters.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "* `identifier` - The identifier of the vault.",
        "* `name` - The name of the vault.",
        "* `amount_to_be_vested` - The amount to be vested in the vault.",
        "* `total_vesting_duration` - The total duration of the vesting period.",
        "* `start_date` - The start date of the vesting period.",
        "* `payout_interval` - The interval at which the vested amount is disbursed.",
        "* `cancel_authority` - The authority to cancel the vault.",
        "",
        "# Errors",
        "",
        "Returns an error if the vault creation fails."
      ],
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The creator of the vault."
          ]
        },
        {
          "name": "recipient",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The recipient of the vault tokens."
          ]
        },
        {
          "name": "devTreasury",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The dev treasury account."
          ]
        },
        {
          "name": "daoTreasury",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The dao treasury account."
          ]
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The configuration account."
          ]
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault account."
          ]
        },
        {
          "name": "vaultAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault token account."
          ]
        },
        {
          "name": "daoTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The creator's token account."
          ]
        },
        {
          "name": "creatorGovernanceAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The creator's reward token account"
          ]
        },
        {
          "name": "governanceTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The reward token mint account."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint of the token."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for the mint."
          ]
        },
        {
          "name": "governanceTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for the reward token."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The associated token program."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program."
          ]
        }
      ],
      "args": [
        {
          "name": "identifier",
          "type": "u64"
        },
        {
          "name": "name",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "amountToBeVested",
          "type": "u64"
        },
        {
          "name": "totalVestingDuration",
          "type": "u64"
        },
        {
          "name": "startDate",
          "type": "u64"
        },
        {
          "name": "payoutInterval",
          "type": "u64"
        },
        {
          "name": "cancelAuthority",
          "type": {
            "defined": "Authority"
          }
        }
      ]
    },
    {
      "name": "disburse",
      "docs": [
        "Disburses the vested amount from the vault.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "",
        "# Errors",
        "",
        "Returns an error if the disbursement fails."
      ],
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The signer of the transaction."
          ]
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The creator of the vault."
          ]
        },
        {
          "name": "recipient",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The recipient of the funds."
          ]
        },
        {
          "name": "devTreasury",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The dev treasury account."
          ]
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The configuration account."
          ]
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault account from which the funds will be disbursed."
          ]
        },
        {
          "name": "vaultAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The associated token account for the vault."
          ]
        },
        {
          "name": "signerGovernanceAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The signer's reward token account"
          ]
        },
        {
          "name": "recipientAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The associated token account for the recipient."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint of the tokens being disbursed."
          ]
        },
        {
          "name": "governanceTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The reward token mint account."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program."
          ]
        },
        {
          "name": "governanceTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The bump values for the accounts."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The associated token program."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "close",
      "docs": [
        "Closes the vault, preventing further vesting and disbursements.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "",
        "# Errors",
        "",
        "Returns an error if the vault closure fails."
      ],
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The creator of the vault."
          ]
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault account to be closed."
          ]
        },
        {
          "name": "vaultAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The associated token account for the vault."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint account for the token."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program interface."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "cancel",
      "docs": [
        "Cancels the vault, preventing further vesting and disbursements and returning the remaining funds to the cancel authority.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "",
        "# Errors",
        "",
        "Returns an error if the vault cancellation fails."
      ],
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The signer account for the instruction."
          ]
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The creator account of the vault."
          ]
        },
        {
          "name": "recipient",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The recipient account of the vault."
          ]
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault account to be closed."
          ]
        },
        {
          "name": "vaultAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The associated token account for the vault."
          ]
        },
        {
          "name": "creatorAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The creator's token account."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint account for the token."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program interface."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The associated token program."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program."
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "config",
      "docs": [
        "Represents the configuration for the Valhalla program."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "The public key of the admin account."
            ],
            "type": "publicKey"
          },
          {
            "name": "devTreasury",
            "docs": [
              "The public key of the dev treasury account."
            ],
            "type": "publicKey"
          },
          {
            "name": "daoTreasury",
            "docs": [
              "The public key of the dao treasury account."
            ],
            "type": "publicKey"
          },
          {
            "name": "governanceTokenMintKey",
            "docs": [
              "The public key of the token mint used for rewards."
            ],
            "type": "publicKey"
          },
          {
            "name": "devFee",
            "docs": [
              "The amount of sol taken as a flat fee to the dev treasury."
            ],
            "type": "u64"
          },
          {
            "name": "tokenFeeBasisPoints",
            "docs": [
              "The basis points of the token fee."
            ],
            "type": "u64"
          },
          {
            "name": "governanceTokenAmount",
            "docs": [
              "The governance token reward amount"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vault",
      "docs": [
        "Represents a vault."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "identifier",
            "docs": [
              "The identifier of the vault, a randomly generated number."
            ],
            "type": "u64"
          },
          {
            "name": "name",
            "docs": [
              "The name of the vault, string of length 32."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "creator",
            "docs": [
              "The public key of the creator of the vault."
            ],
            "type": "publicKey"
          },
          {
            "name": "recipient",
            "docs": [
              "The public key of the recipient of the vault."
            ],
            "type": "publicKey"
          },
          {
            "name": "mint",
            "docs": [
              "The public key of the mint associated with the vault."
            ],
            "type": "publicKey"
          },
          {
            "name": "totalVestingDuration",
            "docs": [
              "The total duration of vesting for the vault."
            ],
            "type": "u64"
          },
          {
            "name": "createdTimestamp",
            "docs": [
              "The timestamp when the vault was created."
            ],
            "type": "u64"
          },
          {
            "name": "startDate",
            "docs": [
              "The start date of the vault."
            ],
            "type": "u64"
          },
          {
            "name": "lastPaymentTimestamp",
            "docs": [
              "The timestamp of the last payment made from the vault."
            ],
            "type": "u64"
          },
          {
            "name": "initialDepositAmount",
            "docs": [
              "Initial deposit amount."
            ],
            "type": "u64"
          },
          {
            "name": "totalNumberOfPayouts",
            "docs": [
              "The number of payments to be made by the vault."
            ],
            "type": "u64"
          },
          {
            "name": "payoutInterval",
            "docs": [
              "The payout interval."
            ],
            "type": "u64"
          },
          {
            "name": "numberOfPaymentsMade",
            "docs": [
              "The number of payments made from the vault."
            ],
            "type": "u64"
          },
          {
            "name": "cancelAuthority",
            "docs": [
              "The authority to cancel the vault."
            ],
            "type": {
              "defined": "Authority"
            }
          },
          {
            "name": "tokenAccountBump",
            "docs": [
              "The bump value for the vault associated token account pda associated with the vault."
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Authority",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Neither"
          },
          {
            "name": "Creator"
          },
          {
            "name": "Recipient"
          },
          {
            "name": "Both"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Locked",
      "msg": "The vault is locked!"
    },
    {
      "code": 6001,
      "name": "Unauthorized",
      "msg": "Not authorized to perform this action!"
    },
    {
      "code": 6002,
      "name": "NoPayout",
      "msg": "No payout!"
    },
    {
      "code": 6003,
      "name": "AlreadyInitialized",
      "msg": "Config account is already initialized!"
    },
    {
      "code": 6004,
      "name": "CloseVaultFailed",
      "msg": "Closing the vault failed!"
    },
    {
      "code": 6005,
      "name": "InvalidTokenFeeBasisPoints",
      "msg": "Token fee basis points are invalid!"
    },
    {
      "code": 6006,
      "name": "InvalidSolFee",
      "msg": "SOL fee is invalid!"
    },
    {
      "code": 6007,
      "name": "FeePaymentFailed",
      "msg": "Fee payment failed!"
    }
  ]
};

export const IDL: Valhalla = {
  "version": "0.1.0",
  "name": "valhalla",
  "docs": [
    "The `valhalla` module contains functions for creating, updating, and managing vaults."
  ],
  "constants": [
    {
      "name": "MIN_SOL_FEE",
      "type": "u64",
      "value": "(0.001 * LAMPORTS_PER_SOL as f64) as u64"
    },
    {
      "name": "MAX_BASIS_POINTS",
      "type": "u64",
      "value": "10000"
    },
    {
      "name": "CONFIG_SEED",
      "type": "bytes",
      "value": "[99, 111, 110, 102, 105, 103]"
    },
    {
      "name": "VAULT_SEED",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116]"
    },
    {
      "name": "VAULT_ATA_SEED",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116, 95, 97, 116, 97]"
    },
    {
      "name": "GOVERNANCE_TOKEN_MINT_SEED",
      "type": "bytes",
      "value": "[103, 111, 118, 101, 114, 110, 97, 110, 99, 101, 95, 116, 111, 107, 101, 110, 95, 109, 105, 110, 116]"
    }
  ],
  "instructions": [
    {
      "name": "createConfig",
      "docs": [
        "Creates a new configuration with the specified fee.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "* `dev_fee` - The fee value for the configuration.",
        "* `token_fee_basis_points` - The basis points of the token fee.",
        "* `governance_token_amount` - The amount of reward tokens to be minted.",
        "* `dev_treasury_governance_token_amount` - The amount of reward tokens to be minted for the dev treasury.",
        "* `dao_treasury_governance_token_amount` - The amount of reward tokens to be minted for the dao treasury.",
        "",
        "# Errors",
        "",
        "Returns an error if the configuration creation fails."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The admin account that will sign the transaction."
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The configuration account to be created."
          ]
        },
        {
          "name": "devTreasury",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The dev treasury account."
          ]
        },
        {
          "name": "daoTreasury",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The dao treasury account."
          ]
        },
        {
          "name": "governanceTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The reward token mint account."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program account."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The associated token program account."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program account."
          ]
        }
      ],
      "args": [
        {
          "name": "devFee",
          "type": "u64"
        },
        {
          "name": "tokenFeeBasisPoints",
          "type": "u64"
        },
        {
          "name": "governanceTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateConfig",
      "docs": [
        "Updates the configuration with a new fee.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "* `new_dev_fee` - The new fee to be set in the configuration.",
        "* `new_token_fee_basis_points` - The new basis points of the token fee.",
        "",
        "# Errors",
        "",
        "Returns an error if the configuration update fails."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The admin account that is authorized to update the configuration."
          ]
        },
        {
          "name": "newAdmin",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The new admin account to be set in the configuration.",
            "Pass in the same admin if you don't want to change it."
          ]
        },
        {
          "name": "newDaoTreasury",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The new dao treasury account to be set in the configuration.",
            "Pass in the same dao treasury if you don't want to change it."
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The configuration account to be updated."
          ]
        }
      ],
      "args": [
        {
          "name": "newDevFee",
          "type": "u64"
        },
        {
          "name": "newTokenFeeBasisPoints",
          "type": "u64"
        },
        {
          "name": "newGovernanceTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mintGovernanceTokens",
      "docs": [
        "Mints governance tokens to the receiver.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "* `amount` - The amount of governance tokens to mint.",
        "",
        "# Errors",
        "",
        "Returns an error if the minting fails."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The admin account that will sign the transaction."
          ]
        },
        {
          "name": "receiver",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The account that will receive the minted governance tokens."
          ]
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The config account"
          ]
        },
        {
          "name": "governanceTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The governance token mint account."
          ]
        },
        {
          "name": "receiverTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The receiver token account."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program account."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The associated token program account."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program account."
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "create",
      "docs": [
        "Creates a new vault with the specified parameters.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "* `identifier` - The identifier of the vault.",
        "* `name` - The name of the vault.",
        "* `amount_to_be_vested` - The amount to be vested in the vault.",
        "* `total_vesting_duration` - The total duration of the vesting period.",
        "* `start_date` - The start date of the vesting period.",
        "* `payout_interval` - The interval at which the vested amount is disbursed.",
        "* `cancel_authority` - The authority to cancel the vault.",
        "",
        "# Errors",
        "",
        "Returns an error if the vault creation fails."
      ],
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The creator of the vault."
          ]
        },
        {
          "name": "recipient",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The recipient of the vault tokens."
          ]
        },
        {
          "name": "devTreasury",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The dev treasury account."
          ]
        },
        {
          "name": "daoTreasury",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The dao treasury account."
          ]
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The configuration account."
          ]
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault account."
          ]
        },
        {
          "name": "vaultAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault token account."
          ]
        },
        {
          "name": "daoTreasuryAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The creator's token account."
          ]
        },
        {
          "name": "creatorGovernanceAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The creator's reward token account"
          ]
        },
        {
          "name": "governanceTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The reward token mint account."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint of the token."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for the mint."
          ]
        },
        {
          "name": "governanceTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for the reward token."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The associated token program."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program."
          ]
        }
      ],
      "args": [
        {
          "name": "identifier",
          "type": "u64"
        },
        {
          "name": "name",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "amountToBeVested",
          "type": "u64"
        },
        {
          "name": "totalVestingDuration",
          "type": "u64"
        },
        {
          "name": "startDate",
          "type": "u64"
        },
        {
          "name": "payoutInterval",
          "type": "u64"
        },
        {
          "name": "cancelAuthority",
          "type": {
            "defined": "Authority"
          }
        }
      ]
    },
    {
      "name": "disburse",
      "docs": [
        "Disburses the vested amount from the vault.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "",
        "# Errors",
        "",
        "Returns an error if the disbursement fails."
      ],
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The signer of the transaction."
          ]
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The creator of the vault."
          ]
        },
        {
          "name": "recipient",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The recipient of the funds."
          ]
        },
        {
          "name": "devTreasury",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The dev treasury account."
          ]
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The configuration account."
          ]
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault account from which the funds will be disbursed."
          ]
        },
        {
          "name": "vaultAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The associated token account for the vault."
          ]
        },
        {
          "name": "signerGovernanceAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The signer's reward token account"
          ]
        },
        {
          "name": "recipientAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The associated token account for the recipient."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint of the tokens being disbursed."
          ]
        },
        {
          "name": "governanceTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The reward token mint account."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program."
          ]
        },
        {
          "name": "governanceTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The bump values for the accounts."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The associated token program."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "close",
      "docs": [
        "Closes the vault, preventing further vesting and disbursements.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "",
        "# Errors",
        "",
        "Returns an error if the vault closure fails."
      ],
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The creator of the vault."
          ]
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault account to be closed."
          ]
        },
        {
          "name": "vaultAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The associated token account for the vault."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint account for the token."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program interface."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "cancel",
      "docs": [
        "Cancels the vault, preventing further vesting and disbursements and returning the remaining funds to the cancel authority.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context for the transaction.",
        "",
        "# Errors",
        "",
        "Returns an error if the vault cancellation fails."
      ],
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The signer account for the instruction."
          ]
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The creator account of the vault."
          ]
        },
        {
          "name": "recipient",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The recipient account of the vault."
          ]
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault account to be closed."
          ]
        },
        {
          "name": "vaultAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The associated token account for the vault."
          ]
        },
        {
          "name": "creatorAta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The creator's token account."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint account for the token."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program interface."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The associated token program."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program."
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "config",
      "docs": [
        "Represents the configuration for the Valhalla program."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "The public key of the admin account."
            ],
            "type": "publicKey"
          },
          {
            "name": "devTreasury",
            "docs": [
              "The public key of the dev treasury account."
            ],
            "type": "publicKey"
          },
          {
            "name": "daoTreasury",
            "docs": [
              "The public key of the dao treasury account."
            ],
            "type": "publicKey"
          },
          {
            "name": "governanceTokenMintKey",
            "docs": [
              "The public key of the token mint used for rewards."
            ],
            "type": "publicKey"
          },
          {
            "name": "devFee",
            "docs": [
              "The amount of sol taken as a flat fee to the dev treasury."
            ],
            "type": "u64"
          },
          {
            "name": "tokenFeeBasisPoints",
            "docs": [
              "The basis points of the token fee."
            ],
            "type": "u64"
          },
          {
            "name": "governanceTokenAmount",
            "docs": [
              "The governance token reward amount"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vault",
      "docs": [
        "Represents a vault."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "identifier",
            "docs": [
              "The identifier of the vault, a randomly generated number."
            ],
            "type": "u64"
          },
          {
            "name": "name",
            "docs": [
              "The name of the vault, string of length 32."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "creator",
            "docs": [
              "The public key of the creator of the vault."
            ],
            "type": "publicKey"
          },
          {
            "name": "recipient",
            "docs": [
              "The public key of the recipient of the vault."
            ],
            "type": "publicKey"
          },
          {
            "name": "mint",
            "docs": [
              "The public key of the mint associated with the vault."
            ],
            "type": "publicKey"
          },
          {
            "name": "totalVestingDuration",
            "docs": [
              "The total duration of vesting for the vault."
            ],
            "type": "u64"
          },
          {
            "name": "createdTimestamp",
            "docs": [
              "The timestamp when the vault was created."
            ],
            "type": "u64"
          },
          {
            "name": "startDate",
            "docs": [
              "The start date of the vault."
            ],
            "type": "u64"
          },
          {
            "name": "lastPaymentTimestamp",
            "docs": [
              "The timestamp of the last payment made from the vault."
            ],
            "type": "u64"
          },
          {
            "name": "initialDepositAmount",
            "docs": [
              "Initial deposit amount."
            ],
            "type": "u64"
          },
          {
            "name": "totalNumberOfPayouts",
            "docs": [
              "The number of payments to be made by the vault."
            ],
            "type": "u64"
          },
          {
            "name": "payoutInterval",
            "docs": [
              "The payout interval."
            ],
            "type": "u64"
          },
          {
            "name": "numberOfPaymentsMade",
            "docs": [
              "The number of payments made from the vault."
            ],
            "type": "u64"
          },
          {
            "name": "cancelAuthority",
            "docs": [
              "The authority to cancel the vault."
            ],
            "type": {
              "defined": "Authority"
            }
          },
          {
            "name": "tokenAccountBump",
            "docs": [
              "The bump value for the vault associated token account pda associated with the vault."
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Authority",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Neither"
          },
          {
            "name": "Creator"
          },
          {
            "name": "Recipient"
          },
          {
            "name": "Both"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Locked",
      "msg": "The vault is locked!"
    },
    {
      "code": 6001,
      "name": "Unauthorized",
      "msg": "Not authorized to perform this action!"
    },
    {
      "code": 6002,
      "name": "NoPayout",
      "msg": "No payout!"
    },
    {
      "code": 6003,
      "name": "AlreadyInitialized",
      "msg": "Config account is already initialized!"
    },
    {
      "code": 6004,
      "name": "CloseVaultFailed",
      "msg": "Closing the vault failed!"
    },
    {
      "code": 6005,
      "name": "InvalidTokenFeeBasisPoints",
      "msg": "Token fee basis points are invalid!"
    },
    {
      "code": 6006,
      "name": "InvalidSolFee",
      "msg": "SOL fee is invalid!"
    },
    {
      "code": 6007,
      "name": "FeePaymentFailed",
      "msg": "Fee payment failed!"
    }
  ]
};
