import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractArtifact from './abi/HemanthToken.json';
import tokenLogo from './assets/token.png'; // Ensure logo path is valid

const contractAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
const tokenAbi = contractArtifact.abi;

const ADDRESS_BOOK = {
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": "Hemanth",
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": "Teja",
};

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
  const [localHistory, setLocalHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState("light");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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

  const formatAddressName = (address) => {
    const normalized = address.toLowerCase();
    return ADDRESS_BOOK[normalized] || `${normalized.slice(0, 6)}...`;
  };

  const loadHistory = async () => {
    if (!tokenContract || !account) return;
    try {
      const filter = tokenContract.filters.Transfer(null, null);
      const events = await tokenContract.queryFilter(filter);
      const userTxs = events
        .filter((e) =>
          e.args.from.toLowerCase() === account.toLowerCase() ||
          e.args.to.toLowerCase() === account.toLowerCase()
        )
        .map((e) => {
          const existing = localHistory.find(h => h.hash === e.transactionHash);
          return {
            from: e.args.from,
            to: e.args.to,
            value: ethers.formatUnits(e.args.value, 18),
            hash: e.transactionHash,
            fromName: formatAddressName(e.args.from),
            toName: formatAddressName(e.args.to),
            latency: existing?.latency || null,
            startTime: existing?.startTime || null,
            endTime: existing?.endTime || null,
          };
        })
        .reverse();
      setHistory(userTxs);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const value = ethers.parseUnits(amount, 18);
      const startTime = Date.now();
      const tx = await tokenContract.transfer(toAddress, value);
      const receipt = await tx.wait();
      const endTime = Date.now();
      const latency = ((endTime - startTime) / 1000).toFixed(3);
      setLocalHistory(prev => [
        {
          hash: tx.hash,
          from: account,
          to: toAddress,
          fromName: formatAddressName(account),
          toName: formatAddressName(toAddress),
          value: amount,
          latency,
          startTime: new Date(startTime).toLocaleTimeString(),
          endTime: new Date(endTime).toLocaleTimeString()
        },
        ...prev
      ]);
      showToast(`✅ Sent ${amount} ${tokenSymbol} to ${formatAddressName(toAddress)}`);
      setAmount("");
      setToAddress("");
      loadBalance();
      loadHistory();
    } catch (err) {
      console.error("Transfer failed:", err);
      showToast("❌ Transfer failed");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    if (tokenContract && account) {
      loadBalance();
      loadHistory();
      loadTokenMetadata();
    }
  }, [tokenContract, account, localHistory]);

  const filteredHistory = history.filter(tx => {
    if (filter === "sent") return tx.from.toLowerCase() === account.toLowerCase();
    if (filter === "received") return tx.to.toLowerCase() === account.toLowerCase();
    return true;
  });

  return (
    <div className={`min-h-screen p-6 transition-all duration-300 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <img src={tokenLogo} alt="Token" className="h-10 w-10" />
          <h1 className="text-3xl font-bold">{tokenName || "Token"} Wallet</h1>
        </div>
        <button onClick={toggleTheme} className="bg-gray-300 dark:bg-gray-700 px-4 py-2 rounded-md shadow hover:scale-105 transition-transform">
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>

      {!account && (
        <button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-3 rounded-md shadow hover:bg-blue-700">Connect MetaMask</button>
      )}

      {account && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <p><strong>Account:</strong> {account} <button onClick={copyToClipboard}>📋</button> {copied && "Copied!"}</p>
          <p><strong>Balance:</strong> {balance} {tokenSymbol}</p>
        </div>
      )}

      {account && (
        <form onSubmit={handleTransfer} className="space-y-4 mb-8">
          <input type="text" placeholder="Recipient address" value={toAddress} onChange={(e) => setToAddress(e.target.value)} className="w-full p-3 border rounded dark:bg-gray-700 dark:text-white" required />
          <input type="number" placeholder={`Amount (e.g. 100 ${tokenSymbol})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 border rounded dark:bg-gray-700 dark:text-white" required />
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Send</button>
        </form>
      )}

      {account && (
        <div>
          <div className="flex gap-4 mb-4">
            <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-300 dark:bg-gray-700"}`}>All</button>
            <button onClick={() => setFilter("sent")} className={`px-4 py-2 rounded ${filter === "sent" ? "bg-blue-600 text-white" : "bg-gray-300 dark:bg-gray-700"}`}>Sent</button>
            <button onClick={() => setFilter("received")} className={`px-4 py-2 rounded ${filter === "received" ? "bg-blue-600 text-white" : "bg-gray-300 dark:bg-gray-700"}`}>Received</button>
          </div>

          <h3 className="text-xl font-semibold mb-2">📜 Transaction History</h3>
          {filteredHistory.length === 0 && <p>No transactions to display.</p>}
          {filteredHistory.map((tx, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 mb-3 border rounded-lg shadow hover:scale-[1.01] transition-all">
              <p><strong>From:</strong> {tx.fromName}</p>
              <p><strong>To:</strong> {tx.toName}</p>
              <p><strong>Amount:</strong> {tx.value} {tokenSymbol}</p>
              {tx.latency && (
                <>
                  <p><strong>Latency:</strong> {tx.latency} sec</p>
                  <p><strong>Start:</strong> {tx.startTime}</p>
                  <p><strong>End:</strong> {tx.endTime}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded shadow-lg animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
