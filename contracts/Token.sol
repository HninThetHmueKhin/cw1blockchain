// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 1_000_000 * (10 ** 18); // 1 million tokens with 18 decimals

    constructor() ERC20("Ecommerce", "ECM") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // Mint new tokens (Owner only)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Burn tokens (Owner only)
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}
