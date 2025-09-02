/**
 * Enhanced Encoder/Decoder Tool
 * Advanced JavaScript functionality with multiple encoding methods,
 * hash functions, compression, and enhanced user experience
 */

// Global application state
const appState = {
    history: JSON.parse(localStorage.getItem('encoder-history') || '[]'),
    theme: localStorage.getItem('theme') || 'light',
    stats: JSON.parse(localStorage.getItem('encoder-stats') || '{"encodings": 0, "decodings": 0, "totalOps": 0}'),
    settings: JSON.parse(localStorage.getItem('encoder-settings') || '{"autoDetect": true, "detectionSensitivity": "medium", "enabledEncodings": [], "strictValidation": false, "showConfidence": false}')
};

// Encoding alphabets and lookup tables
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const base85Alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~';

// Morse code mappings
const morseToChar = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
    '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
    '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
    '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
    '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
    '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7',
    '---..': '8', '----.': '9', '/': ' '
};

const charToMorse = Object.fromEntries(
    Object.entries(morseToChar).map(([morse, char]) => [char, morse])
);

// Advanced hash functions implementation
class HashFunctions {
    static async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static async sha1(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static md5(message) {
        // Simple MD5 implementation for educational purposes
        // In production, use crypto.subtle or a proper library
        function md5cycle(x, k) {
            var a = x[0], b = x[1], c = x[2], d = x[3];
            a = ff(a, b, c, d, k[0], 7, -680876936);
            d = ff(d, a, b, c, k[1], 12, -389564586);
            // ... (simplified for brevity)
            return [a, b, c, d];
        }
        // Simplified MD5 - for full implementation, use a proper library
        return 'MD5 requires external library - use SHA256 instead';
    }
}

// Enhanced error handling utilities
class ErrorHandler {
    static createError(type, message, details = {}) {
        const error = new Error(message);
        error.type = type;
        error.details = details;
        return error;
    }

    static handleEncodingError(error, operation, input) {
        console.error(`${operation} error:`, error);
        
        let userMessage = `Error during ${operation.toLowerCase()}: `;
        
        if (error.type === 'INVALID_INPUT') {
            userMessage += 'Invalid input format. Please check your data.';
        } else if (error.type === 'UNSUPPORTED_ENCODING') {
            userMessage += 'This encoding type is not supported.';
        } else if (error.type === 'DECODE_FAILED') {
            userMessage += 'Unable to decode this text. It may not be encoded or may be corrupted.';
        } else if (error.type === 'ENCODE_FAILED') {
            userMessage += 'Unable to encode this text. Please check the input format.';
        } else if (error.message.includes('Invalid')) {
            userMessage += 'The input contains invalid characters for this encoding type.';
        } else if (error.message.includes('too large')) {
            userMessage += 'The input is too large to process.';
        } else {
            userMessage += error.message || 'An unexpected error occurred.';
        }
        
        return userMessage;
    }

    static validateInput(input, type = 'general') {
        if (typeof input !== 'string') {
            throw ErrorHandler.createError('INVALID_INPUT', 'Input must be a string');
        }
        
        if (input.length > 1048576) { // 1MB limit
            throw ErrorHandler.createError('INVALID_INPUT', 'Input is too large (max 1MB)');
        }
        
        switch (type) {
            case 'base64':
                if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input)) {
                    throw ErrorHandler.createError('INVALID_INPUT', 'Invalid Base64 format');
                }
                if (input.length % 4 !== 0) {
                    throw ErrorHandler.createError('INVALID_INPUT', 'Invalid Base64 length');
                }
                break;
            case 'hex':
                if (!/^([0-9a-fA-F]{2}\s*)*$/.test(input.trim())) {
                    throw ErrorHandler.createError('INVALID_INPUT', 'Invalid hexadecimal format');
                }
                break;
            case 'binary':
                if (!/^([01]{8}\s*)*$/.test(input.trim())) {
                    throw ErrorHandler.createError('INVALID_INPUT', 'Invalid binary format');
                }
                break;
        }
        
        return true;
    }
}

// Enhanced detection confidence scoring
class DetectionEngine {
    static calculateConfidence(input, result, type) {
        if (!result || result === input) return 0;
        
        let confidence = 0.5; // Base confidence
        
        // Length-based confidence
        if (input.length > 10) confidence += 0.1;
        if (input.length > 50) confidence += 0.1;
        
        // Type-specific confidence adjustments
        switch (type) {
            case 'base64':
                if (input.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(input)) {
                    confidence += 0.3;
                }
                break;
            case 'hex':
                if (/^([0-9a-fA-F]{2}\s*)+$/.test(input.trim())) {
                    confidence += 0.3;
                }
                break;
            case 'url':
                if (input.includes('%') && /%[0-9A-Fa-f]{2}/.test(input)) {
                    confidence += 0.2;
                }
                break;
            case 'morse':
                if (/^[.-\s/]+$/.test(input) && input.includes('.') && input.includes('-')) {
                    confidence += 0.3;
                }
                break;
        }
        
        // Result quality check
        if (result && /^[\x20-\x7E\s]*$/.test(result)) {
            confidence += 0.1; // Printable ASCII characters
        }
        
        return Math.min(confidence, 1.0);
    }

    static shouldAttemptDecoding(input, type, settings) {
        if (!settings.autoDetect) return false;
        
        if (settings.enabledEncodings.length > 0 && !settings.enabledEncodings.includes(type)) {
            return false;
        }
        
        const minConfidence = {
            'strict': 0.8,
            'medium': 0.5,
            'loose': 0.2
        }[settings.detectionSensitivity] || 0.5;
        
        // Quick pre-check for basic format compliance
        switch (type) {
            case 'base64':
                return /^[A-Za-z0-9+/]*={0,2}$/.test(input) && input.length % 4 === 0;
            case 'hex':
                return /^([0-9a-fA-F]{2}\s*)+$/.test(input.trim());
            case 'binary':
                return /^([01]{8}\s*)+$/.test(input.trim());
            case 'url':
                return input.includes('%') && /%[0-9A-Fa-f]{2}/.test(input);
            case 'morse':
                return /^[.-\s/]+$/.test(input);
            default:
                return true;
        }
    }
}

// Advanced encoding/decoding functions
class AdvancedEncoders {
    static encodeBase85(input) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(input);
        let result = '';
        
