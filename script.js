class QuantumLayeredEncoder {
    constructor() {
        // Fixed matrices for consistency
        this.substitutionMatrix = this.createSubstitutionMatrix();
        this.inverseMatrix = this.createInverseMatrix();
    }

    createSubstitutionMatrix() {
        const matrix = [];
        for (let i = 0; i < 256; i++) {
            matrix[i] = (i * 17 + 42) % 256;
        }
        return matrix;
    }

    createInverseMatrix() {
        const inverse = new Array(256);
        for (let i = 0; i < 256; i++) {
            inverse[this.substitutionMatrix[i]] = i;
        }
        return inverse;
    }

    keyDerivation(key) {
        if (!key || key.length === 0) {
            throw new Error('Encryption key is required');
        }
        
        let derivedKey = [];
        let hash = 5381; // DJB2 hash initial value
        
        // Create stable hash from key
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) + hash) + key.charCodeAt(i);
            hash = hash & 0xFFFFFFFF; // Keep 32-bit
        }
        
        // Generate 256 bytes of derived key material
        for (let i = 0; i < 256; i++) {
            hash = ((hash << 5) + hash) + i + 7919;
            hash = hash & 0xFFFFFFFF;
            derivedKey.push(hash & 0xFF);
        }
        
        return derivedKey;
    }

    scrambleByte(byte, position, derivedKey) {
        // Layer 1: Substitution
        let result = this.substitutionMatrix[byte];
        
        // Layer 2: XOR with position-dependent key
        result ^= derivedKey[position % derivedKey.length];
        
        // Layer 3: Bit rotation based on position
        const rotateAmount = position % 8;
        result = ((result << rotateAmount) | (result >> (8 - rotateAmount))) & 0xFF;
        
        // Layer 4: Add key-dependent value
        result = (result + derivedKey[(position * 7) % derivedKey.length]) & 0xFF;
        
        return result;
    }

    unscrambleByte(byte, position, derivedKey) {
        // Reverse Layer 4: Subtract key-dependent value
        let result = (byte - derivedKey[(position * 7) % derivedKey.length] + 256) & 0xFF;
        
        // Reverse Layer 3: Reverse bit rotation
        const rotateAmount = position % 8;
        result = ((result >> rotateAmount) | (result << (8 - rotateAmount))) & 0xFF;
        
        // Reverse Layer 2: XOR with position-dependent key
        result ^= derivedKey[position % derivedKey.length];
        
        // Reverse Layer 1: Inverse substitution
        result = this.inverseMatrix[result];
        
        return result;
    }

    encode(text, key) {
        if (!text) return '';
        
        const derivedKey = this.keyDerivation(key);
        const textBytes = new TextEncoder().encode(text);
        const encoded = [];
        
        for (let i = 0; i < textBytes.length; i++) {
            const scrambled = this.scrambleByte(textBytes[i], i, derivedKey);
            encoded.push(scrambled);
        }
        
        // Convert to hex with checksum
        return this.bytesToHex(encoded, derivedKey);
    }

    decode(encodedText, key) {
        if (!encodedText) return '';
        
        try {
            const derivedKey = this.keyDerivation(key);
            const decodedBytes = this.hexToBytes(encodedText, derivedKey);
            const original = [];
            
            for (let i = 0; i < decodedBytes.length; i++) {
                const unscrambled = this.unscrambleByte(decodedBytes[i], i, derivedKey);
                original.push(unscrambled);
            }
            
            return new TextDecoder().decode(new Uint8Array(original));
        } catch (error) {
            throw new Error('Decoding failed: Invalid key or corrupted data');
        }
    }

    bytesToHex(bytes, derivedKey) {
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
            hex += bytes[i].toString(16).padStart(2, '0');
        }
        
        // Add simple checksum
        const checksum = this.calculateChecksum(hex, derivedKey);
        return hex + '.' + checksum;
    }

    hexToBytes(encoded, derivedKey) {
        const parts = encoded.split('.');
        if (parts.length !== 2) {
            throw new Error('Invalid format');
        }
        
        const [hexData, checksum] = parts;
        const expectedChecksum = this.calculateChecksum(hexData, derivedKey);
        
        if (checksum !== expectedChecksum) {
            throw new Error('Checksum verification failed');
        }
        
        if (hexData.length % 2 !== 0) {
            throw new Error('Invalid hex data');
        }
        
        const bytes = [];
        for (let i = 0; i < hexData.length; i += 2) {
            const byte = parseInt(hexData.substr(i, 2), 16);
            if (isNaN(byte)) {
                throw new Error('Invalid hex character');
            }
            bytes.push(byte);
        }
        
        return bytes;
    }

    calculateChecksum(data, derivedKey) {
        let checksum = 0;
        for (let i = 0; i < data.length; i++) {
            checksum = (checksum * 31 + data.charCodeAt(i)) % 65536;
        }
        // Add key influence
        for (let i = 0; i < derivedKey.length && i < 16; i++) {
            checksum = (checksum + derivedKey[i] * (i + 1)) % 65536;
        }
        return checksum.toString(16).padStart(4, '0');
    }

    generateRandomKey() {
        const length = 16 + Math.floor(Math.random() * 16);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let key = '';
        for (let i = 0; i < length; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }
}

