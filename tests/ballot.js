const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ballot Contract", function () {
  let Ballot, ballot, owner, voter1, voter2, voter3, voter4;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, voter4] = await ethers.getSigners();

    // Deploy the Ballot contract
    Ballot = await ethers.getContractFactory("Ballot");
    const proposalNames = [ethers.utils.formatBytes32String("Proposal1"), ethers.utils.formatBytes32String("Proposal2")];
    ballot = await Ballot.deploy(proposalNames);
    await ballot.deployed();
  });

  it("should deploy the contract and set the owner as chairperson", async function () {
    const chairperson = await ballot.chairperson();
    expect(chairperson).to.equal(owner.address);
  });

  it("should add proposals correctly", async function () {
    const proposal1 = await ballot.proposals(0);
    const proposal2 = await ballot.proposals(1);

    expect(ethers.utils.parseBytes32String(proposal1.name)).to.equal("Proposal1");
    expect(proposal1.voteCount).to.equal(0);

    expect(ethers.utils.parseBytes32String(proposal2.name)).to.equal("Proposal2");
    expect(proposal2.voteCount).to.equal(0);
  });

  it("should allow the chairperson to give voting rights", async function () {
    await ballot.giveRightToVote(voter1.address);

    const voter = await ballot.voters(voter1.address);
    expect(voter.weight).to.equal(1);
    expect(voter.voted).to.equal(false);
  });

  it("should prevent non-chairpersons from giving voting rights", async function () {
    await expect(ballot.connect(voter1).giveRightToVote(voter2.address)).to.be.revertedWith(
      "Only chairperson can give right to vote."
    );
  });

  it("should allow voters to delegate their votes", async function () {
    await ballot.giveRightToVote(voter1.address);
    await ballot.giveRightToVote(voter2.address);

    await ballot.connect(voter1).delegate(voter2.address);

    const voter1Data = await ballot.voters(voter1.address);
    const voter2Data = await ballot.voters(voter2.address);

    expect(voter1Data.voted).to.equal(true);
    expect(voter1Data.delegate).to.equal(voter2.address);
    expect(voter2Data.weight).to.equal(2);
  });

  it("should allow voters to vote and increase the proposal's vote count", async function () {
    await ballot.giveRightToVote(voter1.address);

    await ballot.connect(voter1).vote(0);

    const proposal = await ballot.proposals(0);
    const voter = await ballot.voters(voter1.address);

    expect(proposal.voteCount).to.equal(1);
    expect(voter.voted).to.equal(true);
    expect(voter.vote).to.equal(0);
  });

  it("should prevent voters without voting rights from voting", async function () {
    await expect(ballot.connect(voter1).vote(0)).to.be.revertedWith("Has no right to vote");
  });

  it("should compute the winning proposal correctly", async function () {
    await ballot.giveRightToVote(voter1.address);
    await ballot.giveRightToVote(voter2.address);

    await ballot.connect(voter1).vote(0);
    await ballot.connect(voter2).vote(1);

    const winningProposal = await ballot.winningProposal();
    expect(winningProposal).to.equal(1); // Both proposals have equal votes, but the latest wins
  });

  it("should return the winner's name correctly", async function () {
    await ballot.giveRightToVote(voter1.address);
    await ballot.connect(voter1).vote(0);

    const winnerName = await ballot.winnerName();
    expect(ethers.utils.parseBytes32String(winnerName)).to.equal("Proposal1");
  });
});