        for (let i = 0; i < bytes.length; i += 4) {
            const chunk = bytes.slice(i, i + 4);
            const paddedChunk = new Uint8Array(4);
            paddedChunk.set(chunk);
            
            let value = (paddedChunk[0] << 24) | (paddedChunk[1] << 16) | 
                       (paddedChunk[2] << 8) | paddedChunk[3];
            
            if (value === 0 && chunk.length === 4) {
                result += 'z';
            } else {
                let encoded = '';
                for (let j = 0; j < 5; j++) {
                    encoded = base85Alphabet[value % 85] + encoded;
                    value = Math.floor(value / 85);
                }
                result += encoded.substring(0, chunk.length + 1);
            }
        }
        
        return result;
    }

    static decodeBase85(input) {
        let result = '';
        let i = 0;
        
        while (i < input.length) {
            if (input[i] === 'z') {
                result += '\\0\\0\\0\\0';
                i++;
                continue;
            }
            
            const chunk = input.substring(i, i + 5);
            let value = 0;
            
            for (let j = 0; j < chunk.length; j++) {
                const index = base85Alphabet.indexOf(chunk[j]);
                if (index === -1) throw new Error('Invalid Base85 character');
                value = value * 85 + index;
            }
            
            const bytes = [];
            for (let j = 3; j >= 0; j--) {
                bytes.push((value >> (j * 8)) & 0xFF);
            }
            
            result += String.fromCharCode(...bytes.slice(0, chunk.length - 1));
            i += 5;
        }
        
        return result;
    }

    static encodeQuotedPrintable(input) {
        return input.replace(/[\\x00-\\x1F\\x7F-\\xFF=]/g, (match) => {
            return '=' + match.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
        }).replace(/(.{75})/g, '$1=\\r\\n');
    }

    static decodeQuotedPrintable(input) {
        return input
            .replace(/=\\r\\n/g, '')
            .replace(/=([0-9A-Fa-f]{2})/g, (match, hex) => {
                return String.fromCharCode(parseInt(hex, 16));
            });
    }

    static encodeUuencode(input) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(input);
        let result = 'begin 644 file.txt\\n';
        
        for (let i = 0; i < bytes.length; i += 45) {
            const chunk = bytes.slice(i, i + 45);
            result += String.fromCharCode(chunk.length + 32);
            
            for (let j = 0; j < chunk.length; j += 3) {
                const group = chunk.slice(j, j + 3);
                const paddedGroup = new Uint8Array(3);
                paddedGroup.set(group);
                
                const value = (paddedGroup[0] << 16) | (paddedGroup[1] << 8) | paddedGroup[2];
                
                for (let k = 0; k < 4; k++) {
                    const sextet = (value >> (18 - k * 6)) & 0x3F;
                    result += String.fromCharCode(sextet === 0 ? 96 : sextet + 32);
                }
            }
            result += '\\n';
        }
        
        result += '`\\nend\\n';
        return result;
    }
}

// Compression utilities
class CompressionUtils {
    static async compressLZ(text) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(text));
        writer.close();
        
        const chunks = [];
        let done = false;
        
        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        
        for (const chunk of chunks) {
            compressed.set(chunk, offset);
            offset += chunk.length;
        }
        
        return btoa(String.fromCharCode(...compressed));
    }

    static async decompressLZ(compressedBase64) {
        const compressed = Uint8Array.from(atob(compressedBase64), c => c.charCodeAt(0));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(compressed);
        writer.close();
        
        const chunks = [];
        let done = false;
        
        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        
        for (const chunk of chunks) {
            decompressed.set(chunk, offset);
            offset += chunk.length;
        }
        
        return new TextDecoder().decode(decompressed);
    }
}

// Enhanced UI utilities
class UIEnhancements {
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-triangle' : 
                    type === 'warning' ? 'exclamation-circle' : 'info-circle';
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-${icon}" style="color: var(--${type === 'info' ? 'accent' : type});"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, duration);
    }

    static addLoadingState(button, text = 'Processing...') {
        const originalContent = button.innerHTML;
        button.innerHTML = `<div class="loading"></div> ${text}`;
        button.disabled = true;
        
        return () => {
            button.innerHTML = originalContent;
            button.disabled = false;
        };
    }

    static animateValue(element, start, end, duration = 1000) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
}

// Keyboard shortcuts manager
class KeyboardShortcuts {
    static init() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'e':
                        e.preventDefault();
                        document.querySelector('[data-tab="encode"]')?.click();
                        document.getElementById('encode-input')?.focus();
                        break;
                    case 'd':
                        e.preventDefault();
                        document.querySelector('[data-tab="decode"]')?.click();
                        document.getElementById('decode-input')?.focus();
                        break;
                    case 'b':
                        e.preventDefault();
                        document.querySelector('[data-tab="batch"]')?.click();
                        break;
                    case 'a':
                        e.preventDefault();
                        document.querySelector('[data-tab="analysis"]')?.click();
                        break;
                    case 'l':
                        e.preventDefault();
                        const activeTab = document.querySelector('.tab-content.active');
                        const input = activeTab?.querySelector('input, textarea');
                        if (input) {
                            input.value = '';
                            input.focus();
                        }
                        break;
                    case 'enter':
                        e.preventDefault();
                        const activeButton = document.querySelector('.tab-content.active .button:not(.button-secondary)');
                        activeButton?.click();
                        break;
                }
            }
        });
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    KeyboardShortcuts.init();
    loadUserPreferences();
    renderHistory();
    updateStatsDisplay();
});

