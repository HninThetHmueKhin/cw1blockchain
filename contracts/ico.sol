// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Token.sol";
import "./EcommerceAccessControl.sol";

contract ICO is EcommerceAccessControl {
    Token public token;
    uint256 public rate; // Rate of token per Ether
    uint256 public tokensSold;

    // Mapping for escrow payments and status
    mapping(uint256 => address) public escrowPayment;
    mapping(uint256 => bool) public escrowStatus;

    event TokensPurchased(address indexed buyer, uint256 amount);
    event EscrowPaymentInitiated(uint256 productId, address buyer);
    event EscrowApproved(uint256 productId, address buyer, address seller);
    event EscrowCanceled(uint256 productId);

    constructor(address _tokenAddress, uint256 _rate) {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_rate > 0, "Rate must be greater than 0");

        token = Token(_tokenAddress);
        rate = _rate;

        // Grant ADMIN_ROLE to the deployer
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ICO Token Purchase
    function buyTokens() public payable {
        require(msg.value > 0, "Ether amount must be greater than 0");

        uint256 tokenAmount = msg.value * rate;
        require(token.balanceOf(address(this)) >= tokenAmount, "Not enough tokens available");

        tokensSold += tokenAmount;
        require(token.transfer(msg.sender, tokenAmount), "Token transfer failed");

        emit TokensPurchased(msg.sender, tokenAmount);
    }

    // Initiate escrow for product purchase
    function initiateEscrow(uint256 productId, uint256 price, address buyer) external onlyRole(SELLER_ROLE) {
        require(token.balanceOf(buyer) >= price, "Insufficient token balance");
        escrowPayment[productId] = buyer;
        escrowStatus[productId] = false;

        emit EscrowPaymentInitiated(productId, buyer);
    }

    // Approve escrow payment
    function approveEscrow(uint256 productId, address seller, uint256 price) external onlyRole(AUTHENTICATOR_ROLE) {
        address buyer = escrowPayment[productId];
        require(buyer != address(0), "No escrow payment found");
        require(!escrowStatus[productId], "Escrow already approved");

        escrowStatus[productId] = true;
        require(token.transferFrom(buyer, seller, price), "Token transfer failed");

        emit EscrowApproved(productId, buyer, seller);
    }

    // Cancel escrow
    function cancelEscrow(uint256 productId) external onlyRole(AUDITOR_ROLE) {
        address buyer = escrowPayment[productId];
        require(buyer != address(0), "No escrow payment found");

        // Reset escrow data
        escrowPayment[productId] = address(0);
        escrowStatus[productId] = false;

        emit EscrowCanceled(productId);
    }
}
