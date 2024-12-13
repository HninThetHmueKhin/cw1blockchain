const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ICO Contract", function () {
  let Token, token, ICO, ico, owner, buyer, seller, authenticator, auditor;
  const rate = 1000; // 1 Ether = 1000 Tokens

  beforeEach(async function () {
    [owner, buyer, seller, authenticator, auditor] = await ethers.getSigners();

    // Deploy Token contract
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();

    // Deploy ICO contract
    ICO = await ethers.getContractFactory("ICO");
    ico = await ICO.deploy(token.address, rate);
    await ico.deployed();

    // Transfer some tokens to ICO contract for distribution
    await token.transfer(ico.address, ethers.utils.parseUnits("10000", 18));

    // Assign roles
    await ico.grantRole(await ico.SELLER_ROLE(), seller.address);
    await ico.grantRole(await ico.AUTHENTICATOR_ROLE(), authenticator.address);
    await ico.grantRole(await ico.AUDITOR_ROLE(), auditor.address);
  });

  it("should allow a user to buy tokens", async function () {
    const etherAmount = ethers.utils.parseEther("1"); // 1 Ether
    const tokenAmount = etherAmount.mul(rate);

    await ico.connect(buyer).buyTokens({ value: etherAmount });

    expect(await token.balanceOf(buyer.address)).to.equal(tokenAmount);
    expect(await ethers.provider.getBalance(ico.address)).to.equal(etherAmount);
  });

  it("should initiate escrow for a product purchase", async function () {
    const productId = 1;
    const price = ethers.utils.parseUnits("100", 18);

    // Mint tokens to the buyer and approve the ICO contract
    await token.mint(buyer.address, price);
    await token.connect(buyer).approve(ico.address, price);

    await ico.connect(seller).initiateEscrow(productId, price, buyer.address);

    expect(await ico.escrowPayment(productId)).to.equal(buyer.address);
    expect(await ico.escrowStatus(productId)).to.equal(false);
  });

  it("should approve escrow and transfer tokens to the seller", async function () {
    const productId = 1;
    const price = ethers.utils.parseUnits("100", 18);

    // Mint tokens to the buyer and approve the ICO contract
    await token.mint(buyer.address, price);
    await token.connect(buyer).approve(ico.address, price);

    // Initiate escrow
    await ico.connect(seller).initiateEscrow(productId, price, buyer.address);

    // Approve escrow
    await ico.connect(authenticator).approveEscrow(productId, seller.address, price);

    expect(await token.balanceOf(seller.address)).to.equal(price);
    expect(await ico.escrowStatus(productId)).to.equal(true);
  });

  it("should cancel escrow", async function () {
    const productId = 1;
    const price = ethers.utils.parseUnits("100", 18);

    // Mint tokens to the buyer and approve the ICO contract
    await token.mint(buyer.address, price);
    await token.connect(buyer).approve(ico.address, price);

    // Initiate escrow
    await ico.connect(seller).initiateEscrow(productId, price, buyer.address);

    // Cancel escrow
    await ico.connect(auditor).cancelEscrow(productId);

    expect(await ico.escrowPayment(productId)).to.equal(ethers.constants.AddressZero);
    expect(await ico.escrowStatus(productId)).to.equal(false);
  });

  it("should revert if non-authorized user tries to initiate escrow", async function () {
    const productId = 1;
    const price = ethers.utils.parseUnits("100", 18);

    await expect(
      ico.connect(buyer).initiateEscrow(productId, price, buyer.address)
    ).to.be.revertedWith("AccessControl: account is missing role");
  });

  it("should revert if non-authorized user tries to approve escrow", async function () {
    const productId = 1;
    const price = ethers.utils.parseUnits("100", 18);

    // Mint tokens to the buyer and approve the ICO contract
    await token.mint(buyer.address, price);
    await token.connect(buyer).approve(ico.address, price);

    // Initiate escrow
    await ico.connect(seller).initiateEscrow(productId, price, buyer.address);

    // Attempt to approve escrow with a non-authorized account
    await expect(
      ico.connect(buyer).approveEscrow(productId, seller.address, price)
    ).to.be.revertedWith("AccessControl: account is missing role");
  });

  it("should revert if non-authorized user tries to cancel escrow", async function () {
    const productId = 1;
    const price = ethers.utils.parseUnits("100", 18);

    // Mint tokens to the buyer and approve the ICO contract
    await token.mint(buyer.address, price);
    await token.connect(buyer).approve(ico.address, price);

    // Initiate escrow
    await ico.connect(seller).initiateEscrow(productId, price, buyer.address);

    // Attempt to cancel escrow with a non-authorized account
    await expect(
      ico.connect(buyer).cancelEscrow(productId)
    ).to.be.revertedWith("AccessControl: account is missing role");
  });
});
