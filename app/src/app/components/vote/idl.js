"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idl = void 0;
// Define the IDL based on the fetched-idl.json structure
exports.idl = {
    address: "HaEmonFHu9RoLvn1EPreVcfDFmYGQqVdhUsADrAWorfL",
    programId: "HaEmonFHu9RoLvn1EPreVcfDFmYGQqVdhUsADrAWorfL",
    metadata: {
        name: "voteyourstake",
        version: "0.1.0",
        spec: "0.1.0",
        description: "Created with Anchor"
    },
    instructions: [
        {
            name: "cast_vote",
            discriminator: [20, 212, 15, 189, 69, 180, 69, 151],
            accounts: [
                {
                    name: "proposal",
                    writable: true
                },
                {
                    name: "stake_account"
                },
                {
                    name: "voter",
                    writable: true,
                    signer: true
                },
                {
                    name: "vote_record_account",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [118, 111, 116, 101, 95, 114, 101, 99, 111, 114, 100]
                            },
                            {
                                kind: "account",
                                path: "proposal"
                            },
                            {
                                kind: "account",
                                path: "stake_account"
                            }
                        ]
                    }
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111"
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
            discriminator: [213, 178, 139, 19, 50, 191, 82, 245],
            accounts: [
                {
                    name: "proposal",
                    writable: true
                },
                {
                    name: "authority",
                    signer: true
                }
            ],
            args: []
        },
        {
            name: "initialize_proposal",
            discriminator: [50, 73, 156, 98, 129, 149, 21, 158],
            accounts: [
                {
                    name: "proposal",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [112, 114, 111, 112, 111, 115, 97, 108]
                            },
                            {
                                kind: "arg",
                                path: "proposal_id"
                            }
                        ]
                    }
                },
                {
                    name: "authority",
                    writable: true,
                    signer: true
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111"
                }
            ],
            args: [
                {
                    name: "proposal_id",
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
                    name: "end_time",
                    type: "i64"
                }
            ]
        }
    ],
    accounts: [
        {
            name: "Proposal",
            discriminator: [26, 94, 189, 187, 116, 136, 53, 33]
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
        },
        {
            code: 6007,
            name: "ProposalIdTooLong",
            msg: "Proposal ID too long - maximum 32 characters"
        },
        {
            code: 6008,
            name: "TitleTooLong",
            msg: "Title too long - maximum 64 characters"
        },
        {
            code: 6009,
            name: "DescriptionTooLong",
            msg: "Description too long - maximum 256 characters"
        },
        {
            code: 6010,
            name: "InvalidEndTime",
            msg: "End time must be in the future"
        }
    ],
    types: [
        {
            name: "Proposal",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "authority",
                        type: "pubkey"
                    },
                    {
                        name: "proposal_id",
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
                        name: "yes_votes",
                        type: "u64"
                    },
                    {
                        name: "no_votes",
                        type: "u64"
                    },
                    {
                        name: "end_time",
                        type: "i64"
                    },
                    {
                        name: "is_active",
                        type: "bool"
                    },
                    {
                        name: "vote_count",
                        type: "u64"
                    },
                    {
                        name: "merkle_root",
                        type: {
                            array: ["u8", 32]
                        }
                    }
                ]
            }
        }
    ]
};
