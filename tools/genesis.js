const fs = require("fs");
const process = require("process");
const path = require("path");
const genesisJson = require("./genesis-base.json");

const network = process.argv[2] || "testnet";

let csv = `
iconlake,iconlake1njpxea460gxk5l448mxs75g7qe796wsnmmxxfc,0
`;

const accountsCSV = fs.readFileSync(path.resolve(__dirname, `./accounts.csv`));

csv += accountsCSV.toString().split("\n").slice(1).join("\n");

const accounts = {};

csv
  .trim()
  .split("\n")
  .forEach((row) => {
    const [name, address, amount] = row.split(",");
    if (address in accounts) {
      accounts[address].name += "+" + name;
      accounts[address].amount += parseInt(amount);
    } else {
      accounts[address] = {
        name,
        amount: parseInt(amount),
      };
    }
  });

console.log(JSON.stringify(accounts, null, 2));

const genAccounts = [];
const genBalances = [];
Object.keys(accounts).forEach((address) => {
  genAccounts.push({
    "@type": "/cosmos.auth.v1beta1.BaseAccount",
    address,
    pub_key: null,
    account_number: "0",
    sequence: "0",
  });
  genBalances.push({
    address,
    coins:
      accounts[address].amount > 0
        ? [
            {
              denom: "ulake",
              amount: `${accounts[address].amount * 1000000}`,
            },
          ]
        : [],
  });
});

genesisJson.app_state.auth.accounts = genAccounts;
genesisJson.app_state.bank.balances = genBalances;

if (network === "testnet") {
  genesisJson.genesis_time = "2023-12-30T10:00:00Z";
  genesisJson.chain_id = "iconlake-testnet-1";
  genesisJson.app_state.staking.params.unbonding_time = "600s";
}

fs.writeFileSync(
  path.resolve(__dirname, `../${network}/genesis.json`),
  JSON.stringify(genesisJson, null, 4)
);

console.log("\n Network info:\n");

console.table([
  {
    network: network,
    chainId: genesisJson.chain_id,
    genesisTime: genesisJson.genesis_time,
    accountsCount: genAccounts.length,
    balanceTotal: `${
      genBalances.reduce(
        (acc, cur) => acc + (cur.coins.length > 0 ? +cur.coins[0].amount : 0),
        0
      ) / 1000000
    }LAKE`,
  },
]);

console.log("\ndone!!!");
