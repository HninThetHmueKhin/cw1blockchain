const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EcommerceAccessControl Contract", function () {
  let AccessControl, accessControl, owner, seller, buyer, authenticator, auditor;

  beforeEach(async function () {
    [owner, seller, buyer, authenticator, auditor] = await ethers.getSigners();

    // Deploy EcommerceAccessControl contract
    AccessControl = await ethers.getContractFactory("EcommerceAccessControl");
    accessControl = await AccessControl.deploy();
    await accessControl.deployed();
  });

  it("should grant the ADMIN_ROLE to the deployer", async function () {
    const ADMIN_ROLE = await accessControl.ADMIN_ROLE();
    expect(await accessControl.hasRole(ADMIN_ROLE, owner.address)).to.equal(true);
  });

  it("should allow admin to grant roles", async function () {
    const SELLER_ROLE = await accessControl.SELLER_ROLE();

    await accessControl.grantRole(SELLER_ROLE, seller.address);

    expect(await accessControl.hasRole(SELLER_ROLE, seller.address)).to.equal(true);
  });

  it("should prevent non-admins from granting roles", async function () {
    const BUYER_ROLE = await accessControl.BUYER_ROLE();

    await expect(
      accessControl.connect(seller).grantRole(BUYER_ROLE, buyer.address)
    ).to.be.revertedWith("AccessControl: account is missing role");
  });

  it("should allow admin to revoke roles", async function () {
    const SELLER_ROLE = await accessControl.SELLER_ROLE();

    await accessControl.grantRole(SELLER_ROLE, seller.address);
    expect(await accessControl.hasRole(SELLER_ROLE, seller.address)).to.equal(true);

    await accessControl.revokeRole(SELLER_ROLE, seller.address);
    expect(await accessControl.hasRole(SELLER_ROLE, seller.address)).to.equal(false);
  });

  it("should prevent non-admins from revoking roles", async function () {
    const AUTHENTICATOR_ROLE = await accessControl.AUTHENTICATOR_ROLE();

    await accessControl.grantRole(AUTHENTICATOR_ROLE, authenticator.address);
    await expect(
      accessControl.connect(seller).revokeRole(AUTHENTICATOR_ROLE, authenticator.address)
    ).to.be.revertedWith("AccessControl: account is missing role");
  });

  it("should correctly set role hierarchies", async function () {
    const ADMIN_ROLE = await accessControl.ADMIN_ROLE();
    const SELLER_ROLE = await accessControl.SELLER_ROLE();

    const roleAdmin = await accessControl.getRoleAdmin(SELLER_ROLE);
    expect(roleAdmin).to.equal(ADMIN_ROLE);
  });

  it("should allow role-based access control", async function () {
    const AUDITOR_ROLE = await accessControl.AUDITOR_ROLE();

    await accessControl.grantRole(AUDITOR_ROLE, auditor.address);

    // Verify the role
    expect(await accessControl.hasRole(AUDITOR_ROLE, auditor.address)).to.equal(true);
  });

  it("should prevent unauthorized actions based on roles", async function () {
    const AUTHENTICATOR_ROLE = await accessControl.AUTHENTICATOR_ROLE();

    // Ensure authenticator role is not granted to the seller
    expect(await accessControl.hasRole(AUTHENTICATOR_ROLE, seller.address)).to.equal(false);
  });
});
