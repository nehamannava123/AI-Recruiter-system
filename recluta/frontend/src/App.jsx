import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import Setup from './pages/Setup';
import Interview from './pages/Interview';
import Results from './pages/Results';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <AnimatedPage>
              <Home />
            </AnimatedPage>
          }
        />
        <Route
          path="/setup"
          element={
            <AnimatedPage>
              <Setup />
            </AnimatedPage>
          }
        />
        <Route
          path="/interview"
          element={
            <AnimatedPage>
              <Interview />
            </AnimatedPage>
          }
        />
        <Route
          path="/results"
          element={
            <AnimatedPage>
              <Results />
            </AnimatedPage>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AnimatedPage>
              <Dashboard />
            </AnimatedPage>
          }
        />
        <Route
          path="/login"
          element={
            <AnimatedPage>
              <AuthPage mode="login" />
            </AnimatedPage>
          }
        />
        <Route
          path="/signup"
          element={
            <AnimatedPage>
              <AuthPage mode="signup" />
            </AnimatedPage>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