function initializeApp() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Initialize advanced settings button
    const settingsButton = document.getElementById('settings-toggle');
    if (settingsButton) {
        console.log('Advanced settings button found and initialized');
        // Ensure the button is visible
        settingsButton.style.display = 'inline-block';
        settingsButton.style.visibility = 'visible';
        // Add click handler (backup to onclick attribute)
        settingsButton.addEventListener('click', function(e) {
            console.log('Settings button clicked via event listener');
            e.preventDefault();
            e.stopPropagation();
            toggleAdvancedSettings();
        });
    } else {
        console.error('Advanced settings button not found in DOM');
    }

    // Real-time encoding toggle
    const realTimeToggle = document.getElementById('real-time-encode');
    const encodeInput = document.getElementById('encode-input');
    
    if (realTimeToggle && encodeInput) {
        encodeInput.addEventListener('input', () => {
            if (realTimeToggle.checked) {
                encode(true);
            }
        });
    }

    // Auto-decode toggle
    const autoDecodeToggle = document.getElementById('auto-decode');
    const decodeInput = document.getElementById('decode-input');
    
    if (autoDecodeToggle && decodeInput) {
        decodeInput.addEventListener('input', () => {
            if (autoDecodeToggle.checked) {
                detectAndDecode(true);
            }
        });
    }

    // Encoding type change handler
    const encodingSelect = document.getElementById('encoding-select');
    if (encodingSelect) {
        encodingSelect.addEventListener('change', () => {
            const caesarGroup = document.getElementById('caesar-shift-group');
            if (caesarGroup) {
                caesarGroup.style.display = encodingSelect.value === 'caesar' ? 'block' : 'none';
            }
        });
    }

    // Batch operation change handler
    const batchOperation = document.getElementById('batch-operation');
    const batchEncodingGroup = document.getElementById('batch-encoding-group');
    
    if (batchOperation && batchEncodingGroup) {
        batchOperation.addEventListener('change', () => {
            batchEncodingGroup.style.display = batchOperation.value === 'encode' ? 'block' : 'none';
        });
    }
}

function loadUserPreferences() {
    // Load theme
    if (appState.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (themeText) themeText.textContent = 'Light Mode';
    }
    
    // Load settings
    loadAdvancedSettings();
}

// Advanced Settings Management
function toggleAdvancedSettings() {
    try {
        const settingsPanel = document.getElementById('advanced-settings');
        const toggleButton = document.getElementById('settings-toggle');
        
        if (!settingsPanel) {
            console.error('Advanced settings panel not found');
            return;
        }
        
        const isVisible = settingsPanel.style.display !== 'none';
        
        if (isVisible) {
            settingsPanel.style.display = 'none';
            settingsPanel.classList.remove('show');
            if (toggleButton) {
                toggleButton.innerHTML = '<i class="fas fa-cog"></i> Advanced Settings';
            }
        } else {
            settingsPanel.style.display = 'block';
            settingsPanel.classList.add('show');
            // Scroll settings into view on mobile
            setTimeout(() => {
                if (window.innerWidth <= 768) {
                    settingsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
            if (toggleButton) {
                toggleButton.innerHTML = '<i class="fas fa-cog"></i> Hide Settings';
            }
        }
        
        UIEnhancements.showNotification(
            isVisible ? 'Settings panel hidden' : 'Settings panel opened',
            'info'
        );
    } catch (error) {
        console.error('Error toggling advanced settings:', error);
        UIEnhancements.showNotification('Error opening settings panel', 'error');
    }
}

function loadAdvancedSettings() {
    const settings = appState.settings;
    
    // Load auto-detect setting
    const autoDetectToggle = document.getElementById('auto-decode');
    if (autoDetectToggle) {
        autoDetectToggle.checked = settings.autoDetect;
    }
    
    // Load detection sensitivity
    const sensitivitySelect = document.getElementById('detection-sensitivity');
    if (sensitivitySelect) {
        sensitivitySelect.value = settings.detectionSensitivity;
    }
    
    // Load validation settings
    const strictValidation = document.getElementById('strict-validation');
    if (strictValidation) {
        strictValidation.checked = settings.strictValidation;
    }
    
    const showConfidence = document.getElementById('show-confidence');
    if (showConfidence) {
        showConfidence.checked = settings.showConfidence;
    }
    
    // Load enabled encodings
    const checkboxes = document.querySelectorAll('#encoding-checkboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = settings.enabledEncodings.length === 0 || 
                         settings.enabledEncodings.includes(checkbox.value);
    });
}

function updateSettings() {
    try {
        // Update auto-detect
        const autoDetectToggle = document.getElementById('auto-decode');
        if (autoDetectToggle) {
            appState.settings.autoDetect = autoDetectToggle.checked;
        }
        
        // Update detection sensitivity
        const sensitivitySelect = document.getElementById('detection-sensitivity');
        if (sensitivitySelect) {
            appState.settings.detectionSensitivity = sensitivitySelect.value;
        }
        
        // Update validation settings
        const strictValidation = document.getElementById('strict-validation');
        if (strictValidation) {
            appState.settings.strictValidation = strictValidation.checked;
        }
        
        const showConfidence = document.getElementById('show-confidence');
        if (showConfidence) {
            appState.settings.showConfidence = showConfidence.checked;
        }
        
        // Update enabled encodings
        const checkboxes = document.querySelectorAll('#encoding-checkboxes input[type="checkbox"]');
        const enabledEncodings = [];
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                enabledEncodings.push(checkbox.value);
            }
        });
        
        // If all are checked, treat as "all enabled" (empty array)
        if (enabledEncodings.length === checkboxes.length) {
            appState.settings.enabledEncodings = [];
        } else {
            appState.settings.enabledEncodings = enabledEncodings;
        }
        
        // Save to localStorage
        localStorage.setItem('encoder-settings', JSON.stringify(appState.settings));
        
        // Show feedback for sensitivity changes
        if (sensitivitySelect && document.activeElement === sensitivitySelect) {
            const feedbackMap = {
                'strict': 'High accuracy mode - fewer false positives',
                'medium': 'Balanced detection - good for most cases',
                'loose': 'Aggressive detection - more attempts but may have false positives'
            };
            
            UIEnhancements.showNotification(
                feedbackMap[sensitivitySelect.value] || 'Settings updated',
                'info',
                4000
            );
        }
        
    } catch (error) {
        console.error('Settings update error:', error);
        UIEnhancements.showNotification('Failed to update settings', 'error');
    }
}

function resetSettings() {
    if (confirm('Reset all advanced settings to defaults?')) {
        appState.settings = {
            autoDetect: true,
            detectionSensitivity: 'medium',
            enabledEncodings: [],
            strictValidation: false,
            showConfidence: false
        };
        
        localStorage.setItem('encoder-settings', JSON.stringify(appState.settings));
        loadAdvancedSettings();
        
        UIEnhancements.showNotification('Settings reset to defaults', 'success');
    }
}

