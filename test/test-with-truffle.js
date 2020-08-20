Gsn = require( '@opengsn/gsn')
const { resolveConfigurationGSN } = require( '@opengsn/gsn/dist/src/relayclient/GSNConfigurator' )
// const { startGsn } = require( '@opengsn/gsn/dist/src/relayclient/GsnTestEnvironent' )

const { GsnTestEnvironment } = require('@opengsn/gsn/dist/GsnTestEnvironment' )
Counter = artifacts.require( 'Counter')
// IPaymaster = artifacts.require( 'IPaymaster')
CounterArtifact = require( '../build/contracts/Counter')

describe( 'using truffle\'s TruffleContract', ()=> {
  let counter
  let from
  let forwarder
  let paymasterAddress
  before(async function () {
    this.timeout(20000) //startGsn takes few seconds
    if ( process.argv.includes('kovan')) {

      paymasterAddress = '0x9940c8e12Ca14Fe4f82646D6d00030f4fC3C7ad1'
      forwarder = '0x663946D7Ea17FEd07BF1420559F9FB73d85B5B03'

    } else {
      const yarnWithGanache=false
      if ( yarnWithGanache ) {

        //gsn started with "yarn ganache-with-gsn"
        paymasterAddress = require( '../build/gsn/Paymaster.json').address
        forwarder = require( '../build/gsn/Forwarder.json').address
      } else {

        //only ganache is running. start GSN with each test:      
        let env = await GsnTestEnvironment.startGsn('localhost')
        paymasterAddress = env.deploymentResult.naivePaymasterAddress
        forwarder = env.deploymentResult.forwarderAddress
      }
    }


    const config = await resolveConfigurationGSN(web3.currentProvider, {
        paymasterAddress, 
        forwarderAddress: forwarder, 
	verbose: true
    })
    provider = new Gsn.RelayProvider(web3.currentProvider, config )

    //create a new gasless account:
    from = web3.utils.toChecksumAddress(provider.newAccount().address)
  })

  it( 'run with TruffleContract', async function() {
    this.timeout(20000)

    counter = await Counter.new(forwarder)

    if ( !counter && process.argv.includes('kovan') )
      counter = await Counter.at('0xDF387A17FD0dC5dEcfEA385e4e336F947363831b')
    console.log( 'created counter=', counter.address)

    //NOTE: this is required only it truffle tests: the "artifacts.require" is called
    // before we could update the global web3's provider,
    Counter.web3.setProvider(provider)

    await counter.increment({from, gas:1e6})
    assert.equal( from, await counter.lastCaller() )
  })

  it( 'run with web3.Contract', async function () {
    this.timeout(20000)
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

