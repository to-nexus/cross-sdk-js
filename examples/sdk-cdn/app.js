/**
 * Cross SDK CDN Sample Application
 * Vanilla JavaScript sample using Cross SDK via CDN
 */

class CrossSdkCDNSample {
    constructor() {
        this.sdk = null;
        this.account = null;
        this.network = null;
        this.balance = null;
        
        this.init();
        this.bindEvents();
    }

    async init() {
        try {
            this.log('Initializing Cross SDK...', 'info');
            
            // Check if Cross SDK is loaded from CDN
            if (typeof window.CrossSdk === 'undefined') {
                throw new Error('Cross SDK not loaded. Please check the CDN URL.');
            }

            // Initialize SDK
            this.sdk = window.CrossSdk;
            
            // SDK configuration
            const projectId = 'YOUR_PROJECT_ID'; // Change to actual project ID
            const metadata = {
                name: 'Cross SDK CDN Sample',
                description: 'Sample using Cross SDK via CDN',
                url: window.location.origin,
                icons: ['https://your-app-icon.com/icon.png']
            };

            // Initialize SDK
            await this.sdk.initCrossSdk({
                projectId,
                metadata,
                chains: [this.sdk.crossTestnet], // Use testnet
                enableAnalytics: false
            });

            this.log('Cross SDK initialization completed', 'info');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check initial connection status
            await this.checkConnectionStatus();
            
        } catch (error) {
            this.log(`Initialization error: ${error.message}`, 'error');
            console.error('SDK initialization error:', error);
        }
    }

    setupEventListeners() {
        // Connection status change event
        this.sdk.on('session_event', (event) => {
            this.log(`Session event: ${event.name}`, 'info');
            this.updateConnectionStatus();
        });

        // Account change event
        this.sdk.on('session_update', (event) => {
            this.log(`Session update: ${JSON.stringify(event)}`, 'info');
            this.updateAccountInfo();
        });

        // Disconnect event
        this.sdk.on('session_delete', () => {
            this.log('Session deleted', 'warning');
            this.updateConnectionStatus();
            this.hideAccountInfo();
        });
    }

    async checkConnectionStatus() {
        try {
            const session = await this.sdk.getActiveSession();
            if (session) {
                this.log('Existing session found', 'info');
                await this.updateConnectionStatus();
                await this.updateAccountInfo();
            } else {
                this.log('No connected session', 'info');
            }
        } catch (error) {
            this.log(`Connection status check error: ${error.message}`, 'error');
        }
    }

    async connect() {
        try {
            this.log('Attempting to connect wallet...', 'info');
            
            const session = await this.sdk.connect();
            
            if (session) {
                this.log('Wallet connected successfully!', 'info');
                await this.updateConnectionStatus();
                await this.updateAccountInfo();
            } else {
                this.log('Wallet connection failed', 'error');
            }
        } catch (error) {
            this.log(`Connection error: ${error.message}`, 'error');
        }
    }

    async disconnect() {
        try {
            this.log('Disconnecting wallet...', 'info');
            
            await this.sdk.disconnect();
            
            this.log('Wallet disconnected successfully', 'info');
            this.updateConnectionStatus();
            this.hideAccountInfo();
        } catch (error) {
            this.log(`Disconnect error: ${error.message}`, 'error');
        }
    }

    async updateConnectionStatus() {
        try {
            const session = await this.sdk.getActiveSession();
            const statusElement = document.getElementById('connection-status');
            const connectBtn = document.getElementById('connect-btn');
            const disconnectBtn = document.getElementById('disconnect-btn');
            const accountInfo = document.getElementById('account-info');
            const actions = document.getElementById('actions');

            if (session) {
                statusElement.textContent = 'Connected';
                statusElement.className = 'status connected';
                connectBtn.disabled = true;
                disconnectBtn.disabled = false;
                accountInfo.style.display = 'block';
                actions.style.display = 'block';
            } else {
                statusElement.textContent = 'Not Connected';
                statusElement.className = 'status disconnected';
                connectBtn.disabled = false;
                disconnectBtn.disabled = true;
                accountInfo.style.display = 'none';
                actions.style.display = 'none';
            }
        } catch (error) {
            this.log(`Status update error: ${error.message}`, 'error');
        }
    }

