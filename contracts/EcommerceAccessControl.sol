// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract EcommerceAccessControl is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SELLER_ROLE = keccak256("SELLER_ROLE");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 public constant AUTHENTICATOR_ROLE = keccak256("AUTHENTICATOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
        _setRoleAdmin(SELLER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(BUYER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(AUTHENTICATOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(AUDITOR_ROLE, ADMIN_ROLE);
    }
}
