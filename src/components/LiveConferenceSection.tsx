import React from "react";
import LiveConferenceTabs from "./conferences/LiveConferenceTabs";

// This is a wrapper component that uses the new tabs implementation
const LiveConferenceSection: React.FC = () => {
  return <LiveConferenceTabs />;
};

export default LiveConferenceSection;
