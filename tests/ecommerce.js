const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ecommerce Contract", function () {
  let Token, token, ICO, ico, Ecommerce, ecommerce;
  let owner, seller, buyer, authenticator, auditor;
  const rate = 1000; // 1 Ether = 1000 Tokens

  beforeEach(async function () {
    [owner, seller, buyer, authenticator, auditor] = await ethers.getSigners();

    // Deploy Token contract
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();

    // Deploy ICO contract
    ICO = await ethers.getContractFactory("ICO");
    ico = await ICO.deploy(token.address, rate);
    await ico.deployed();

    // Deploy Ecommerce contract
    Ecommerce = await ethers.getContractFactory("Ecommerce");
    ecommerce = await Ecommerce.deploy(ico.address);
    await ecommerce.deployed();

    // Assign roles
    await ecommerce.grantRole(await ecommerce.SELLER_ROLE(), seller.address);
    await ecommerce.grantRole(await ecommerce.BUYER_ROLE(), buyer.address);
    await ecommerce.grantRole(await ecommerce.AUTHENTICATOR_ROLE(), authenticator.address);
    await ecommerce.grantRole(await ecommerce.AUDITOR_ROLE(), auditor.address);

    // Transfer tokens to the buyer and ICO contract
    const initialTokens = ethers.utils.parseUnits("1000", 18);
    await token.mint(buyer.address, initialTokens);
    await token.transfer(ico.address, initialTokens);
  });

  it("should allow sellers to add products", async function () {
    await ecommerce.connect(seller).addProduct("Product1", ethers.utils.parseUnits("100", 18));

    const product = await ecommerce.products(0);
    expect(product.name).to.equal("Product1");
    expect(product.price).to.equal(ethers.utils.parseUnits("100", 18));
    expect(product.seller).to.equal(seller.address);
    expect(product.available).to.equal(true);
  });

  it("should prevent non-sellers from adding products", async function () {
    await expect(
      ecommerce.connect(buyer).addProduct("Product1", ethers.utils.parseUnits("100", 18))
    ).to.be.revertedWith("Restricted to sellers");
  });

  it("should allow sellers to update product availability", async function () {
    await ecommerce.connect(seller).addProduct("Product1", ethers.utils.parseUnits("100", 18));

    await ecommerce.connect(seller).updateProductStatus(0, false);

    const product = await ecommerce.products(0);
    expect(product.available).to.equal(false);
  });

  it("should prevent non-sellers from updating product status", async function () {
    await ecommerce.connect(seller).addProduct("Product1", ethers.utils.parseUnits("100", 18));

    await expect(
      ecommerce.connect(buyer).updateProductStatus(0, false)
    ).to.be.revertedWith("Restricted to sellers");
  });

  it("should allow buyers to purchase products and initiate escrow", async function () {
    await ecommerce.connect(seller).addProduct("Product1", ethers.utils.parseUnits("100", 18));

    // Approve tokens for the ICO contract
    await token.connect(buyer).approve(ico.address, ethers.utils.parseUnits("100", 18));

    await ecommerce.connect(buyer).purchaseProduct(0);

    const product = await ecommerce.products(0);
    expect(product.buyer).to.equal(buyer.address);
    expect(product.available).to.equal(false);
  });

  it("should prevent non-buyers from purchasing products", async function () {
    await ecommerce.connect(seller).addProduct("Product1", ethers.utils.parseUnits("100", 18));

    await expect(
      ecommerce.connect(seller).purchaseProduct(0)
    ).to.be.revertedWith("Restricted to buyers");
  });

  it("should allow auditors to cancel purchases", async function () {
    await ecommerce.connect(seller).addProduct("Product1", ethers.utils.parseUnits("100", 18));

    // Approve tokens for the ICO contract
    await token.connect(buyer).approve(ico.address, ethers.utils.parseUnits("100", 18));

    await ecommerce.connect(buyer).purchaseProduct(0);
    await ecommerce.connect(auditor).cancelPurchase(0);

    const product = await ecommerce.products(0);
    expect(product.buyer).to.equal(ethers.constants.AddressZero);
    expect(product.available).to.equal(true);
  });

  it("should prevent non-auditors from canceling purchases", async function () {
    await ecommerce.connect(seller).addProduct("Product1", ethers.utils.parseUnits("100", 18));

    // Approve tokens for the ICO contract
    await token.connect(buyer).approve(ico.address, ethers.utils.parseUnits("100", 18));

    await ecommerce.connect(buyer).purchaseProduct(0);

    await expect(
      ecommerce.connect(buyer).cancelPurchase(0)
    ).to.be.revertedWith("Restricted to auditors");
  });
});