function exportSettings() {
    try {
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            settings: appState.settings,
            stats: appState.stats
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `encoder-settings-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        UIEnhancements.showNotification('Settings exported successfully', 'success');
    } catch (error) {
        console.error('Export error:', error);
        UIEnhancements.showNotification('Failed to export settings', 'error');
    }
}

function importSettings(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (imported.settings) {
                appState.settings = { ...appState.settings, ...imported.settings };
                localStorage.setItem('encoder-settings', JSON.stringify(appState.settings));
                loadAdvancedSettings();
                UIEnhancements.showNotification('Settings imported successfully', 'success');
            } else {
                throw new Error('Invalid settings file format');
            }
        } catch (error) {
            console.error('Import error:', error);
            UIEnhancements.showNotification('Failed to import settings: Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (newTheme === 'dark') {
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (themeText) themeText.textContent = 'Light Mode';
    } else {
        if (themeIcon) themeIcon.className = 'fas fa-moon';
        if (themeText) themeText.textContent = 'Dark Mode';
    }
    
    appState.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    
    UIEnhancements.showNotification(`Switched to ${newTheme} mode`, 'success');
}

// Character count handlers
function handleDecodeInput() {
    const input = document.getElementById('decode-input');
    const charCount = document.getElementById('decode-char-count');
    
    if (input && charCount) {
        charCount.textContent = `${input.value.length} characters`;
    }
}

function handleEncodeInput() {
    const input = document.getElementById('encode-input');
    const charCount = document.getElementById('encode-char-count');
    
    if (input && charCount) {
        charCount.textContent = `${input.value.length} characters`;
    }
}

// File handling functions
function handleFileDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files } });
    }
    event.target.classList.remove('dragover');
}

function handleDragEnter(event) {
    event.preventDefault();
    event.target.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.target.classList.remove('dragover');
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit
        showMessage('decode', 'error', 'File too large. Maximum size is 1MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('decode-input').value = e.target.result;
        handleDecodeInput();
        showMessage('decode', 'success', `File "${file.name}" loaded successfully.`);
    };
    reader.onerror = function() {
        showMessage('decode', 'error', 'Error reading file.');
    };
    reader.readAsText(file);
}

function showMessage(tab, type, message) {
    hideAllMessages(tab);
    const messageElement = document.getElementById(`${tab}-${type}`);
    if (messageElement) {
        messageElement.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i> ${message}`;
        messageElement.classList.remove('hidden');
        
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 5000);
    }
}

function hideAllMessages(tab) {
    ['error', 'success', 'warning'].forEach(type => {
        const element = document.getElementById(`${tab}-${type}`);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

function showOutput(tab, result, info = '') {
    const outputContainer = document.getElementById(`${tab}-output`);
    const resultElement = document.getElementById(`${tab}-result`);
    const infoElement = document.getElementById(`${tab === 'decode' ? 'encoding-type' : 'encode-type-info'}`);
    const sizeElement = document.getElementById(`${tab}-size-info`);
    
    if (resultElement) resultElement.textContent = result;
    if (info && infoElement) infoElement.textContent = info;
    if (sizeElement) sizeElement.textContent = ` | ${result.length} characters`;
    if (outputContainer) outputContainer.style.display = 'block';
}

function hideOutput(tab) {
    const outputContainer = document.getElementById(`${tab}-output`);
    if (outputContainer) outputContainer.style.display = 'none';
}

function copyText(elementId) {
    const textToCopy = document.getElementById(elementId)?.textContent || '';
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showCopyFeedback(event.target);
        }).catch(err => {
            fallbackCopyText(textToCopy, event.target);
        });
    } else {
        fallbackCopyText(textToCopy, event.target);
    }
}

