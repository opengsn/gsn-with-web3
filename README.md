# Sample GSN project with web3

This is a simple project to demonstrate using OpenGSN with Truffle and web3

Usage:
```
yarn install

yarn test
```

The test can be done in 3 modes:

1. self-contained test - `yarn test`.

2. start `ganache` in another window, and then `npx gsn start` in another to install GSN and bring up a relayer. 
  Then tell the test NOT to start GSN internally, by setting yarnWithGanache=true. The test will still need to load the Forwarder and RelayHub addresses.
  Then run the test with `truffle test`

3. run `yarn testkovan` to start the test against a deployed network (kovan)


The test thus shows how to start GSN within the test (using `startGsn()`) and how to refernce GSN started in another terminal.

The test then shows how to configure your web3 contracts to use GSN.

The tests themselves merely verify that the call was relayed (caller didn't pay..) and that indeed it can see the caller's address (using `_msgSender()`)

It shows using both truffle's TruffleContract and web3.Contract