    async updateAccountInfo() {
        try {
            const session = await this.sdk.getActiveSession();
            if (!session) return;

            // Get account information
            const accounts = await this.sdk.getAccounts();
            if (accounts && accounts.length > 0) {
                this.account = accounts[0];
                
                // Display address
                document.getElementById('account-address').textContent = 
                    `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
                
                // Network information
                const chainId = await this.sdk.getChainId();
                const networkName = this.getNetworkName(chainId);
                document.getElementById('network-name').textContent = networkName;
                
                // Get balance
                await this.updateBalance();
            }
        } catch (error) {
            this.log(`Account info update error: ${error.message}`, 'error');
        }
    }

    async updateBalance() {
        try {
            if (!this.account) return;

            const balance = await this.sdk.getBalance();
            if (balance) {
                const formattedBalance = this.formatBalance(balance);
                document.getElementById('account-balance').textContent = formattedBalance;
            }
        } catch (error) {
            this.log(`Balance update error: ${error.message}`, 'error');
        }
    }

    async signMessage() {
        try {
            if (!this.account) {
                this.log('Account not connected', 'error');
                return;
            }

            const message = prompt('Enter message to sign:', 'Hello Cross SDK!');
            if (!message) return;

            this.log('Signing message...', 'info');
            
            const signature = await this.sdk.signMessage({
                message,
                account: this.account
            });

            this.log(`Message signed successfully: ${signature}`, 'info');
            
            // Display signature result in modal or alert
            alert(`Signature completed!\n\nMessage: ${message}\nSignature: ${signature}`);
            
        } catch (error) {
            this.log(`Message signing error: ${error.message}`, 'error');
        }
    }

    async sendTransaction() {
        try {
            if (!this.account) {
                this.log('Account not connected', 'error');
                return;
            }

            const toAddress = prompt('Enter recipient address:');
            if (!toAddress) return;

            const amount = prompt('Enter amount to send (CROSS):', '0.001');
            if (!amount) return;

            this.log('Sending transaction...', 'info');
            
            const transaction = {
                to: toAddress,
                value: this.sdk.parseEther(amount),
                account: this.account
            };

            const hash = await this.sdk.sendTransaction(transaction);
            
            this.log(`Transaction sent successfully: ${hash}`, 'info');
            
            // Display transaction hash in modal or alert
            alert(`Transaction sent successfully!\n\nHash: ${hash}`);
            
            // Update balance
            await this.updateBalance();
            
        } catch (error) {
            this.log(`Transaction sending error: ${error.message}`, 'error');
        }
    }

    async switchNetwork() {
        try {
            this.log('Switching network...', 'info');
            
            const networks = [
                { name: 'Cross Testnet', chain: this.sdk.crossTestnet },
                { name: 'Cross Mainnet', chain: this.sdk.crossMainnet },
                { name: 'BSC Testnet', chain: this.sdk.bscTestnet },
                { name: 'BSC Mainnet', chain: this.sdk.bscMainnet }
            ];

            const networkNames = networks.map(n => n.name);
            const selectedNetwork = prompt(
                `Select network:\n${networkNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}`,
                '1'
            );

            if (!selectedNetwork) return;

            const networkIndex = parseInt(selectedNetwork) - 1;
            if (networkIndex >= 0 && networkIndex < networks.length) {
                const selectedChain = networks[networkIndex].chain;
                
                await this.sdk.switchChain(selectedChain);
                
                this.log(`Network switched successfully: ${networks[networkIndex].name}`, 'info');
                
                // Update account information
                await this.updateAccountInfo();
            }
        } catch (error) {
            this.log(`Network switch error: ${error.message}`, 'error');
        }
    }

    getNetworkName(chainId) {
        const networks = {
            1: 'Cross Mainnet',
            56: 'BSC Mainnet',
            97: 'BSC Testnet',
            1001: 'Cross Testnet'
        };
        return networks[chainId] || `Chain ID: ${chainId}`;
    }

    formatBalance(balance) {
        if (!balance) return '0 CROSS';
        
        // Convert Wei to CROSS (18 decimals)
        const crossAmount = parseFloat(balance) / Math.pow(10, 18);
        return `${crossAmount.toFixed(6)} CROSS`;
    }

    log(message, type = 'info') {
        const logContainer = document.getElementById('log-container');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    bindEvents() {
        // Connect button
        document.getElementById('connect-btn').addEventListener('click', () => {
            this.connect();
        });

        // Disconnect button
        document.getElementById('disconnect-btn').addEventListener('click', () => {
            this.disconnect();
        });

        // Sign message button
        document.getElementById('sign-message-btn').addEventListener('click', () => {
            this.signMessage();
        });

        // Send transaction button
        document.getElementById('send-transaction-btn').addEventListener('click', () => {
            this.sendTransaction();
        });

        // Switch network button
        document.getElementById('switch-network-btn').addEventListener('click', () => {
            this.switchNetwork();
        });

        // Clear logs button
        document.getElementById('clear-log-btn').addEventListener('click', () => {
            document.getElementById('log-container').innerHTML = '';
        });
    }

    hideAccountInfo() {
        document.getElementById('account-info').style.display = 'none';
        document.getElementById('actions').style.display = 'none';
    }
}

// Start application
document.addEventListener('DOMContentLoaded', () => {
    new CrossSdkCDNSample();
}); 