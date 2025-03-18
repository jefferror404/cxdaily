function prepareDownload() {
  // Create temporary image elements for icons
  const btcImage = new Image();
  btcImage.crossOrigin = "Anonymous";
  btcImage.src = "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=025";
  
  const ethImage = new Image();
  ethImage.crossOrigin = "Anonymous";
  ethImage.src = "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=025";
  
  const solImage = new Image();
  solImage.crossOrigin = "Anonymous";
  solImage.src = "https://cryptologos.cc/logos/solana-sol-logo.svg?v=025";
  
  return new Promise((resolve) => {
    // Wait for images to load
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 3) resolve([btcImage, ethImage, solImage]);
    };
    
    btcImage.onload = checkLoaded;
    ethImage.onload = checkLoaded;
    solImage.onload = checkLoaded;
    
    // Handle errors - continue even if images fail to load
    btcImage.onerror = checkLoaded;
    ethImage.onerror = checkLoaded;
    solImage.onerror = checkLoaded;
    
    // If images take too long, continue anyway
    setTimeout(() => resolve([btcImage, ethImage, solImage]), 3000);
  });
}


// Toggle controls panel
document.getElementById('toggleControls').addEventListener('click', function () {
    document.getElementById('controls').classList.toggle('open');
});

// Initialize with current date
const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
document.getElementById('currentDate').textContent = currentDate;
document.getElementById('dateInput').value = currentDate;

// Initialize with example news
const initialNews = [
    "DOGE prototype Shiba Inu, Kabosu's owner, launched the $Cocoro token on Base, but after reaching a $100M market cap, the price plunged by 70%.",
    "Texas Senate passed a bill for a Bitcoin reserve fund.",
    "AI sector's market cap dropped 5.6% in 24 hours.",
    "Bubblemap's TGE for $BMT is set for March 11."
];
document.getElementById('newsInput').value = initialNews.join('\n');

// Initialize form values
document.getElementById('etfFlowInput').value = "+$234.5M";
document.getElementById('listedCoinsInput').value = "1300";
document.getElementById('coinsUpInput').value = "900";
document.getElementById('coinsDownInput').value = "400";

// Store token data
let tokenData = {
    token1: { id: "sui", symbol: "SUI" },
    token2: { id: "hyperliquid", symbol: "HYPE" },
    token3: { id: "myshell", symbol: "SHELL" },
    token4: { id: "ondo-finance", symbol: "ONDO" }
};

// Helper function for delayed execution
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch Bitcoin data from CoinGecko
async function fetchBitcoinData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();
        const bitcoinData = data.bitcoin;

        if (bitcoinData) {
            const price = bitcoinData.usd;
            const change = bitcoinData.usd_24h_change;

            document.getElementById('btcPrice').textContent = `$${price.toLocaleString()}`;
            document.getElementById('btcChange').textContent = `${change.toFixed(2)}%`;
            document.getElementById('btcChange').classList.toggle('positive', change >= 0);
            document.getElementById('btcChange').classList.toggle('negative', change < 0);
        }
    } catch (error) {
        console.error('Error fetching Bitcoin data:', error);
    }
}

// Fetch Fear & Greed Index from Alternative.me
async function fetchFearGreedIndex() {
    try {
        const response = await fetch('https://api.alternative.me/fng/?limit=1');
        const data = await response.json();
        const fearGreedValue = data.data[0].value;

        updateFearGreedNeedle(fearGreedValue);
    } catch (error) {
        console.error('Error fetching Fear & Greed Index:', error);
    }
}

// Update Fear & Greed needle position - vertical version
function updateFearGreedNeedle(value) {
    // Calculate the position along the meter (0-100%)
    const percentage = value / 100;

    // Calculate the left position in percentage (0% to 100% of the meter width)
    const leftPosition = percentage * 100;

    // Set the left position directly
    document.getElementById('fearNeedle').style.left = `${leftPosition}%`;

    // Remove any rotation - keep needle straight vertical
    document.getElementById('fearNeedle').style.transform = 'translateX(-50%)';

    // Update label based on value
    let label = "Neutral";
    if (value <= 20) label = "Extreme Fear";
    else if (value <= 40) label = "Fear";
    else if (value <= 60) label = "Neutral";
    else if (value <= 80) label = "Greed";
    else label = "Extreme Greed";

    document.getElementById('fearLabel').textContent = label;
    document.getElementById('fearValue').textContent = value;
}

