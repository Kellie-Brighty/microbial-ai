import React from "react";

interface ActiveTokensSidebarProps {
  onSelectToken?: (tokenId: string) => void; // Placeholder function for selecting a token
}

const ActiveTokensSidebar: React.FC<ActiveTokensSidebarProps> = ({
  onSelectToken,
}) => {
  const placeholderTokens = [
    { id: "token_1", name: "Token 1" },
    { id: "token_2", name: "Token 2" },
    { id: "token_3", name: "Token 3" },
  ];

  return (
    <div className="w-full bg-gray-100 p-4 border-l border-gray-300">
      <h2 className="text-lg font-semibold mb-4">Active Tokens</h2>
      <ul>
        {placeholderTokens.map((token) => (
          <li
            key={token.id}
            className="p-2 mb-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300"
            onClick={() => onSelectToken && onSelectToken(token.id)}
          >
            {token.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActiveTokensSidebar;
