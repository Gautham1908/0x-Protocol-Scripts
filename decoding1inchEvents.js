const Web3 = require('web3');

const ContractNameABI = require('./contractNameSymbol.json');

const web3 = new Web3(
    "https://mainnet.infura.io/v3/585178b4d49e49c59162eee163ccade8"
);

const limitOrderSig = web3.eth.abi.encodeEventSignature('LimitOrderFilled(bytes32,address,address,address,address,address,uint128,uint128,uint128,uint256,bytes32)');
console.log("limit ", limitOrderSig)

const contractAddress = "0xdef1c0ded9bec7f1a1670819833240f027b25eff"; // the address of your contract
const contractABI = require("./0xProtocalAbi.json");

const contract = new web3.eth.Contract(contractABI, contractAddress);


async function getLogsOfContract() {
    let Result = []
    let blockNumber = await web3.eth.getBlockNumber()
    console.log("blockNumber", blockNumber);

    let Logs = await contract.getPastEvents(
        "allEvents",
        {
            fromBlock: blockNumber - 100,
            toBlock: "latest",
        },
        //   (error, events) => {
        //     if (error) {
        //       console.log(error);
        //       return;
        //     }
        //     // console.log(events.length)
        //     events.forEach((event) => {     
        //     });
        //   }
    );

    Logs.forEach((log) => {
        if (log.raw.topics[0] == limitOrderSig) {
            Result.push(log)
        }
    })

    console.log("Events received ", Logs.length)
    console.log("Filter Events ", Result.length)
    return Result
}

function DecodeEvent(eventsArray) {
    let FinalArray = []
    eventsArray.forEach((event,i) => {

        let topicArr = []

        let res = web3.eth.abi.decodeLog(
            [
                {
                    "name": "orderHash",
                    "type": "bytes32"
                },
                {
                    "name": "maker",
                    "type": "address"
                },
                {
                    "name": "taker",
                    "type": "address"
                },
                {
                    "name": "feeRecipient",
                    "type": "address"
                },
                {
                    "name": "makerToken",
                    "type": "address"
                },
                {
                    "name": "takerToken",
                    "type": "address"
                },
                {
                    "name": "takerTokenFilledAmount",
                    "type": "uint128"
                },
                {
                    "name": "makerTokenFilledAmount",
                    "type": "uint128"
                },
                {
                    "name": "takerTokenFeeFilledAmount",
                    "type": "uint128"
                },
                {
                    "name": "protocolFeePaid",
                    "type": "uint256"
                },
                {
                    "name": "pool",
                    "type": "bytes32"
                }
            ],
            event.raw["data"],
            topicArr
        );

        let obj =  {
            "Hash": event.transactionHash,
            "DecodedEventData": {
                "orderHash": res.orderHash,
                "maker": res.maker,
                "taker": res.taker,
                "feeRecipient": res.feeRecipient,
                "makerToken": res.makerToken,
                "takerToken": res.takerToken,
                "takerTokenFilledAmount": res.takerTokenFilledAmount,
                "makerTokenFilledAmount": res.makerTokenFilledAmount,
                "takerTokenFeeFilledAmount": res.takerTokenFeeFilledAmount,
                "protocolFeePaid": res.protocolFeePaid,
                "pool": res.pool
            }
        }
        // console.log("index ", i, "data ",obj)
        FinalArray.push(obj);
    })

    return FinalArray
}

async function getTransactionReceipt(hash) {
    let result = await web3.eth.getTransactionReceipt(hash)
    result.logs.forEach((log) => {
        if (log.topics[0] == limitOrderSig) {
            console.log("founded ", log)
        }
    })
    // console.log(result)
    return result
}

// getTransactionReceipt('0x02481ac84f26d0e25489c413b1e9c8599f3469304486fc03c0f2fdf9a432952b')

getLogsOfContract().then((result) => {
    let DecodeData = DecodeEvent(result)
    // console.log("result length ",result.length)
    console.log("Decode data length ",DecodeData.length)
    console.log(DecodeData)
})