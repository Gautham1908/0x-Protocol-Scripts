const Web3 = require('web3');

const web3 = new Web3(
    "https://mainnet.infura.io/v3/585178b4d49e49c59162eee163ccade8"
);

const limitOrderSig = web3.eth.abi.encodeEventSignature('LimitOrderFilled(bytes32,address,address,address,address,address,uint128,uint128,uint128,uint256,bytes32)');
console.log("",limitOrderSig)


async function DecodeTxnOfOrderFilledEvent(hash){
    let result = await web3.eth.getTransactionReceipt(hash)
    let data = filterLogsOfspecificTx(result)

    // console.log(data)
    return data
}

function filterLogsOfspecificTx(logsObj){
    //  console.log(logsObj)
    let result = []
    let logs = logsObj.logs

    logs.forEach((log) => {
        let txtype = EventType(log)
        if(txtype){
            result.push(txtype)
        }
    })


    return result
}

function EventType(log) {
    if(log.topics[0].toLowerCase() == limitOrderSig){
        return decodeFillOrder(log)
    }
}

function decodeFillOrder(log){
    let topicArr = []

    for (let i = 1; i < log.topics.length; i++) {
        topicArr.push(log.topics[i])
    }

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
        log["data"],
        topicArr
    );

    return {
        "contract-address": log.address,
        "decodeValue": {
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
}

DecodeTxnOfOrderFilledEvent('0x87b06f51b6e14c9edc26f9af246bc7b4ba3d82ae7b61597dda772a0a6547f934').then((result) => {
    console.log(result)
})