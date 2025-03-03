"use client"

// Important: Removed Idl import and type enforcement to eliminate any unexpected constraints

// Define a complete Anchor IDL with accounts section
export const idl = {
  version: "0.1.0",
  name: "voteyourstake",
  programId: "HaEmonFHu9RoLvn1EPreVcfDFmYGQqVdhUsADrAWorfL",
  instructions: [
    {
      name: "initialize_proposal",
      accounts: [
        {
          name: "proposal",
          isMut: true,
          isSigner: false
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "proposalId",
          type: "string"
        },
        {
          name: "title",
          type: "string"
        },
        {
          name: "description",
          type: "string"
        },
        {
          name: "endTime",
          type: "i64"
        }
      ]
    },
    {
      name: "cast_vote",
      accounts: [
        {
          name: "proposal",
          isMut: true,
          isSigner: false
        },
        {
          name: "stakeAccount",
          isMut: false,
          isSigner: false
        },
        {
          name: "voter",
          isMut: true,
          isSigner: true
        },
        {
          name: "voteRecordAccount",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "vote",
          type: "u8"
        }
      ]
    },
    {
      name: "close_proposal",
      accounts: [
        {
          name: "proposal",
          isMut: true,
          isSigner: false
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "proposal",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey"
          },
          {
            name: "proposalId",
            type: "string"
          },
          {
            name: "title",
            type: "string"
          },
          {
            name: "description",
            type: "string"
          },
          {
            name: "yesVotes",
            type: "u64"
          },
          {
            name: "noVotes",
            type: "u64"
          },
          {
            name: "endTime",
            type: "i64"
          },
          {
            name: "isActive",
            type: "bool"
          },
          {
            name: "voteCount",
            type: "u64"
          },
          {
            name: "merkleRoot",
            type: {
              array: ["u8", 32]
            }
          }
        ]
      }
    },
    {
      name: "voteRecord",
      type: {
        kind: "struct",
        fields: [
          {
            name: "proposal",
            type: "publicKey"
          },
          {
            name: "voter",
            type: "publicKey"
          },
          {
            name: "vote",
            type: "u8"
          }
        ]
      }
    }
  ],
  errors: [
    {
      code: 6000,
      name: "UnauthorizedVoter",
      msg: "Unauthorized voter"
    },
    {
      code: 6001,
      name: "InvalidVoteOption",
      msg: "Invalid vote option - must be 0 or 1"
    },
    {
      code: 6002,
      name: "InvalidStakeAccount",
      msg: "Invalid stake account - must be initialized stake account"
    },
    {
      code: 6003,
      name: "AlreadyVoted",
      msg: "This stake account has already voted"
    },
    {
      code: 6004,
      name: "UnauthorizedAction",
      msg: "Unauthorized action"
    },
    {
      code: 6005,
      name: "VotingPeriodEnded",
      msg: "Voting period has ended"
    },
    {
      code: 6006,
      name: "ProposalInactive",
      msg: "Proposal is no longer active"
    }
  ]
}; 