var mysql2 = require('mysql2');
const nodeFetch = require('node-fetch');

const LINK_TABLE = 'tft_poe_account_links';
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const pool = mysql2.createPool({
  host: process.env.dbHost,
  user: process.env.dbUser,
  password: process.env.dbPassword,
  database: process.env.dbName,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 10,
});

const getConnection = async () => {
  return pool.promise();
}

// Get all of the accounts in DB
const getAccounts = async () => {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    `SELECT poe_account_name FROM ${LINK_TABLE}`
  )

  const bannedCheck = rows.map((row) => row['poe_account_name']);

  bannedCheck.forEach(async i => {
    await sleep(2000);
    await checkBannedAccount(i);
  });
}

//Checks if account is banned
const checkBannedAccount = async (poeAcc) => {
  var bannedStr = "<div class=\"roleLabel banned\">Banned</div>";
  // In case many banned accs suddenly try to link, we don't want to get rate limited by GGG
  await sleep(2000);
  const response = await nodeFetch(`https://www.pathofexile.com/account/view-profile/${poeAcc}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Host': 'www.pathofexile.com',
      'User-Agent': 'TftPoeLinker / 1.0'
    }
  });
  const text = await response.text();
  return text.includes(bannedStr);
}

module.exports = {
  checkBannedAccount,
  getAccounts
}