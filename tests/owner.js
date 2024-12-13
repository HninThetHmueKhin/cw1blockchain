const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Owner Contract", function () {
  let Owner; // Contract factory
  let owner; // Deployed contract instance
  let deployer; // Deployer address
  let newOwner; // Address for the new owner
  let other; // Another address

  beforeEach(async function () {
    // Get contract factory and signers
    Owner = await ethers.getContractFactory("Owner");
    [deployer, newOwner, other] = await ethers.getSigners();

    // Deploy the contract
    owner = await Owner.deploy();
    await owner.deployed();
  });

  it("Should set the deployer as the initial owner", async function () {
    const currentOwner = await owner.getOwner();
    expect(currentOwner).to.equal(deployer.address);
  });

  it("Should allow the owner to change ownership", async function () {
    // Change the owner to `newOwner`
    await owner.changeOwner(newOwner.address);

    // Verify the new owner is set
    const currentOwner = await owner.getOwner();
    expect(currentOwner).to.equal(newOwner.address);
  });

  it("Should emit an event when the owner is changed", async function () {
    await expect(owner.changeOwner(newOwner.address))
      .to.emit(owner, "OwnerSet")
      .withArgs(deployer.address, newOwner.address);
  });

  it("Should revert if a non-owner tries to change ownership", async function () {
    // Attempt to change owner from a non-owner account
    await expect(
      owner.connect(other).changeOwner(newOwner.address)
    ).to.be.revertedWith("Caller is not owner");
  });

  it("Should return the current owner", async function () {
    const currentOwner = await owner.getOwner();
    expect(currentOwner).to.equal(deployer.address);
  });
});
