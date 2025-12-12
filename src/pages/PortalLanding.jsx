import React, { useState } from 'react';
import PortalLandingPage from '../components/portal/PortalLandingPage';
import PortalSignup from '../components/portal/PortalSignup';
import { motion, AnimatePresence } from 'framer-motion';

export default function PortalLanding() {
  const [showSignup, setShowSignup] = useState(false);

  const handleSignupComplete = (portalUser) => {
    window.location.href = `/client-portal?userId=${portalUser.id}`;
  };

  return (
    <AnimatePresence mode="wait">
      {!showSignup ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PortalLandingPage onGetStarted={() => setShowSignup(true)} />
        </motion.div>
      ) : (
        <motion.div
          key="signup"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <PortalSignup onSignupComplete={handleSignupComplete} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}