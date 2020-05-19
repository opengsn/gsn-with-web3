# Sample GSN project with ethers.

This is a simple project to demonstrate using OpenGSN with truffle and web3

Usage:
```
yarn install

ganache-cli & (or in another terminal)

yarn test
```

The test brings up a full GSN envorment by calling `startGsn()`. It deploy the contracts and starts a relay inside your test.
The test then shows how to configure your web3 contracts to use GSN.

The tests themselves merely verify that the call was relayed (caller didn't pay..) and that indeed it can see the caller's address (using `_msgSender()`)

It shows using both truffle's TruffleContract and web3.Contract

You can also start GSN outside the test:
- start GSN from another window, by calling: 
  ```
  npx gsn start localhost
  ```
  
- In the test, remove the `startGSN()` in the test.
- Update the test to read the relayHub address (and other deployed components):
  ```
  relayHubAddress = require('./build/gsn/RelayHub').address
  ```

