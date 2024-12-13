const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Storage Contract", function () {
  let Storage;
  let storage;

  beforeEach(async function () {
    // Deploy the contract before each test
    Storage = await ethers.getContractFactory("Storage");
    storage = await Storage.deploy();
    await storage.deployed();
  });

  it("Should store the correct value", async function () {
    // Store the value 42
    await storage.store(42);

    // Retrieve the value
    const storedValue = await storage.retrieve();

    // Check that the value is 42
    expect(storedValue).to.equal(42);
  });

  it("Should update the stored value", async function () {
    // Store the initial value 10
    await storage.store(10);

    // Update the value to 100
    await storage.store(100);

    // Retrieve the updated value
    const storedValue = await storage.retrieve();

    // Check that the value is updated to 100
    expect(storedValue).to.equal(100);
  });

  it("Should retrieve the default value as 0", async function () {
    // Retrieve the value without storing anything
    const storedValue = await storage.retrieve();

    // Check that the default value is 0
    expect(storedValue).to.equal(0);
  });
});