function fallbackCopyText(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopyFeedback(button);
    } catch (err) {
        console.error('Failed to copy text:', err);
        UIEnhancements.showNotification('Failed to copy text', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showCopyFeedback(button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.style.background = 'var(--success)';
    
    setTimeout(() => {
        button.innerHTML = originalContent;
        button.style.background = 'var(--accent)';
    }, 2000);
}

// Enhanced encoding functions
function encodeBase32(input) {
    let output = '';
    let bits = 0;
    let value = 0;
    
    for (let i = 0; i < input.length; i++) {
        value = (value << 8) | input.charCodeAt(i);
        bits += 8;
        
        while (bits >= 5) {
            output += base32Alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    
    if (bits > 0) {
        output += base32Alphabet[(value << (5 - bits)) & 31];
    }
    
    while (output.length % 8 !== 0) {
        output += '=';
    }
    
    return output;
}

function decodeBase32(input) {
    input = input.replace(/=+$/, '');
    let output = '';
    let bits = 0;
    let value = 0;
    
    for (let i = 0; i < input.length; i++) {
        const index = base32Alphabet.indexOf(input[i].toUpperCase());
        if (index === -1) throw new Error('Invalid base32 character');
        
        value = (value << 5) | index;
        bits += 5;
        
        if (bits >= 8) {
            output += String.fromCharCode((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    
    return output;
}

function caesarEncode(text, shift) {
    return text.replace(/[a-zA-Z]/g, char => {
        const base = char <= 'Z' ? 65 : 97;
        return String.fromCharCode((char.charCodeAt(0) - base + shift) % 26 + base);
    });
}

function caesarDecode(text, shift) {
    return caesarEncode(text, 26 - shift);
}

function encodeJWT(payload) {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/=]/g, m => ({'+':'-','/':'_','=':''}[m]));
    const encodedPayload = btoa(JSON.stringify(JSON.parse(payload))).replace(/[+/=]/g, m => ({'+':'-','/':'_','=':''}[m]));
    return `${encodedHeader}.${encodedPayload}.signature`;
}

function decodeJWT(token) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    
    const payload = parts[1].replace(/[-_]/g, m => ({'-':'+','_':'/'}[m]));
    const padding = '='.repeat((4 - payload.length % 4) % 4);
    return JSON.stringify(JSON.parse(atob(payload + padding)), null, 2);
}

async function encode(isRealTime = false) {
    const input = document.getElementById('encode-input')?.value || '';
    const encoding = document.getElementById('encoding-select')?.value || 'base64';
    
    if (!input.trim()) {
        if (!isRealTime) {
            showMessage('encode', 'error', 'Please enter some text to encode');
        }
        return;
    }

    const button = document.getElementById('encode-btn');
    let removeLoading = () => {};
    
    if (!isRealTime && button) {
        removeLoading = UIEnhancements.addLoadingState(button, 'Encoding...');
    }

    try {
        let result;
        let typeInfo = encoding.toUpperCase();

        switch (encoding) {
            case 'base64':
                result = btoa(input);
                break;
            case 'base32':
                result = encodeBase32(input);
                break;
            case 'base85':
                result = AdvancedEncoders.encodeBase85(input);
                break;
            case 'url':
                result = encodeURIComponent(input);
                break;
            case 'html':
                result = input.replace(/[<>&"']/g, match => ({
                    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
                })[match]);
                break;
            case 'hex':
                result = Array.from(input)
                    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
                    .join(' ');
                break;
            case 'binary':
                result = Array.from(input)
                    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
                    .join(' ');
                break;
            case 'morse':
                result = input.toUpperCase().split('')
                    .map(char => charToMorse[char] || char)
                    .join(' ');
                break;
            case 'rot13':
                result = input.replace(/[a-zA-Z]/g, char => {
                    const base = char <= 'Z' ? 65 : 97;
                    return String.fromCharCode((char.charCodeAt(0) - base + 13) % 26 + base);
                });
                break;
            case 'caesar':
                const shift = parseInt(document.getElementById('caesar-shift')?.value || '3');
                result = caesarEncode(input, shift);
                typeInfo = `Caesar Cipher (shift ${shift})`;
                break;
            case 'ascii':
                result = Array.from(input)
                    .map(char => char.charCodeAt(0))
                    .join(' ');
                break;
            case 'jwt':
                result = encodeJWT(input);
                break;
            case 'quoted-printable':
                result = AdvancedEncoders.encodeQuotedPrintable(input);
                break;
            case 'uuencode':
                result = AdvancedEncoders.encodeUuencode(input);
                break;
            case 'sha256':
                result = await HashFunctions.sha256(input);
                typeInfo = 'SHA-256 Hash';
                break;
            case 'sha1':
                result = await HashFunctions.sha1(input);
                typeInfo = 'SHA-1 Hash';
                break;
            case 'md5':
                result = HashFunctions.md5(input);
                typeInfo = 'MD5 Hash';
                break;
            case 'compress':
                result = await CompressionUtils.compressLZ(input);
                typeInfo = 'LZ Compressed (Base64)';
                break;
        }

        showOutput('encode', result, typeInfo);
        
        if (!isRealTime) {
            addToHistory('encode', encoding, input, result);
            updateStats('encodings');
            showMessage('encode', 'success', 'Text encoded successfully!');
        }

    } catch (error) {
        console.error('Encoding error:', error);
        if (!isRealTime) {
            showMessage('encode', 'error', `Error encoding text: ${error.message}`);
        }
    } finally {
        removeLoading();
    }
}

async function detectAndDecode(isAuto = false) {
    const input = document.getElementById('decode-input')?.value || '';
    
    if (!input.trim()) {
        if (!isAuto) {
            showMessage('decode', 'error', 'Please enter some text to decode');
        }
        return;
    }

    const button = document.getElementById('decode-btn');
    let removeLoading = () => {};
    
    if (!isAuto && button) {
        removeLoading = UIEnhancements.addLoadingState(button, 'Detecting...');
    }

    try {
        ErrorHandler.validateInput(input);
        
        // Get current settings
        const settings = appState.settings;
        
        let bestResult = null;
        let bestType = null;
        let bestConfidence = 0;
        const results = [];

        // Define encoding detection order (most reliable first)
        const encodingTests = [
            { type: 'jwt', test: () => input.includes('.') && input.split('.').length === 3 },
            { type: 'base64', test: () => /^[A-Za-z0-9+/]*={0,2}$/.test(input) && input.length % 4 === 0 },
            { type: 'base32', test: () => /^[A-Z2-7=]*$/i.test(input) },
            { type: 'base85', test: () => /^[0-9A-Za-z!#$%&()*+\\-;<=>?@^_`{|}~z]*$/.test(input) },
            { type: 'hex', test: () => /^([0-9a-fA-F]{2}\s*)+$/.test(input.trim()) },
            { type: 'binary', test: () => /^([01]{8}\s*)+$/.test(input.trim()) },
            { type: 'url', test: () => input.includes('%') && /%[0-9A-Fa-f]{2}/.test(input) },
            { type: 'morse', test: () => /^[.-\s/]+$/.test(input) },
            { type: 'ascii', test: () => /^(\d{2,3}\s*)+$/.test(input.trim()) },
            { type: 'html', test: () => input.includes('&') && input.includes(';') },
            { type: 'quoted-printable', test: () => input.includes('=') && /=[0-9A-Fa-f]{2}/.test(input) },
            { type: 'compress', test: () => /^[A-Za-z0-9+/]*={0,2}$/.test(input) },
            { type: 'rot13', test: () => /[a-zA-Z]/.test(input) }
        ];

        // Test each encoding type
        for (const { type, test } of encodingTests) {
            if (!DetectionEngine.shouldAttemptDecoding(input, type, settings)) {
                continue;
            }

            if (!test()) continue;

            try {
                let result = null;
                let typeName = '';

                switch (type) {
                    case 'jwt':
                        result = decodeJWT(input);
                        typeName = 'JWT (JSON Web Token)';
                        break;
                    case 'base64':
                        ErrorHandler.validateInput(input, 'base64');
                        result = atob(input);
                        typeName = 'Base64';
                        break;
                    case 'base32':
                        result = decodeBase32(input);
                        typeName = 'Base32';
                        break;
                    case 'base85':
                        result = AdvancedEncoders.decodeBase85(input);
                        typeName = 'Base85';
                        break;
                    case 'hex':
                        ErrorHandler.validateInput(input, 'hex');
                        result = input.trim().split(/\s+/)
                            .map(hex => String.fromCharCode(parseInt(hex, 16)))
                            .join('');
                        typeName = 'Hexadecimal';
                        break;
                    case 'binary':
                        ErrorHandler.validateInput(input, 'binary');
                        result = input.trim().split(/\s+/)
                            .map(bin => String.fromCharCode(parseInt(bin, 2)))
                            .join('');
                        typeName = 'Binary';
                        break;
                    case 'url':
                        result = decodeURIComponent(input);
                        typeName = 'URL Encoding';
                        break;
                    case 'morse':
                        result = decodeMorse(input);
                        typeName = 'Morse Code';
                        break;
                    case 'ascii':
                        result = input.trim().split(/\s+/)
                            .map(code => String.fromCharCode(parseInt(code)))
                            .join('');
                        typeName = 'ASCII Codes';
                        break;
                    case 'html':
                        const div = document.createElement('div');
                        div.innerHTML = input;
                        result = div.textContent || div.innerText || "";
                        typeName = 'HTML Entities';
                        break;
                    case 'quoted-printable':
                        result = AdvancedEncoders.decodeQuotedPrintable(input);
                        typeName = 'Quoted-Printable';
                        break;
                    case 'compress':
                        result = await CompressionUtils.decompressLZ(input);
                        typeName = 'LZ Compressed';
                        break;
                    case 'rot13':
                        result = input.replace(/[a-zA-Z]/g, char => {
                            const base = char <= 'Z' ? 65 : 97;
                            return String.fromCharCode((char.charCodeAt(0) - base + 13) % 26 + base);
                        });
                        typeName = 'ROT13';
                        break;
                }

                if (result && result !== input) {
                    const confidence = DetectionEngine.calculateConfidence(input, result, type);
                    
                    results.push({
                        result,
                        type: typeName,
                        confidence: confidence,
                        originalType: type
                    });

                    if (confidence > bestConfidence) {
                        bestResult = result;
                        bestType = typeName;
                        bestConfidence = confidence;
                    }
                }

            } catch (error) {
                // Log individual encoding failures for debugging
                if (settings.strictValidation) {
                    console.warn(`${type} decoding failed:`, error.message);
                }
            }
        }

        // Display the best result
        if (bestResult) {
            const confidenceText = settings.showConfidence ? 
                ` (${Math.round(bestConfidence * 100)}% confidence)` : '';
            
            showOutput('decode', bestResult, `Detected: ${bestType}${confidenceText}`);
            
            if (!isAuto) {
                addToHistory('decode', bestType, input, bestResult);
                updateStats('decodings');
                
                let successMessage = `Successfully decoded as ${bestType}!`;
                if (results.length > 1) {
                    successMessage += ` Found ${results.length} possible encodings.`;
                }
                
                showMessage('decode', 'success', successMessage);
                
                // Show alternative results if enabled
                if (settings.showConfidence && results.length > 1) {
                    console.log('Alternative decoding results:', results.sort((a, b) => b.confidence - a.confidence));
                }
            }
        } else {
            if (!isAuto) {
                let warningMessage = 'No encoding detected. ';
                if (!settings.autoDetect) {
                    warningMessage += 'Auto-detection is disabled. ';
                }
                warningMessage += 'The text might already be decoded or use an unsupported encoding.';
                showMessage('decode', 'warning', warningMessage);
            }
        }

    } catch (error) {
        const userMessage = ErrorHandler.handleEncodingError(error, 'Decoding', input);
        console.error('Decoding error:', error);
        
        if (!isAuto) {
            showMessage('decode', 'error', userMessage);
        }
    } finally {
        removeLoading();
    }
}

function decodeMorse(morseText) {
    return morseText
        .trim()
        .split('/')
        .map(word => 
            word.trim()
                .split(' ')
                .map(code => morseToChar[code] || '')
                .join('')
        )
        .join(' ')
        .trim();
}

// Batch processing functions
function processBatch() {
    const input = document.getElementById('batch-input')?.value || '';
    const operation = document.getElementById('batch-operation')?.value || 'encode';
    const encoding = document.getElementById('batch-encoding')?.value || 'base64';
    
    if (!input.trim()) {
        showMessage('batch', 'error', 'Please enter text to process');
        return;
    }

    const lines = input.split('\n').filter(line => line.trim());
    const resultsContainer = document.getElementById('batch-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }

    let processedCount = 0;
    const totalLines = lines.length;

    lines.forEach(async (line, index) => {
        const item = document.createElement('div');
        item.className = 'batch-item';
        
        try {
            let result;
            
            if (operation === 'encode') {
                // Temporarily set values for encoding
                const originalInput = document.getElementById('encode-input')?.value || '';
                const originalSelect = document.getElementById('encoding-select')?.value || '';
                
                if (document.getElementById('encode-input')) document.getElementById('encode-input').value = line;
                if (document.getElementById('encoding-select')) document.getElementById('encoding-select').value = encoding;
                
                await encode(true);
                result = document.getElementById('encode-result')?.textContent || 'Encoding failed';
                
                // Restore original values
                if (document.getElementById('encode-input')) document.getElementById('encode-input').value = originalInput;
                if (document.getElementById('encoding-select')) document.getElementById('encoding-select').value = originalSelect;
            } else {
                // Auto-decode
                const originalInput = document.getElementById('decode-input')?.value || '';
                
                if (document.getElementById('decode-input')) document.getElementById('decode-input').value = line;
                await detectAndDecode(true);
                result = document.getElementById('decode-result')?.textContent || 'No encoding detected';
                
                // Restore original value
                if (document.getElementById('decode-input')) document.getElementById('decode-input').value = originalInput;
            }
            
            item.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 4px; color: var(--accent);">
                    <i class="fas fa-check-circle" style="color: var(--success);"></i>
                    Line ${index + 1}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                    Input: ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}
                </div>
                <div style="font-family: monospace; font-size: 12px; background: var(--bg-primary); padding: 8px; border-radius: 4px; word-break: break-all; border: 1px solid var(--border);">
                    ${result}
                </div>
            `;
            
        } catch (error) {
            item.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 4px; color: var(--error);">
                    <i class="fas fa-exclamation-triangle"></i>
                    Line ${index + 1} - Error
                </div>
                <div style="color: var(--error); font-size: 12px;">${error.message}</div>
            `;
        }
        
        if (resultsContainer) {
            resultsContainer.appendChild(item);
        }
        
        processedCount++;
        
        // Update progress
        if (processedCount === totalLines) {
            updateStats('totalOps');
            UIEnhancements.showNotification(`Batch processing completed: ${processedCount} items processed`, 'success');
        }
    });
}

function exportResults() {
    const results = document.getElementById('batch-results');
    if (!results || !results.children.length) {
        showMessage('batch', 'warning', 'No results to export');
        return;
    }

    let exportText = 'Batch Processing Results\n';
    exportText += '='.repeat(30) + '\n\n';
    exportText += `Export Date: ${new Date().toLocaleString()}\n\n`;
    
    Array.from(results.children).forEach((item, index) => {
        const lines = item.textContent.split('\n').filter(line => line.trim());
        exportText += `Result ${index + 1}:\n`;
        exportText += lines.join('\n') + '\n\n';
    });

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessage('batch', 'success', 'Results exported successfully!');
}

function clearBatchResults() {
    const results = document.getElementById('batch-results');
    const input = document.getElementById('batch-input');
    
    if (results) results.innerHTML = '';
    if (input) input.value = '';
    
    UIEnhancements.showNotification('Batch results cleared', 'info');
}

function clearBatchInput() {
    const input = document.getElementById('batch-input');
    if (input) {
        input.value = '';
        showMessage('batch', 'success', 'Batch input cleared!');
    }
}

function handleBatchFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for batch
        showMessage('batch', 'error', 'File too large. Maximum size is 2MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const input = document.getElementById('batch-input');
        if (input) {
            input.value = e.target.result;
            showMessage('batch', 'success', `File "${file.name}" imported successfully.`);
        }
    };
    reader.onerror = function() {
        showMessage('batch', 'error', 'Error reading file.');
    };
    reader.readAsText(file);
}

// Text analysis functions
function handleAnalysisFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) { // 1MB limit for analysis
        showMessage('analysis', 'error', 'File too large. Maximum size is 1MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const input = document.getElementById('analysis-input');
        if (input) {
            input.value = e.target.result;
            performTextAnalysis();
            showMessage('analysis', 'success', `File "${file.name}" loaded for analysis.`);
        }
    };
    reader.onerror = function() {
        showMessage('analysis', 'error', 'Error reading file.');
    };
    reader.readAsText(file);
}

function performTextAnalysis() {
    const text = document.getElementById('analysis-input')?.value || '';
    const resultsContainer = document.getElementById('analysis-results');
    
    if (!text.trim()) {
        if (resultsContainer) resultsContainer.style.display = 'none';
        return;
    }

    // Enhanced text analysis with more metrics
    const charCount = text.length;
    const charNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;
    const lineCount = text.split('\n').length;

    // Reading statistics
    const avgWordsPerMinute = 200;
    const avgSpeakingWordsPerMinute = 150;
    const readingTime = Math.ceil(wordCount / avgWordsPerMinute);
    const speakingTime = Math.ceil(wordCount / avgSpeakingWordsPerMinute);
    const avgWordsPerSentence = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(1) : 0;
    const avgCharsPerWord = wordCount > 0 ? (charNoSpaces / wordCount).toFixed(1) : 0;

    // Enhanced character analysis
    const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
    const lowercaseCount = (text.match(/[a-z]/g) || []).length;
    const numberCount = (text.match(/[0-9]/g) || []).length;
    const spaceCount = (text.match(/\s/g) || []).length;
    const punctuationCount = (text.match(/[.,;:!?'"()[\]{}-]/g) || []).length;
    const specialCount = text.length - uppercaseCount - lowercaseCount - numberCount - spaceCount - punctuationCount;

    // Advanced word analysis
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
    const wordFreq = {};
    words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^a-zA-Z]/g, '');
        if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
            wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        }
    });
    const sortedWords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    // Language detection (simple)
    const languageIndicators = {
        'english': /\b(the|and|is|in|to|of|a|that|it|with|for|as|was|on|are)\b/gi,
        'spanish': /\b(el|la|de|que|y|en|un|es|se|no|te|lo|le|da|su|por|son)\b/gi,
        'french': /\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son)\b/gi,
        'german': /\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist)\b/gi
    };
    
    let detectedLanguage = 'Unknown';
    let maxMatches = 0;
    
    Object.entries(languageIndicators).forEach(([lang, regex]) => {
        const matches = (text.match(regex) || []).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedLanguage = lang.charAt(0).toUpperCase() + lang.slice(1);
        }
    });

    // Readability score (simplified Flesch Reading Ease)
    const avgSentenceLength = wordCount / sentenceCount || 0;
    const avgSyllablesPerWord = 1.5; // Simplified assumption
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    let readabilityLevel = 'Graduate';
    if (fleschScore >= 90) readabilityLevel = 'Very Easy';
    else if (fleschScore >= 80) readabilityLevel = 'Easy';
    else if (fleschScore >= 70) readabilityLevel = 'Fairly Easy';
    else if (fleschScore >= 60) readabilityLevel = 'Standard';
    else if (fleschScore >= 50) readabilityLevel = 'Fairly Difficult';
    else if (fleschScore >= 30) readabilityLevel = 'Difficult';

    // Update UI with animations
    const elements = {
        'char-count': charCount,
        'char-no-spaces': charNoSpaces,
        'word-count': wordCount,
        'sentence-count': sentenceCount,
        'paragraph-count': paragraphCount,
        'line-count': lineCount,
        'reading-time': `${readingTime} min`,
        'speaking-time': `${speakingTime} min`,
        'avg-words-sentence': avgWordsPerSentence,
        'avg-chars-word': avgCharsPerWord,
        'uppercase-count': uppercaseCount,
        'lowercase-count': lowercaseCount,
        'number-count': numberCount,
        'special-count': specialCount,
        'space-count': spaceCount
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && typeof value === 'number') {
            UIEnhancements.animateValue(element, 0, value, 800);
        } else if (element) {
            element.textContent = value;
        }
    });

    // Common words with enhanced display
    const commonWordsElement = document.getElementById('common-words');
    if (commonWordsElement) {
        commonWordsElement.innerHTML = sortedWords
            .map(([word, count]) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; padding: 2px 4px; background: var(--bg-secondary); border-radius: 4px;">
                    <span>${word}</span>
                    <span class="badge">${count}</span>
                </div>
            `)
            .join('') || '<div style="color: var(--text-secondary);">No common words found</div>';
    }

    // Add additional metrics if elements exist
    const languageElement = document.getElementById('detected-language');
    if (languageElement) languageElement.textContent = detectedLanguage;
    
    const readabilityElement = document.getElementById('readability-level');
    if (readabilityElement) readabilityElement.textContent = readabilityLevel;

    if (resultsContainer) {
        resultsContainer.style.display = 'block';
    }
}

function clearAnalysis() {
    const input = document.getElementById('analysis-input');
    const results = document.getElementById('analysis-results');
    
    if (input) input.value = '';
    if (results) results.style.display = 'none';
    
    showMessage('analysis', 'success', 'Analysis cleared!');
}

function exportAnalysis() {
    const text = document.getElementById('analysis-input')?.value || '';
    if (!text.trim()) {
        showMessage('analysis', 'warning', 'No text to analyze');
        return;
    }

    // Enhanced export with more data
    let exportData = 'Advanced Text Analysis Report\n';
    exportData += '='.repeat(50) + '\n\n';
    exportData += `Analysis Date: ${new Date().toLocaleString()}\n\n`;
    
    const stats = [
        ['Text Length', `${text.length} characters`],
        ['Characters (no spaces)', document.getElementById('char-no-spaces')?.textContent || '0'],
        ['Word Count', document.getElementById('word-count')?.textContent || '0'],
        ['Sentence Count', document.getElementById('sentence-count')?.textContent || '0'],
        ['Paragraph Count', document.getElementById('paragraph-count')?.textContent || '0'],
        ['Line Count', document.getElementById('line-count')?.textContent || '0'],
        ['Estimated Reading Time', document.getElementById('reading-time')?.textContent || '0 min'],
        ['Estimated Speaking Time', document.getElementById('speaking-time')?.textContent || '0 min'],
        ['Average Words per Sentence', document.getElementById('avg-words-sentence')?.textContent || '0'],
        ['Average Characters per Word', document.getElementById('avg-chars-word')?.textContent || '0'],
        ['Uppercase Letters', document.getElementById('uppercase-count')?.textContent || '0'],
        ['Lowercase Letters', document.getElementById('lowercase-count')?.textContent || '0'],
        ['Numbers', document.getElementById('number-count')?.textContent || '0'],
        ['Special Characters', document.getElementById('special-count')?.textContent || '0'],
        ['Spaces', document.getElementById('space-count')?.textContent || '0']
    ];

    stats.forEach(([label, value]) => {
        exportData += `${label}: ${value}\n`;
    });

    const commonWords = document.getElementById('common-words')?.textContent || '';
    if (commonWords && !commonWords.includes('No common words found')) {
        exportData += '\nMost Common Words:\n' + '-'.repeat(20) + '\n';
        exportData += commonWords.replace(/(\d+)/g, ': $1').replace(/\s+/g, '\n') + '\n';
    }

    exportData += '\nOriginal Text:\n' + '-'.repeat(20) + '\n';
    exportData += text;

    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `advanced-text-analysis-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessage('analysis', 'success', 'Analysis exported successfully!');
}

// History and statistics management
function addToHistory(operation, type, input, output) {
    const historyItem = {
        id: Date.now(),
        operation,
        type,
        input: input.substring(0, 100),
        output: output.substring(0, 100),
        timestamp: new Date().toLocaleString()
    };

    appState.history.unshift(historyItem);
    appState.history = appState.history.slice(0, 20); // Keep last 20 items
    
    localStorage.setItem('encoder-history', JSON.stringify(appState.history));
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    if (appState.history.length === 0) {
        historyList.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px; text-align: center; padding: 20px;">No recent activity</p>';
        return;
    }

    historyList.innerHTML = appState.history.map(item => `
        <div class="history-item" onclick="restoreFromHistory('${item.id}')" title="Click to restore">
            <div class="history-meta">
                <i class="fas fa-${item.operation === 'encode' ? 'lock' : 'unlock'}"></i>
                ${item.operation.toUpperCase()} - ${item.type} - ${item.timestamp}
            </div>
            <div class="history-preview">
                ${item.input}${item.input.length > 50 ? '...' : ''}
            </div>
        </div>
    `).join('');
}

function restoreFromHistory(id) {
    const item = appState.history.find(h => h.id == id);
    if (!item) return;

    if (item.operation === 'encode') {
        document.querySelector('[data-tab="encode"]')?.click();
        const input = document.getElementById('encode-input');
        if (input) {
            input.value = item.input;
            handleEncodeInput();
        }
    } else {
        document.querySelector('[data-tab="decode"]')?.click();
        const input = document.getElementById('decode-input');
        if (input) {
            input.value = item.input;
            handleDecodeInput();
        }
    }
    
    UIEnhancements.showNotification('Input restored from history', 'success');
}

function clearHistory() {
    appState.history = [];
    localStorage.setItem('encoder-history', JSON.stringify(appState.history));
    renderHistory();
    showMessage('decode', 'success', 'History cleared successfully!');
}

function updateStats(type = null) {
    if (type) {
        appState.stats[type] = (appState.stats[type] || 0) + 1;
        localStorage.setItem('encoder-stats', JSON.stringify(appState.stats));
    }
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const elements = {
        'total-encodings': appState.stats.encodings || 0,
        'total-decodings': appState.stats.decodings || 0,
        'total-operations': (appState.stats.encodings || 0) + (appState.stats.decodings || 0) + (appState.stats.totalOps || 0)
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            UIEnhancements.animateValue(element, parseInt(element.textContent) || 0, value, 500);
        }
    });
}

