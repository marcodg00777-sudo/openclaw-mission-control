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