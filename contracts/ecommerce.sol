// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IICO {
    function initiateEscrow(uint256 productId, uint256 price, address buyer) external;
    function approveEscrow(uint256 productId, address seller, uint256 price) external;
    function cancelEscrow(uint256 productId) external;
}

contract Ecommerce is AccessControl, Pausable {
    // Define roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SELLER_ROLE = keccak256("SELLER_ROLE");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 public constant AUTHENTICATOR_ROLE = keccak256("AUTHENTICATOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    address public constant sellerAddress = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4;
    address public constant buyerAddress = 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db;
    address public constant authenticatorAddress = 0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB;
    address public constant audictorAddress = 0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB;
    uint8 public constant decimal = 18; // Decimal places for currency/token

    struct Product {
        string name;
        uint256 price;
        address seller;
        bool available;
        address buyer;
    }

    mapping(uint256 => Product) public products;
    uint256 public productCount;

    IICO public icoContract; // Reference to ICO contract

    event ProductAdded(uint256 productId, string name, uint256 price, address seller);
    event ProductStatusUpdated(uint256 productId, bool available);
    event ProductPurchased(uint256 productId, address buyer);
    event ProductPurchaseCanceled(uint256 productId, address buyer);



    constructor(address _icoContractAddress) {
        require(_icoContractAddress != address(0), "Invalid ICO contract address");
        icoContract = IICO(_icoContractAddress);
    
        // Grant ADMIN_ROLE to the deployer
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SELLER_ROLE, sellerAddress);
        _grantRole(BUYER_ROLE, buyerAddress);
        _grantRole(AUTHENTICATOR_ROLE, authenticatorAddress);
        _grantRole(AUDITOR_ROLE, audictorAddress);
        // Set role hierarchies
        _setRoleAdmin(SELLER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(BUYER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(AUTHENTICATOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(AUDITOR_ROLE, ADMIN_ROLE);
    }

    // Static Modifiers
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Restricted to admins");
        _;
    }

    modifier onlySeller() {
        require(hasRole(SELLER_ROLE, msg.sender), "Restricted to sellers");
        _;
    }

    modifier onlyBuyer() {
        require(hasRole(BUYER_ROLE, msg.sender), "Restricted to buyers");
        _;
    }

    modifier onlyAuthenticator() {
        require(hasRole(AUTHENTICATOR_ROLE, msg.sender), "Restricted to authenticators");
        _;
    }

    modifier onlyAuditor() {
        require(hasRole(AUDITOR_ROLE, msg.sender), "Restricted to auditors");
        _;
    }

    // Role Management
    function addSeller(address account) external onlyAdmin {
        grantRole(SELLER_ROLE, account);
    }

    function removeSeller(address account) external onlyAdmin {
        revokeRole(SELLER_ROLE, account);
    }

    function addBuyer(address account) external onlyAdmin {
        grantRole(BUYER_ROLE, account);
    }

    function removeBuyer(address account) external onlyAdmin {
        revokeRole(BUYER_ROLE, account);
    }

    function addAuthenticator(address account) external onlyAdmin {
        grantRole(AUTHENTICATOR_ROLE, account);
    }

    function removeAuthenticator(address account) external onlyAdmin {
        revokeRole(AUTHENTICATOR_ROLE, account);
    }

    function addAuditor(address account) external onlyAdmin {
        grantRole(AUDITOR_ROLE, account);
    }

    function removeAuditor(address account) external onlyAdmin {
        revokeRole(AUDITOR_ROLE, account);
    }

    // Pausable Functionality
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Decimal Override
    function decimals() public pure returns (uint8) {
        return decimal;
    }

    // Fallback and Receive Functions
    receive() external payable {
        revert("Direct payments not allowed");
    }

    fallback() external payable {
        revert("Function does not exist or direct payment not allowed");
    }

    // Product Management
    function addProduct(string memory name, uint256 price) external onlySeller whenNotPaused {
        require(bytes(name).length > 0, "Product name is required");
        require(price > 0, "Price must be greater than 0");

        products[productCount] = Product({
            name: name,
            price: price,
            seller: msg.sender,
            available: true,
            buyer: address(0)
        });

        emit ProductAdded(productCount, name, price, msg.sender);
       
    }

    function updateProductStatus(uint256 productId, bool available) external onlySeller whenNotPaused {
        Product storage product = products[productId];
        require(msg.sender == product.seller, "Only the seller can update the product status");
        product.available = available;

        emit ProductStatusUpdated(productId, available);
    }

    // Purchase a product
    function purchaseProduct(uint256 productId) external onlyBuyer whenNotPaused {
        Product storage product = products[productId];
        require(product.available, "Product is not available");

        // Initiate escrow via ICO contract
        icoContract.initiateEscrow(productId, product.price, msg.sender);

        // Mark the product as pending buyer payment
        product.buyer = msg.sender;
        product.available = false;

        emit ProductPurchased(productId, msg.sender);
    }

    // Cancel a product purchase
    function cancelPurchase(uint256 productId) external onlyAuditor whenNotPaused {
        Product storage product = products[productId];
        require(!product.available, "Product is still available");

        // Cancel escrow via ICO contract
        icoContract.cancelEscrow(productId);

        // Reset product availability
        product.buyer = address(0);
        product.available = true;

        emit ProductPurchaseCanceled(productId, msg.sender);
    }
}
