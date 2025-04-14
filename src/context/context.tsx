import React, { createContext, useState, useContext, ReactNode } from "react"

interface Thread {
	id: string
	created_at: string
}

interface Chain {
	id: number
	name: string
}

interface TypingContextProps {
	isTyping: boolean
	setTyping: (loading: boolean) => void
	threads: Thread[]
	setThreads: (threads: Thread[]) => void
	getThreadsFromLocalStorage: () => void
	selectedThread: string | undefined
	setSelectedThread: (threadId: string) => void
	selectedChain: Chain
	setSelectedChain: (chain: Chain) => void
}

const TypingContext = createContext<TypingContextProps | undefined>(undefined)

export const TypingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const getThreadsFromLocalStorage = () => {
		const savedThreads = JSON.parse(localStorage.getItem("threads") || "[]")
		if (savedThreads) {
			setThreads(savedThreads)
		} else {
			setThreads([])
		}
	}

	const [isTyping, setTyping] = useState<boolean>(false)
	const [threads, setThreads] = useState<Thread[]>([])
	const [selectedThread, setSelectedThread] = useState<string | undefined>()
	const [selectedChain, setSelectedChain] = useState<Chain>({ id: 1, name: "mainnet" })

	React.useEffect(() => {
		getThreadsFromLocalStorage()
	}, [])

	return (
		<TypingContext.Provider
			value={{
				isTyping,
				setTyping,
				threads,
				setThreads,
				getThreadsFromLocalStorage,
				selectedThread,
				setSelectedThread,
				selectedChain,
				setSelectedChain,
			}}>
			{children}
		</TypingContext.Provider>
	)
}

export const useTyping = (): TypingContextProps => {
	const context = useContext(TypingContext)
	if (!context) {
		throw new Error("useTyping must be used within a LoadingProvider")
	}
	return context
}
