import React from "react";
import { useTyping } from "../context/context";
import AgenNicky from "../assets/microbial-profile.png";
import { GiDna1 } from "react-icons/gi";
import { FaMicrochip } from "react-icons/fa6";

const TypingIndicator: React.FC = () => {
  const { isTyping } = useTyping();

  if (!isTyping) return null;

  return (
    <div className="p-4 rounded-2xl shadow-sm bg-offWhite border border-mint border-opacity-30 self-start max-w-[85%] sm:max-w-[75%] md:max-w-[50%] mr-auto text-charcoal mb-3">
      <div className="flex items-center mb-3">
        <div className="relative">
          <img
            src={AgenNicky}
            className="w-[30px] h-[30px] rounded-full border-2 border-mint"
            alt="Microbial AI"
          />
          <div className="absolute -bottom-1 -right-1 text-mint animate-pulse">
            <GiDna1 size={14} />
          </div>
        </div>
        <div className="ml-2">
          <span className="text-mint font-semibold text-md flex items-center">
            Microbial
            <span className="ml-1 bg-mint text-white text-xs px-1.5 py-0.5 rounded-full">
              AI
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <div className="flex space-x-1">
            <div className="w-2.5 h-2.5 rounded-full bg-mint animate-pulse delay-0"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-mint animate-pulse delay-150"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-mint animate-pulse delay-300"></div>
          </div>
          <div className="text-gray-600 text-sm font-medium ml-1">
            thinking...
          </div>
        </div>
        <div className="flex items-center">
          <div className="p-1 rounded-full bg-mint bg-opacity-10 animate-pulse">
            <FaMicrochip className="text-mint" size={14} />
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-200 border-opacity-50">
        <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2 mt-1.5"></div>
        <div className="h-2 bg-gray-200 rounded animate-pulse w-5/6 mt-1.5"></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
