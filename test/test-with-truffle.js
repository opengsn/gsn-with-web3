Gsn = require( '@opengsn/gsn')
const { resolveConfigurationGSN } = require( '@opengsn/gsn/dist/src/relayclient/GSNConfigurator' )
// const { startGsn } = require( '@opengsn/gsn/dist/src/relayclient/GsnTestEnvironent' )

const { GsnTestEnvironment } = require('@opengsn/gsn/dist/GsnTestEnvironment' )
Counter = artifacts.require( 'Counter')
// IPaymaster = artifacts.require( 'IPaymaster')
CounterArtifact = require( '../build/contracts/Counter')

let counterAddress
describe( 'using truffle\'s TruffleContract', ()=> {
  let counter
  let from
  let forwarder
  let paymasterAddress
  let netid
  before(async function () {
    this.timeout(60000) //startGsn takes few seconds
    netid = await web3.eth.net.getId()
  	console.log( 'using network', netid) 
  
    switch (netid) {
      case 42:
        paymasterAddress = '0x083082b7Eada37dbD8f263050570B31448E61c94'
        forwarder = '0x0842Ad6B8cb64364761C7c170D0002CC56b1c498'
        counterAddress = '0x60180E5a653b475dAb7F5a92523A88d141215355'
        break

      case 4:
        paymasterAddress = '0x43d66E6Dce20264F6511A0e8EEa3f570980341a2'
        forwarder = '0x956868751Cc565507B3B58E53a6f9f41B56bed74'
        counterAddress = '0x74440273b6442C879A7174Fed79b18720B4f2218'
        break

      case 3:

        paymasterAddress = '0x8057c0fb7089BB646f824fF4A4f5a18A8d978ecC'
        forwarder: '0x25CEd1955423BA34332Ec1B60154967750a0297D'
        counterAddress = '0xDF387A17FD0dC5dEcfEA385e4e336F947363831b'
        break

      default:

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
      // forwarderAddress: forwarder, 
    	verbose: true
    })
    console.log( 'config=',config)
    provider = new Gsn.RelayProvider(web3.currentProvider, config )

    provider.registerEventListener(console.log)
    //create a new gasless account:
    from = web3.utils.toChecksumAddress(provider.newAccount().address)
  })

  it( 'run with TruffleContract', async function() {
    this.timeout(60000)

//    counter = await Counter.new(forwarder)

    if ( counterAddress ) {
      //on testnet. use existing contract
      counter = await Counter.at(counterAddress)
      console.log( 'using counter at address=', counter.address)
    } else {

        //deploy on ganache
        counter = await Counter.new(forwarder)
        console.log( 'deployed counter at address=', counter.address)
    }
    console.log( 'paymaster=', paymasterAddress)

    //NOTE: this is required only in truffle tests: the "artifacts.require" is called
    // before we could update the global web3's provider
    Counter.web3.setProvider(provider)

    await counter.increment({from, gas:1e6})
    assert.equal( from, await counter.lastCaller() )
  })

  it( 'run with web3.Contract', async function () {
    this.timeout(60000)
    if ( !counterAddress ) {
      const deployAccount = (await web3.eth.getAccounts())[0]
      console.log( 'bal ', deployAccount, await web3.eth.getBalance(deployAccount))
      //create a contract and deploy it - without GSN
      const deployCounter = new web3.eth.Contract( CounterArtifact.abi )
      const deployed = await deployCounter.deploy({arguments:[forwarder], data:CounterArtifact.bytecode} ).send({from:deployAccount, gasLimit:1e6})
      counterAddress = deployed.options.address
    }

    web3.setProvider(provider)
    //now any contract created with this web3 instance is GSN-enabled

    const counter = new web3.eth.Contract( CounterArtifact.abi, counterAddress )

    await counter.methods.increment().send({from, gas:1e6})
    assert.equal( from, await counter.methods.lastCaller().call() )
  })
})