// Initialize the encoder
const encoder = new QuantumLayeredEncoder();

// DOM elements
const passcodeScreen = document.getElementById('passcode-screen');
const mainContent = document.getElementById('main-content');
const passcodeInput = document.getElementById('passcode-input');
const accessBtn = document.getElementById('access-btn');
const passcodeError = document.getElementById('passcode-error');

const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const encryptionKey = document.getElementById('encryptionKey');
const encodeBtn = document.getElementById('encodeBtn');
const decodeBtn = document.getElementById('decodeBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const generateKeyBtn = document.getElementById('generateKey');

// Passcode authentication
const CORRECT_PASSCODE = 'AE&DS';

function checkPasscode() {
    const enteredPasscode = passcodeInput.value;
    
    if (enteredPasscode === CORRECT_PASSCODE) {
        passcodeScreen.style.display = 'none';
        mainContent.style.display = 'grid';
        passcodeError.textContent = '';
    } else {
        passcodeError.textContent = 'Incorrect passcode. Access denied.';
        passcodeInput.value = '';
        passcodeInput.style.borderColor = '#e74c3c';
        setTimeout(() => {
            passcodeInput.style.borderColor = '#e0e6ed';
        }, 2000);
    }
}

// Passcode event listeners
accessBtn.addEventListener('click', checkPasscode);

passcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkPasscode();
    }
});

// Event listeners
encodeBtn.addEventListener('click', () => {
    try {
        const text = inputText.value;
        const key = encryptionKey.value;
        
        if (!text.trim()) {
            alert('Please enter text to encode');
            return;
        }
        
        if (!key.trim()) {
            alert('Please enter an encryption key');
            return;
        }
        
        encodeBtn.classList.add('processing');
        
        setTimeout(() => {
            try {
                const encoded = encoder.encode(text, key);
                outputText.value = encoded;
                outputText.classList.add('success-flash');
                setTimeout(() => outputText.classList.remove('success-flash'), 300);
            } catch (error) {
                alert('Encoding failed: ' + error.message);
            } finally {
                encodeBtn.classList.remove('processing');
            }
        }, 100);
        
    } catch (error) {
        alert('Encoding error: ' + error.message);
        encodeBtn.classList.remove('processing');
    }
});

decodeBtn.addEventListener('click', () => {
    try {
        const text = inputText.value;
        const key = encryptionKey.value;
        
        if (!text.trim()) {
            alert('Please enter encoded text to decode');
            return;
        }
        
        if (!key.trim()) {
            alert('Please enter the encryption key');
            return;
        }
        
        decodeBtn.classList.add('processing');
        
        setTimeout(() => {
            try {
                const decoded = encoder.decode(text, key);
                outputText.value = decoded;
                outputText.classList.add('success-flash');
                setTimeout(() => outputText.classList.remove('success-flash'), 300);
            } catch (error) {
                alert('Decoding failed: ' + error.message);
            } finally {
                decodeBtn.classList.remove('processing');
            }
        }, 100);
        
    } catch (error) {
        alert('Decoding error: ' + error.message);
        decodeBtn.classList.remove('processing');
    }
});

clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputText.value = '';
    encryptionKey.value = '';
});

copyBtn.addEventListener('click', () => {
    if (outputText.value) {
        navigator.clipboard.writeText(outputText.value).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Result';
            }, 2000);
        }).catch(() => {
            outputText.select();
            document.execCommand('copy');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Result';
            }, 2000);
        });
    }
});

generateKeyBtn.addEventListener('click', () => {
    const randomKey = encoder.generateRandomKey();
    encryptionKey.value = randomKey;
    generateKeyBtn.textContent = 'Generated!';
    setTimeout(() => {
        generateKeyBtn.textContent = 'Generate Random Key';
    }, 2000);
});

// Auto-resize textareas
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

inputText.addEventListener('input', () => autoResize(inputText));
outputText.addEventListener('input', () => autoResize(outputText));
