import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractArtifact from './abi/HemanthToken.json';

const contractAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"; // Replace if redeployed
const tokenAbi = contractArtifact.abi;

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [tokenContract, setTokenContract] = useState(null);
  const [balance, setBalance] = useState("0");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState([]);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Install MetaMask!");
      const tempProvider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const tempSigner = await tempProvider.getSigner();
      const tempAccount = await tempSigner.getAddress();
      const tempContract = new ethers.Contract(contractAddress, tokenAbi, tempSigner);

      setProvider(tempProvider);
      setSigner(tempSigner);
      setAccount(tempAccount);
      setTokenContract(tempContract);
    } catch (err) {
      console.error("Wallet connect error:", err);
    }
  };

  const loadBalance = async () => {
    if (tokenContract && account) {
      const raw = await tokenContract.balanceOf(account);
      setBalance(ethers.formatUnits(raw, 18));
    }
  };

  const loadTokenMetadata = async () => {
    if (!tokenContract) return;

    try {
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      setTokenName(name);
      setTokenSymbol(symbol);
    } catch (err) {
      console.error("Failed to fetch token metadata:", err);
    }
  };

  const loadHistory = async () => {
    if (!tokenContract || !account) return;

    try {
      const filter = tokenContract.filters.Transfer(null, null);
      const events = await tokenContract.queryFilter(filter); // all blocks

      const userTxs = events
        .filter((e) =>
          e.args.from.toLowerCase() === account.toLowerCase() ||
          e.args.to.toLowerCase() === account.toLowerCase()
        )
        .map((e) => ({
          from: e.args.from,
          to: e.args.to,
          value: ethers.formatUnits(e.args.value, 18),
          hash: e.transactionHash,
        }))
        .reverse(); // newest first

      setHistory(userTxs);
      console.log("Found transactions:", userTxs);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const value = ethers.parseUnits(amount, 18);
      const tx = await tokenContract.transfer(toAddress, value);
      await tx.wait();
      alert(`✅ Sent ${amount} ${tokenSymbol} to ${toAddress}`);
      setAmount("");
      setToAddress("");
      loadBalance();
      loadHistory();
    } catch (err) {
      console.error("Transfer failed:", err);
      alert("Transfer failed — see console for details.");
    }
  };

  useEffect(() => {
    if (tokenContract && account) {
      loadBalance();
      loadHistory();
      loadTokenMetadata();
    }
  }, [tokenContract, account]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", color: "#333" }}>💰 {tokenName || "Token"} Wallet</h1>

      {!account && (
        <button onClick={connectWallet} style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}>
          Connect MetaMask
        </button>
      )}

      {account && (
        <>
          <p><strong>Account:</strong> {account}</p>
          <p><strong>Balance:</strong> {balance} {tokenSymbol}</p>
          <p><strong>Token:</strong> {tokenName}</p>

          <div style={{ marginTop: '2rem' }}>
            <h3>Send {tokenSymbol} Tokens</h3>
            <form onSubmit={handleTransfer}>
              <input
                type="text"
                placeholder="Recipient address"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                style={{ padding: '0.5rem', marginBottom: '0.5rem', width: '100%' }}
                required
              />
              <input
                type="number"
                placeholder={`Amount (e.g. 100 ${tokenSymbol})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ padding: '0.5rem', marginBottom: '0.5rem', width: '100%' }}
                required
              />
              <button
                type="submit"
                style={{ padding: '0.5rem 1rem', marginTop: '0.5rem' }}
              >
                Send
              </button>
            </form>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h3>📜 Transaction History</h3>
            {history.length === 0 && <p>No recent transactions found.</p>}
            {history.map((tx, index) => (
              <div key={index} style={{ padding: "0.5rem", borderBottom: "1px solid #ccc" }}>
                <p><strong>From:</strong> {tx.from}</p>
                <p><strong>To:</strong> {tx.to}</p>
                <p><strong>Amount:</strong> {tx.value} {tokenSymbol}</p>
                <p><strong>Tx:</strong> {tx.hash.slice(0, 10)}...</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