// Quick tools and utilities
function generateRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 16;
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const activeTab = document.querySelector('.tab-content.active');
    const input = activeTab?.querySelector('input, textarea');
    
    if (input) {
        input.value = result;
        input.dispatchEvent(new Event('input'));
        UIEnhancements.showNotification('Random string generated', 'success');
    }
}

function analyzeText() {
    document.querySelector('[data-tab="analysis"]')?.click();
    UIEnhancements.showNotification('Switched to text analysis', 'info');
}

function formatJson() {
    const activeTab = document.querySelector('.tab-content.active');
    const input = activeTab?.querySelector('textarea, input');
    
    if (input && input.value) {
        try {
            const parsed = JSON.parse(input.value);
            input.value = JSON.stringify(parsed, null, 2);
            UIEnhancements.showNotification('JSON formatted successfully', 'success');
        } catch (error) {
            UIEnhancements.showNotification('Invalid JSON format', 'error');
        }
    }
}

// Error handling and user feedback
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    UIEnhancements.showNotification('An unexpected error occurred', 'error');
});

// Service worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration would go here for offline functionality
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Auto-save functionality
let autoSaveTimer;
function enableAutoSave() {
    document.querySelectorAll('textarea, input[type="text"]').forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                const data = {
                    [input.id]: input.value,
                    timestamp: Date.now()
                };
                localStorage.setItem('auto-save-data', JSON.stringify(data));
            }, 1000);
        });
    });
}

// Initialize auto-save when DOM is ready
document.addEventListener('DOMContentLoaded', enableAutoSave);

// Export functions for global access
window.encoderApp = {
    encode,
    detectAndDecode,
    toggleTheme,
    processBatch,
    performTextAnalysis,
    generateRandomString,
    formatJson,
    analyzeText,
    UIEnhancements,
    HashFunctions,
    AdvancedEncoders,
    CompressionUtils
};
