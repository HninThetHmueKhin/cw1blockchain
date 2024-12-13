const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Contract", function () {
  let Token, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the Token contract
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();
  });

  it("should have correct name, symbol, and initial supply", async function () {
    expect(await token.name()).to.equal("Ecommerce");
    expect(await token.symbol()).to.equal("ECM");
    expect(await token.totalSupply()).to.equal(ethers.utils.parseUnits("1000000", 18));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("1000000", 18));
  });

  it("should allow the owner to mint new tokens", async function () {
    const mintAmount = ethers.utils.parseUnits("100", 18);

    await token.mint(addr1.address, mintAmount);

    expect(await token.totalSupply()).to.equal(ethers.utils.parseUnits("1000100", 18));
    expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("should prevent non-owners from minting tokens", async function () {
    const mintAmount = ethers.utils.parseUnits("100", 18);

    await expect(token.connect(addr1).mint(addr1.address, mintAmount)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("should allow the owner to burn tokens", async function () {
    const burnAmount = ethers.utils.parseUnits("500", 18);

    await token.burn(owner.address, burnAmount);

    expect(await token.totalSupply()).to.equal(ethers.utils.parseUnits("999500", 18));
    expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("999500", 18));
  });

  it("should prevent non-owners from burning tokens", async function () {
    const burnAmount = ethers.utils.parseUnits("100", 18);

    await expect(token.connect(addr1).burn(addr1.address, burnAmount)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("should update balances correctly after transfers", async function () {
    const transferAmount = ethers.utils.parseUnits("200", 18);

    await token.transfer(addr1.address, transferAmount);

    expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("999800", 18));
    expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);

    await token.connect(addr1).transfer(addr2.address, transferAmount);

    expect(await token.balanceOf(addr1.address)).to.equal(0);
    expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
  });
});
