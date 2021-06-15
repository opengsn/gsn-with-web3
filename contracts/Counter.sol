pragma solidity ^0.7.6;
// SPDX-License-Identifier: MIT

import "@opengsn/contracts/src/BaseRelayRecipient.sol";


contract Counter is BaseRelayRecipient {

	uint public counter;
	address public lastCaller;

	constructor(address _forwarder) public {
		trustedForwarder = _forwarder;
	}

	function increment() public {
		counter++;
		lastCaller = _msgSender();
	}

	function versionRecipient() external override view returns (string memory) {
		return "2.2.0";
	}

} 

