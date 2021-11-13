import './styles/App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import twitterLogo from './assets/twitter-logo.svg';
import myEpicNft from './utils/MyEpicNFT.json';
import React, { useEffect, useState, Component} from "react";
import { ethers } from "ethers";
import { Button, Spinner } from 'react-bootstrap'



const TWITTER_HANDLE = 'gio_incognito';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0xC93Bdd302b29FD679996B2D4865cb74B4D4a66eD";
const OPENSEA_LINK = 'https://testnets.opensea.io/assets/' + CONTRACT_ADDRESS
const OPENSEA_COLLECTION_LINK = 'https://testnets.opensea.io/collection/squarenft-iyhzdnsivt'


const App = () => {

    const [currentAccount, setCurrentAccount] = useState("");
    const [numMinted, setNumMinted] = useState(0)
    
    const checkIfWalletIsConnected = async () => {
      const { ethereum } = window;

      if (!ethereum) {
          console.log("Make sure you have metamask!");
          return;
      } else {
          console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account)

          // Setup listener! This is for the case where a user comes to our site
          // and ALREADY had their wallet connected + authorized.
          setupEventListener()
      } else {
          console.log("No authorized account found")
      }
  }

  /*
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener() 
    } catch (error) {
      console.log(error)
    }
  }

  const onRinkeby = async () => {
    console.log("Checking user is on Rinkeby")
    try {
      const { ethereum } = window;

      if (ethereum) {
        let chainId = await ethereum.request({ method: 'eth_chainId' });
        console.log("Connected to chain " + chainId);

        // String, hex code of the chainId of the Rinkebey test network
        const rinkebyChainId = "0x4"; 
        if (chainId !== rinkebyChainId) {
          alert("You are not connected to the Rinkeby Test Network!");
          return false
        } else if (chainId == rinkebyChainId) {
          console.log("Rinkeby detected")
          return true
        }
      } else {
        console.log("No ethereum object.");
      } 
    } catch(error) {
        console.log(error);
      }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        let reqNumMinted = await connectedContract.tokensMinted();
        setNumMinted(parseInt(Number(reqNumMinted['_hex']), 10))

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });
        

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  class MintButton extends Component {
    state = {
      loading: false
    };

    askContractToMintNft = async () => {
      try {
        const { ethereum } = window;

        if (ethereum) {
          let correctNetwork = await onRinkeby()
          if (correctNetwork) {
            this.setState({ loading: true });
            console.log("Entering minting process")
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

            console.log("Going to pop wallet now to pay gas...")
            let nftTxn = await connectedContract.makeAnEpicNFT();

            console.log("Mining...please wait.")
            await nftTxn.wait();
            this.setState({ loading: false });
            let reqNumMinted = await connectedContract.tokensMinted();
            setNumMinted(parseInt(Number(reqNumMinted['_hex']), 10))
            
            console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
          } else {
            console.log("User is on wrong network");
          }

        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        console.log(error)
      }
    }

    render() {
      const { loading } = this.state;

      return (
        <button className="cta-button mint-button" onClick={this.askContractToMintNft} disabled={loading}>
          {loading && (
            <i
              className="fa fa-spinner fa-spin"
              style={{ marginRight: "5px" }}
            />
          )}
          {loading && <span>Minting NFT...</span>}
          {!loading && <span>Mint NFT</span>}
        </button>
      );
    }
  }



  const openCollection = async () => {
    window.open(OPENSEA_COLLECTION_LINK)
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  // componentDidMount() {
  //       import("./LoaderCube.js");
  // }

  /*
  * Added a conditional render! We don't want to show Connect to Wallet if we're already conencted :).
  */
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">NumerousFantasyTreats Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. {numMinted} / {TOTAL_MINT_COUNT} Minted so far!
          </p>
          {currentAccount === "" ? (
            <button onClick={connectWallet} className="cta-button connect-wallet-button">
              Connect to Wallet
            </button>
          ) : (
            /** Add askContractToMintNft Action for the onClick event **/
            // <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
            //   Mint NFT
            // </button>
            <MintButton />
          )}
          <button onClick={openCollection} className="cta-button opensea-button">
          See the Collection
          </button>
        </div>
        <div className="footer-container">
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;