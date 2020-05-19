Gsn = require( '@opengsn/gsn')
const GsnTestEnvironment = require('@opengsn/gsn/dist/GsnTestEnvironment' ).default
Counter = artifacts.require( 'Counter')

CounterArtifact = require( '../build/contracts/Counter')

describe( 'using truffle\'s TruffleContract', ()=> {
  let counter
  let from
  let forwarder
  before(async function () {
    this.timeout(10000) //startGsn takes few seconds
    let env = await GsnTestEnvironment.startGsn('localhost')
    const { relayHubAddress, paymasterAddress, stakeManagerAddress, forwarderAddress } = env.deploymentResult
    forwarder = forwarderAddress

    config = Gsn.configureGSN({
        relayHubAddress,
        stakeManagerAddress,
        paymasterAddress
    })
    provider = new Gsn.RelayProvider(web3.currentProvider, config )
 
    //create a new gasless account:
    from = web3.utils.toChecksumAddress(provider.newAccount().address)
  })

  it( 'run with TruffleContract', async function() {
    this.timeout(5000)

    counter = await Counter.new(forwarder)

    //NOTE: this is required only it truffle tests: the "artifacts.require" is called
    // before we could update the global web3's provider, 
    Counter.web3.setProvider(provider)
	
    await counter.increment({from, gas:1e6})
    assert.equal( from, await counter.lastCaller() )
  })

  it( 'run with web3.Contract', async function () {
    this.timeout(5000)
    const deployAccount = (await web3.eth.getAccounts())[5]
    console.log( 'bal ', deployAccount, await web3.eth.getBalance(deployAccount))
    //create a contract and deploy it - without GSN
    const deployCounter = new web3.eth.Contract( CounterArtifact.abi )
    const deployed = await deployCounter.deploy({arguments:[forwarder], data:CounterArtifact.bytecode} ).send({from:deployAccount, gasLimit:1e6, gasPrice:1})

    web3.setProvider(provider)
    //now any contract created with this web3 instance is GSN-enabled

    const counter = new web3.eth.Contract( CounterArtifact.abi, deployed.options.address )

    await counter.methods.increment().send({from, gas:1e6})
    assert.equal( from, await counter.methods.lastCaller().call() )
  })
})