// Helper function to format small token prices
function formatSmallTokenPrice(price) {
    if (price < 0.01) {
        // Convert the price to a string to count leading zeros
        const priceStr = price.toFixed(8); // Ensure enough decimal places
        const [integerPart, decimalPart] = priceStr.split('.');

        // Find the number of leading zeros after the decimal point
        const leadingZeros = decimalPart.match(/^0+/)?.[0]?.length || 0;

        // Extract the significant digits (non-zero part)
        const significantDigits = decimalPart.slice(leadingZeros, leadingZeros + 4); // Show up to 4 significant digits

        // Format the price with superscript for leading zeros
        return `$0.0<sup>${leadingZeros}</sup>${significantDigits}`;
    } else {
        // For prices >= 0.01, use standard formatting
        return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

// Fetch all token data in a single API call
async function fetchAllTokensData(retryCount = 0, delayMs = 1000) {
    try {
        console.log("Fetching all token data in a single API call...");
        
        // Get token IDs from the control panel
        const tokenIds = [
            document.getElementById('token1Input').value,
            document.getElementById('token2Input').value,
            document.getElementById('token3Input').value,
            document.getElementById('token4Input').value,
            'ethereum',
            'solana'
        ];
        
        // Create a mapping of token IDs to element IDs
        const tokenMapping = {
            [document.getElementById('token1Input').value]: 'token1',
            [document.getElementById('token2Input').value]: 'token2',
            [document.getElementById('token3Input').value]: 'token3',
            [document.getElementById('token4Input').value]: 'token4',
            'ethereum': 'eth',
            'solana': 'sol'
        };
        
        // Join token IDs for a single API call
        const idsString = tokenIds.join(',');
        
        // Make the API call
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true`);
        const data = await response.json();
        
        console.log("Token data received:", data);
        
        // Update each token's data
        for (const tokenId of tokenIds) {
            const elementId = tokenMapping[tokenId];
            const tokenData = data[tokenId];
            
            if (tokenData) {
                const price = tokenData.usd;
                const change = tokenData.usd_24h_change;
                
                // Format the price
                const formattedPrice = formatSmallTokenPrice(price);
                
                // Get the elements
                const priceElement = document.getElementById(`${elementId}Price`);
                const changeElement = document.getElementById(`${elementId}Change`);
                
                if (priceElement && changeElement) {
                    // Update the price display (use innerHTML to render superscript)
                    priceElement.innerHTML = formattedPrice;
                    
                    // Update the change percentage
                    changeElement.textContent = `${change.toFixed(2)}%`;
                    changeElement.classList.toggle('positive', change >= 0);
                    changeElement.classList.toggle('negative', change < 0);
                    
                    console.log(`Updated ${tokenId} (${elementId}) data successfully`);
                } else {
                    console.error(`Elements not found for ${tokenId} (${elementId})`);
                }
            } else {
                console.error(`No data found for token ${tokenId}`);
            }
        }
        
        return true; // Success
    } catch (error) {
        console.error(`Error fetching all token data (attempt ${retryCount + 1}):`, error);
        
        // Retry with exponential backoff, up to 3 attempts
        if (retryCount < 3) {
            const nextDelayMs = delayMs * 2; // Exponential backoff
            console.log(`Retrying in ${nextDelayMs}ms...`);
            await sleep(nextDelayMs);
            return fetchAllTokensData(retryCount + 1, nextDelayMs);
        }
        
        return false; // Failed after retries
    }
}

// Fetch all data on page load
async function fetchAllData() {
    try {
        console.log("Starting to fetch all data...");
        
        // Show loading indicator (if you want to add one)
        // document.getElementById('loadingIndicator').style.display = 'block';
        
        // Fetch Bitcoin data
        await fetchBitcoinData();
        await sleep(300); // Short delay
        
        // Fetch Fear & Greed data
        await fetchFearGreedIndex();
        await sleep(300); // Short delay
        
        // Fetch all token data in a single call
        const success = await fetchAllTokensData();
        
        // If combined approach fails, try individual fetches with longer delays
        if (!success) {
            console.log("Combined API call failed, trying individual fetches...");
            // Implementation for individual fetches if needed
        }
        
        console.log("All data fetched successfully");
        
        // Hide loading indicator (if you added one)
        // document.getElementById('loadingIndicator').style.display = 'none';
    } catch (error) {
        console.error("Error in fetchAllData:", error);
        
        // Hide loading indicator (if you added one)
        // document.getElementById('loadingIndicator').style.display = 'none';
    }
}

// Fetch API data on button click
document.getElementById('fetchApiData').addEventListener('click', function() {
    console.log("Fetch API Data button clicked");
    fetchAllData();
});

// Fetch data on page load
console.log("Initial data fetch on page load");
fetchAllData();

// Update manual data
document.getElementById('updateManualData').addEventListener('click', function () {
    try {
        console.log("Update Manual Data button clicked");
        
        // Update date
        const dateValue = document.getElementById('dateInput').value;
        document.getElementById('currentDate').textContent = dateValue;

        // Update ETF Flow
        const etfFlowValue = document.getElementById('etfFlowInput').value;
        document.getElementById('etfFlow').textContent = etfFlowValue;

        // Update Listed Coins
        const listedCoinsValue = document.getElementById('listedCoinsInput').value;
        document.getElementById('listedCoins').textContent = parseInt(listedCoinsValue).toLocaleString(); // Add comma for thousands

        // Update Coins Up and Down
        const coinsUpValue = document.getElementById('coinsUpInput').value;
        const coinsDownValue = document.getElementById('coinsDownInput').value;
        document.getElementById('coinsUp').textContent = parseInt(coinsUpValue).toLocaleString(); // Add comma for thousands
        document.getElementById('coinsDown').textContent = parseInt(coinsDownValue).toLocaleString(); // Add comma for thousands

        // Update Up and Down Bars
        const totalCoins = parseInt(coinsUpValue) + parseInt(coinsDownValue);
        const upPercentage = (parseInt(coinsUpValue) / totalCoins) * 100;
        const downPercentage = (parseInt(coinsDownValue) / totalCoins) * 100;
        document.getElementById('upBar').style.width = `${upPercentage}%`;
        document.getElementById('downBar').style.width = `${downPercentage}%`;

        // Update Tokens to Watch
        const token1Symbol = document.getElementById('token1SymbolInput').value;
        const token2Symbol = document.getElementById('token2SymbolInput').value;
        const token3Symbol = document.getElementById('token3SymbolInput').value;
        const token4Symbol = document.getElementById('token4SymbolInput').value;

        const token1Category = document.getElementById('token1CategoryInput').value;
        const token2Category = document.getElementById('token2CategoryInput').value;
        const token3Category = document.getElementById('token3CategoryInput').value;
        const token4Category = document.getElementById('token4CategoryInput').value;

        document.getElementById('token1Symbol').textContent = token1Symbol;
        document.getElementById('token2Symbol').textContent = token2Symbol;
        document.getElementById('token3Symbol').textContent = token3Symbol;
        document.getElementById('token4Symbol').textContent = token4Symbol;

        // Update category text
        document.getElementById('token1Card').querySelector('.token-icon').textContent = token1Category;
        document.getElementById('token2Card').querySelector('.token-icon').textContent = token2Category;
        document.getElementById('token3Card').querySelector('.token-icon').textContent = token3Category;
        document.getElementById('token4Card').querySelector('.token-icon').textContent = token4Category;

        // Update News Items
        const newsItems = document.getElementById('newsInput').value.split('\n');
        const newsContainer = document.getElementById('newsContainer');
        newsContainer.innerHTML = ''; // Clear existing news items

        newsItems.forEach(newsText => {
            if (newsText.trim() !== '') {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                newsItem.innerHTML = `
                    <div class="news-bullet"></div>
                    <div class="news-text">${newsText}</div>
                `;
                newsContainer.appendChild(newsItem);
            }
        });

        console.log("Manual data updated successfully");
        alert('Poster updated successfully!');
    } catch (error) {
        console.error('Error updating poster:', error);
        alert('Failed to update poster. Please check the console for more details.');
    }
});


// Replace your current download button code with this simplified version
// This is optimized for hosted environments like GitHub Pages

document.getElementById('downloadPoster').addEventListener('click', async function() {
  console.log("Download button clicked");
  
  // Reference the poster container
  const posterContainer = document.querySelector('.poster-container');
  
  // Hide controls for clean capture
  const toggleButton = document.getElementById('toggleControls');
  const controlsPanel = document.getElementById('controls');
  const controlsWasOpen = controlsPanel.classList.contains('open');
  
  // Hide UI elements
  toggleButton.style.display = 'none';
  controlsPanel.classList.remove('open');
  
  // Show loading message
  alert("Preparing image for download. This may take a few seconds...");
  
  try {
    // Load crypto icons
    const [btcImage, ethImage, solImage] = await prepareDownload();
    
    // Get references to elements
    const btcLogo = document.querySelector('.btc-logo');
    const ethIcon = document.querySelector('.token-icon.eth');
    const solIcon = document.querySelector('.token-icon.sol');
    
    // Store original state
    const originalHTML = {
      btcLogo: btcLogo ? btcLogo.innerHTML : '',
      ethIcon: ethIcon ? ethIcon.innerHTML : '',
      solIcon: solIcon ? solIcon.innerHTML : '',
    };
    
    const originalStyle = {
      btcLogo: btcLogo ? btcLogo.getAttribute('style') || '' : '',
      ethIcon: ethIcon ? ethIcon.getAttribute('style') || '' : '',
      solIcon: solIcon ? solIcon.getAttribute('style') || '' : '',
    };
    
    // Temporarily replace with actual images for capture
    if (btcLogo) {
      btcLogo.innerHTML = '';
      btcLogo.style.background = 'none';
      btcLogo.style.display = 'flex';
      btcLogo.style.justifyContent = 'center';
      btcLogo.style.alignItems = 'center';
      
      const btcImgElement = document.createElement('img');
      btcImgElement.src = btcImage.src;
      btcImgElement.style.width = '90px';
      btcImgElement.style.height = '90px';
      btcLogo.appendChild(btcImgElement);
    }
    
    if (ethIcon) {
      ethIcon.innerHTML = '';
      ethIcon.style.backgroundImage = 'none';
      
      const ethImgElement = document.createElement('img');
      ethImgElement.src = ethImage.src;
      ethImgElement.style.width = '36px';
      ethImgElement.style.height = '36px';
      ethIcon.appendChild(ethImgElement);
    }
    
    if (solIcon) {
      solIcon.innerHTML = '';
      solIcon.style.backgroundImage = 'none';
      
      const solImgElement = document.createElement('img');
      solImgElement.src = solImage.src;
      solImgElement.style.width = '36px';
      solImgElement.style.height = '36px';
      solIcon.appendChild(solImgElement);
    }
    
    // Wait a moment for UI to update
    setTimeout(async function() {
      try {
        // Capture with html2canvas
        const canvas = await html2canvas(posterContainer, { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#000000'
        });
        
        console.log("Canvas generated, attempting download");
        
        // Create download link
        try {
          canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'coinex-daily-poster.png';
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
          }, 'image/png');
        } catch (error) {
          console.error("Error creating download:", error);
          alert("Could not generate download. Please try taking a screenshot instead.");
        }
      } catch (error) {
        console.error("Error capturing image:", error);
        alert("Could not capture the poster. Please try taking a screenshot instead.");
      } finally {
        // Restore original state
        if (btcLogo) {
          btcLogo.innerHTML = originalHTML.btcLogo;
          btcLogo.setAttribute('style', originalStyle.btcLogo);
        }
        
        if (ethIcon) {
          ethIcon.innerHTML = originalHTML.ethIcon;
          ethIcon.setAttribute('style', originalStyle.ethIcon);
        }
        
        if (solIcon) {
          solIcon.innerHTML = originalHTML.solIcon;
          solIcon.setAttribute('style', originalStyle.solIcon);
        }
        
        // Restore UI
        toggleButton.style.display = 'block';
        if (controlsWasOpen) {
          controlsPanel.classList.add('open');
        }
      }
    }, 500);
  } catch (error) {
    console.error("Error preparing download:", error);
    alert("An error occurred preparing the download. Please try again or take a screenshot instead.");
    
    // Restore UI
    toggleButton.style.display = 'block';
    if (controlsWasOpen) {
      controlsPanel.classList.add('open');
    }
  }
});
