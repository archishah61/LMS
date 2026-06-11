/**
 * Formats time in minutes to a human-readable string
 * @param {number} minutes - Time in minutes
 * @param {boolean} [includeSeconds=false] - Whether to include seconds for times less than 1 minute
 * @returns {string} Formatted time string
 */
export const formatTimeDisplay = (minutes) => {
    if (!minutes && minutes !== 0) return 'N/A';
    minutes = Math.round(Number(minutes));
    
    if (minutes < 60) {
        return `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
};

/**
 * Converts seconds to minutes
 * @param {number} seconds - Time in seconds
 * @returns {number} Time in minutes (rounded)
 */
export const secondsToMinutes = (seconds) => {
    if (!seconds && seconds !== 0) return 0;
    return Math.round(Number(seconds) / 60);
};

/**
 * Formats time in seconds to a human-readable string (H hr/hrs M min/mins S sec/secs)
 * @param {number} totalSeconds - Time in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (totalSeconds) => {
    if (!totalSeconds && totalSeconds !== 0) return '0 sec';
    
    const secondsValue = Math.round(Number(totalSeconds));
    if (secondsValue === 0) return '0 sec';
    
    const h = Math.floor(secondsValue / 3600);
    const m = Math.floor((secondsValue % 3600) / 60);
    const s = secondsValue % 60;

    const parts = [];
    if (h > 0) parts.push(`${h} ${h > 1 ? 'hrs' : 'hr'}`);
    if (m > 0) parts.push(`${m} ${m > 1 ? 'mins' : 'min'}`);
    if (s > 0) parts.push(`${s} ${s > 1 ? 'secs' : 'sec'}`);

    return parts.join(' ');
};
