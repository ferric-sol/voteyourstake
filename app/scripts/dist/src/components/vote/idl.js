"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idl = void 0;
// Updated IDL to match our program structure
exports.idl = {
    version: "0.1.0",
    name: "voteyourstake",
    programId: "HaEmonFHu9RoLvn1EPreVcfDFmYGQqVdhUsADrAWorfL",
    instructions: [
        {
            name: "initializeProposal",
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
            name: "castVote",
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
            name: "closeProposal",
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
                        name: "voteMerkleRoot",
                        type: {
                            array: [
                                "u8",
                                32
                            ]
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
                        name: "stakeAccount",
                        type: "publicKey"
                    },
                    {
                        name: "proposal",
                        type: "publicKey"
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
