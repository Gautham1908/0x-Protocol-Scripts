const Web3 = require('web3');

const ContractNameABI = require('./contractNameSymbol.json');

const web3 = new Web3(
    "https://mainnet.infura.io/v3/585178b4d49e49c59162eee163ccade8"
);

/**
 * each log should have
 * - conract-address
 * - contract-name
 * - contract-symbol
 * - transaction type / function call name/ log name 
 * - value obj with decode data
 * each tx such have
 * - logs obj 
 * - and in last tx hash
 */

///////////- Global Variables -/////////////
let count
///////////////////////////////////////////

const contractAddress = "0x1111111254eeb25477b68fb85ed929f73a960582"; // Address of 1inch Aggregator

const swapFunctionSig = web3.eth.abi.encodeFunctionSignature(
    "swap(address,(address,address,address,address,uint256,uint256,uint256),bytes,bytes)"
    );
    console.log("Function signature of swap : " + swapFunctionSig);
    
    const unoswapFunctionSig = web3.eth.abi.encodeFunctionSignature("unoswap(address,uint256,uint256,uint256[])")
    console.log("Function signature of unoswap : " + unoswapFunctionSig);
    
/**
* @returns txn of specific contract and takes only swap and unoswap function call txns
*/
async function getTransactionFromBlock() {
    count = 0 
    let arr = []

    const blockNumber = await web3.eth.getBlockNumber();
    console.log("blockNumber", blockNumber);

    // 
    for (let i = blockNumber - 10; i <= blockNumber; i++) {

        // getting the specific block txns
        let getBlock = await web3.eth.getBlock(i, true)

        // accessing each txn of the block
        getBlock.transactions.forEach(async (tx) => {

            // filter it with 1inch contract only
            if (tx.to !== null && tx.to.toLowerCase() === contractAddress) {

                // console.log("TX ",tx)

                // filtering only swap and unoswap function call
                if (tx.input.slice(0, 10) === swapFunctionSig || tx.input.slice(0, 10) === unoswapFunctionSig) {

                    count++;
                    
                    let resultArr = await getLogsDataFromHash(tx)
                    // console.log("result received ", resultArr)
                    arr.push(resultArr)
                    
                    // pushing each tranaction arr to sub arr
                }
            }
        })
    }
    return arr
}

/**
 * @param txObj takes obj of transaction
 * @returns object which includes hash and logs object of that transaction hash 
 */
async function getLogsDataFromHash(txObj) {
    // getting logs object for specifc tx by hash
    let result = await web3.eth.getTransactionReceipt(txObj.hash)

    let data = filterLogsOfspecificTx(result)

    // adding hash of each txn in last
    data.push({
        "hash": txObj.hash
    })
    
    return data
}

/**
 * 
 */
function filterLogsOfspecificTx(logsObj){
    let result = []
    let logs = logsObj.logs

    logs.forEach((log) => {
        let txtype = transactionType(log)
        if(txtype){
            result.push(txtype)
        }
    })


    return result
}

/**
 * 
 */
function transactionType(log) {
    // console.log(log)
    // hash of events 
    let transferEvent = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    let approvalEvent = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
    let depositEvent = "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c";
    let withdrawelEvent = "0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65";
    let swapEvent = "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822";
    let syncEvent = "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1";

    if (log.topics[0].toLowerCase() == transferEvent) {
        return transferEventFn(log)
    } else if (log.topics[0].toLowerCase() == swapEvent) {
        return swapEventFn(log);
    }
}

/**
 * @param log takes a specific log and access topics array
 * @returns decode output in object
 */
function transferEventFn(log) {
    let topicArr = []

    for (let i = 1; i < log.topics.length; i++) {
        topicArr.push(log.topics[i])
    }

    let res = web3.eth.abi.decodeLog(
        [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        log["data"],
        topicArr
    );

    return {
        "contract-address": log.address,
        "transaction-type": "Transfer",
        "value": {
            "from": res.from,
            "to": res.to,
            "value": res.value
        }
    }  
}

/**
 * @param log takes a specific log and access topics array
 * @returns decode output in object
 */
function swapEventFn(log) {
    let topicArr = []
    
    for (let i = 1; i < log.topics.length; i++) {
        topicArr.push(log.topics[i])
    }
    
    let res = web3.eth.abi.decodeLog(
        [
            {
                "indexed": true,
                "name": "sender",
                "type": "address"
            },
            {
                "name": "amount0In",
                "type": "uint256"
            },
            {
                "name": "amount1In",
                "type": "uint256"
            },
            {
                "name": "amount0Out",
                "type": "uint256"
            },
            {
                "name": "amount1Out",
                "type": "uint256"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            }
        ],
        log["data"],
        topicArr
    );

    return {
        "contract-address": log.address,
        "transaction-type": "Swap",
        "value": {
            "sender": res.sender,
            "amount0In": res.amount0In,
            "amount1In": res.amount1In,
            "amount0Out": res.amount0Out,
            "amount1Out": res.amount1Out,
            "to": res.to,
        }
    }
}


async function getContractName(contractAddress) {
    const contract = new web3.eth.Contract(ContractNameABI, contractAddress);

    let name = await contract.methods.name().call()
    let symbol = await contract.methods.symbol().call()

    // console.log(name)
    // console.log(symbol)

    return {"name": name, "symbol": symbol}
}

async function getContracNameForArray(txArray){
    for(let i = 0; i < txArray.length; i++){
        let contractNames = []
        for(let j = 0; j< txArray[i].length; j++){
                if(txArray[i][j]['contract-address']){
                    let contractNameAndSymbol = await getContractName(txArray[i][j]['contract-address'])
                    txArray[i][j]['contract-name'] = contractNameAndSymbol.name
                    txArray[i][j]['contract-symbol'] = contractNameAndSymbol.symbol
                    if(contractNames.indexOf(contractNameAndSymbol.name) == -1 || j == txArray.length - 1){
                        contractNames.push(contractNameAndSymbol.name)
                    }
                } else if(txArray[i][j].hash){
                    txArray[i][j]['contract-names'] = contractNames
                }
        }
    }
    return txArray
}

function accessAndConsole(array) {
    for(let i = 0; i < array.length; i++){
        console.log('i ',i)
        for(let j = 0; j< array[i].length; j++){
            console.log(array[i][j])
        }
    }    
}




async function main() {
    let filterArray = []
    let txHashArray = await getTransactionFromBlock();

    const result = await getContracNameForArray(txHashArray)

    accessAndConsole(result);
    return result
}

main().then((result) => {
    console.log("txn received : ", count)
    console.log("result count : ", result.length)
    // console.log(result)
})

// getTransactionFromBlock().then((result) => {
//     console.log("txn received : ", count)
//     console.log("result count : ", result.length)
//     console.log("RESULT ",result)
// })