/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/guitar_contest.json`.
 */
export type GuitarContest = {
  "address": "2Hg6qeZGBsMPDDM1RY65Ucwk5JbLrF3D3P9qdYbEfmSU",
  "metadata": {
    "name": "guitarContest",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "backfillTokens",
      "docs": [
        "Instruction 4: Backfill tokens for a submission based on existing votes",
        "This is useful for rewarding performers who received votes before token minting was implemented"
      ],
      "discriminator": [
        131,
        55,
        171,
        136,
        247,
        225,
        227,
        76
      ],
      "accounts": [
        {
          "name": "submission"
        },
        {
          "name": "performer",
          "docs": [
            "The performer (contestant) - must match submission.contestant"
          ]
        },
        {
          "name": "performerProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "performer"
              }
            ]
          }
        },
        {
          "name": "tarMint",
          "writable": true
        },
        {
          "name": "performerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "performer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tarMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": []
    },
    {
      "name": "completeQuiz",
      "docs": [
        "Instruction 5: Complete the quiz and claim reward",
        "Awards 1 TAR token if user got 80%+ correct (4/5 questions)",
        "Each account can only take the quiz once per version"
      ],
      "discriminator": [
        210,
        177,
        96,
        61,
        240,
        31,
        255,
        158
      ],
      "accounts": [
        {
          "name": "quizConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  105,
                  122,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "quizState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  105,
                  122,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "quiz_config.quiz_version",
                "account": "quizConfig"
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "tarMint",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tarMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "totalQuestions",
          "type": "u64"
        },
        {
          "name": "correctAnswers",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createSubmission",
      "docs": [
        "Instruction 1: Creates a new SubmissionAccount to host a video"
      ],
      "discriminator": [
        85,
        217,
        61,
        59,
        157,
        60,
        175,
        220
      ],
      "accounts": [
        {
          "name": "submission",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "youtubeId",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeQuizConfig",
      "docs": [
        "Instruction 6: Initialize the global quiz configuration (admin only, one-time)"
      ],
      "discriminator": [
        71,
        114,
        204,
        234,
        165,
        95,
        54,
        157
      ],
      "accounts": [
        {
          "name": "quizConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  105,
                  122,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "resetQuizVersion",
      "docs": [
        "Instruction 7: Reset quiz version (admin only)",
        "This allows all users to retake the quiz with new questions"
      ],
      "discriminator": [
        206,
        57,
        249,
        71,
        57,
        182,
        160,
        51
      ],
      "accounts": [
        {
          "name": "quizConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  105,
                  122,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "quizConfig"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "transferMintAuthority",
      "docs": [
        "Instruction 3: Transfer mint authority to the program's PDA",
        "This allows the program to mint TAR tokens as rewards"
      ],
      "discriminator": [
        87,
        237,
        187,
        84,
        168,
        175,
        241,
        75
      ],
      "accounts": [
        {
          "name": "tarMint",
          "writable": true
        },
        {
          "name": "currentAuthority",
          "signer": true
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "updateSubmission",
      "discriminator": [
        177,
        143,
        162,
        63,
        208,
        227,
        103,
        173
      ],
      "accounts": [
        {
          "name": "submission",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newTitle",
          "type": "string"
        },
        {
          "name": "newYoutubeId",
          "type": "string"
        }
      ]
    },
    {
      "name": "vote",
      "docs": [
        "Instruction 2: Allows a user to vote for a submission.",
        "This instruction uses a PDA (VoteReceipt) to prevent double voting.",
        "Now also awards 3 TAR tokens to the performer (minted from the TAR token)"
      ],
      "discriminator": [
        227,
        110,
        155,
        23,
        136,
        126,
        172,
        25
      ],
      "accounts": [
        {
          "name": "submission",
          "writable": true
        },
        {
          "name": "voteReceipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "submission"
              }
            ]
          }
        },
        {
          "name": "userProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "performer",
          "docs": [
            "The performer (contestant) - must match submission.contestant"
          ]
        },
        {
          "name": "performerProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "performer"
              }
            ]
          }
        },
        {
          "name": "tarMint",
          "writable": true
        },
        {
          "name": "performerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "performer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tarMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "quizConfig",
      "discriminator": [
        250,
        219,
        202,
        113,
        218,
        145,
        175,
        236
      ]
    },
    {
      "name": "quizState",
      "discriminator": [
        222,
        255,
        111,
        89,
        226,
        46,
        27,
        9
      ]
    },
    {
      "name": "submissionAccount",
      "discriminator": [
        254,
        14,
        34,
        50,
        170,
        36,
        60,
        191
      ]
    },
    {
      "name": "userProfile",
      "discriminator": [
        32,
        37,
        119,
        205,
        179,
        180,
        13,
        194
      ]
    },
    {
      "name": "voteReceipt",
      "discriminator": [
        104,
        20,
        204,
        252,
        45,
        84,
        37,
        195
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notContestant",
      "msg": "Only the original contestant can update this submission."
    },
    {
      "code": 6001,
      "name": "overflow",
      "msg": "Arithmetic overflow occurred."
    },
    {
      "code": 6002,
      "name": "unauthorized",
      "msg": "Only the admin can perform this action."
    }
  ],
  "types": [
    {
      "name": "quizConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "quizVersion",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "quizState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "quizVersion",
            "type": "u64"
          },
          {
            "name": "totalQuestions",
            "type": "u64"
          },
          {
            "name": "correctAnswers",
            "type": "u64"
          },
          {
            "name": "quizCompleted",
            "type": "bool"
          },
          {
            "name": "tokensAwarded",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "submissionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contestant",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "youtubeId",
            "type": "string"
          },
          {
            "name": "voteCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "tarBalance",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "voteReceipt",
      "type": {
        "kind": "struct",
        "fields": []
      }
    }
  ]
};
