Gsn = require( '@opengsn/provider')

const { GsnTestEnvironment } = require('@opengsn/cli/dist/GsnTestEnvironment' )
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
        paymasterAddress = '0xFACb65Ea83795c54Fb92Bb3B646B757A9eB9ECA2'
        forwarder = '0x7eEae829DF28F9Ce522274D5771A6Be91d00E5ED'
        counterAddress = '0x439cDcF4F501018Cb16428f635eE55042cDA7335'
        break

      case 4:
        paymasterAddress = '0xA6e10aA9B038c9Cddea24D2ae77eC3cE38a0c016'
        forwarder = '0x83A54884bE4657706785D7309cf46B58FE5f6e8a'
        counterAddress = '0x4f6A12C3F9e6Ce99ece166Caa3E714f331E9f93c'
        break

      case 3:
        paymasterAddress = '0x246aC46ad7ee41A1Ba87DbF9Dd0592E8a20951D9'
        forwarder = '0xeB230bF62267E94e657b5cbE74bdcea78EB3a5AB'
        counterAddress = '0x51a89c18f9E29b434B9308e87D6A1AE6CF5E9A31'
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
          paymasterAddress = env.contractsDeployment.paymasterAddress
          forwarder = env.contractsDeployment.forwarderAddress

        }
    }

    const config = {
      paymasterAddress,
      loggerConfiguration: {
        logLevel: 'error'
      }
    }
    console.log( 'config=',config)
   provider = Gsn.RelayProvider.newProvider({provider: web3.currentProvider, config})
   await provider.init()

    //provider.registerEventListener(console.log)
    //create a new gasless account:
    from = web3.utils.toChecksumAddress(provider.newAccount().address)
  })

  after(async()=>{
    await GsnTestEnvironment.stopGsn()
  })

  it( 'run with TruffleContract', async function() {
    this.timeout(60000)

//    counter = await Counter.new(forwarder)

    if ( counterAddress ) {
      //on testnet. use existing contract
      counter = await Counter.at(counterAddress)
      console.log( 'using counter at address=', counter.address)
    } else {

        const accounts = await web3.eth.getAccounts()
        //deploy on ganache
        counter = await Counter.new(forwarder, {from:accounts[0], useGSN:false})
        console.log( 'deployed counter at address=', counter.address)
    }
    console.log( 'paymaster=', paymasterAddress)

    //required: truffle allows too much gas for inner transaction. must estimate or set a lower gas limit
    Counter.defaults({...Counter.defaults(), gas:undefined })

    //NOTE: this is required only in truffle tests: the "artifacts.require" is called
    // before we could update the global web3's provider
    Counter.web3.setProvider(provider)

    await counter.increment({from})
    assert.equal( from, await counter.lastCaller() )
  })

  it( 'run with web3.Contract', async function () {
    this.timeout(60000)
    if ( !counterAddress ) {
      const deployAccount = (await web3.eth.getAccounts())[0]
      console.log( 'bal ', deployAccount, await web3.eth.getBalance(deployAccount))
      //create a contract and deploy it - without GSN
      const deployCounter = new web3.eth.Contract( CounterArtifact.abi )
      const deployed = await deployCounter.deploy({arguments:[forwarder], data:CounterArtifact.bytecode} ).send({from:deployAccount, gasLimit:1e6, useGSN:false})
      counterAddress = deployed.options.address
    }

    web3.setProvider(provider)
    //now any contract created with this web3 instance is GSN-enabled

    const counter = new web3.eth.Contract( CounterArtifact.abi, counterAddress )

    await counter.methods.increment().send({from})
    assert.equal( from, await counter.methods.lastCaller().call() )
  })
})

