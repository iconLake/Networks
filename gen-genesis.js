const fs = require('fs');

const network = 'testnet';

const csv = `
iconlake,iconlake1njpxea460gxk5l448mxs75g7qe796wsnmmxxfc,0
`;

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
        coins: accounts[address].amount > 0 ? [
            {
                denom: "ulake",
                amount: `${accounts[address].amount * 1000000}`,
            },
        ] : [],
    });
});

const genesisJson = JSON.parse(fs.readFileSync(`./${network}/genesis.json`));

genesisJson.app_state.auth.accounts = genAccounts;
genesisJson.app_state.bank.balances = genBalances;

fs.writeFileSync(`./${network}/genesis.json`, JSON.stringify(genesisJson, null, 4));

console.log('done');
