// === CONFIG ===
        // Auto-detect repo from GitHub Pages URL (works for any fork)
        const getRepoFromURL = () => {
            const hostname = window.location.hostname;
            const pathname = window.location.pathname;
            // GitHub Pages format: {owner}.github.io/{repo}/
            if (hostname.includes('.github.io')) {
                const owner = hostname.split('.github.io')[0];
                const repo = pathname.split('/')[1] || 'mission-control';
                return { owner, repo };
            }
            // Fallback for local development
            return { owner: 'rdsthomas', repo: 'mission-control' };
        };
        const { owner: detectedOwner, repo: detectedRepo } = getRepoFromURL();
        
        const CONFIG = {
            owner: detectedOwner,
            repo: detectedRepo,
            branch: 'main',
            tasksFile: 'data/tasks.json'
        };

        // === STATE ===
        let STATE = {
            user: null,
            token: null,
            data: null,  // Loaded from GitHub or fallback
            originalData: null,  // For detecting changes
            hasUnsavedChanges: false,
            isLoading: false,
            gatewayUrl: null,  // Set via config or auto-detected
            sessionKey: null,  // Session key for thinking visibility
            skills: [],  // Skills list for skill column
            crons: [],   // Crons list for recurring column
            searchQuery: '',  // Current search filter
            thinkingHistory: {},  // Task ID -> thinking blocks
            thinkingPolling: null,  // Polling interval ID
            expandedTasks: new Set()  // Set of expanded task IDs
        };
        
        // Gateway URL detection
        const KNOWN_GATEWAY_URLS = [
            'http://localhost:18789',
            'http://localhost:3033',
            'https://your-gateway.example.com'
        ];
        
        function getGatewayUrl() {