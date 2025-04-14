import CryptoJS from "crypto-js"

const secretKey = import.meta.env.VITE_ENCRYPTION_SECRET_KEY
// console.log("Secretkey:::", secretKey)

// Function to encrypt a message
export function encryptMessage(message: string): string {
	return CryptoJS.AES.encrypt(message, secretKey).toString()
}

// Function to decrypt a message
export function decryptMessage(ciphertext: string): string {
	const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey)
	return bytes.toString(CryptoJS.enc.Utf8)
}
